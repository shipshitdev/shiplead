import type {
  PersonalizationRequest,
  PersonalizationResult,
  ReplyClassification,
  ReplyTriageRequest,
  ReplyTriageResult,
  ResearchRequest,
  ResearchResult,
} from '@shiplead/shared';

function computeFitScore(request: ResearchRequest): number {
  let score = 55;
  const text =
    `${request.offer.idealCustomerProfile} ${request.company.notes} ${request.contact?.notes ?? ''}`.toLowerCase();
  if (text.includes('engineering')) score += 12;
  if (text.includes('content')) score += 10;
  if (text.includes('founder')) score += 8;
  if (text.includes('warm') || text.includes('intro')) score += 10;
  return Math.min(100, score);
}

export function researchLead(request: ResearchRequest): ResearchResult {
  const fitScore = computeFitScore(request);
  const angles = [
    `Lead with ${request.offer.valueProp.toLowerCase()}.`,
    `Anchor the message in ${request.company.name}'s current operating pain.`,
    `Keep the CTA tied to a fast pilot instead of a generic discovery call.`,
  ];

  return {
    fitScore,
    summary: `${request.company.name} is a credible fit for ${request.offer.name}. ${request.project.name} should be framed as a direct operational outcome, not a vague AI pitch.`,
    angles,
  };
}

export function personalizeOutreach(request: PersonalizationRequest): PersonalizationResult {
  const firstName = request.contact.fullName.split(' ')[0] ?? request.contact.fullName;
  const callToAction =
    request.channel === 'linkedin'
      ? 'Happy to send a tighter note you can review before sending.'
      : 'Worth a 15-minute pilot scoping call next week?';

  const subject =
    request.channel === 'email' ? `${firstName}, quick idea for ${request.company.name}` : null;

  return {
    subject,
    body: [
      `${firstName} — ${request.brand.name} helps teams move from AI chaos to something operational.`,
      `For ${request.company.name}, the obvious angle is ${request.offer.valueProp.toLowerCase()}.`,
      `If that is live pain right now, ${callToAction}`,
    ].join('\n\n'),
    callToAction,
  };
}

export function triageReply(request: ReplyTriageRequest): ReplyTriageResult {
  const text = request.text.toLowerCase();

  const match = (
    classification: ReplyClassification,
    confidence: number,
    reason: string,
    suggestedNextStep: string,
  ): ReplyTriageResult => ({
    classification,
    confidence,
    reason,
    suggestedNextStep,
  });

  if (/\b(book|calendar|meet|next week|pricing|outline)\b/.test(text)) {
    return match(
      'meeting',
      0.93,
      'The reply asks for scheduling or concrete proposal details.',
      'Create a high-priority follow-up task and move the opportunity forward.',
    );
  }

  if (/\b(interested|sounds good|timely|send over|yes)\b/.test(text)) {
    return match(
      'interested',
      0.88,
      'The reply shows clear positive buying intent.',
      'Stop the sequence and create a founder follow-up task.',
    );
  }

  if (/\b(not now|later|quarter|circle back|follow up later)\b/.test(text)) {
    return match(
      'not-now',
      0.85,
      'The contact is deferring rather than rejecting.',
      'Pause the sequence and schedule a future follow-up task.',
    );
  }

  if (/\b(no thanks|not a fit|not relevant|unsubscribe|remove me)\b/.test(text)) {
    return match(
      /unsubscribe|remove me/.test(text) ? 'unsubscribe' : 'not-a-fit',
      0.96,
      'The reply explicitly opts out or rejects the fit.',
      'Stop the sequence and mark the lead closed-lost.',
    );
  }

  return match(
    'neutral',
    0.52,
    'The reply contains no strong purchase or rejection signal.',
    'Keep the thread open for manual review.',
  );
}
