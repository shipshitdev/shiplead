import { DatabaseSync } from 'node:sqlite';
import { ShipleadDatabase, seedDatabase } from './index.js';
import { migrate } from './schema.js';

export function createTestStore(): ShipleadDatabase {
  const db = new DatabaseSync(':memory:', { enableForeignKeyConstraints: true });
  migrate(db);
  const store = new ShipleadDatabase(db);
  seedDatabase(store);
  return store;
}
