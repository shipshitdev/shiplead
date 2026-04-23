import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  type Activity,
  type Brand,
  type ChannelAccount,
  type Company,
  type Contact,
  type CreateActivityInput,
  type CreateBrandInput,
  type CreateCompanyInput,
  type CreateContactInput,
  type CreateEnrollmentInput,
  type CreateLeadInput,
  type CreateMessageInput,
  type CreateOfferInput,
  type CreateOpportunityInput,
  type CreateProjectInput,
  type CreateSequenceInput,
  type CreateTaskInput,
  type CreateThreadInput,
  createActivityInputSchema,
  createBrandInputSchema,
  createCompanyInputSchema,
  createContactInputSchema,
  createDemoSeed,
  createEnrollmentInputSchema,
  createLeadInputSchema,
  createMessageInputSchema,
  createOfferInputSchema,
  createOpportunityInputSchema,
  createProjectInputSchema,
  createSequenceInputSchema,
  createTaskInputSchema as createTaskSchema,
  createThreadInputSchema,
  type DashboardSnapshot,
  type Enrollment,
  type InboxThread,
  type LeadRecord,
  leadStatusPatchSchema,
  type Message,
  type Offer,
  type Opportunity,
  type Project,
  type SearchResult,
  type Sequence,
  type Task,
  type TaskStatus,
  taskStatusPatchSchema,
  toIsoUtc,
  type Workspace,
} from '@shiplead/shared';
import { nanoid } from 'nanoid';
import { migrate } from './schema.js';

let dbSingleton: DatabaseSync | null = null;

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function asRows<T>(rows: unknown[]): T[] {
  return rows as T[];
}

function asRow<T>(row: unknown): T {
  return row as T;
}

type EntityRow = {
  id: string;
  created_at: string;
  updated_at: string;
};

type WorkspaceRow = EntityRow & {
  name: string;
  slug: string;
  owner_name: string;
  deployment_mode: 'self-hosted' | 'hosted';
};

type ProjectRow = EntityRow & {
  workspace_id: string;
  name: string;
  slug: string;
  description: string;
  website_url: string | null;
  status: 'active' | 'paused' | 'archived';
};

type BrandRow = EntityRow & {
  workspace_id: string;
  name: string;
  slug: string;
  email_from: string | null;
  x_handle: string | null;
  linkedin_url: string | null;
  tone_summary: string;
};

type OfferRow = EntityRow & {
  project_id: string;
  brand_id: string;
  name: string;
  description: string;
  ideal_customer_profile: string;
  value_prop: string;
};

type CompanyRow = EntityRow & {
  name: string;
  domain: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  x_handle: string | null;
  tags_json: string;
  notes: string;
};

type ContactRow = EntityRow & {
  company_id: string | null;
  full_name: string;
  job_title: string | null;
  email: string | null;
  x_handle: string | null;
  linkedin_url: string | null;
  lifecycle: Contact['lifecycle'];
  notes: string;
};

type LeadRow = EntityRow & {
  project_id: string;
  offer_id: string;
  brand_id: string;
  company_id: string;
  contact_id: string;
  source: string;
  status: LeadRecord['status'];
  score: number;
  notes: string;
};

type OpportunityRow = EntityRow & {
  project_id: string;
  offer_id: string;
  company_id: string;
  contact_id: string | null;
  name: string;
  stage: Opportunity['stage'];
  annual_value: number | null;
  next_step: string;
};

type TaskRow = EntityRow & {
  project_id: string;
  brand_id: string;
  contact_id: string | null;
  company_id: string | null;
  opportunity_id: string | null;
  summary: string;
  description: string;
  channel: Task['channel'];
  status: Task['status'];
  priority: Task['priority'];
  due_at: string | null;
};

type ActivityRow = EntityRow & {
  project_id: string;
  brand_id: string | null;
  contact_id: string | null;
  company_id: string | null;
  opportunity_id: string | null;
  kind: Activity['kind'];
  actor: Activity['actor'];
  summary: string;
  detail: string;
  occurred_at: string;
};

type SequenceRow = EntityRow & {
  project_id: string;
  brand_id: string;
  offer_id: string | null;
  name: string;
  description: string;
  status: Sequence['status'];
  stop_on_reply: number;
  steps_json: string;
};

type EnrollmentRow = EntityRow & {
  sequence_id: string;
  project_id: string;
  brand_id: string;
  lead_id: string;
  contact_id: string;
  status: Enrollment['status'];
  current_step_index: number;
  next_run_at: string | null;
  last_run_at: string | null;
  stopped_reason: string | null;
};

