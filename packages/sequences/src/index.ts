import type { Enrollment, Sequence, SequenceStep } from '@shiplead/shared';
import { toIsoUtc } from '@shiplead/shared';

function addDays(baseIso: string, days: number): string {
  const next = new Date(baseIso);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString();
}

export function getStepAt(sequence: Sequence, index: number): SequenceStep | null {
  return sequence.steps[index] ?? null;
}

export function calculateNextRunAt(
  sequence: Sequence,
  nextIndex: number,
  anchorIso: string,
): string | null {
  const nextStep = getStepAt(sequence, nextIndex);
  if (!nextStep) return null;
  return addDays(anchorIso, nextStep.delayDays);
}

export function advanceEnrollment(
  sequence: Sequence,
  enrollment: Enrollment,
  now = toIsoUtc(),
): Enrollment {
  const nextIndex = enrollment.currentStepIndex + 1;
  const nextRunAt = calculateNextRunAt(sequence, nextIndex, now);

  return {
    ...enrollment,
    currentStepIndex: Math.min(nextIndex, sequence.steps.length),
    lastRunAt: now,
    nextRunAt,
    status: nextRunAt ? enrollment.status : 'completed',
    stoppedReason: nextRunAt ? enrollment.stoppedReason : 'sequence-finished',
    updatedAt: now,
  };
}

export function stopEnrollmentOnReply(
  enrollment: Enrollment,
  reason: string,
  now = toIsoUtc(),
): Enrollment {
  return {
    ...enrollment,
    status: 'replied',
    nextRunAt: null,
    stoppedReason: reason,
    updatedAt: now,
  };
}

export function isEnrollmentDue(enrollment: Enrollment, now = toIsoUtc()): boolean {
  if (enrollment.status !== 'active') return false;
  if (!enrollment.nextRunAt) return false;
  return new Date(enrollment.nextRunAt).getTime() <= new Date(now).getTime();
}
