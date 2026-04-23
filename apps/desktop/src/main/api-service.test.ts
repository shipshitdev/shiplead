import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveLaunchCommand } from './api-service';

const tempRoots: string[] = [];

function createTempRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'shiplead-desktop-api-'));
  tempRoots.push(root);
  return root;
}

describe('resolveLaunchCommand', () => {
  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      fs.rmSync(root, { force: true, recursive: true });
    }
  });

  it('prefers the packaged API bundle when it exists', () => {
    const repoRoot = createTempRoot();
    const packagedApiEntry = path.join(repoRoot, 'Resources', 'api', 'index.mjs');
    fs.mkdirSync(path.dirname(packagedApiEntry), { recursive: true });
    fs.writeFileSync(packagedApiEntry, '');

    expect(resolveLaunchCommand(repoRoot, false, packagedApiEntry)).toEqual({
      command: process.execPath,
      args: [packagedApiEntry],
    });
  });

  it('falls back to the built API entry in source checkouts', () => {
    const repoRoot = createTempRoot();
    const apiDistEntry = path.join(repoRoot, 'apps', 'api', 'dist', 'index.js');
    fs.mkdirSync(path.dirname(apiDistEntry), { recursive: true });
    fs.writeFileSync(apiDistEntry, '');

    expect(resolveLaunchCommand(repoRoot, false)).toEqual({
      command: process.execPath,
      args: [apiDistEntry],
    });
  });
});
