import { personalizeOutreach, researchLead, triageReply } from '@shiplead/agents';
import { createChannelDraft } from '@shiplead/channels';
import type { ShipleadDatabase } from '@shiplead/db';
import { enrichLead } from '@shiplead/enrichment';
import { advanceEnrollment, stopEnrollmentOnReply } from '@shiplead/sequences';
import {
  createActivityInputSchema,
  createBrandInputSchema,
  createCompanyInputSchema,
  createContactInputSchema,
  createEnrollmentInputSchema,
  createLeadInputSchema,
  createMessageInputSchema,
  createOfferInputSchema,
  createOpportunityInputSchema,
  createProjectInputSchema,
  createSequenceInputSchema,
  createTaskInputSchema,
  createThreadInputSchema,
  leadStatusPatchSchema,
  personalizationRequestSchema,
  type ReplyClassification,
  replyTriageRequestSchema,
  researchRequestSchema,
  type TaskPriority,
  taskStatusPatchSchema,
} from '@shiplead/shared';

type ApiContext = {
  store: ShipleadDatabase;
};

const JSON_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
  'access-control-allow-headers': 'content-type',
  'content-type': 'application/json; charset=utf-8',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS,
  });
}

function errorResponse(message: string, status = 400): Response {
  return json({ error: message }, status);
}

async function readJson<T>(request: Request, parser: { parse: (input: unknown) => T }): Promise<T> {
  const raw = await request.text();
  const body = raw.length > 0 ? JSON.parse(raw) : {};
  return parser.parse(body);
}

function matchPath(pathname: string, expression: RegExp): RegExpExecArray | null {
  return expression.exec(pathname);
}

function createFollowUpTaskPriority(classification: ReplyClassification): TaskPriority {
  return classification === 'meeting' || classification === 'interested' ? 'high' : 'medium';
}

async function triageMessageAction(request: Request, ctx: ApiContext): Promise<Response> {
  const { messageId } = (await request.json()) as { messageId?: string };
  if (!messageId) return errorResponse('Missing messageId');

  const message = ctx.store.getMessageById(messageId);
  if (!message) return errorResponse('Message not found', 404);

  const triage = triageReply({ text: message.body });
  ctx.store.updateMessageClassification(message.id, triage.classification);

  if (message.contactId) {
    const activeEnrollments = ctx.store.getActiveEnrollmentsForContact(message.contactId);
    for (const enrollment of activeEnrollments) {
      const stopped = stopEnrollmentOnReply(enrollment, triage.classification);
      ctx.store.updateEnrollment(stopped);
    }

    const opportunity = ctx.store.getOpportunityByContact(message.contactId);
    if (opportunity) {
      const stage =
        triage.classification === 'meeting'
          ? 'meeting-booked'
          : triage.classification === 'interested'
            ? 'qualified'
            : triage.classification === 'not-a-fit' || triage.classification === 'unsubscribe'
              ? 'lost'
              : opportunity.stage;

      ctx.store.updateOpportunityStage(opportunity.id, stage, triage.suggestedNextStep);
    }

    const contact = ctx.store.getContactById(message.contactId);
    const thread = ctx.store.listThreads().find((item) => item.id === message.threadId);

    if (contact && thread && triage.classification !== 'neutral') {
      const task = ctx.store.createTask({
        projectId: thread.projectId,
        brandId: thread.brandId,
        contactId: contact.id,
        companyId: thread.companyId,
        opportunityId: opportunity?.id ?? null,
        summary: `Reply follow-up: ${contact.fullName}`,
        description: triage.suggestedNextStep,
        channel: thread.channel,
        priority: createFollowUpTaskPriority(triage.classification),
      });

      ctx.store.createActivity({
        projectId: thread.projectId,
        brandId: thread.brandId,
        contactId: contact.id,
        companyId: thread.companyId,
        opportunityId: opportunity?.id ?? null,
        kind: thread.channel === 'email' ? 'email-replied' : 'note',
        actor: 'ai',
        summary: `Reply triaged as ${triage.classification}`,
        detail: `${triage.reason} Next step: ${task.summary}.`,
      });
    }

    ctx.store.clearThreadUnread(message.threadId);
  }

  return json({ triage });
}

