import type {
  Brand,
  ChannelDraft,
  ChannelType,
  Offer,
  PersonalizationResult,
} from '@shiplead/shared';

function senderIdentity(brand: Brand, channel: ChannelType): string {
  if (channel === 'email') return brand.emailFrom ?? brand.name;
  if (channel === 'x') return brand.xHandle ?? brand.name;
  return brand.linkedinUrl ?? brand.name;
}

export function createChannelDraft(args: {
  channel: ChannelType;
  brand: Brand;
  offer: Offer;
  personalization: PersonalizationResult;
}): ChannelDraft {
  const reviewRequired = args.channel === 'linkedin';

  return {
    channel: args.channel,
    subject: args.personalization.subject,
    body:
      args.channel === 'linkedin'
        ? `${args.personalization.body}\n\nManual send only in v1.`
        : args.personalization.body,
    senderIdentity: senderIdentity(args.brand, args.channel),
    reviewRequired,
  };
}
