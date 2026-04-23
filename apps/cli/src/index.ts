const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 5)) {
  console.error(
    `ShipLead requires Node.js >= 22.5.0 (you have ${process.version}). node:sqlite is not available in older versions.`,
  );
  process.exit(1);
}

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startShipleadServer } from '@shiplead/api/source';
import { closeDatabase, getDatabase, type ShipleadDatabase } from '@shiplead/db';
import {
  type Brand,
  type ChannelType,
  DEFAULT_API_PORT,
  type LeadStatus,
  type Project,
  type TaskPriority,
  type TaskStatus,
} from '@shiplead/shared';
import { Command } from 'commander';

type DataOptions = {
  dataDir?: string;
  json?: boolean;
};

type ProjectBrandOptions = {
  brandId?: string;
  projectId?: string;
};

function resolveDefaultDataDir(): string {
  const home = os.homedir();

  if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'ShipLead', 'data');
  }

  if (process.platform === 'win32') {
    return path.join(
      process.env.APPDATA ?? path.join(home, 'AppData', 'Roaming'),
      'ShipLead',
      'data',
    );
  }

  return path.join(process.env.XDG_CONFIG_HOME ?? path.join(home, '.config'), 'ShipLead', 'data');
}

function resolveDataDir(options: DataOptions): string {
  return options.dataDir ? path.resolve(options.dataDir) : resolveDefaultDataDir();
}

function openStore(options: DataOptions): { dataDir: string; store: ShipleadDatabase } {
  const dataDir = resolveDataDir(options);
  fs.mkdirSync(dataDir, { recursive: true });
  return { dataDir, store: getDatabase(dataDir) };
}

async function withStore<T>(
  options: DataOptions,
  run: (ctx: { dataDir: string; store: ShipleadDatabase }) => T | Promise<T>,
): Promise<T> {
  const ctx = openStore(options);
  try {
    return await run(ctx);
  } finally {
    closeDatabase();
  }
}

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function parseTags(value?: string): string[] {
  return value
    ? value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];
}

