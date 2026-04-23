import { z } from 'zod';

export const channelSchema = z.enum(['email', 'x', 'linkedin']);
export const contactLifecycleSchema = z.enum(['new', 'qualified', 'engaged', 'customer']);
export const leadStatusSchema = z.enum([
  'new',
  'researching',
  'qualified',
  'reached-out',
  'engaged',
  'won',
  'lost',
]);
export const opportunityStageSchema = z.enum([
  'prospecting',
  'qualified',
  'meeting-booked',
  'proposal',
  'won',
  'lost',
]);
export const taskStatusSchema = z.enum(['todo', 'in-progress', 'done']);
export const taskPrioritySchema = z.enum(['high', 'medium', 'low']);
export const activityKindSchema = z.enum([
  'note',
  'sequence-enrolled',
  'sequence-stopped',
  'email-sent',
  'email-replied',
  'x-sent',
  'linkedin-task',
  'task-created',
  'task-completed',
  'stage-changed',
]);
export const threadStatusSchema = z.enum(['open', 'waiting', 'closed']);
export const messageDirectionSchema = z.enum(['inbound', 'outbound', 'draft']);
export const sequenceStatusSchema = z.enum(['active', 'paused', 'archived']);
export const enrollmentStatusSchema = z.enum(['active', 'paused', 'completed', 'replied']);
export const sequenceStepTypeSchema = z.enum([
  'research',
  'task',
  'wait',
  'email',
  'x',
  'linkedin-task',
]);
export const replyClassificationSchema = z.enum([
  'interested',
  'meeting',
  'not-now',
  'not-a-fit',
  'unsubscribe',
  'neutral',
]);

const idSchema = z.string().min(1);
const isoSchema = z.string().min(1);

export const sequenceStepSchema = z.object({
  id: idSchema,
  position: z.number().int().nonnegative(),
  type: sequenceStepTypeSchema,
  channel: channelSchema.nullable(),
  delayDays: z.number().int().nonnegative(),
  subjectTemplate: z.string().nullable(),
  bodyTemplate: z.string().nullable(),
  taskTitle: z.string().nullable(),
});

const entityBaseSchema = z.object({
  id: idSchema,
  createdAt: isoSchema,
  updatedAt: isoSchema,
});

export const workspaceSchema = entityBaseSchema.extend({
  name: z.string().min(1),
  slug: z.string().min(1),
  ownerName: z.string().min(1),
  deploymentMode: z.enum(['self-hosted', 'hosted']),
});

export const projectSchema = entityBaseSchema.extend({
  workspaceId: idSchema,
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string(),
  websiteUrl: z.string().nullable(),
  status: z.enum(['active', 'paused', 'archived']),
});

export const brandSchema = entityBaseSchema.extend({
  workspaceId: idSchema,
  name: z.string().min(1),
  slug: z.string().min(1),
  emailFrom: z.string().nullable(),
  xHandle: z.string().nullable(),
  linkedinUrl: z.string().nullable(),
  toneSummary: z.string(),
});

export const offerSchema = entityBaseSchema.extend({
  projectId: idSchema,
  brandId: idSchema,
  name: z.string().min(1),
  description: z.string(),
  idealCustomerProfile: z.string(),
  valueProp: z.string(),
});

export const companySchema = entityBaseSchema.extend({
  name: z.string().min(1),
  domain: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  linkedinUrl: z.string().nullable(),
  xHandle: z.string().nullable(),
  tags: z.array(z.string()),
  notes: z.string(),
});

export const contactSchema = entityBaseSchema.extend({
  companyId: idSchema.nullable(),
  fullName: z.string().min(1),
  jobTitle: z.string().nullable(),
  email: z.string().nullable(),
  xHandle: z.string().nullable(),
  linkedinUrl: z.string().nullable(),
  lifecycle: contactLifecycleSchema,
  notes: z.string(),
});

export const leadSchema = entityBaseSchema.extend({
  projectId: idSchema,
  offerId: idSchema,
  brandId: idSchema,
  companyId: idSchema,
  contactId: idSchema,
  source: z.string().min(1),
  status: leadStatusSchema,
  score: z.number().min(0).max(100),
  notes: z.string(),
});

export const opportunitySchema = entityBaseSchema.extend({
  projectId: idSchema,
  offerId: idSchema,
  companyId: idSchema,
  contactId: idSchema.nullable(),
  name: z.string().min(1),
  stage: opportunityStageSchema,
  annualValue: z.number().nullable(),
  nextStep: z.string(),
});

