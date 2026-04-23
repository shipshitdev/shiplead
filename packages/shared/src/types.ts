export type ChannelType = 'email' | 'x' | 'linkedin';
export type ContactLifecycle = 'new' | 'qualified' | 'engaged' | 'customer';
export type LeadStatus =
  | 'new'
  | 'researching'
  | 'qualified'
  | 'reached-out'
  | 'engaged'
  | 'won'
  | 'lost';
export type OpportunityStage =
  | 'prospecting'
  | 'qualified'
  | 'meeting-booked'
  | 'proposal'
  | 'won'
  | 'lost';
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';
export type ActivityKind =
  | 'note'
  | 'sequence-enrolled'
  | 'sequence-stopped'
  | 'email-sent'
  | 'email-replied'
  | 'x-sent'
  | 'linkedin-task'
  | 'task-created'
  | 'task-completed'
  | 'stage-changed';
export type ThreadStatus = 'open' | 'waiting' | 'closed';
export type MessageDirection = 'inbound' | 'outbound' | 'draft';
export type SequenceStatus = 'active' | 'paused' | 'archived';
export type EnrollmentStatus = 'active' | 'paused' | 'completed' | 'replied';
export type SequenceStepType = 'research' | 'task' | 'wait' | 'email' | 'x' | 'linkedin-task';
export type ReplyClassification =
  | 'interested'
  | 'meeting'
  | 'not-now'
  | 'not-a-fit'
  | 'unsubscribe'
  | 'neutral';