function parseNullable(value?: string): string | null {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function parseChannel(value?: string): ChannelType | null {
  return parseNullable(value) as ChannelType | null;
}

function parsePriority(value: string): TaskPriority {
  return value as TaskPriority;
}

function requireProjectAndBrand(
  store: ShipleadDatabase,
  options: ProjectBrandOptions,
): { brand: Brand; project: Project } {
  const projects = store.listProjects();
  const brands = store.listBrands();
  const project = options.projectId
    ? projects.find((item) => item.id === options.projectId)
    : projects[0];
  const brand = options.brandId ? brands.find((item) => item.id === options.brandId) : brands[0];

  if (!project) {
    throw new Error('No project found. Pass --project-id or create a project first.');
  }

  if (!brand) {
    throw new Error('No brand found. Pass --brand-id or create a brand first.');
  }

  return { brand, project };
}

function printStatus(store: ShipleadDatabase, dataDir: string): void {
  const snapshot = store.getDashboardSnapshot();
  console.log(`ShipLead (${snapshot.workspace.name})`);
  console.log(`Data: ${dataDir}`);
  console.log('');
  console.log(`Projects: ${snapshot.projects.length}`);
  console.log(`Contacts: ${snapshot.metrics.contactCount}`);
  console.log(`Companies: ${snapshot.metrics.companyCount}`);
  console.log(`Open tasks: ${snapshot.metrics.openTaskCount}`);
  console.log(`Open inbox: ${snapshot.metrics.openInboxCount}`);
  console.log(`Pipeline value: ${snapshot.metrics.pipelineValue}`);
}

function printTasks(
  store: ShipleadDatabase,
  options: { json?: boolean; limit?: string; status?: string },
): void {
  let tasks = store.listTasks();
  if (options.status) {
    tasks = tasks.filter((task) => task.status === options.status);
  }

  const limit = Math.max(1, Number(options.limit ?? 20) || 20);
  const payload = tasks.slice(0, limit);

  if (options.json) {
    printJson(payload);
    return;
  }

  for (const task of payload) {
    console.log(`[${task.status}] ${task.priority} ${task.id} ${task.summary}`);
  }
}

function printCompanies(
  store: ShipleadDatabase,
  options: { json?: boolean; limit?: string },
): void {
  const limit = Math.max(1, Number(options.limit ?? 20) || 20);
  const companies = store.listCompanies().slice(0, limit);

  if (options.json) {
    printJson(companies);
    return;
  }

  for (const company of companies) {
    const meta = company.domain ?? company.websiteUrl ?? 'no domain';
    console.log(`${company.id} ${company.name} (${meta})`);
  }
}

function printContacts(store: ShipleadDatabase, options: { json?: boolean; limit?: string }): void {
  const limit = Math.max(1, Number(options.limit ?? 20) || 20);
  const contacts = store.listContacts().slice(0, limit);

  if (options.json) {
    printJson(contacts);
    return;
  }

  for (const contact of contacts) {
    const meta = contact.email ?? contact.jobTitle ?? 'no email';
    console.log(`${contact.id} ${contact.fullName} (${meta})`);
  }
}

const program = new Command();

program.name('shiplead').description('ShipLead — local-first agentic CRM').version('0.0.1');

program
  .command('serve')
  .description('Start the local ShipLead API')
  .option('--data-dir <path>', 'Override the local data directory')
  .option('--host <host>', 'Bind host', '127.0.0.1')
  .option('--port <port>', 'Bind port', String(DEFAULT_API_PORT))
  .action(async (options) => {
    const dataDir = resolveDataDir(options);
    const running = await startShipleadServer({
      dataDir,
      host: options.host,
      port: Number(options.port),
    });
    console.log(`Shiplead API listening on ${running.baseUrl}`);
    console.log(`Data: ${running.dataDir}`);

    const shutdown = async () => {
      await running.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  });

program
  .command('status')
  .description('Show local workspace metrics')
  .option('--data-dir <path>', 'Override the local data directory')
  .option('--json', 'Print JSON')
  .action(async (options) => {
    await withStore(options, ({ dataDir, store }) => {
      const snapshot = store.getDashboardSnapshot();
      if (options.json) {
        printJson({ dataDir, metrics: snapshot.metrics, workspace: snapshot.workspace });
        return;
      }
      printStatus(store, dataDir);
    });
  });

program
  .command('search <query>')
  .description('Search contacts, companies, tasks, and opportunities')
  .option('--data-dir <path>', 'Override the local data directory')
  .option('--json', 'Print JSON')
  .action(async (query: string, options) => {
    await withStore(options, ({ store }) => {
      const results = store.search(query);
      if (options.json) {
        printJson(results);
        return;
      }

      for (const result of results) {
        console.log(`[${result.entityType}] ${result.id} ${result.title} — ${result.subtitle}`);
      }
    });
  });

program
  .command('tasks')
  .description('List local tasks')
  .option('--data-dir <path>', 'Override the local data directory')
  .option('--json', 'Print JSON')
  .option('--limit <count>', 'Maximum rows to print', '20')
  .option('--status <status>', 'Filter by task status')
  .action(async (options) => {
    await withStore(options, ({ store }) => printTasks(store, options));
  });

program
  .command('task-create')
  .description('Create a task')
  .requiredOption('--summary <text>', 'Task summary')
  .option('--brand-id <id>', 'Brand id')
  .option('--channel <channel>', 'Channel: email, x, or linkedin')
  .option('--company-id <id>', 'Company id')
  .option('--contact-id <id>', 'Contact id')
  .option('--data-dir <path>', 'Override the local data directory')
  .option('--description <text>', 'Task description', '')
  .option('--due-at <iso>', 'Due date/time')
  .option('--json', 'Print JSON')
  .option('--opportunity-id <id>', 'Opportunity id')
  .option('--priority <priority>', 'Priority: high, medium, or low', 'medium')
  .option('--project-id <id>', 'Project id')
  .action(async (options) => {
    await withStore(options, ({ store }) => {
      const { brand, project } = requireProjectAndBrand(store, options);
      const task = store.createTask({
        brandId: brand.id,
        channel: parseChannel(options.channel),
        companyId: parseNullable(options.companyId),
        contactId: parseNullable(options.contactId),
        description: options.description,
        dueAt: parseNullable(options.dueAt),
        opportunityId: parseNullable(options.opportunityId),
        priority: parsePriority(options.priority),
        projectId: project.id,
        summary: options.summary,
      });

      if (options.json) printJson(task);
      else console.log(`Created task ${task.id}: ${task.summary}`);
    });
  });

program
  .command('task-status <taskId> <status>')
  .description('Update a task status')
  .option('--data-dir <path>', 'Override the local data directory')
  .option('--json', 'Print JSON')
  .action(async (taskId: string, status: string, options) => {
    await withStore(options, ({ store }) => {
      const task = store.updateTaskStatus(taskId, status as TaskStatus);
      if (!task) throw new Error(`Task not found: ${taskId}`);
      if (options.json) printJson(task);
      else console.log(`Updated task ${task.id}: ${task.status}`);
    });
  });

program
  .command('companies')
  .description('List companies')
  .option('--data-dir <path>', 'Override the local data directory')
  .option('--json', 'Print JSON')
  .option('--limit <count>', 'Maximum rows to print', '20')
  .action(async (options) => {
    await withStore(options, ({ store }) => printCompanies(store, options));
  });

program
  .command('company-create')
  .description('Create a company')
  .requiredOption('--name <name>', 'Company name')
  .option('--data-dir <path>', 'Override the local data directory')
  .option('--domain <domain>', 'Company domain')
  .option('--json', 'Print JSON')
  .option('--linkedin-url <url>', 'LinkedIn URL')
  .option('--notes <text>', 'Notes', '')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--website-url <url>', 'Website URL')
  .option('--x-handle <handle>', 'X handle')
  .action(async (options) => {
    await withStore(options, ({ store }) => {
      const company = store.createCompany({
        domain: parseNullable(options.domain),
        linkedinUrl: parseNullable(options.linkedinUrl),
        name: options.name,
        notes: options.notes,
        tags: parseTags(options.tags),
        websiteUrl: parseNullable(options.websiteUrl),
        xHandle: parseNullable(options.xHandle),
      });

      if (options.json) printJson(company);
      else console.log(`Created company ${company.id}: ${company.name}`);
    });
  });

program
  .command('contacts')
  .description('List contacts')
  .option('--data-dir <path>', 'Override the local data directory')
  .option('--json', 'Print JSON')
  .option('--limit <count>', 'Maximum rows to print', '20')
  .action(async (options) => {
    await withStore(options, ({ store }) => printContacts(store, options));
  });

program
  .command('contact-create')
  .description('Create a contact')
  .requiredOption('--full-name <name>', 'Full name')
  .option('--company-id <id>', 'Company id')
  .option('--data-dir <path>', 'Override the local data directory')
  .option('--email <email>', 'Email')
  .option('--job-title <title>', 'Job title')
  .option('--json', 'Print JSON')
  .option('--linkedin-url <url>', 'LinkedIn URL')
  .option('--notes <text>', 'Notes', '')
  .option('--x-handle <handle>', 'X handle')
  .action(async (options) => {
    await withStore(options, ({ store }) => {
      const contact = store.createContact({
        companyId: parseNullable(options.companyId),
        email: parseNullable(options.email),
        fullName: options.fullName,
        jobTitle: parseNullable(options.jobTitle),
        linkedinUrl: parseNullable(options.linkedinUrl),
        notes: options.notes,
        xHandle: parseNullable(options.xHandle),
      });

      if (options.json) printJson(contact);
      else console.log(`Created contact ${contact.id}: ${contact.fullName}`);
    });
  });

program
  .command('lead-status <leadId> <status>')
  .description('Update a lead pipeline status')
  .option('--data-dir <path>', 'Override the local data directory')
  .option('--json', 'Print JSON')
  .action(async (leadId: string, status: string, options) => {
    await withStore(options, ({ store }) => {
      const lead = store.updateLeadStatus(leadId, status as LeadStatus);
      if (!lead) throw new Error(`Lead not found: ${leadId}`);
      if (options.json) printJson(lead);
      else console.log(`Updated lead ${lead.id}: ${lead.status}`);
    });
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
