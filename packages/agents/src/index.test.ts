import { createDemoSeed } from '@shiplead/shared';
import { describe, expect, it } from 'vitest';
import { personalizeOutreach, researchLead, triageReply } from './index';

describe('agent helpers', () => {
  const seed = createDemoSeed();

  it('scores a lead and returns tactical angles', () => {
    const result = researchLead({
      project: seed.projects[0],
      offer: seed.offers[0],
      company: seed.companies[0],
      contact: seed.contacts[0],
    });

    expect(result.fitScore).toBeGreaterThan(60);
    expect(result.angles).toHaveLength(3);
  });

  it('creates a personalized email draft', () => {
    const result = personalizeOutreach({
      channel: 'email',
      brand: seed.brands[0],
      offer: seed.offers[0],
      company: seed.companies[0],
      contact: seed.contacts[0],
    });

    expect(result.subject).toContain('Maya');
    expect(result.body).toContain('ArcForge');
  });

  it('classifies positive replies as meeting intent', () => {
    const result = triageReply({
      text: 'This looks timely. Can you send over pricing and a time next week?',
    });

    expect(result.classification).toBe('meeting');
  });
});
