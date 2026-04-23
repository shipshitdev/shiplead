export * from './demo-data.js';
export * from './schemas.js';
export * from './types.js';

export const DEFAULT_API_PORT = 4280;
export const DEFAULT_API_BASE_URL = `http://127.0.0.1:${DEFAULT_API_PORT}`;

export function toIsoUtc(input: Date | string = new Date()): string {
  return typeof input === 'string' ? new Date(input).toISOString() : input.toISOString();
}
