import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'tsup';

export default defineConfig({
  banner: { js: '#!/usr/bin/env node' },
  clean: true,
  dts: false,
  entry: ['src/index.ts'],
  format: ['esm'],
  noExternal: ['@shiplead/api', '@shiplead/db', '@shiplead/shared'],
  outDir: 'dist',
  platform: 'node',
  sourcemap: false,
  target: 'node22',
  async onSuccess() {
    // esbuild still strips the `node:` prefix from node:sqlite when bundling.
    const out = path.resolve('dist/index.js');
    const code = fs.readFileSync(out, 'utf8');
    fs.writeFileSync(out, code.replaceAll('from "sqlite"', 'from "node:sqlite"'));
  },
});
