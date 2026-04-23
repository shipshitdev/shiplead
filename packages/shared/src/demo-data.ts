import type {
  Activity,
  Brand,
  ChannelAccount,
  Company,
  Contact,
  DashboardSnapshot,
  Enrollment,
  InboxThread,
  LeadRecord,
  Message,
  Offer,
  Opportunity,
  Project,
  Sequence,
  SequenceStep,
  Task,
  Workspace,
} from './types.js';

function iso(input: string): string {
  return new Date(input).toISOString();
}

function stamp<T extends object>(
  id: string,
  createdAt: string,
  updatedAt = createdAt,
): T & {
  id: string;
  createdAt: string;
  updatedAt: string;
} {
  return {
    id,
    createdAt: iso(createdAt),
    updatedAt: iso(updatedAt),
  } as T & { id: string; createdAt: string; updatedAt: string };
}

export type DemoSeed = DashboardSnapshot & {
  leads: LeadRecord[];
  channelAccounts: ChannelAccount[];
  messages: Message[];
};

export function createDemoSeed(): DemoSeed {
  const workspace: Workspace = {
    ...stamp<Workspace>('ws_main', '2026-04-23T08:00:00Z'),
    name: 'Vincent Labs',
    slug: 'vincent-labs',
    ownerName: 'Vincent',
    deploymentMode: 'self-hosted',
  };

  const projects: Project[] = [
    {
      ...stamp<Project>('proj_shipcode', '2026-04-23T08:10:00Z'),
      workspaceId: workspace.id,
      name: 'ShipCode',
      slug: 'shipcode',
      description: 'Autonomous coding pipeline for GitHub issues to PRs.',
      websiteUrl: 'https://shipcode.dev',
      status: 'active',
    },
    {
      ...stamp<Project>('proj_shipcut', '2026-04-23T08:12:00Z'),
      workspaceId: workspace.id,
      name: 'ShipCut',
      slug: 'shipcut',
      description: 'Fast social clip workflow and distribution tooling.',
      websiteUrl: 'https://shipcut.dev',
      status: 'active',
    },
  ];

  const brands: Brand[] = [
    {
      ...stamp<Brand>('brand_shipshit', '2026-04-23T08:20:00Z'),
      workspaceId: workspace.id,
      name: 'ShipShit.dev',
      slug: 'shipshit',
      emailFrom: 'vincent@shipshit.dev',
      xHandle: '@ShipShitDev',
      linkedinUrl: 'https://www.linkedin.com/company/shipshitdev',
      toneSummary: 'Founder-led, blunt, tactical, anti-bureaucracy.',
    },
  ];

  const offers: Offer[] = [
    {
      ...stamp<Offer>('offer_workshop', '2026-04-23T08:25:00Z'),
      projectId: projects[0].id,
      brandId: brands[0].id,
      name: 'AI Workflow Workshop',
      description: 'Hands-on workshop that gets a team shipping with AI agents.',
      idealCustomerProfile: 'Engineering leaders running delivery-heavy teams.',
      valueProp: 'Reduce AI chaos and turn it into repeatable execution.',
    },
    {
      ...stamp<Offer>('offer_sponsorship', '2026-04-23T08:27:00Z'),
      projectId: projects[1].id,
      brandId: brands[0].id,
      name: 'Creator Tool Pilot',
      description: 'Pilot onboarding for teams pushing clips and content output.',
      idealCustomerProfile: 'Marketing and media teams shipping content weekly.',
      valueProp: 'Shorten clip turnaround and improve repurposing throughput.',
    },
  ];

  const companies: Company[] = [
    {
      ...stamp<Company>('company_arc', '2026-04-23T08:30:00Z'),
      name: 'ArcForge',
      domain: 'arcforge.ai',
      websiteUrl: 'https://arcforge.ai',
      linkedinUrl: 'https://www.linkedin.com/company/arcforge-ai',
      xHandle: '@arcforge_ai',
      tags: ['ai-native', 'series-a'],
      notes: 'Strong engineering culture. Could buy workflow workshops quickly.',
    },
    {
      ...stamp<Company>('company_studio', '2026-04-23T08:31:00Z'),
      name: 'Studio Velocity',
      domain: 'studiovelocity.co',
      websiteUrl: 'https://studiovelocity.co',
      linkedinUrl: null,
      xHandle: '@velocitystudio',
      tags: ['content', 'agency'],
      notes: 'Likely fit for ShipCut pilot and automation retainers.',
    },
  ];

  const contacts: Contact[] = [
    {
      ...stamp<Contact>('contact_maya', '2026-04-23T08:35:00Z'),
      companyId: companies[0].id,
      fullName: 'Maya Coleman',
      jobTitle: 'VP Engineering',
      email: 'maya@arcforge.ai',
      xHandle: '@maya_builds',
      linkedinUrl: 'https://www.linkedin.com/in/maya-coleman',
      lifecycle: 'qualified',
      notes: 'Already discussing internal AI tooling rollout.',
    },
    {
      ...stamp<Contact>('contact_liam', '2026-04-23T08:37:00Z'),
      companyId: companies[1].id,
      fullName: 'Liam Ortega',
      jobTitle: 'Operations Director',
      email: 'liam@studiovelocity.co',
      xHandle: null,
      linkedinUrl: 'https://www.linkedin.com/in/liam-ortega',
      lifecycle: 'new',
      notes: 'Good candidate for social clip workflow pilot.',
    },
    {
      ...stamp<Contact>('contact_ren', '2026-04-23T08:38:00Z'),
      companyId: companies[1].id,
      fullName: 'Ren Park',
      jobTitle: 'Founder',
      email: 'ren@studiovelocity.co',
      xHandle: '@renpark',
      linkedinUrl: null,
      lifecycle: 'engaged',
      notes: 'Replied positively to a DM, wants concrete offer.',
    },
  ];

  const leads: LeadRecord[] = [
    {
      ...stamp<LeadRecord>('lead_maya', '2026-04-23T08:40:00Z'),
      projectId: projects[0].id,
      offerId: offers[0].id,
      brandId: brands[0].id,
      companyId: companies[0].id,
      contactId: contacts[0].id,
      source: 'founder-network',
      status: 'engaged',
      score: 88,
      notes: 'Warm intro through CTO community.',
    },
    {
      ...stamp<LeadRecord>('lead_liam', '2026-04-23T08:41:00Z'),
      projectId: projects[1].id,
      offerId: offers[1].id,
      brandId: brands[0].id,
      companyId: companies[1].id,
      contactId: contacts[1].id,
      source: 'csv-import',
      status: 'reached-out',
      score: 71,
      notes: 'Imported from outbound list.',
    },
  ];

  const opportunities: Opportunity[] = [
    {
      ...stamp<Opportunity>('opp_arc_workshop', '2026-04-23T08:50:00Z'),
      projectId: projects[0].id,
      offerId: offers[0].id,
      companyId: companies[0].id,
      contactId: contacts[0].id,
      name: 'ArcForge AI workshop pilot',
      stage: 'meeting-booked',
      annualValue: 4800,
      nextStep: 'Send deck and lock a May pilot date.',
    },
    {
      ...stamp<Opportunity>('opp_velocity_pilot', '2026-04-23T08:51:00Z'),
      projectId: projects[1].id,
      offerId: offers[1].id,
      companyId: companies[1].id,
      contactId: contacts[2].id,
      name: 'Studio Velocity pilot',
      stage: 'qualified',
      annualValue: 7200,
      nextStep: 'Share scoped pilot offer after founder call.',
    },
  ];

  const tasks: Task[] = [
    {
      ...stamp<Task>('task_followup_maya', '2026-04-23T09:00:00Z'),
      projectId: projects[0].id,
      brandId: brands[0].id,
      contactId: contacts[0].id,
      companyId: companies[0].id,
      opportunityId: opportunities[0].id,
      summary: 'Send AI workshop agenda to Maya',
      description: 'Keep it tactical. Include implementation examples from ShipCode.',
      channel: 'email',
      status: 'todo',
      priority: 'high',
      dueAt: iso('2026-04-23T14:00:00Z'),
    },
    {
      ...stamp<Task>('task_linkedin_liam', '2026-04-23T09:05:00Z'),
      projectId: projects[1].id,
      brandId: brands[0].id,
      contactId: contacts[1].id,
      companyId: companies[1].id,
      opportunityId: null,
      summary: 'Review LinkedIn message draft for Liam',
      description: 'Copilot only. Send manually after tightening the CTA.',
      channel: 'linkedin',
      status: 'todo',
      priority: 'medium',
      dueAt: iso('2026-04-23T16:00:00Z'),
    },
    {
      ...stamp<Task>('task_x_ren', '2026-04-23T09:06:00Z'),
      projectId: projects[1].id,
      brandId: brands[0].id,
      contactId: contacts[2].id,
      companyId: companies[1].id,
      opportunityId: opportunities[1].id,
      summary: 'Reply to Ren with pilot framing',
      description: 'Reference the clip backlog and operational pain directly.',
      channel: 'x',
      status: 'in-progress',
      priority: 'high',
      dueAt: iso('2026-04-23T12:30:00Z'),
    },
  ];

  const activities: Activity[] = [
    {
      ...stamp<Activity>('activity_1', '2026-04-23T09:10:00Z'),
      projectId: projects[0].id,
      brandId: brands[0].id,
      contactId: contacts[0].id,
      companyId: companies[0].id,
      opportunityId: opportunities[0].id,
      kind: 'stage-changed',
      actor: 'system',
      summary: 'Moved ArcForge to meeting-booked',
      detail: 'Reply classification marked Maya as interested and ready for a pilot call.',
      occurredAt: iso('2026-04-23T09:10:00Z'),
    },
    {
      ...stamp<Activity>('activity_2', '2026-04-23T09:12:00Z'),
      projectId: projects[1].id,
      brandId: brands[0].id,
      contactId: contacts[1].id,
      companyId: companies[1].id,
      opportunityId: null,
      kind: 'linkedin-task',
      actor: 'ai',
      summary: 'Prepared LinkedIn copilot draft for Liam',
      detail: 'Message draft queued for manual review because LinkedIn stays copilot-only.',
      occurredAt: iso('2026-04-23T09:12:00Z'),
    },
    {
      ...stamp<Activity>('activity_3', '2026-04-23T09:13:00Z'),
      projectId: projects[1].id,
      brandId: brands[0].id,
      contactId: contacts[2].id,
      companyId: companies[1].id,
      opportunityId: opportunities[1].id,
      kind: 'x-sent',
      actor: 'ai',
      summary: 'Queued X follow-up for Ren',
      detail: 'Short founder-to-founder note with a direct pilot CTA.',
      occurredAt: iso('2026-04-23T09:13:00Z'),
    },
  ];

  const steps: SequenceStep[] = [
    {
      id: 'step_research',
      position: 0,
      type: 'research',
      channel: null,
      delayDays: 0,
      subjectTemplate: null,
      bodyTemplate: null,
      taskTitle: 'Review AI research summary',
    },
    {
      id: 'step_email',
      position: 1,
      type: 'email',
      channel: 'email',
      delayDays: 1,
      subjectTemplate: 'Quick idea for {{company}}',
      bodyTemplate: 'We can usually cut the AI chaos and turn it into shipping velocity fast.',
      taskTitle: null,
    },
    {
      id: 'step_linkedin',
      position: 2,
      type: 'linkedin-task',
      channel: 'linkedin',
      delayDays: 3,
      subjectTemplate: null,
      bodyTemplate: 'Send the tightened LinkedIn version if email stays quiet.',
      taskTitle: 'Approve LinkedIn follow-up',
    },
  ];

  const sequences: Sequence[] = [
    {
      ...stamp<Sequence>('sequence_founder_outbound', '2026-04-23T09:20:00Z'),
      projectId: projects[0].id,
      brandId: brands[0].id,
      offerId: offers[0].id,
      name: 'Founder outbound v1',
      description: 'Research -> direct founder email -> LinkedIn copilot check.',
      status: 'active',
      stopOnReply: true,
      steps,
    },
  ];

  const enrollments: Enrollment[] = [
    {
      ...stamp<Enrollment>('enrollment_liam', '2026-04-23T09:25:00Z'),
      sequenceId: sequences[0].id,
      projectId: projects[1].id,
      brandId: brands[0].id,
      leadId: leads[1].id,
      contactId: contacts[1].id,
      status: 'active',
      currentStepIndex: 1,
      nextRunAt: iso('2026-04-24T09:00:00Z'),
      lastRunAt: iso('2026-04-23T09:25:00Z'),
      stoppedReason: null,
    },
  ];

  const threads: InboxThread[] = [
    {
      ...stamp<InboxThread>('thread_maya', '2026-04-23T09:30:00Z'),
      projectId: projects[0].id,
      brandId: brands[0].id,
      companyId: companies[0].id,
      contactId: contacts[0].id,
      channel: 'email',
      title: 'ArcForge workshop follow-up',
      status: 'open',
      unreadCount: 1,
      lastMessageAt: iso('2026-04-23T09:30:00Z'),
    },
    {
      ...stamp<InboxThread>('thread_ren', '2026-04-23T09:31:00Z'),
      projectId: projects[1].id,
      brandId: brands[0].id,
      companyId: companies[1].id,
      contactId: contacts[2].id,
      channel: 'x',
      title: 'Ren Park on X',
      status: 'waiting',
      unreadCount: 0,
      lastMessageAt: iso('2026-04-23T09:31:00Z'),
    },
  ];

  const messages: Message[] = [
    {
      ...stamp<Message>('msg_maya_1', '2026-04-23T09:30:00Z'),
      threadId: threads[0].id,
      contactId: contacts[0].id,
      direction: 'inbound',
      channel: 'email',
      subject: 'Re: workshop idea',
      body: 'This looks timely. Can you send over an outline and pricing for next week?',
      sender: 'maya@arcforge.ai',
      recipient: 'vincent@shipshit.dev',
      sentAt: iso('2026-04-23T09:30:00Z'),
      classification: 'interested',
    },
    {
      ...stamp<Message>('msg_ren_1', '2026-04-23T09:31:00Z'),
      threadId: threads[1].id,
      contactId: contacts[2].id,
      direction: 'outbound',
      channel: 'x',
      subject: null,
      body: 'Saw the clip backlog pain. Want me to sketch a pilot that fixes the ops side first?',
      sender: '@ShipShitDev',
      recipient: '@renpark',
      sentAt: iso('2026-04-23T09:31:00Z'),
      classification: null,
    },
  ];

  const channelAccounts: ChannelAccount[] = [
    {
      ...stamp<ChannelAccount>('acct_email', '2026-04-23T09:35:00Z'),
      brandId: brands[0].id,
      channel: 'email',
      identifier: 'vincent@shipshit.dev',
      status: 'connected',
    },
    {
      ...stamp<ChannelAccount>('acct_x', '2026-04-23T09:36:00Z'),
      brandId: brands[0].id,
      channel: 'x',
      identifier: '@ShipShitDev',
      status: 'connected',
    },
    {
      ...stamp<ChannelAccount>('acct_linkedin', '2026-04-23T09:37:00Z'),
      brandId: brands[0].id,
      channel: 'linkedin',
      identifier: 'https://www.linkedin.com/company/shipshitdev',
      status: 'manual',
    },
  ];

  return {
    workspace,
    projects,
    brands,
    offers,
    metrics: {
      contactCount: contacts.length,
      companyCount: companies.length,
      openTaskCount: tasks.filter((task) => task.status !== 'done').length,
      activeSequenceCount: sequences.filter((sequence) => sequence.status === 'active').length,
      openInboxCount: threads.filter((thread) => thread.status !== 'closed').length,
      pipelineValue: opportunities.reduce((total, opportunity) => {
        return total + (opportunity.annualValue ?? 0);
      }, 0),
    },
    tasks,
    activities,
    inboxThreads: threads,
    contacts,
    companies,
    opportunities,
    sequences,
    enrollments,
    leads,
    channelAccounts,
    messages,
  };
}
