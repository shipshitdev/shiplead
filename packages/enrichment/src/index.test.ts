import { createDemoSeed } from '@shiplead/shared';
import { describe, expect, it } from 'vitest';
import { enrichLead } from './index';

describe('lead enrichment', () => {
  const seed = createDemoSeed();

  it('fills obvious company hints from known contact and company data', () => {
    const result = enrichLead(seed.companies[0], seed.contacts[0]);

    expect(result.companyDomain).toBe('arcforge.ai');
    expect(result.summary.length).toBeGreaterThan(0);
  });
});