export async function handleApiRequest(request: Request, ctx: ApiContext): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  try {
    if (pathname === '/health' && request.method === 'GET') {
      return json({ ok: true });
    }

    if (pathname === '/dashboard' && request.method === 'GET') {
      return json(ctx.store.getDashboardSnapshot());
    }

    if (pathname === '/search' && request.method === 'GET') {
      return json(ctx.store.search(url.searchParams.get('q') ?? ''));
    }

    if (pathname === '/projects') {
      if (request.method === 'GET') return json(ctx.store.listProjects());
      if (request.method === 'POST') {
        const input = await readJson(request, createProjectInputSchema);
        return json(ctx.store.createProject(input), 201);
      }
    }

    if (pathname === '/brands') {
      if (request.method === 'GET') return json(ctx.store.listBrands());
      if (request.method === 'POST') {
        const input = await readJson(request, createBrandInputSchema);
        return json(ctx.store.createBrand(input), 201);
      }
    }

    if (pathname === '/offers') {
      if (request.method === 'GET') return json(ctx.store.listOffers());
      if (request.method === 'POST') {
        const input = await readJson(request, createOfferInputSchema);
        return json(ctx.store.createOffer(input), 201);
      }
    }

    if (pathname === '/companies') {
      if (request.method === 'GET') return json(ctx.store.listCompanies());
      if (request.method === 'POST') {
        const input = await readJson(request, createCompanyInputSchema);
        return json(ctx.store.createCompany(input), 201);
      }
    }

    if (pathname === '/contacts') {
      if (request.method === 'GET') return json(ctx.store.listContacts());
      if (request.method === 'POST') {
        const input = await readJson(request, createContactInputSchema);
        return json(ctx.store.createContact(input), 201);
      }
    }

    if (pathname === '/leads') {
      if (request.method === 'GET') return json(ctx.store.listLeads());
      if (request.method === 'POST') {
        const input = await readJson(request, createLeadInputSchema);
        return json(ctx.store.createLead(input), 201);
      }
    }

    const leadStatusMatch = matchPath(pathname, /^\/leads\/([^/]+)\/status$/);
    if (leadStatusMatch && request.method === 'PATCH') {
      const leadId = leadStatusMatch[1];
      const body = await readJson(request, leadStatusPatchSchema);
      const previous = ctx.store.getLeadById(leadId);
      const updated = ctx.store.updateLeadStatus(leadId, body.status);
      if (!updated) return errorResponse('Lead not found', 404);

      ctx.store.createActivity({
        projectId: updated.projectId,
        brandId: updated.brandId,
        contactId: updated.contactId,
        companyId: updated.companyId,
        opportunityId: null,
        kind: 'stage-changed',
        actor: 'human',
        summary: `Lead moved to ${updated.status}`,
        detail: previous
          ? `Lead status changed from ${previous.status} to ${updated.status}.`
          : `Lead status changed to ${updated.status}.`,
      });

      return json(updated);
    }

    if (pathname === '/opportunities') {
      if (request.method === 'GET') return json(ctx.store.listOpportunities());
      if (request.method === 'POST') {
        const input = await readJson(request, createOpportunityInputSchema);
        return json(ctx.store.createOpportunity(input), 201);
      }
    }

    if (pathname === '/tasks') {
      if (request.method === 'GET') return json(ctx.store.listTasks());
      if (request.method === 'POST') {
        const input = await readJson(request, createTaskInputSchema);
        return json(ctx.store.createTask(input), 201);
      }
    }

    const taskStatusMatch = matchPath(pathname, /^\/tasks\/([^/]+)\/status$/);
    if (taskStatusMatch && request.method === 'PATCH') {
      const taskId = taskStatusMatch[1];
      const body = await readJson(request, taskStatusPatchSchema);
      const updated = ctx.store.updateTaskStatus(taskId, body.status);
      if (!updated) return errorResponse('Task not found', 404);

      ctx.store.createActivity({
        projectId: updated.projectId,
        brandId: updated.brandId,
        contactId: updated.contactId,
        companyId: updated.companyId,
        opportunityId: updated.opportunityId,
        kind: body.status === 'done' ? 'task-completed' : 'task-created',
        actor: 'human',
        summary: `${updated.summary} → ${body.status}`,
        detail: 'Task status updated from the Shiplead UI.',
      });

      return json(updated);
    }

    if (pathname === '/activities') {
      if (request.method === 'GET') return json(ctx.store.listActivities());
      if (request.method === 'POST') {
        const input = await readJson(request, createActivityInputSchema);
        return json(ctx.store.createActivity(input), 201);
      }
    }

    if (pathname === '/inbox/threads') {
      if (request.method === 'GET') return json(ctx.store.listThreads());
      if (request.method === 'POST') {
        const input = await readJson(request, createThreadInputSchema);
        return json(ctx.store.createThread(input), 201);
      }
    }

    const threadMessagesMatch = matchPath(pathname, /^\/inbox\/threads\/([^/]+)\/messages$/);
    if (threadMessagesMatch) {
      const threadId = threadMessagesMatch[1];
      if (request.method === 'GET') return json(ctx.store.listMessages(threadId));
      if (request.method === 'POST') {
        const input = await readJson(request, createMessageInputSchema);
        return json(ctx.store.createMessage(threadId, input), 201);
      }
    }

    if (pathname === '/sequences') {
      if (request.method === 'GET') return json(ctx.store.listSequences());
      if (request.method === 'POST') {
        const input = await readJson(request, createSequenceInputSchema);
        return json(ctx.store.createSequence(input), 201);
      }
    }

    if (pathname === '/enrollments') {
      if (request.method === 'GET') return json(ctx.store.listEnrollments());
      if (request.method === 'POST') {
        const input = await readJson(request, createEnrollmentInputSchema);
        return json(ctx.store.createEnrollment(input), 201);
      }
    }

    const advanceMatch = matchPath(pathname, /^\/enrollments\/([^/]+)\/advance$/);
    if (advanceMatch && request.method === 'POST') {
      const enrollment = ctx.store.listEnrollments().find((item) => item.id === advanceMatch[1]);
      if (!enrollment) return errorResponse('Enrollment not found', 404);

      const sequence = ctx.store.getSequenceById(enrollment.sequenceId);
      if (!sequence) return errorResponse('Sequence not found', 404);

      const advanced = advanceEnrollment(sequence, enrollment);
      const updated = ctx.store.updateEnrollment(advanced);

      ctx.store.createActivity({
        projectId: updated.projectId,
        brandId: updated.brandId,
        contactId: updated.contactId,
        kind: updated.status === 'completed' ? 'sequence-stopped' : 'sequence-enrolled',
        actor: 'system',
        summary:
          updated.status === 'completed'
            ? `${sequence.name} completed`
            : `${sequence.name} advanced to step ${updated.currentStepIndex + 1}`,
        detail: 'Sequence state advanced by the API.',
      });

      return json(updated);
    }

    if (pathname === '/agents/research' && request.method === 'POST') {
      const input = await readJson(request, researchRequestSchema);
      return json(researchLead(input));
    }

    if (pathname === '/agents/personalize' && request.method === 'POST') {
      const input = await readJson(request, personalizationRequestSchema);
      const personalization = personalizeOutreach(input);
      return json({
        personalization,
        draft: createChannelDraft({
          channel: input.channel,
          brand: input.brand,
          offer: input.offer,
          personalization,
        }),
      });
    }

    if (pathname === '/agents/reply-triage' && request.method === 'POST') {
      const input = await readJson(request, replyTriageRequestSchema);
      return json(triageReply(input));
    }

    if (pathname === '/actions/triage-message' && request.method === 'POST') {
      return triageMessageAction(request, ctx);
    }

    if (pathname === '/enrichment' && request.method === 'GET') {
      const companyId = url.searchParams.get('companyId');
      if (!companyId) return errorResponse('Missing companyId');
      const company = ctx.store.getCompanyById(companyId);
      if (!company) return errorResponse('Company not found', 404);
      const contactId = url.searchParams.get('contactId');
      const contact = contactId ? ctx.store.getContactById(contactId) : null;
      return json(enrichLead(company, contact));
    }

    return errorResponse('Not found', 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 400);
  }
}
