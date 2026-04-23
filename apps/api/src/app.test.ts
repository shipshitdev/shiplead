import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { closeDatabase, getDatabase } from '@shiplead/db';
import { afterEach, describe, expect, it } from 'vitest';
import { handleApiRequest } from './app';

function makeStore() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shiplead-api-'));
  return {
    dataDir,
    store: getDatabase(dataDir),
  };
}

afterEach(() => {
  closeDatabase();
});

describe('api app', () => {
  it('serves the dashboard snapshot', async () => {
    const { store } = makeStore();
    const response = await handleApiRequest(new Request('http://localhost/dashboard'), { store });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.metrics.contactCount).toBeGreaterThan(0);
  });

  it('updates task status', async () => {
    const { store } = makeStore();
    const task = store.listTasks()[0];
    const response = await handleApiRequest(
      new Request(`http://localhost/tasks/${task.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'done' }),
      }),
      { store },
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.status).toBe('done');
  });

  it('triages replies and creates follow-up work', async () => {
    const { store } = makeStore();
    const thread = store.listThreads().find((item) => item.unreadCount > 0);
    if (!thread) {
      throw new Error('Expected a seeded unread thread');
    }

    const message = store.listMessages(thread.id).find((item) => item.direction === 'inbound');
    if (!message) {
      throw new Error('Expected a seeded inbound message');
    }

    const response = await handleApiRequest(
      new Request('http://localhost/actions/triage-message', {
        method: 'POST',
        body: JSON.stringify({ messageId: message.id }),
      }),
      { store },
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.triage.classification).toBe('meeting');
    expect(store.listTasks().length).toBeGreaterThan(3);
  });
});
