import fs from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import path from 'node:path';
import { closeDatabase, getDatabase } from '@shiplead/db';
import { DEFAULT_API_BASE_URL, DEFAULT_API_PORT } from '@shiplead/shared';
import { handleApiRequest } from './app.js';

async function toRequest(req: IncomingMessage): Promise<Request> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const url = new URL(req.url ?? '/', DEFAULT_API_BASE_URL);
  const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks);

  return new Request(url, {
    method: req.method,
    headers: req.headers as HeadersInit,
    body,
  });
}

async function writeResponse(response: Response, res: ServerResponse): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const payload = Buffer.from(await response.arrayBuffer());
  res.end(payload);
}

async function main() {
  const port = Number(process.env.PORT ?? DEFAULT_API_PORT);
  const dataDir = process.env.SHIPLEAD_DATA_DIR ?? path.resolve(process.cwd(), '.data');
  fs.mkdirSync(dataDir, { recursive: true });

  const store = getDatabase(dataDir);
  const server = createServer(async (req, res) => {
    const request = await toRequest(req);
    const response = await handleApiRequest(request, { store });
    await writeResponse(response, res);
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`Shiplead API listening on http://127.0.0.1:${port}`);
  });

  const shutdown = () => {
    closeDatabase();
    server.close();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

void main();
