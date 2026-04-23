import type { Company, Contact, EnrichmentResult } from '@shiplead/shared';

function inferDomain(company: Company, contact: Contact | null): string | null {
  if (company.domain) return company.domain;
  if (contact?.email?.includes('@')) return contact.email.split('@')[1] ?? null;
  return null;
}

export function enrichLead(company: Company, contact: Contact | null): EnrichmentResult {
  const domain = inferDomain(company, contact);
  const inferredWebsiteUrl = company.websiteUrl ?? (domain ? `https://${domain}` : null);
  const inferredXHandle = company.xHandle ?? (domain ? `@${domain.split('.')[0]}` : null);
  const missingFields = [
    company.domain ? null : 'company.domain',
    company.websiteUrl ? null : 'company.websiteUrl',
    contact?.linkedinUrl ? null : 'contact.linkedinUrl',
  ].filter((value): value is string => Boolean(value));

  return {
    companyDomain: domain,
    inferredWebsiteUrl,
    inferredXHandle,
    missingFields,
    summary:
      missingFields.length === 0
        ? 'Record is already strong enough for outbound.'
        : `Still missing ${missingFields.join(', ')} before a fully personalized sequence.`,
  };
}
