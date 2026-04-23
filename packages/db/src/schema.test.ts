import { describe, expect, it } from 'vitest';
import { createTestStore } from './test-helpers';

describe('db store', () => {
  it('returns a seeded dashboard snapshot', () => {
    const store = createTestStore();
    const snapshot = store.getDashboardSnapshot();

    expect(snapshot.projects.length).toBeGreaterThan(0);
    expect(snapshot.tasks.length).toBeGreaterThan(0);
  });

  it('searches contacts, companies, and opportunities', () => {
    const store = createTestStore();
    const results = store.search('ArcForge');

    expect(results.some((result) => result.entityType === 'company')).toBe(true);
  });

  it('updates task status', () => {
    const store = createTestStore();
    const task = store.listTasks()[0];
    const updated = store.updateTaskStatus(task.id, 'done');

    expect(updated?.status).toBe('done');
  });
});
