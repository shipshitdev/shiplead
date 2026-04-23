import path from 'node:path';
import { closeDatabase } from '@shiplead/db';
import { DEFAULT_API_PORT } from '@shiplead/shared';
import { startShipleadServer } from './server.js';

async function main() {
  const port = Number(process.env.PORT ?? DEFAULT_API_PORT);
  const dataDir = process.env.SHIPLEAD_DATA_DIR ?? path.resolve(process.cwd(), '.data');
  const running = await startShipleadServer({ dataDir, port });
  console.log(`Shiplead API listening on ${running.baseUrl}`);

  const shutdown = () => {
    closeDatabase();
    running.server.close();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

void main();