type ChannelAccountRow = EntityRow & {
  brand_id: string;
  channel: ChannelAccount['channel'];
  identifier: string;
  status: ChannelAccount['status'];
};

type InboxThreadRow = EntityRow & {
  project_id: string;
  brand_id: string;
  company_id: string | null;
  contact_id: string | null;
  channel: InboxThread['channel'];
  title: string;
  status: InboxThread['status'];
  unread_count: number;
  last_message_at: string;
};

type MessageRow = EntityRow & {
  thread_id: string;
  contact_id: string | null;
  direction: Message['direction'];
  channel: Message['channel'];
  subject: string | null;
  body: string;
  sender: string;
  recipient: string;
  sent_at: string;
  classification: Message['classification'];
};

function mapWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    ownerName: row.owner_name,
    deploymentMode: row.deployment_mode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    websiteUrl: row.website_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBrand(row: BrandRow): Brand {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    slug: row.slug,
    emailFrom: row.email_from,
    xHandle: row.x_handle,
    linkedinUrl: row.linkedin_url,
    toneSummary: row.tone_summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOffer(row: OfferRow): Offer {
  return {
    id: row.id,
    projectId: row.project_id,
    brandId: row.brand_id,
    name: row.name,
    description: row.description,
    idealCustomerProfile: row.ideal_customer_profile,
    valueProp: row.value_prop,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    domain: row.domain,
    websiteUrl: row.website_url,
    linkedinUrl: row.linkedin_url,
    xHandle: row.x_handle,
    tags: parseJson<string[]>(row.tags_json),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapContact(row: ContactRow): Contact {
  return {
    id: row.id,
    companyId: row.company_id,
    fullName: row.full_name,
    jobTitle: row.job_title,
    email: row.email,
    xHandle: row.x_handle,
    linkedinUrl: row.linkedin_url,
    lifecycle: row.lifecycle,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLead(row: LeadRow): LeadRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    offerId: row.offer_id,
    brandId: row.brand_id,
    companyId: row.company_id,
    contactId: row.contact_id,
    source: row.source,
    status: row.status,
    score: row.score,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOpportunity(row: OpportunityRow): Opportunity {
  return {
    id: row.id,
    projectId: row.project_id,
    offerId: row.offer_id,
    companyId: row.company_id,
    contactId: row.contact_id,
    name: row.name,
    stage: row.stage,
    annualValue: row.annual_value,
    nextStep: row.next_step,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    brandId: row.brand_id,
    contactId: row.contact_id,
    companyId: row.company_id,
    opportunityId: row.opportunity_id,
    summary: row.summary,
    description: row.description,
    channel: row.channel,
    status: row.status,
    priority: row.priority,
    dueAt: row.due_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    projectId: row.project_id,
    brandId: row.brand_id,
    contactId: row.contact_id,
    companyId: row.company_id,
    opportunityId: row.opportunity_id,
    kind: row.kind,
    actor: row.actor,
    summary: row.summary,
    detail: row.detail,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSequence(row: SequenceRow): Sequence {
  return {
    id: row.id,
    projectId: row.project_id,
    brandId: row.brand_id,
    offerId: row.offer_id,
    name: row.name,
    description: row.description,
    status: row.status,
    stopOnReply: Boolean(row.stop_on_reply),
    steps: parseJson<Sequence['steps']>(row.steps_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEnrollment(row: EnrollmentRow): Enrollment {
  return {
    id: row.id,
    sequenceId: row.sequence_id,
    projectId: row.project_id,
    brandId: row.brand_id,
    leadId: row.lead_id,
    contactId: row.contact_id,
    status: row.status,
    currentStepIndex: row.current_step_index,
    nextRunAt: row.next_run_at,
    lastRunAt: row.last_run_at,
    stoppedReason: row.stopped_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapChannelAccount(row: ChannelAccountRow): ChannelAccount {
  return {
    id: row.id,
    brandId: row.brand_id,
    channel: row.channel,
    identifier: row.identifier,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapThread(row: InboxThreadRow): InboxThread {
  return {
    id: row.id,
    projectId: row.project_id,
    brandId: row.brand_id,
    companyId: row.company_id,
    contactId: row.contact_id,
    channel: row.channel,
    title: row.title,
    status: row.status,
    unreadCount: row.unread_count,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessage(row: MessageRow): Message {
  return {
    id: row.id,
    threadId: row.thread_id,
    contactId: row.contact_id,
    direction: row.direction,
    channel: row.channel,
    subject: row.subject,
    body: row.body,
    sender: row.sender,
    recipient: row.recipient,
    sentAt: row.sent_at,
    classification: row.classification,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function countRow(db: DatabaseSync, table: string): number {
  const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
  return row.count;
}

export class ShipleadDatabase {
  constructor(private readonly db: DatabaseSync) {}

  getWorkspace(): Workspace {
    const row = this.db.prepare('SELECT * FROM workspaces LIMIT 1').get();
    if (!row) {
      throw new Error('Workspace not found');
    }
    return mapWorkspace(asRow<WorkspaceRow>(row));
  }

  listProjects(): Project[] {
    return asRows<ProjectRow>(
      this.db.prepare('SELECT * FROM projects ORDER BY name ASC').all(),
    ).map(mapProject);
  }

  listBrands(): Brand[] {
    return asRows<BrandRow>(this.db.prepare('SELECT * FROM brands ORDER BY name ASC').all()).map(
      mapBrand,
    );
  }

  listOffers(): Offer[] {
    return asRows<OfferRow>(this.db.prepare('SELECT * FROM offers ORDER BY name ASC').all()).map(
      mapOffer,
    );
  }

  listCompanies(): Company[] {
    return asRows<CompanyRow>(
      this.db.prepare('SELECT * FROM companies ORDER BY name ASC').all(),
    ).map(mapCompany);
  }

  listContacts(): Contact[] {
    return asRows<ContactRow>(
      this.db.prepare('SELECT * FROM contacts ORDER BY full_name ASC').all(),
    ).map(mapContact);
  }

  listLeads(): LeadRecord[] {
    return asRows<LeadRow>(this.db.prepare('SELECT * FROM leads ORDER BY score DESC').all()).map(
      mapLead,
    );
  }

  listOpportunities(): Opportunity[] {
    return asRows<OpportunityRow>(
      this.db.prepare('SELECT * FROM opportunities ORDER BY updated_at DESC').all(),
    ).map(mapOpportunity);
  }

  listTasks(): Task[] {
    return asRows<TaskRow>(
      this.db
        .prepare(
          `SELECT * FROM tasks
             ORDER BY CASE status WHEN 'todo' THEN 0 WHEN 'in-progress' THEN 1 ELSE 2 END,
                      priority DESC,
                      COALESCE(due_at, updated_at) ASC`,
        )
        .all(),
    ).map(mapTask);
  }

  listActivities(): Activity[] {
    return asRows<ActivityRow>(
      this.db.prepare('SELECT * FROM activities ORDER BY occurred_at DESC').all(),
    ).map(mapActivity);
  }

  listSequences(): Sequence[] {
    return asRows<SequenceRow>(
      this.db.prepare('SELECT * FROM sequences ORDER BY updated_at DESC').all(),
    ).map(mapSequence);
  }

  listEnrollments(): Enrollment[] {
    return asRows<EnrollmentRow>(
      this.db.prepare('SELECT * FROM enrollments ORDER BY updated_at DESC').all(),
    ).map(mapEnrollment);
  }

  listThreads(): InboxThread[] {
    return asRows<InboxThreadRow>(
      this.db.prepare('SELECT * FROM inbox_threads ORDER BY last_message_at DESC').all(),
    ).map(mapThread);
  }

  listMessages(threadId: string): Message[] {
    return asRows<MessageRow>(
      this.db
        .prepare('SELECT * FROM messages WHERE thread_id = ? ORDER BY sent_at ASC')
        .all(threadId),
    ).map(mapMessage);
  }

  listChannelAccounts(): ChannelAccount[] {
    return asRows<ChannelAccountRow>(
      this.db.prepare('SELECT * FROM channel_accounts ORDER BY created_at ASC').all(),
    ).map(mapChannelAccount);
  }

  search(query: string): SearchResult[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    const contacts = this.listContacts()
      .filter((contact) =>
        [contact.fullName, contact.jobTitle, contact.email, contact.notes]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalized),
      )
      .map<SearchResult>((contact) => ({
        id: contact.id,
        entityType: 'contact',
        title: contact.fullName,
        subtitle: contact.jobTitle ?? contact.email ?? 'Contact',
      }));

    const companies = this.listCompanies()
      .filter((company) =>
        [company.name, company.domain, company.notes, company.tags.join(' ')]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalized),
      )
      .map<SearchResult>((company) => ({
        id: company.id,
        entityType: 'company',
        title: company.name,
        subtitle: company.domain ?? company.websiteUrl ?? 'Company',
      }));

    const tasks = this.listTasks()
      .filter((task) =>
        [task.summary, task.description].join(' ').toLowerCase().includes(normalized),
      )
      .map<SearchResult>((task) => ({
        id: task.id,
        entityType: 'task',
        title: task.summary,
        subtitle: `${task.priority} priority · ${task.status}`,
      }));

    const opportunities = this.listOpportunities()
      .filter((opportunity) =>
        [opportunity.name, opportunity.nextStep].join(' ').toLowerCase().includes(normalized),
      )
      .map<SearchResult>((opportunity) => ({
        id: opportunity.id,
        entityType: 'opportunity',
        title: opportunity.name,
        subtitle: `${opportunity.stage} · ${opportunity.annualValue ?? 0}`,
      }));

    return [...contacts, ...companies, ...tasks, ...opportunities].slice(0, 24);
  }

  getTaskById(id: string): Task | null {
    const row = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return row ? mapTask(asRow<TaskRow>(row)) : null;
  }

  getContactById(id: string): Contact | null {
    const row = this.db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
    return row ? mapContact(asRow<ContactRow>(row)) : null;
  }

  getCompanyById(id: string): Company | null {
    const row = this.db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
    return row ? mapCompany(asRow<CompanyRow>(row)) : null;
  }

  getOfferById(id: string): Offer | null {
    const row = this.db.prepare('SELECT * FROM offers WHERE id = ?').get(id);
    return row ? mapOffer(asRow<OfferRow>(row)) : null;
  }

  getProjectById(id: string): Project | null {
    const row = this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    return row ? mapProject(asRow<ProjectRow>(row)) : null;
  }

  getBrandById(id: string): Brand | null {
    const row = this.db.prepare('SELECT * FROM brands WHERE id = ?').get(id);
    return row ? mapBrand(asRow<BrandRow>(row)) : null;
  }

  getMessageById(id: string): Message | null {
    const row = this.db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
    return row ? mapMessage(asRow<MessageRow>(row)) : null;
  }

  getOpportunityByContact(contactId: string): Opportunity | null {
    const row = this.db
      .prepare(
        `SELECT * FROM opportunities
         WHERE contact_id = ? AND stage NOT IN ('won', 'lost')
         ORDER BY updated_at DESC
         LIMIT 1`,
      )
      .get(contactId);
    return row ? mapOpportunity(asRow<OpportunityRow>(row)) : null;
  }

  getSequenceById(id: string): Sequence | null {
    const row = this.db.prepare('SELECT * FROM sequences WHERE id = ?').get(id);
    return row ? mapSequence(asRow<SequenceRow>(row)) : null;
  }

  getLeadById(id: string): LeadRecord | null {
    const row = this.db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
    return row ? mapLead(asRow<LeadRow>(row)) : null;
  }

  getActiveEnrollmentsForContact(contactId: string): Enrollment[] {
    return asRows<EnrollmentRow>(
      this.db
        .prepare(
          'SELECT * FROM enrollments WHERE contact_id = ? AND status = ? ORDER BY updated_at DESC',
        )
        .all(contactId, 'active'),
    ).map(mapEnrollment);
  }

  getDashboardSnapshot(): DashboardSnapshot {
    const tasks = this.listTasks();
    const threads = this.listThreads();
    const leads = this.listLeads();
    const opportunities = this.listOpportunities();

    return {
      workspace: this.getWorkspace(),
      projects: this.listProjects(),
      brands: this.listBrands(),
      offers: this.listOffers(),
      metrics: {
        contactCount: countRow(this.db, 'contacts'),
        companyCount: countRow(this.db, 'companies'),
        openTaskCount: tasks.filter((task) => task.status !== 'done').length,
        activeSequenceCount: this.listSequences().filter((sequence) => sequence.status === 'active')
          .length,
        openInboxCount: threads.filter((thread) => thread.status !== 'closed').length,
        pipelineValue: opportunities.reduce((total, opportunity) => {
          return total + (opportunity.annualValue ?? 0);
        }, 0),
      },
      tasks: tasks.slice(0, 12),
      activities: this.listActivities().slice(0, 12),
      inboxThreads: threads.slice(0, 12),
      leads: leads.slice(0, 24),
      contacts: this.listContacts().slice(0, 12),
      companies: this.listCompanies().slice(0, 12),
      opportunities: opportunities.slice(0, 12),
      sequences: this.listSequences(),
      enrollments: this.listEnrollments(),
    };
  }

  createProject(input: CreateProjectInput): Project {
    const value = createProjectInputSchema.parse(input);
    const now = toIsoUtc();
    const id = nanoid();
    this.db
      .prepare(
        `INSERT INTO projects (
          id, workspace_id, name, slug, description, website_url, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      )
      .run(
        id,
        value.workspaceId,
        value.name,
        value.slug,
        value.description,
        value.websiteUrl,
        now,
        now,
      );

    return this.getProjectById(id) as Project;
  }

  createBrand(input: CreateBrandInput): Brand {
    const value = createBrandInputSchema.parse(input);
    const now = toIsoUtc();
    const id = nanoid();
    this.db
      .prepare(
        `INSERT INTO brands (
          id, workspace_id, name, slug, email_from, x_handle, linkedin_url, tone_summary, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        value.workspaceId,
        value.name,
        value.slug,
        value.emailFrom,
        value.xHandle,
        value.linkedinUrl,
        value.toneSummary,
        now,
        now,
      );

    return this.getBrandById(id) as Brand;
  }

  createOffer(input: CreateOfferInput): Offer {
    const value = createOfferInputSchema.parse(input);
    const now = toIsoUtc();
    const id = nanoid();
    this.db
      .prepare(
        `INSERT INTO offers (
          id, project_id, brand_id, name, description, ideal_customer_profile, value_prop, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        value.projectId,
        value.brandId,
        value.name,
        value.description,
        value.idealCustomerProfile,
        value.valueProp,
        now,
        now,
      );
    return this.getOfferById(id) as Offer;
  }

  createCompany(input: CreateCompanyInput): Company {
    const value = createCompanyInputSchema.parse(input);
    const now = toIsoUtc();
    const id = nanoid();
    this.db
      .prepare(
        `INSERT INTO companies (
          id, name, domain, website_url, linkedin_url, x_handle, tags_json, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        value.name,
        value.domain,
        value.websiteUrl,
        value.linkedinUrl,
        value.xHandle,
        JSON.stringify(value.tags),
        value.notes,
        now,
        now,
      );
    return this.getCompanyById(id) as Company;
  }

  createContact(input: CreateContactInput): Contact {
    const value = createContactInputSchema.parse(input);
    const now = toIsoUtc();
    const id = nanoid();
    this.db
      .prepare(
        `INSERT INTO contacts (
          id, company_id, full_name, job_title, email, x_handle, linkedin_url, lifecycle, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        value.companyId,
        value.fullName,
        value.jobTitle,
        value.email,
        value.xHandle,
        value.linkedinUrl,
        value.lifecycle,
        value.notes,
        now,
        now,
      );
    return this.getContactById(id) as Contact;
  }

  createLead(input: CreateLeadInput): LeadRecord {
    const value = createLeadInputSchema.parse(input);
    const now = toIsoUtc();
    const id = nanoid();
    this.db
      .prepare(
        `INSERT INTO leads (
          id, project_id, offer_id, brand_id, company_id, contact_id, source, status, score, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        value.projectId,
        value.offerId,
        value.brandId,
        value.companyId,
        value.contactId,
        value.source,
        value.status,
        value.score,
        value.notes,
        now,
        now,
      );

    return this.getLeadById(id) as LeadRecord;
  }

  createOpportunity(input: CreateOpportunityInput): Opportunity {
    const value = createOpportunityInputSchema.parse(input);
    const now = toIsoUtc();
    const id = nanoid();
    this.db
      .prepare(
        `INSERT INTO opportunities (
          id, project_id, offer_id, company_id, contact_id, name, stage, annual_value, next_step, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        value.projectId,
        value.offerId,
        value.companyId,
        value.contactId,
        value.name,
        value.stage,
        value.annualValue,
        value.nextStep,
        now,
        now,
      );
    const row = this.db.prepare('SELECT * FROM opportunities WHERE id = ?').get(id);
    return mapOpportunity(asRow<OpportunityRow>(row));
  }

  createTask(input: CreateTaskInput): Task {
    const value = createTaskSchema.parse(input);
    const now = toIsoUtc();
    const id = nanoid();
    this.db
      .prepare(
        `INSERT INTO tasks (
          id, project_id, brand_id, contact_id, company_id, opportunity_id, summary, description, channel, status, priority, due_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        value.projectId,
        value.brandId,
        value.contactId,
        value.companyId,
        value.opportunityId,
        value.summary,
        value.description,
        value.channel,
        value.status,
        value.priority,
        value.dueAt,
        now,
        now,
      );
    return this.getTaskById(id) as Task;
  }

  createActivity(input: CreateActivityInput): Activity {
    const value = createActivityInputSchema.parse(input);
    const now = toIsoUtc();
    const id = nanoid();
    this.db
      .prepare(
        `INSERT INTO activities (
          id, project_id, brand_id, contact_id, company_id, opportunity_id, kind, actor, summary, detail, occurred_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        value.projectId,
        value.brandId,
        value.contactId,
        value.companyId,
        value.opportunityId,
        value.kind,
        value.actor,
        value.summary,
        value.detail,
        value.occurredAt ?? now,
        now,
        now,
      );
    const row = this.db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
    return mapActivity(asRow<ActivityRow>(row));
  }

  createSequence(input: CreateSequenceInput): Sequence {
    const value = createSequenceInputSchema.parse(input);
    const now = toIsoUtc();
    const id = nanoid();
    this.db
      .prepare(
        `INSERT INTO sequences (
          id, project_id, brand_id, offer_id, name, description, status, stop_on_reply, steps_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        value.projectId,
        value.brandId,
        value.offerId,
        value.name,
        value.description,
        value.status,
        value.stopOnReply ? 1 : 0,
        JSON.stringify(value.steps),
        now,
        now,
      );
    return this.getSequenceById(id) as Sequence;
  }

  createThread(input: CreateThreadInput): InboxThread {
    const value = createThreadInputSchema.parse(input);
    const now = toIsoUtc();
    const id = nanoid();
    this.db
      .prepare(
        `INSERT INTO inbox_threads (
          id, project_id, brand_id, company_id, contact_id, channel, title, status, unread_count, last_message_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      )
      .run(
        id,
        value.projectId,
        value.brandId,
        value.companyId,
        value.contactId,
        value.channel,
        value.title,
        value.status,
        now,
        now,
        now,
      );
    const row = this.db.prepare('SELECT * FROM inbox_threads WHERE id = ?').get(id);
    return mapThread(asRow<InboxThreadRow>(row));
  }

  createMessage(threadId: string, input: CreateMessageInput): Message {
    const value = createMessageInputSchema.parse(input);
    const now = toIsoUtc();
    const id = nanoid();
    const sentAt = value.sentAt ?? now;
    this.db
      .prepare(
        `INSERT INTO messages (
          id, thread_id, contact_id, direction, channel, subject, body, sender, recipient, sent_at, classification, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
      )
      .run(
        id,
        threadId,
        value.contactId,
        value.direction,
        value.channel,
        value.subject,
        value.body,
        value.sender,
        value.recipient,
        sentAt,
        now,
        now,
      );

    const unreadIncrement = value.direction === 'inbound' ? 1 : 0;
    this.db
      .prepare(
        `UPDATE inbox_threads
           SET last_message_at = ?, unread_count = unread_count + ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(sentAt, unreadIncrement, now, threadId);

    const row = this.db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
    return mapMessage(asRow<MessageRow>(row));
  }

  createEnrollment(input: CreateEnrollmentInput): Enrollment {
    const value = createEnrollmentInputSchema.parse(input);
    const now = toIsoUtc();
    const id = nanoid();
    this.db
      .prepare(
        `INSERT INTO enrollments (
          id, sequence_id, project_id, brand_id, lead_id, contact_id, status, current_step_index, next_run_at, last_run_at, stopped_reason, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'active', 0, ?, NULL, NULL, ?, ?)`,
      )
      .run(
        id,
        value.sequenceId,
        value.projectId,
        value.brandId,
        value.leadId,
        value.contactId,
        value.nextRunAt,
        now,
        now,
      );
    const row = this.db.prepare('SELECT * FROM enrollments WHERE id = ?').get(id);
    return mapEnrollment(asRow<EnrollmentRow>(row));
  }

  updateTaskStatus(taskId: string, status: TaskStatus): Task | null {
    const value = taskStatusPatchSchema.parse({ status });
    const now = toIsoUtc();
    this.db
      .prepare('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?')
      .run(value.status, now, taskId);
    return this.getTaskById(taskId);
  }

  updateLeadStatus(leadId: string, status: LeadRecord['status']): LeadRecord | null {
    const value = leadStatusPatchSchema.parse({ status });
    const now = toIsoUtc();
    this.db
      .prepare('UPDATE leads SET status = ?, updated_at = ? WHERE id = ?')
      .run(value.status, now, leadId);
    return this.getLeadById(leadId);
  }

  updateMessageClassification(
    messageId: string,
    classification: Message['classification'],
  ): Message | null {
    const now = toIsoUtc();
    this.db
      .prepare('UPDATE messages SET classification = ?, updated_at = ? WHERE id = ?')
      .run(classification, now, messageId);
    return this.getMessageById(messageId);
  }

  updateOpportunityStage(
    opportunityId: string,
    stage: Opportunity['stage'],
    nextStep?: string,
  ): Opportunity | null {
    const now = toIsoUtc();
    this.db
      .prepare(
        `UPDATE opportunities
           SET stage = ?, next_step = COALESCE(?, next_step), updated_at = ?
         WHERE id = ?`,
      )
      .run(stage, nextStep ?? null, now, opportunityId);
    const row = this.db.prepare('SELECT * FROM opportunities WHERE id = ?').get(opportunityId);
    return row ? mapOpportunity(asRow<OpportunityRow>(row)) : null;
  }

  updateEnrollment(enrollment: Enrollment): Enrollment {
    this.db
      .prepare(
        `UPDATE enrollments
           SET status = ?, current_step_index = ?, next_run_at = ?, last_run_at = ?, stopped_reason = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        enrollment.status,
        enrollment.currentStepIndex,
        enrollment.nextRunAt,
        enrollment.lastRunAt,
        enrollment.stoppedReason,
        enrollment.updatedAt,
        enrollment.id,
      );
    const row = this.db.prepare('SELECT * FROM enrollments WHERE id = ?').get(enrollment.id);
    return mapEnrollment(asRow<EnrollmentRow>(row));
  }

  clearThreadUnread(threadId: string): void {
    this.db
      .prepare('UPDATE inbox_threads SET unread_count = 0, updated_at = ? WHERE id = ?')
      .run(toIsoUtc(), threadId);
  }
}

function insertSeedRows(store: ShipleadDatabase, seed = createDemoSeed()): void {
  const db = (store as unknown as { db: DatabaseSync }).db;

  db.prepare(
    `INSERT INTO workspaces (id, name, slug, owner_name, deployment_mode, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    seed.workspace.id,
    seed.workspace.name,
    seed.workspace.slug,
    seed.workspace.ownerName,
    seed.workspace.deploymentMode,
    seed.workspace.createdAt,
    seed.workspace.updatedAt,
  );

  for (const project of seed.projects) {
    db.prepare(
      `INSERT INTO projects (id, workspace_id, name, slug, description, website_url, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      project.id,
      project.workspaceId,
      project.name,
      project.slug,
      project.description,
      project.websiteUrl,
      project.status,
      project.createdAt,
      project.updatedAt,
    );
  }

  for (const brand of seed.brands) {
    db.prepare(
      `INSERT INTO brands (id, workspace_id, name, slug, email_from, x_handle, linkedin_url, tone_summary, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      brand.id,
      brand.workspaceId,
      brand.name,
      brand.slug,
      brand.emailFrom,
      brand.xHandle,
      brand.linkedinUrl,
      brand.toneSummary,
      brand.createdAt,
      brand.updatedAt,
    );
  }

  for (const offer of seed.offers) {
    db.prepare(
      `INSERT INTO offers (id, project_id, brand_id, name, description, ideal_customer_profile, value_prop, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      offer.id,
      offer.projectId,
      offer.brandId,
      offer.name,
      offer.description,
      offer.idealCustomerProfile,
      offer.valueProp,
      offer.createdAt,
      offer.updatedAt,
    );
  }

  for (const company of seed.companies) {
    db.prepare(
      `INSERT INTO companies (id, name, domain, website_url, linkedin_url, x_handle, tags_json, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      company.id,
      company.name,
      company.domain,
      company.websiteUrl,
      company.linkedinUrl,
      company.xHandle,
      JSON.stringify(company.tags),
      company.notes,
      company.createdAt,
      company.updatedAt,
    );
  }

  for (const contact of seed.contacts) {
    db.prepare(
      `INSERT INTO contacts (id, company_id, full_name, job_title, email, x_handle, linkedin_url, lifecycle, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      contact.id,
      contact.companyId,
      contact.fullName,
      contact.jobTitle,
      contact.email,
      contact.xHandle,
      contact.linkedinUrl,
      contact.lifecycle,
      contact.notes,
      contact.createdAt,
      contact.updatedAt,
    );
  }

  for (const lead of seed.leads) {
    db.prepare(
      `INSERT INTO leads (id, project_id, offer_id, brand_id, company_id, contact_id, source, status, score, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      lead.id,
      lead.projectId,
      lead.offerId,
      lead.brandId,
      lead.companyId,
      lead.contactId,
      lead.source,
      lead.status,
      lead.score,
      lead.notes,
      lead.createdAt,
      lead.updatedAt,
    );
  }

  for (const opportunity of seed.opportunities) {
    db.prepare(
      `INSERT INTO opportunities (id, project_id, offer_id, company_id, contact_id, name, stage, annual_value, next_step, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      opportunity.id,
      opportunity.projectId,
      opportunity.offerId,
      opportunity.companyId,
      opportunity.contactId,
      opportunity.name,
      opportunity.stage,
      opportunity.annualValue,
      opportunity.nextStep,
      opportunity.createdAt,
      opportunity.updatedAt,
    );
  }

  for (const task of seed.tasks) {
    db.prepare(
      `INSERT INTO tasks (id, project_id, brand_id, contact_id, company_id, opportunity_id, summary, description, channel, status, priority, due_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      task.id,
      task.projectId,
      task.brandId,
      task.contactId,
      task.companyId,
      task.opportunityId,
      task.summary,
      task.description,
      task.channel,
      task.status,
      task.priority,
      task.dueAt,
      task.createdAt,
      task.updatedAt,
    );
  }

  for (const activity of seed.activities) {
    db.prepare(
      `INSERT INTO activities (id, project_id, brand_id, contact_id, company_id, opportunity_id, kind, actor, summary, detail, occurred_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      activity.id,
      activity.projectId,
      activity.brandId,
      activity.contactId,
      activity.companyId,
      activity.opportunityId,
      activity.kind,
      activity.actor,
      activity.summary,
      activity.detail,
      activity.occurredAt,
      activity.createdAt,
      activity.updatedAt,
    );
  }

  for (const sequence of seed.sequences) {
    db.prepare(
      `INSERT INTO sequences (id, project_id, brand_id, offer_id, name, description, status, stop_on_reply, steps_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      sequence.id,
      sequence.projectId,
      sequence.brandId,
      sequence.offerId,
      sequence.name,
      sequence.description,
      sequence.status,
      sequence.stopOnReply ? 1 : 0,
      JSON.stringify(sequence.steps),
      sequence.createdAt,
      sequence.updatedAt,
    );
  }

  for (const enrollment of seed.enrollments) {
    db.prepare(
      `INSERT INTO enrollments (id, sequence_id, project_id, brand_id, lead_id, contact_id, status, current_step_index, next_run_at, last_run_at, stopped_reason, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      enrollment.id,
      enrollment.sequenceId,
      enrollment.projectId,
      enrollment.brandId,
      enrollment.leadId,
      enrollment.contactId,
      enrollment.status,
      enrollment.currentStepIndex,
      enrollment.nextRunAt,
      enrollment.lastRunAt,
      enrollment.stoppedReason,
      enrollment.createdAt,
      enrollment.updatedAt,
    );
  }

  for (const account of seed.channelAccounts) {
    db.prepare(
      `INSERT INTO channel_accounts (id, brand_id, channel, identifier, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      account.id,
      account.brandId,
      account.channel,
      account.identifier,
      account.status,
      account.createdAt,
      account.updatedAt,
    );
  }

  for (const thread of seed.inboxThreads) {
    db.prepare(
      `INSERT INTO inbox_threads (id, project_id, brand_id, company_id, contact_id, channel, title, status, unread_count, last_message_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      thread.id,
      thread.projectId,
      thread.brandId,
      thread.companyId,
      thread.contactId,
      thread.channel,
      thread.title,
      thread.status,
      thread.unreadCount,
      thread.lastMessageAt,
      thread.createdAt,
      thread.updatedAt,
    );
  }

  for (const message of seed.messages) {
    db.prepare(
      `INSERT INTO messages (id, thread_id, contact_id, direction, channel, subject, body, sender, recipient, sent_at, classification, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      message.id,
      message.threadId,
      message.contactId,
      message.direction,
      message.channel,
      message.subject,
      message.body,
      message.sender,
      message.recipient,
      message.sentAt,
      message.classification,
      message.createdAt,
      message.updatedAt,
    );
  }
}

export function seedDatabase(store: ShipleadDatabase): void {
  const db = (store as unknown as { db: DatabaseSync }).db;
  if (countRow(db, 'workspaces') > 0) return;
  insertSeedRows(store);
}

export function getDatabase(dataDir: string): ShipleadDatabase {
  if (dbSingleton) return new ShipleadDatabase(dbSingleton);

  const dbPath = path.join(dataDir, 'shiplead.db');
  dbSingleton = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true });
  dbSingleton.exec('PRAGMA journal_mode = WAL');
  dbSingleton.exec('PRAGMA busy_timeout = 5000');
  migrate(dbSingleton);

  const store = new ShipleadDatabase(dbSingleton);
  seedDatabase(store);
  return store;
}

export function closeDatabase(): void {
  if (dbSingleton) {
    dbSingleton.close();
    dbSingleton = null;
  }
}