export const taskSchema = entityBaseSchema.extend({
  projectId: idSchema,
  brandId: idSchema,
  contactId: idSchema.nullable(),
  companyId: idSchema.nullable(),
  opportunityId: idSchema.nullable(),
  summary: z.string().min(1),
  description: z.string(),
  channel: channelSchema.nullable(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  dueAt: z.string().nullable(),
});

export const activitySchema = entityBaseSchema.extend({
  projectId: idSchema,
  brandId: idSchema.nullable(),
  contactId: idSchema.nullable(),
  companyId: idSchema.nullable(),
  opportunityId: idSchema.nullable(),
  kind: activityKindSchema,
  actor: z.enum(['ai', 'human', 'system']),
  summary: z.string().min(1),
  detail: z.string(),
  occurredAt: isoSchema,
});

export const sequenceSchema = entityBaseSchema.extend({
  projectId: idSchema,
  brandId: idSchema,
  offerId: idSchema.nullable(),
  name: z.string().min(1),
  description: z.string(),
  status: sequenceStatusSchema,
  stopOnReply: z.boolean(),
  steps: z.array(sequenceStepSchema),
});

export const enrollmentSchema = entityBaseSchema.extend({
  sequenceId: idSchema,
  projectId: idSchema,
  brandId: idSchema,
  leadId: idSchema,
  contactId: idSchema,
  status: enrollmentStatusSchema,
  currentStepIndex: z.number().int().nonnegative(),
  nextRunAt: z.string().nullable(),
  lastRunAt: z.string().nullable(),
  stoppedReason: z.string().nullable(),
});

export const channelAccountSchema = entityBaseSchema.extend({
  brandId: idSchema,
  channel: channelSchema,
  identifier: z.string().min(1),
  status: z.enum(['connected', 'manual', 'disabled']),
});

export const inboxThreadSchema = entityBaseSchema.extend({
  projectId: idSchema,
  brandId: idSchema,
  companyId: idSchema.nullable(),
  contactId: idSchema.nullable(),
  channel: channelSchema,
  title: z.string().min(1),
  status: threadStatusSchema,
  unreadCount: z.number().int().nonnegative(),
  lastMessageAt: isoSchema,
});

export const messageSchema = entityBaseSchema.extend({
  threadId: idSchema,
  contactId: idSchema.nullable(),
  direction: messageDirectionSchema,
  channel: channelSchema,
  subject: z.string().nullable(),
  body: z.string().min(1),
  sender: z.string().min(1),
  recipient: z.string().min(1),
  sentAt: isoSchema,
  classification: replyClassificationSchema.nullable(),
});

export const searchResultSchema = z.object({
  id: idSchema,
  entityType: z.enum(['contact', 'company', 'task', 'opportunity']),
  title: z.string().min(1),
  subtitle: z.string(),
});

export const dashboardMetricsSchema = z.object({
  contactCount: z.number().int().nonnegative(),
  companyCount: z.number().int().nonnegative(),
  openTaskCount: z.number().int().nonnegative(),
  activeSequenceCount: z.number().int().nonnegative(),
  openInboxCount: z.number().int().nonnegative(),
  pipelineValue: z.number().nonnegative(),
});

export const dashboardSnapshotSchema = z.object({
  workspace: workspaceSchema,
  projects: z.array(projectSchema),
  brands: z.array(brandSchema),
  offers: z.array(offerSchema),
  metrics: dashboardMetricsSchema,
  tasks: z.array(taskSchema),
  activities: z.array(activitySchema),
  inboxThreads: z.array(inboxThreadSchema),
  leads: z.array(leadSchema),
  contacts: z.array(contactSchema),
  companies: z.array(companySchema),
  opportunities: z.array(opportunitySchema),
  sequences: z.array(sequenceSchema),
  enrollments: z.array(enrollmentSchema),
});

export const createProjectInputSchema = z.object({
  workspaceId: idSchema,
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().default(''),
  websiteUrl: z.string().nullable().optional().default(null),
});

export const createBrandInputSchema = z.object({
  workspaceId: idSchema,
  name: z.string().min(1),
  slug: z.string().min(1),
  emailFrom: z.string().nullable().optional().default(null),
  xHandle: z.string().nullable().optional().default(null),
  linkedinUrl: z.string().nullable().optional().default(null),
  toneSummary: z.string().default('Direct, concise, product-aware.'),
});

export const createOfferInputSchema = z.object({
  projectId: idSchema,
  brandId: idSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  idealCustomerProfile: z.string().min(1),
  valueProp: z.string().min(1),
});

export const createCompanyInputSchema = z.object({
  name: z.string().min(1),
  domain: z.string().nullable().optional().default(null),
  websiteUrl: z.string().nullable().optional().default(null),
  linkedinUrl: z.string().nullable().optional().default(null),
  xHandle: z.string().nullable().optional().default(null),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().default(''),
});

export const createContactInputSchema = z.object({
  companyId: idSchema.nullable().optional().default(null),
  fullName: z.string().min(1),
  jobTitle: z.string().nullable().optional().default(null),
  email: z.string().nullable().optional().default(null),
  xHandle: z.string().nullable().optional().default(null),
  linkedinUrl: z.string().nullable().optional().default(null),
  lifecycle: contactLifecycleSchema.optional().default('new'),
  notes: z.string().default(''),
});

export const createLeadInputSchema = z.object({
  projectId: idSchema,
  offerId: idSchema,
  brandId: idSchema,
  companyId: idSchema,
  contactId: idSchema,
  source: z.string().min(1),
  status: leadStatusSchema.optional().default('new'),
  score: z.number().min(0).max(100).optional().default(50),
  notes: z.string().default(''),
});

export const createOpportunityInputSchema = z.object({
  projectId: idSchema,
  offerId: idSchema,
  companyId: idSchema,
  contactId: idSchema.nullable().optional().default(null),
  name: z.string().min(1),
  stage: opportunityStageSchema.optional().default('prospecting'),
  annualValue: z.number().nullable().optional().default(null),
  nextStep: z.string().default('Schedule follow-up'),
});

export const createTaskInputSchema = z.object({
  projectId: idSchema,
  brandId: idSchema,
  contactId: idSchema.nullable().optional().default(null),
  companyId: idSchema.nullable().optional().default(null),
  opportunityId: idSchema.nullable().optional().default(null),
  summary: z.string().min(1),
  description: z.string().default(''),
  channel: channelSchema.nullable().optional().default(null),
  status: taskStatusSchema.optional().default('todo'),
  priority: taskPrioritySchema.optional().default('medium'),
  dueAt: z.string().nullable().optional().default(null),
});

export const createActivityInputSchema = z.object({
  projectId: idSchema,
  brandId: idSchema.nullable().optional().default(null),
  contactId: idSchema.nullable().optional().default(null),
  companyId: idSchema.nullable().optional().default(null),
  opportunityId: idSchema.nullable().optional().default(null),
  kind: activityKindSchema,
  actor: z.enum(['ai', 'human', 'system']),
  summary: z.string().min(1),
  detail: z.string().default(''),
  occurredAt: z.string().optional(),
});

export const createSequenceInputSchema = z.object({
  projectId: idSchema,
  brandId: idSchema,
  offerId: idSchema.nullable().optional().default(null),
  name: z.string().min(1),
  description: z.string().default(''),
  status: sequenceStatusSchema.optional().default('active'),
  stopOnReply: z.boolean().optional().default(true),
  steps: z.array(sequenceStepSchema).min(1),
});

export const createThreadInputSchema = z.object({
  projectId: idSchema,
  brandId: idSchema,
  companyId: idSchema.nullable().optional().default(null),
  contactId: idSchema.nullable().optional().default(null),
  channel: channelSchema,
  title: z.string().min(1),
  status: threadStatusSchema.optional().default('open'),
});

export const createMessageInputSchema = z.object({
  contactId: idSchema.nullable().optional().default(null),
  direction: messageDirectionSchema,
  channel: channelSchema,
  subject: z.string().nullable().optional().default(null),
  body: z.string().min(1),
  sender: z.string().min(1),
  recipient: z.string().min(1),
  sentAt: z.string().optional(),
});

export const createEnrollmentInputSchema = z.object({
  sequenceId: idSchema,
  projectId: idSchema,
  brandId: idSchema,
  leadId: idSchema,
  contactId: idSchema,
  nextRunAt: z.string().nullable().optional().default(null),
});

export const researchRequestSchema = z.object({
  project: projectSchema,
  offer: offerSchema,
  company: companySchema,
  contact: contactSchema.nullable(),
});

export const researchResultSchema = z.object({
  fitScore: z.number().min(0).max(100),
  summary: z.string().min(1),
  angles: z.array(z.string()),
});

export const personalizationRequestSchema = z.object({
  channel: channelSchema,
  brand: brandSchema,
  offer: offerSchema,
  company: companySchema,
  contact: contactSchema,
});

export const personalizationResultSchema = z.object({
  subject: z.string().nullable(),
  body: z.string().min(1),
  callToAction: z.string().min(1),
});

export const replyTriageRequestSchema = z.object({
  text: z.string().min(1),
});

export const replyTriageResultSchema = z.object({
  classification: replyClassificationSchema,
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
  suggestedNextStep: z.string().min(1),
});

export const taskStatusPatchSchema = z.object({
  status: taskStatusSchema,
});

export const leadStatusPatchSchema = z.object({
  status: leadStatusSchema,
});

export const channelDraftSchema = z.object({
  channel: channelSchema,
  subject: z.string().nullable(),
  body: z.string().min(1),
  senderIdentity: z.string().min(1),
  reviewRequired: z.boolean(),
});

export const enrichmentResultSchema = z.object({
  companyDomain: z.string().nullable(),
  inferredWebsiteUrl: z.string().nullable(),
  inferredXHandle: z.string().nullable(),
  missingFields: z.array(z.string()),
  summary: z.string().min(1),
});
