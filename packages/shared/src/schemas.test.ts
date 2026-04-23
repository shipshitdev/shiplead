import { describe, expect, it } from 'vitest';
import { createDemoSeed, dashboardSnapshotSchema, sequenceStepSchema } from './index';

describe('shared schemas', () => {
  it('validates the demo seed snapshot shape', () => {
    const seed = createDemoSeed();
    expect(() => dashboardSnapshotSchema.parse(seed)).not.toThrow();
  });

  it('requires a valid sequence step channel and type', () => {
    expect(() =>
      sequenceStepSchema.parse({
        id: 'step_demo',
        position: 0,
        type: 'email',
        channel: 'email',
        delayDays: 1,
        subjectTemplate: 'Hello',
        bodyTemplate: 'World',
        taskTitle: null,
      }),
    ).not.toThrow();
  });
});