export interface EntityBase {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace extends EntityBase {
  name: string;
  slug: string;
  ownerName: string;
  deploymentMode: 'self-hosted' | 'hosted';
}

export interface Project extends EntityBase {
  workspaceId: string;
  name: string;
  slug: string;
  description: string;
  websiteUrl: string | null;
  status: 'active' | 'paused' | 'archived';
}

export interface Brand extends EntityBase {
  workspaceId: string;
  name: string;
  slug: string;
  emailFrom: string | null;
  xHandle: string | null;
  linkedinUrl: string | null;
  toneSummary: string;
}

export interface Offer extends EntityBase {
  projectId: string;
  brandId: string;
  name: string;
  description: string;
  idealCustomerProfile: string;
  valueProp: string;
}

export interface Company extends EntityBase {
  name: string;
  domain: string | null;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  xHandle: string | null;
  tags: string[];
  notes: string;
}

export interface Contact extends EntityBase {
  companyId: string | null;
  fullName: string;
  jobTitle: string | null;
  email: string | null;
  xHandle: string | null;
  linkedinUrl: string | null;
  lifecycle: ContactLifecycle;
  notes: string;
}

export interface LeadRecord extends EntityBase {
  projectId: string;
  offerId: string;
  brandId: string;
  companyId: string;
  contactId: string;
  source: string;
  status: LeadStatus;
  score: number;
  notes: string;
}

export interface Opportunity extends EntityBase {
  projectId: string;
  offerId: string;
  companyId: string;
  contactId: string | null;
  name: string;
  stage: OpportunityStage;
  annualValue: number | null;
  nextStep: string;
}

export interface Task extends EntityBase {
  projectId: string;
  brandId: string;
  contactId: string | null;
  companyId: string | null;
  opportunityId: string | null;
  summary: string;
  description: string;
  channel: ChannelType | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
}

export interface Activity extends EntityBase {
  projectId: string;
  brandId: string | null;
  contactId: string | null;
  companyId: string | null;
  opportunityId: string | null;
  kind: ActivityKind;
  actor: 'ai' | 'human' | 'system';
  summary: string;
  detail: string;
  occurredAt: string;
}

export interface SequenceStep {
  id: string;
  position: number;
  type: SequenceStepType;
  channel: ChannelType | null;
  delayDays: number;
  subjectTemplate: string | null;
  bodyTemplate: string | null;
  taskTitle: string | null;
}

export interface Sequence extends EntityBase {
  projectId: string;
  brandId: string;
  offerId: string | null;
  name: string;
  description: string;
  status: SequenceStatus;
  stopOnReply: boolean;
  steps: SequenceStep[];
}

export interface Enrollment extends EntityBase {
  sequenceId: string;
  projectId: string;
  brandId: string;
  leadId: string;
  contactId: string;
  status: EnrollmentStatus;
  currentStepIndex: number;
  nextRunAt: string | null;
  lastRunAt: string | null;
  stoppedReason: string | null;
}

export interface ChannelAccount extends EntityBase {
  brandId: string;
  channel: ChannelType;
  identifier: string;
  status: 'connected' | 'manual' | 'disabled';
}

export interface InboxThread extends EntityBase {
  projectId: string;
  brandId: string;
  companyId: string | null;
  contactId: string | null;
  channel: ChannelType;
  title: string;
  status: ThreadStatus;
  unreadCount: number;
  lastMessageAt: string;
}

export interface Message extends EntityBase {
  threadId: string;
  contactId: string | null;
  direction: MessageDirection;
  channel: ChannelType;
  subject: string | null;
  body: string;
  sender: string;
  recipient: string;
  sentAt: string;
  classification: ReplyClassification | null;
}

export interface SearchResult {
  id: string;
  entityType: 'contact' | 'company' | 'task' | 'opportunity';
  title: string;
  subtitle: string;
}

export interface DashboardMetrics {
  contactCount: number;
  companyCount: number;
  openTaskCount: number;
  activeSequenceCount: number;
  openInboxCount: number;
  pipelineValue: number;
}

export interface DashboardSnapshot {
  workspace: Workspace;
  projects: Project[];
  brands: Brand[];
  offers: Offer[];
  metrics: DashboardMetrics;
  tasks: Task[];
  activities: Activity[];
  inboxThreads: InboxThread[];
  leads: LeadRecord[];
  contacts: Contact[];
  companies: Company[];
  opportunities: Opportunity[];
  sequences: Sequence[];
  enrollments: Enrollment[];
}

export interface ResearchRequest {
  project: Project;
  offer: Offer;
  company: Company;
  contact: Contact | null;
}

export interface ResearchResult {
  fitScore: number;
  summary: string;
  angles: string[];
}

export interface PersonalizationRequest {
  channel: ChannelType;
  brand: Brand;
  offer: Offer;
  company: Company;
  contact: Contact;
}

export interface PersonalizationResult {
  subject: string | null;
  body: string;
  callToAction: string;
}

export interface ReplyTriageRequest {
  text: string;
}

export interface ReplyTriageResult {
  classification: ReplyClassification;
  confidence: number;
  reason: string;
  suggestedNextStep: string;
}

export interface ChannelDraft {
  channel: ChannelType;
  subject: string | null;
  body: string;
  senderIdentity: string;
  reviewRequired: boolean;
}

export interface EnrichmentResult {
  companyDomain: string | null;
  inferredWebsiteUrl: string | null;
  inferredXHandle: string | null;
  missingFields: string[];
  summary: string;
}

export interface CreateProjectInput {
  workspaceId: string;
  name: string;
  slug: string;
  description?: string;
  websiteUrl?: string | null;
}

export interface CreateBrandInput {
  workspaceId: string;
  name: string;
  slug: string;
  emailFrom?: string | null;
  xHandle?: string | null;
  linkedinUrl?: string | null;
  toneSummary?: string;
}

export interface CreateOfferInput {
  projectId: string;
  brandId: string;
  name: string;
  description: string;
  idealCustomerProfile: string;
  valueProp: string;
}

export interface CreateCompanyInput {
  name: string;
  domain?: string | null;
  websiteUrl?: string | null;
  linkedinUrl?: string | null;
  xHandle?: string | null;
  tags?: string[];
  notes?: string;
}

export interface CreateContactInput {
  companyId?: string | null;
  fullName: string;
  jobTitle?: string | null;
  email?: string | null;
  xHandle?: string | null;
  linkedinUrl?: string | null;
  lifecycle?: ContactLifecycle;
  notes?: string;
}

export interface CreateLeadInput {
  projectId: string;
  offerId: string;
  brandId: string;
  companyId: string;
  contactId: string;
  source: string;
  status?: LeadStatus;
  score?: number;
  notes?: string;
}

export interface LeadStatusPatchInput {
  status: LeadStatus;
}

export interface CreateOpportunityInput {
  projectId: string;
  offerId: string;
  companyId: string;
  contactId?: string | null;
  name: string;
  stage?: OpportunityStage;
  annualValue?: number | null;
  nextStep?: string;
}

export interface CreateTaskInput {
  projectId: string;
  brandId: string;
  contactId?: string | null;
  companyId?: string | null;
  opportunityId?: string | null;
  summary: string;
  description?: string;
  channel?: ChannelType | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueAt?: string | null;
}

export interface CreateActivityInput {
  projectId: string;
  brandId?: string | null;
  contactId?: string | null;
  companyId?: string | null;
  opportunityId?: string | null;
  kind: ActivityKind;
  actor: 'ai' | 'human' | 'system';
  summary: string;
  detail?: string;
  occurredAt?: string;
}

export interface CreateSequenceInput {
  projectId: string;
  brandId: string;
  offerId?: string | null;
  name: string;
  description?: string;
  status?: SequenceStatus;
  stopOnReply?: boolean;
  steps: SequenceStep[];
}

export interface CreateThreadInput {
  projectId: string;
  brandId: string;
  companyId?: string | null;
  contactId?: string | null;
  channel: ChannelType;
  title: string;
  status?: ThreadStatus;
}

export interface CreateMessageInput {
  contactId?: string | null;
  direction: MessageDirection;
  channel: ChannelType;
  subject?: string | null;
  body: string;
  sender: string;
  recipient: string;
  sentAt?: string;
}

export interface CreateEnrollmentInput {
  sequenceId: string;
  projectId: string;
  brandId: string;
  leadId: string;
  contactId: string;
  nextRunAt?: string | null;
}

export interface ShipleadDesktopAPI {
  getApiBaseUrl: () => Promise<string>;
  openExternal: (url: string) => Promise<void>;
}
