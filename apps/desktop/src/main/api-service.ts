import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_API_BASE_URL, DEFAULT_API_PORT } from '@shiplead/shared';

const API_READY_TIMEOUT_MS = 15_000;
const API_POLL_INTERVAL_MS = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function parseApiBaseUrl(baseUrl: string): URL {
  try {
    return new URL(baseUrl);
  } catch {
    throw new Error(`Invalid SHIPLEAD_API_BASE_URL: ${baseUrl}`);
  }
}

function isLoopbackApi(url: URL): boolean {
  return ['127.0.0.1', 'localhost', '::1'].includes(url.hostname);
}

function loadLocalEnvFiles(repoRoot: string, desktopRoot: string): void {
  const candidates = [
    path.join(repoRoot, '.env'),
    path.join(repoRoot, '.env.local'),
    path.join(desktopRoot, '.env'),
    path.join(desktopRoot, '.env.local'),
  ];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    const raw = fs.readFileSync(filePath, 'utf8');

    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const normalized = trimmed.startsWith('export ') ? trimmed.slice(7).trim() : trimmed;
      const eqIndex = normalized.indexOf('=');
      if (eqIndex <= 0) continue;

      const key = normalized.slice(0, eqIndex).trim();
      if (!key || process.env[key] !== undefined) continue;

      let value = normalized.slice(eqIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  }
}

async function isApiHealthy(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(new URL('/health', baseUrl), {
      headers: { accept: 'application/json' },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForApiReady(baseUrl: string, getFailure: () => Error | null): Promise<void> {
  const deadline = Date.now() + API_READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const failure = getFailure();
    if (failure) throw failure;

    if (await isApiHealthy(baseUrl)) {
      return;
    }

    await sleep(API_POLL_INTERVAL_MS);
  }

  throw new Error(`Timed out waiting for Shiplead API at ${baseUrl}`);
}

export type LaunchCommand = {
  command: string;
  args: string[];
};

export function resolveLaunchCommand(repoRoot: string, isDev: boolean): LaunchCommand {
  const apiSourceEntry = path.join(repoRoot, 'apps', 'api', 'src', 'index.ts');
  const apiDistEntry = path.join(repoRoot, 'apps', 'api', 'dist', 'index.js');
  const tsxCliEntry = path.join(repoRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');

  if (isDev && fs.existsSync(tsxCliEntry) && fs.existsSync(apiSourceEntry)) {
    return {
      command: process.execPath,
      args: [tsxCliEntry, apiSourceEntry],
    };
  }

  if (fs.existsSync(apiDistEntry)) {
    return {
      command: process.execPath,
      args: [apiDistEntry],
    };
  }

  if (fs.existsSync(tsxCliEntry) && fs.existsSync(apiSourceEntry)) {
    return {
      command: process.execPath,
      args: [tsxCliEntry, apiSourceEntry],
    };
  }

  throw new Error(
    'Could not resolve a local API entrypoint. Build `apps/api` or install workspace dependencies.',
  );
}

type ApiServiceManagerOptions = {
  desktopRoot: string;
  repoRoot: string;
  userDataPath: string;
};

export class ApiServiceManager {
  private readonly desktopRoot: string;
  private readonly repoRoot: string;
  private readonly userDataPath: string;
  private child: ChildProcessWithoutNullStreams | null = null;
  private startPromise: Promise<string> | null = null;
  private stopRequested = false;

  constructor(options: ApiServiceManagerOptions) {
    this.desktopRoot = options.desktopRoot;
    this.repoRoot = options.repoRoot;
    this.userDataPath = options.userDataPath;
    loadLocalEnvFiles(this.repoRoot, this.desktopRoot);
  }

  getConfiguredBaseUrl(): string {
    const raw = process.env.SHIPLEAD_API_BASE_URL?.trim();
    return raw && raw.length > 0 ? raw : DEFAULT_API_BASE_URL;
  }

  async getApiBaseUrl(): Promise<string> {
    if (!this.startPromise) {
      this.startPromise = this.ensureStarted();
    }

    return this.startPromise;
  }

  stop(): void {
    this.stopRequested = true;
    if (this.child && !this.child.killed) {
      this.child.kill();
    }
    this.child = null;
    this.startPromise = null;
  }

  private async ensureStarted(): Promise<string> {
    const baseUrl = this.getConfiguredBaseUrl();
    const parsed = parseApiBaseUrl(baseUrl);

    if (!isLoopbackApi(parsed)) {
      await waitForApiReady(baseUrl, () => null);
      return baseUrl;
    }

    if (await isApiHealthy(baseUrl)) {
      return baseUrl;
    }

    if (!this.child || this.child.killed) {
      this.spawnLocalApi(parsed);
    }

    let bootFailure: Error | null = null;

    if (this.child) {
      this.child.once('error', (error) => {
        bootFailure = new Error(`Failed to spawn Shiplead API: ${formatError(error)}`);
      });

      this.child.once('exit', (code, signal) => {
        if (!this.stopRequested && code !== 0) {
          bootFailure = new Error(
            `Shiplead API exited before becoming ready (code=${code ?? 'null'}, signal=${signal ?? 'none'})`,
          );
        }
        this.child = null;
        this.startPromise = null;
      });
    }

    await waitForApiReady(baseUrl, () => bootFailure);
    return baseUrl;
  }

  private spawnLocalApi(parsedBaseUrl: URL): void {
    const launch = resolveLaunchCommand(this.repoRoot, Boolean(process.env.VITE_DEV_SERVER_URL));
    const dataDir = path.join(this.userDataPath, 'data');
    fs.mkdirSync(dataDir, { recursive: true });

    this.stopRequested = false;
    this.child = spawn(launch.command, launch.args, {
      cwd: this.repoRoot,
      stdio: 'pipe',
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        PORT: parsedBaseUrl.port || String(DEFAULT_API_PORT),
        SHIPLEAD_DATA_DIR: dataDir,
      },
    });

    this.child.stdout.on('data', (chunk) => {
      const text = chunk.toString().trim();
      if (text) {
        console.info(`[shiplead-api] ${text}`);
      }
    });

    this.child.stderr.on('data', (chunk) => {
      const text = chunk.toString().trim();
      if (text) {
        console.warn(`[shiplead-api] ${text}`);
      }
    });
  }
}

export function resolveDesktopRoots(mainDirname: string): {
  desktopRoot: string;
  repoRoot: string;
} {
  const desktopRoot = path.resolve(mainDirname, '..', '..');
  const repoRoot = path.resolve(desktopRoot, '..', '..');
  return { desktopRoot, repoRoot };
}
