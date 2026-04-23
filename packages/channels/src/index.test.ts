import { createDemoSeed } from '@shiplead/shared';
import { describe, expect, it } from 'vitest';
import { createChannelDraft } from './index';

describe('channel draft adapter', () => {
  const seed = createDemoSeed();

  it('requires review for LinkedIn drafts', () => {
    const draft = createChannelDraft({
      channel: 'linkedin',
      brand: seed.brands[0],
      offer: seed.offers[0],
      personalization: {
        subject: null,
        body: 'Draft body',
        callToAction: 'Send manually',
      },
    });

    expect(draft.reviewRequired).toBe(true);
    expect(draft.body).toContain('Manual send only');
  });
});
