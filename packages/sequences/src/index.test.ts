import { createDemoSeed } from '@shiplead/shared';
import { describe, expect, it } from 'vitest';
import { advanceEnrollment, isEnrollmentDue, stopEnrollmentOnReply } from './index';

describe('sequence engine', () => {
  const seed = createDemoSeed();
  const sequence = seed.sequences[0];
  const enrollment = seed.enrollments[0];

  it('marks active enrollments as due when the scheduled time has passed', () => {
    expect(isEnrollmentDue(enrollment, '2026-04-25T00:00:00Z')).toBe(true);
  });

  it('advances to the next step or completes the sequence', () => {
    const next = advanceEnrollment(sequence, enrollment, '2026-04-24T09:00:00Z');
    expect(next.currentStepIndex).toBe(2);
  });

  it('stops an enrollment immediately on reply', () => {
    const stopped = stopEnrollmentOnReply(enrollment, 'contact-replied');
    expect(stopped.status).toBe('replied');
    expect(stopped.nextRunAt).toBeNull();
  });
});
