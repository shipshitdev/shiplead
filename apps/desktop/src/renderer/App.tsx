import type {
  Activity as ActivityRecord,
  ChannelType,
  Company,
  Contact,
  DashboardMetrics,
  DashboardSnapshot,
  InboxThread,
  LeadRecord,
  LeadStatus,
  Message,
  Opportunity,
  Project,
  SearchResult,
  Task,
  TaskPriority,
} from '@shiplead/shared';
import {
  Badge,
  Briefcase,
  Building2,
  Button,
  Card,
  CardContent,
  CheckCircle2,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
  cn,
  Inbox,
  Input,
  Keycap,
  Label,
  LayoutGrid,
  ListTodo,
  LoadingButtonContent,
  Mail,
  MessagesSquare,
  Modal,
  ModalFooter,
  Plus,
  Search,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sparkles,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Target,
  Textarea,
  UserRound,
} from '@shipshitdev/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type ComponentType,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';

type GlobalViewId = 'tasks' | 'inbox' | 'activities';
type ProjectViewId = 'overview' | 'pipeline' | 'contacts' | 'companies';
type ViewId = GlobalViewId | ProjectViewId;
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'done';
type TaskChannelInput = ChannelType | 'manual';
type ViewDefinition<TViewId extends ViewId = ViewId> = {
  id: TViewId;
  label: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
};

type TriageResponse = {
  triage: {
    classification: string;
    confidence: number;
    reason: string;
    suggestedNextStep: string;
  };
};

const globalViews: Array<ViewDefinition<GlobalViewId>> = [
  { id: 'tasks', label: 'Tasks', detail: 'Operator next actions', icon: ListTodo },
  { id: 'inbox', label: 'Inbox', detail: 'Email, X, LinkedIn', icon: Inbox },
  { id: 'activities', label: 'Activities', detail: 'Timeline and agent notes', icon: Sparkles },
];

const projectViews: Array<ViewDefinition<ProjectViewId>> = [
  { id: 'overview', label: 'Overview', detail: 'Project command center', icon: LayoutGrid },
  { id: 'pipeline', label: 'Pipeline', detail: 'Lead kanban board', icon: Target },
  { id: 'contacts', label: 'Contacts', detail: 'People memory', icon: UserRound },
  { id: 'companies', label: 'Companies', detail: 'Account memory', icon: Building2 },
];

const views: Array<ViewDefinition> = [...globalViews, ...projectViews];
const projectViewIds = new Set<ViewId>(projectViews.map((view) => view.id));

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return (await response.json()) as T;
}

function formatDate(value: string | null): string {
  if (!value) return 'No date';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function money(value: number | null | undefined): string {
  return `$${(value ?? 0).toLocaleString()}`;
}

function priorityVariant(priority: TaskPriority): BadgeVariant {
  if (priority === 'high') return 'warning';
  if (priority === 'low') return 'info';
  return 'default';
}

function channelLabel(channel: ChannelType | null): string {
  if (!channel) return 'manual';
  if (channel === 'x') return 'X';
  return channel;
}

function channelVariant(channel: ChannelType | null): BadgeVariant {
  if (channel === 'email') return 'info';
  if (channel === 'linkedin') return 'accent';
  if (channel === 'x') return 'default';
  return 'default';
}

function getProjectName(projects: Project[], projectId: string): string {
  return projects.find((project) => project.id === projectId)?.name ?? 'Unknown project';
}

function getCompanyName(companies: Company[], companyId: string | null): string {
  if (!companyId) return 'No company';
  return companies.find((company) => company.id === companyId)?.name ?? 'Unknown company';
}

function getContactName(contacts: Contact[], contactId: string | null): string {
  if (!contactId) return 'No contact';
  return contacts.find((contact) => contact.id === contactId)?.fullName ?? 'Unknown contact';
}

function isProjectView(viewId: ViewId): viewId is ProjectViewId {
  return projectViewIds.has(viewId);
}

function viewForSearchResult(result: SearchResult): ViewId {
  if (result.entityType === 'contact') return 'contacts';
  if (result.entityType === 'company') return 'companies';
  if (result.entityType === 'opportunity') return 'pipeline';
  return 'tasks';
}

function getProjectIdForSearchResult(
  dashboard: DashboardSnapshot,
  result: SearchResult,
): string | null {
  if (result.entityType === 'opportunity') {
    return (
      dashboard.opportunities.find((opportunity) => opportunity.id === result.id)?.projectId ?? null
    );
  }

  if (result.entityType === 'task') {
    return dashboard.tasks.find((task) => task.id === result.id)?.projectId ?? null;
  }

  if (result.entityType === 'contact') {
    return (
      dashboard.opportunities.find((opportunity) => opportunity.contactId === result.id)
        ?.projectId ??
      dashboard.tasks.find((task) => task.contactId === result.id)?.projectId ??
      dashboard.inboxThreads.find((thread) => thread.contactId === result.id)?.projectId ??
      dashboard.activities.find((activity) => activity.contactId === result.id)?.projectId ??
      null
    );
  }

  return (
    dashboard.opportunities.find((opportunity) => opportunity.companyId === result.id)?.projectId ??
    dashboard.tasks.find((task) => task.companyId === result.id)?.projectId ??
    dashboard.inboxThreads.find((thread) => thread.companyId === result.id)?.projectId ??
    dashboard.activities.find((activity) => activity.companyId === result.id)?.projectId ??
    null
  );
}

function getProjectScope(dashboard: DashboardSnapshot, projectId: string | null) {
  const project = dashboard.projects.find((candidate) => candidate.id === projectId);

  if (!project) {
    return {
      project: undefined,
      opportunities: dashboard.opportunities,
      contacts: dashboard.contacts,
      companies: dashboard.companies,
      metrics: dashboard.metrics,
    };
  }

  const opportunities = dashboard.opportunities.filter(
    (opportunity) => opportunity.projectId === project.id,
  );
  const tasks = dashboard.tasks.filter((task) => task.projectId === project.id);
  const inboxThreads = dashboard.inboxThreads.filter((thread) => thread.projectId === project.id);
  const activities = dashboard.activities.filter((activity) => activity.projectId === project.id);
  const sequences = dashboard.sequences.filter((sequence) => sequence.projectId === project.id);

  const contactIds = new Set<string>();
  const companyIds = new Set<string>();

  for (const opportunity of opportunities) {
    if (opportunity.contactId) contactIds.add(opportunity.contactId);
    companyIds.add(opportunity.companyId);
  }

  for (const task of tasks) {
    if (task.contactId) contactIds.add(task.contactId);
    if (task.companyId) companyIds.add(task.companyId);
  }

  for (const thread of inboxThreads) {
    if (thread.contactId) contactIds.add(thread.contactId);
    if (thread.companyId) companyIds.add(thread.companyId);
  }

  for (const activity of activities) {
    if (activity.contactId) contactIds.add(activity.contactId);
    if (activity.companyId) companyIds.add(activity.companyId);
  }

  const contacts = dashboard.contacts.filter((contact) => contactIds.has(contact.id));
  for (const contact of contacts) {
    if (contact.companyId) companyIds.add(contact.companyId);
  }

  const companies = dashboard.companies.filter((company) => companyIds.has(company.id));

  return {
    project,
    opportunities,
    contacts,
    companies,
    metrics: {
      contactCount: contacts.length,
      companyCount: companies.length,
      openTaskCount: tasks.filter((task) => task.status !== 'done').length,
      activeSequenceCount: sequences.filter((sequence) => sequence.status === 'active').length,
      openInboxCount: inboxThreads.filter((thread) => thread.status === 'open').length,
      pipelineValue: opportunities.reduce(
        (total, opportunity) => total + (opportunity.annualValue ?? 0),
        0,
      ),
    } satisfies DashboardMetrics,
  };
}

function toLocalDateTimeInput(value: Date): string {
  const offsetMs = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offsetMs).toISOString().slice(0, 16);
}

function ShellTitlebar(props: {
  activeView: ViewId;
  workspaceName: string;
  selectedProjectName: string | null;
  openWork: number;
}) {
  const active = views.find((view) => view.id === props.activeView);
  const showProject = props.selectedProjectName && isProjectView(props.activeView);

  return (
    <div className="relative flex h-[var(--spacing-titlebar)] shrink-0 items-center justify-between border-b border-border bg-primary pl-[84px] pr-2 app-region-drag">
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 select-none text-[11px] font-semibold tracking-tight text-secondary">
        Shiplead
      </span>
      <div className="flex min-w-0 items-center gap-2 text-xs">
        <span className="font-semibold tracking-tight text-primary">Shiplead</span>
        <span className="text-muted">/</span>
        <span className="truncate text-secondary">{props.workspaceName}</span>
        {showProject ? (
          <>
            <span className="text-muted">/</span>
            <span className="truncate text-secondary">{props.selectedProjectName}</span>
          </>
        ) : null}
        <span className="text-muted">/</span>
        <span className="truncate text-primary">{active?.label ?? 'Workspace'}</span>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-muted">
        <span className="rounded-sm border border-border bg-secondary/60 px-2 py-1">
          {props.openWork} open
        </span>
        <span className="inline-flex items-center gap-1 rounded-sm border border-success/20 bg-success/10 px-2 py-1 text-success">
          <CheckCircle2 className="h-3 w-3" />
          local
        </span>
      </div>
    </div>
  );
}

function Sidebar(props: {
  activeView: ViewId;
  dashboard: DashboardSnapshot;
  selectedProjectId: string | null;
  onOpenCommandPalette: () => void;
  onOpenNewTask: () => void;
  onSelectProjectView: (projectId: string, view: ProjectViewId) => void;
  onSelectView: (view: ViewId) => void;
}) {
  const inboxCount = props.dashboard.inboxThreads.reduce(
    (total, thread) => total + thread.unreadCount,
    0,
  );

  return (
    <aside className="relative flex w-64 shrink-0 flex-col border-r border-border bg-primary">
      <div className="px-2 pt-3">
        <Button
          variant="ghost"
          className="h-auto w-full justify-start gap-2 py-2 pl-3 pr-5 text-[13px] font-normal text-secondary app-region-no-drag"
          onClick={props.onOpenNewTask}
        >
          <Plus className="h-3.5 w-3.5 text-secondary" />
          <span className="flex-1 truncate">New Task</span>
          <kbd className="font-mono text-[10px] text-muted">⌘N</kbd>
        </Button>
        <Button
          variant="ghost"
          className="h-auto w-full justify-start gap-2 py-2 pl-3 pr-5 text-[13px] font-normal text-secondary app-region-no-drag"
          onClick={props.onOpenCommandPalette}
        >
          <Search className="h-3.5 w-3.5 text-secondary" />
          <span className="flex-1 truncate">Search</span>
          <kbd className="font-mono text-[10px] text-muted">⌘K</kbd>
        </Button>
      </div>

      <div className="mt-1 px-2">
        {globalViews.map((view) => {
          const Icon = view.icon;
          const isActive = props.activeView === view.id;
          const count = view.id === 'inbox' ? inboxCount : null;

          return (
            <Button
              key={view.id}
              variant="ghost"
              className={cn(
                'h-auto w-full justify-start gap-2 py-2 pl-3 pr-5 text-[13px] font-normal text-secondary app-region-no-drag',
                isActive && 'bg-tertiary font-medium text-primary',
              )}
              onClick={() => props.onSelectView(view.id)}
            >
              <Icon className="h-3.5 w-3.5 text-secondary" />
              <span className="flex-1 truncate">{view.label}</span>
              {count ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-tertiary px-1.5 text-[10px] font-medium text-secondary">
                  {count}
                </span>
              ) : null}
            </Button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between px-4 text-[10px] font-semibold uppercase tracking-wider text-muted">
        <span>Projects</span>
        <span>{props.dashboard.projects.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1">
        {props.dashboard.projects.map((project) => {
          const scope = getProjectScope(props.dashboard, project.id);
          const isSelectedProject = props.selectedProjectId === project.id;
          const projectWorkCount = scope.metrics.openTaskCount;

          return (
            <button
              key={project.id}
              type="button"
              className={cn(
                'group flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] transition-colors hover:bg-tertiary',
                isSelectedProject && isProjectView(props.activeView) && 'bg-tertiary text-primary',
              )}
              onClick={() => props.onSelectProjectView(project.id, 'pipeline')}
              title={project.description}
            >
              <Briefcase className="h-3.5 w-3.5 shrink-0 text-secondary" />
              <span className="min-w-0 flex-1 truncate font-medium text-primary">
                {project.name}
              </span>
              {projectWorkCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-tertiary px-1.5 text-[10px] font-medium text-secondary">
                  {projectWorkCount}
                </span>
              ) : null}
              <Badge variant={project.status === 'active' ? 'success' : 'default'}>
                {project.status}
              </Badge>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function ViewHeader(props: { activeView: ViewId; selectedProject: Project | undefined }) {
  const active = views.find((view) => view.id === props.activeView) ?? views[0];
  const scopedToProject = Boolean(props.selectedProject && isProjectView(props.activeView));
  const Icon = scopedToProject ? Briefcase : active.icon;
  const title = scopedToProject && props.selectedProject ? props.selectedProject.name : active.label;
  const description =
    scopedToProject && props.selectedProject ? props.selectedProject.description : active.detail;

  return (
    <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-secondary">
          <Icon className="h-4 w-4 text-secondary" />
        </span>
        <div>
          <h1 className="text-base font-semibold text-primary">{title}</h1>
          <p className="text-xs text-muted">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1">
          <Mail className="h-3.5 w-3.5" />
          Email
        </span>
        <span className="inline-flex items-center gap-1">
          <MessagesSquare className="h-3.5 w-3.5" />X
        </span>
        <span className="inline-flex items-center gap-1">
          <Briefcase className="h-3.5 w-3.5" />
          LinkedIn copilot
        </span>
      </div>
    </div>
  );
}

function ProjectTabs(props: {
  activeView: ProjectViewId;
  metrics: DashboardMetrics;
  onSelectView: (view: ProjectViewId) => void;
}) {
  const countForView = (view: ProjectViewId) => {
    if (view === 'pipeline') return money(props.metrics.pipelineValue);
    if (view === 'contacts') return props.metrics.contactCount;
    return props.metrics.companyCount;
  };

  return (
    <div className="flex shrink-0 items-center gap-1 border-b border-border px-4 py-1.5">
      {projectViews.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant="ghost"
          className={cn(
            'h-7 gap-1.5 px-2.5 text-xs font-medium text-secondary',
            props.activeView === id && 'bg-tertiary text-primary',
          )}
          onClick={() => props.onSelectView(id)}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
          <span className="text-[10px] text-muted">{countForView(id)}</span>
        </Button>
      ))}
    </div>
  );
}

function StatCard(props: {
  label: string;
  value: string | number;
  subtitle: string;
  tone?: 'default' | 'success' | 'warning' | 'info';
}) {
  const toneClass =
    props.tone === 'success'
      ? 'border-success/35 bg-success/[0.04]'
      : props.tone === 'warning'
        ? 'border-warning/35 bg-warning/[0.04]'
        : props.tone === 'info'
          ? 'border-info/35 bg-info/[0.04]'
          : '';

  return (
    <Card className={cn('min-w-0 flex-1', toneClass)}>
      <CardContent className="p-4">
        <div className="text-3xl font-semibold leading-none tracking-tight text-primary">
          {props.value}
        </div>
        <div className="mt-2 text-[11px] font-medium uppercase tracking-wide text-secondary">
          {props.label}
        </div>
        <div className="mt-1 truncate text-[11px] text-muted">{props.subtitle}</div>
      </CardContent>
    </Card>
  );
}

function MetricsStrip({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="flex gap-4">
      <StatCard label="Contacts" value={metrics.contactCount} subtitle="sequencing pool" />
      <StatCard label="Companies" value={metrics.companyCount} subtitle="shared accounts" />
      <StatCard
        label="Open Work"
        value={metrics.openTaskCount}
        subtitle="needs operator attention"
        tone={metrics.openTaskCount > 0 ? 'warning' : 'default'}
      />
      <StatCard
        label="Pipeline"
        value={money(metrics.pipelineValue)}
        subtitle="active opportunity value"
        tone="success"
      />
    </div>
  );
}

function Section(props: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-primary">{props.title}</h2>
          {props.description ? <p className="text-xs text-muted">{props.description}</p> : null}
        </div>
        {props.action}
      </div>
      {props.children}
    </div>
  );
}

function EmptyBlock({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-xs text-muted">
      {children}
    </div>
  );
}

function QueueView(props: {
  dashboard: DashboardSnapshot;
  isCompleting: boolean;
  onCompleteTask: (taskId: string) => void;
}) {
  if (props.dashboard.tasks.length === 0) {
    return (
      <EmptyBlock>
        No queued SDR work. Inbox replies and sequences will create tasks here.
      </EmptyBlock>
    );
  }

  return (
    <Section
      title="Operator queue"
      description="Triage, reply, review, and follow up across all projects."
    >
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[1%]">Priority</TableHead>
                <TableHead>Task</TableHead>
                <TableHead className="w-[1%]">Project</TableHead>
                <TableHead className="w-[1%]">Channel</TableHead>
                <TableHead className="w-[1%]">Due</TableHead>
                <TableHead className="w-[1%] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.dashboard.tasks.map((task) => (
                <TableRow key={task.id} className="group">
                  <TableCell className="w-[1%] whitespace-nowrap">
                    <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
                  </TableCell>
                  <TableCell className="max-w-0">
                    <div className="truncate text-[13px] font-medium text-primary">
                      {task.summary}
                    </div>
                    <div className="mt-0.5 truncate text-[12px] text-secondary">
                      {task.description || 'No additional detail'}
                    </div>
                  </TableCell>
                  <TableCell className="w-[1%] whitespace-nowrap text-[11px] text-muted">
                    {getProjectName(props.dashboard.projects, task.projectId)}
                  </TableCell>
                  <TableCell className="w-[1%] whitespace-nowrap">
                    <Badge variant={channelVariant(task.channel)}>
                      {channelLabel(task.channel)}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-[1%] whitespace-nowrap text-[11px] text-muted">
                    {formatDate(task.dueAt)}
                  </TableCell>
                  <TableCell className="w-[1%] whitespace-nowrap text-right">
                    {task.status === 'done' ? (
                      <Badge variant="success">done</Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="ml-auto justify-center text-muted hover:bg-elevated hover:text-primary"
                        disabled={props.isCompleting}
                        onClick={() => props.onCompleteTask(task.id)}
                      >
                        Mark done
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Section>
  );
}

function NewTaskModal(props: {
  apiBaseUrl: string;
  dashboard: DashboardSnapshot;
  preferredProjectId: string | null;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const defaultProjectId =
    props.dashboard.projects.find((project) => project.id === props.preferredProjectId)?.id ??
    props.dashboard.projects[0]?.id ??
    '';
  const defaultBrandId = props.dashboard.brands[0]?.id ?? '';
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [brandId, setBrandId] = useState(defaultBrandId);
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [channel, setChannel] = useState<TaskChannelInput>('manual');
  const [dueAt, setDueAt] = useState(() =>
    toLocalDateTimeInput(new Date(Date.now() + 60 * 60_000)),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!props.open) return;
    setProjectId(defaultProjectId);
    setBrandId(defaultBrandId);
    setSummary('');
    setDescription('');
    setPriority('medium');
    setChannel('manual');
    setDueAt(toLocalDateTimeInput(new Date(Date.now() + 60 * 60_000)));
    setError(null);
  }, [defaultBrandId, defaultProjectId, props.open]);

  const createTask = useMutation({
    mutationFn: async () => {
      if (!projectId || !brandId) {
        throw new Error('Missing project or brand.');
      }
      return fetchJson<Task>(`${props.apiBaseUrl}/tasks`, {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          brandId,
          summary: summary.trim(),
          description: description.trim(),
          priority,
          channel: channel === 'manual' ? null : channel,
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        }),
      });
    },
    onSuccess: () => {
      props.onCreated();
      props.onClose();
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : 'Failed to create task.');
    },
  });

  const canSubmit = summary.trim().length > 0 && projectId.length > 0 && brandId.length > 0;

  const handleSubmit = () => {
    if (!canSubmit || createTask.isPending) return;
    createTask.mutate();
  };

  const handleKeyDown = (event: ReactKeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title="New Task"
      className="max-h-[88vh] max-w-[720px] flex flex-col overflow-hidden p-0"
      headerClassName="shrink-0 border-b border-border px-6 py-4"
      onKeyDown={handleKeyDown}
    >
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-project" className="text-xs text-secondary">
                Project
              </Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="task-project" className="bg-transparent">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {props.dashboard.projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-brand" className="text-xs text-secondary">
                Brand
              </Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger id="task-brand" className="bg-transparent">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {props.dashboard.brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-summary" className="text-xs text-secondary">
              Task
            </Label>
            <Input
              id="task-summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Review LinkedIn message draft for Maya..."
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-description" className="text-xs text-secondary">
              Context
            </Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What should the operator know before doing this?"
              className="min-h-24 text-[13px]"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-priority" className="text-xs text-secondary">
                Priority
              </Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as TaskPriority)}
              >
                <SelectTrigger id="task-priority" className="bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-channel" className="text-xs text-secondary">
                Channel
              </Label>
              <Select
                value={channel}
                onValueChange={(value) => setChannel(value as TaskChannelInput)}
              >
                <SelectTrigger id="task-channel" className="bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="x">X</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-due" className="text-xs text-secondary">
                Due
              </Label>
              <Input
                id="task-due"
                type="datetime-local"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-danger/30 bg-danger/10 px-2.5 py-2 text-xs text-danger">
              {error}
            </div>
          ) : null}
        </div>

        <ModalFooter className="mt-0 shrink-0 items-center border-t border-border px-6 py-4">
          <div className="mr-auto text-[11px] text-muted">
            Creates real queue work through the local Shiplead API.
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={props.onClose}
            disabled={createTask.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit || createTask.isPending}>
            <LoadingButtonContent loading={createTask.isPending}>
              <span>Create task</span>
              <Keycap>⌘↩</Keycap>
            </LoadingButtonContent>
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

function CommandPalette(props: {
  dashboard: DashboardSnapshot;
  open: boolean;
  query: string;
  results: SearchResult[];
  selectedProjectId: string | null;
  onOpenChange: (open: boolean) => void;
  onOpenNewTask: () => void;
  onQueryChange: (query: string) => void;
  onSelectProjectView: (projectId: string, view: ProjectViewId) => void;
  onSelectView: (view: ViewId) => void;
}) {
  const close = () => props.onOpenChange(false);

  const runAction = (action: () => void) => {
    close();
    action();
  };

  return (
    <CommandDialog open={props.open} onOpenChange={props.onOpenChange}>
      <CommandInput
        value={props.query}
        onValueChange={props.onQueryChange}
        placeholder="Search contacts, companies, tasks, deals..."
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {props.query.trim().length > 1 ? (
          <CommandGroup heading="Search">
            {props.results.map((result) => (
              <CommandItem
                key={result.id}
                value={`${result.entityType} ${result.title} ${result.subtitle}`}
                onSelect={() =>
                  runAction(() => {
                    const view = viewForSearchResult(result);
                    if (!isProjectView(view)) {
                      props.onSelectView(view);
                      return;
                    }

                    const projectId =
                      getProjectIdForSearchResult(props.dashboard, result) ??
                      props.selectedProjectId ??
                      props.dashboard.projects[0]?.id;

                    if (projectId) props.onSelectProjectView(projectId, view);
                  })
                }
              >
                <Badge>{result.entityType}</Badge>
                <span className="min-w-0 flex-1 truncate">{result.title}</span>
                <CommandShortcut>{result.subtitle}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runAction(props.onOpenNewTask)}>
            <Plus className="h-4 w-4 text-secondary" />
            <span className="flex-1">New Task...</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Go to">
          {globalViews.map((view) => {
            const Icon = view.icon;
            return (
              <CommandItem
                key={view.id}
                value={`${view.label} ${view.detail}`}
                onSelect={() => runAction(() => props.onSelectView(view.id))}
              >
                <Icon className="h-4 w-4 text-secondary" />
                <span className="flex-1">{view.label}</span>
                <CommandShortcut>{view.detail}</CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandGroup heading="Projects">
          {props.dashboard.projects.flatMap((project) =>
            projectViews.map((view) => {
              const Icon = view.icon;
              return (
                <CommandItem
                  key={`${project.id}:${view.id}`}
                  value={`${project.name} ${view.label} ${view.detail}`}
                  onSelect={() => runAction(() => props.onSelectProjectView(project.id, view.id))}
                >
                  <Icon className="h-4 w-4 text-secondary" />
                  <span className="min-w-0 flex-1 truncate">
                    {project.name} / {view.label}
                  </span>
                  <CommandShortcut>{project.status}</CommandShortcut>
                </CommandItem>
              );
            }),
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function InboxView(props: {
  dashboard: DashboardSnapshot;
  selectedThread: InboxThread | undefined;
  selectedMessages: Message[];
  selectedThreadId: string | null;
  isTriaging: boolean;
  latestTriage: TriageResponse | undefined;
  onSelectThread: (threadId: string) => void;
  onTriageMessage: (messageId: string) => void;
}) {
  return (
    <div className="grid min-h-[560px] grid-cols-[320px_1fr] overflow-hidden rounded-lg border border-border bg-secondary">
      <div className="flex min-w-0 flex-col border-r border-border">
        <div className="border-b border-border px-3 py-2">
          <div className="text-[12px] font-medium text-primary">Threads</div>
          <div className="text-[11px] text-muted">Unified inbox across all channels</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {props.dashboard.inboxThreads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              className={cn(
                'w-full border-b border-border px-3 py-2.5 text-left transition-colors hover:bg-tertiary/60',
                props.selectedThreadId === thread.id && 'bg-tertiary',
              )}
              onClick={() => props.onSelectThread(thread.id)}
            >
              <div className="flex items-center gap-2">
                <Badge variant={channelVariant(thread.channel)}>
                  {channelLabel(thread.channel)}
                </Badge>
                <div className="min-w-0 flex-1 truncate text-[13px] font-medium text-primary">
                  {thread.title}
                </div>
                {thread.unreadCount > 0 ? (
                  <Badge variant="warning">{thread.unreadCount}</Badge>
                ) : null}
              </div>
              <div className="mt-1 truncate text-[11px] text-muted">
                {getProjectName(props.dashboard.projects, thread.projectId)} /{' '}
                {formatDate(thread.lastMessageAt)}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-primary">
              {props.selectedThread?.title ?? 'Select a thread'}
            </div>
            <div className="text-[11px] text-muted">
              {props.selectedThread
                ? `${channelLabel(props.selectedThread.channel)} / ${props.selectedThread.status}`
                : 'Choose a conversation to review messages'}
            </div>
          </div>
          {props.latestTriage ? (
            <Badge variant="info">
              {props.latestTriage.triage.classification}{' '}
              {Math.round(props.latestTriage.triage.confidence * 100)}%
            </Badge>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {props.selectedMessages.length === 0 ? (
            <EmptyBlock>No messages loaded for this thread.</EmptyBlock>
          ) : (
            <div className="space-y-3">
              {props.selectedMessages.map((message) => (
                <div key={message.id} className="rounded-lg border border-border bg-primary p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={message.direction === 'inbound' ? 'warning' : 'default'}>
                        {message.direction}
                      </Badge>
                      <span className="text-[11px] text-muted">{message.sender}</span>
                    </div>
                    <span className="text-[10px] text-muted">{formatDate(message.sentAt)}</span>
                  </div>
                  {message.subject ? (
                    <div className="mt-2 text-[12px] font-medium text-primary">
                      {message.subject}
                    </div>
                  ) : null}
                  <div className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-secondary">
                    {message.body}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] text-muted">
                      {message.classification
                        ? `classified: ${message.classification}`
                        : 'unclassified'}
                    </span>
                    {message.direction === 'inbound' ? (
                      <Button
                        variant="secondary"
                        size="xs"
                        disabled={props.isTriaging}
                        onClick={() => props.onTriageMessage(message.id)}
                      >
                        Triage reply
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivitiesView(props: { activities: ActivityRecord[] }) {
  return (
    <Section title="Recent activity" description="System, human, and AI SDR events.">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableBody>
              {props.activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="w-[1%] whitespace-nowrap">
                    <Badge variant={activity.actor === 'ai' ? 'info' : 'default'}>
                      {activity.actor}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-[13px] font-medium text-primary">{activity.summary}</div>
                    <div className="mt-0.5 truncate text-[12px] text-secondary">
                      {activity.detail}
                    </div>
                  </TableCell>
                  <TableCell className="w-[1%] whitespace-nowrap text-[11px] text-muted">
                    {activity.kind}
                  </TableCell>
                  <TableCell className="w-[1%] whitespace-nowrap text-right text-[11px] text-muted">
                    {formatDate(activity.occurredAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Section>
  );
}

function ContactsView(props: { contacts: Contact[]; companies: Company[] }) {
  return (
    <Section
      title="Contacts"
      description="People worth researching, sequencing, or following up with."
    >
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Lifecycle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="text-[13px] font-medium text-primary">{contact.fullName}</div>
                    <div className="mt-0.5 text-[11px] text-muted">
                      {contact.email ?? contact.xHandle ?? contact.linkedinUrl ?? 'No channel'}
                    </div>
                  </TableCell>
                  <TableCell className="text-[12px] text-secondary">
                    {getCompanyName(props.companies, contact.companyId)}
                  </TableCell>
                  <TableCell className="text-[12px] text-secondary">
                    {contact.jobTitle ?? 'Unknown role'}
                  </TableCell>
                  <TableCell className="w-[1%] whitespace-nowrap">
                    <Badge variant={contact.lifecycle === 'engaged' ? 'warning' : 'default'}>
                      {contact.lifecycle}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Section>
  );
}

function CompaniesView(props: { companies: Company[] }) {
  return (
    <Section title="Companies" description="Accounts shared across projects, brands, and offers.">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className="text-[13px] font-medium text-primary">{company.name}</div>
                    <div className="mt-0.5 text-[11px] text-muted">
                      {company.websiteUrl ?? 'No website'}
                    </div>
                  </TableCell>
                  <TableCell className="text-[12px] text-secondary">
                    {company.domain ?? 'No domain'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {company.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-0">
                    <div className="truncate text-[12px] text-secondary">{company.notes}</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Section>
  );
}

function PipelineView(props: {
  opportunities: Opportunity[];
  projects: Project[];
  contacts: Contact[];
  companies: Company[];
}) {
  return (
    <Section title="Pipeline" description="Qualified deals tied back to project offers.">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opportunity</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.opportunities.map((opportunity) => (
                <TableRow key={opportunity.id}>
                  <TableCell>
                    <div className="text-[13px] font-medium text-primary">{opportunity.name}</div>
                    <div className="mt-0.5 text-[12px] text-secondary">{opportunity.nextStep}</div>
                  </TableCell>
                  <TableCell className="text-[12px] text-secondary">
                    {getCompanyName(props.companies, opportunity.companyId)}
                  </TableCell>
                  <TableCell className="text-[12px] text-secondary">
                    {getContactName(props.contacts, opportunity.contactId)}
                  </TableCell>
                  <TableCell className="text-[11px] text-muted">
                    {getProjectName(props.projects, opportunity.projectId)}
                  </TableCell>
                  <TableCell className="w-[1%] whitespace-nowrap text-right">
                    <div className="text-[13px] font-semibold text-primary">
                      {money(opportunity.annualValue)}
                    </div>
                    <Badge variant="accent">{opportunity.stage}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Section>
  );
}

export function App() {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<ViewId>('pipeline');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const { data: apiBaseUrl, error: apiError } = useQuery({
    queryKey: ['api-base-url'],
    queryFn: () => window.shiplead.getApiBaseUrl(),
  });

  const {
    data: dashboard,
    error: dashboardError,
    isLoading,
  } = useQuery<DashboardSnapshot>({
    queryKey: ['dashboard', apiBaseUrl],
    queryFn: () => fetchJson(`${apiBaseUrl}/dashboard`),
    enabled: Boolean(apiBaseUrl),
  });

  const { data: searchResults = [] } = useQuery<SearchResult[]>({
    queryKey: ['search', apiBaseUrl, commandQuery],
    queryFn: () => fetchJson(`${apiBaseUrl}/search?q=${encodeURIComponent(commandQuery)}`),
    enabled: Boolean(apiBaseUrl) && commandPaletteOpen && commandQuery.trim().length > 1,
  });

  const { data: selectedMessages = [] } = useQuery<Message[]>({
    queryKey: ['messages', apiBaseUrl, selectedThreadId],
    queryFn: () => fetchJson(`${apiBaseUrl}/inbox/threads/${selectedThreadId}/messages`),
    enabled: Boolean(apiBaseUrl && selectedThreadId),
  });

  useEffect(() => {
    if (!selectedThreadId && dashboard?.inboxThreads[0]) {
      setSelectedThreadId(dashboard.inboxThreads[0].id);
    }
  }, [dashboard, selectedThreadId]);

  useEffect(() => {
    if (!dashboard?.projects.length) return;
    if (
      selectedProjectId &&
      dashboard.projects.some((project) => project.id === selectedProjectId)
    ) {
      return;
    }
    setSelectedProjectId(dashboard.projects[0].id);
  }, [dashboard?.projects, selectedProjectId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifierPressed = event.metaKey || event.ctrlKey;
      if (!modifierPressed) return;

      if (event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen((open) => !open);
      }

      if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setNewTaskOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return fetchJson<Task>(`${apiBaseUrl}/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'done' }),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const triageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return fetchJson<TriageResponse>(`${apiBaseUrl}/actions/triage-message`, {
        method: 'POST',
        body: JSON.stringify({ messageId }),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  const selectedThread = useMemo<InboxThread | undefined>(() => {
    return dashboard?.inboxThreads.find((thread) => thread.id === selectedThreadId);
  }, [dashboard?.inboxThreads, selectedThreadId]);

  const invalidateDashboard = () => {
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const selectProjectView = (projectId: string, view: ProjectViewId) => {
    setSelectedProjectId(projectId);
    setActiveView(view);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-9 w-9 animate-spin rounded-full border border-border"
            style={{ borderTopColor: 'var(--text-secondary)' }}
          />
          <span className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted">
            Shiplead
          </span>
        </div>
      </div>
    );
  }

  if (apiError || dashboardError || !dashboard || !apiBaseUrl) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-primary p-8">
        <Card className="max-w-2xl">
          <CardContent className="p-5">
            <div className="text-sm font-semibold text-primary">Local API failed to boot</div>
            <p className="mt-2 text-sm text-secondary">
              Shiplead tries to start its local API automatically. If this still fails, the backend
              process crashed before it became healthy.
            </p>
            <p className="mt-4 rounded-md border border-border bg-tertiary p-3 font-mono text-[11px] text-muted">
              {String(apiError ?? dashboardError)}
            </p>
            <p className="mt-3 text-[11px] text-muted">
              Expected API base URL: {apiBaseUrl ?? 'unknown'} / fallback: bun run dev:api
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeProjectScope = getProjectScope(dashboard, selectedProjectId);
  const visibleMetrics = isProjectView(activeView) ? activeProjectScope.metrics : dashboard.metrics;

  const renderActiveView = () => {
    if (activeView === 'tasks') {
      return (
        <QueueView
          dashboard={dashboard}
          isCompleting={completeTaskMutation.isPending}
          onCompleteTask={(taskId) => completeTaskMutation.mutate(taskId)}
        />
      );
    }

    if (activeView === 'inbox') {
      return (
        <InboxView
          dashboard={dashboard}
          selectedThread={selectedThread}
          selectedMessages={selectedMessages}
          selectedThreadId={selectedThreadId}
          isTriaging={triageMutation.isPending}
          latestTriage={triageMutation.data}
          onSelectThread={setSelectedThreadId}
          onTriageMessage={(messageId) => triageMutation.mutate(messageId)}
        />
      );
    }

    if (activeView === 'activities') {
      return <ActivitiesView activities={dashboard.activities} />;
    }

    if (activeView === 'contacts') {
      return (
        <ContactsView
          contacts={activeProjectScope.contacts}
          companies={activeProjectScope.companies}
        />
      );
    }

    if (activeView === 'companies') {
      return <CompaniesView companies={activeProjectScope.companies} />;
    }

    return (
      <PipelineView
        opportunities={activeProjectScope.opportunities}
        projects={dashboard.projects}
        contacts={activeProjectScope.contacts}
        companies={activeProjectScope.companies}
      />
    );
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-primary text-primary">
      <ShellTitlebar
        activeView={activeView}
        workspaceName={dashboard.workspace.name}
        selectedProjectName={activeProjectScope.project?.name ?? null}
        openWork={visibleMetrics.openTaskCount}
      />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar
          activeView={activeView}
          dashboard={dashboard}
          selectedProjectId={activeProjectScope.project?.id ?? null}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenNewTask={() => setNewTaskOpen(true)}
          onSelectProjectView={selectProjectView}
          onSelectView={setActiveView}
        />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-primary">
          <ViewHeader activeView={activeView} selectedProject={activeProjectScope.project} />
          {activeProjectScope.project && isProjectView(activeView) ? (
            <ProjectTabs
              activeView={activeView}
              metrics={activeProjectScope.metrics}
              onSelectView={(view) => selectProjectView(activeProjectScope.project.id, view)}
            />
          ) : null}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="flex max-w-5xl flex-col gap-6">
              <MetricsStrip metrics={visibleMetrics} />
              {renderActiveView()}
            </div>
          </div>
        </main>
      </div>
      <CommandPalette
        dashboard={dashboard}
        open={commandPaletteOpen}
        query={commandQuery}
        results={searchResults}
        selectedProjectId={activeProjectScope.project?.id ?? null}
        onOpenChange={(open) => {
          setCommandPaletteOpen(open);
          if (!open) setCommandQuery('');
        }}
        onOpenNewTask={() => setNewTaskOpen(true)}
        onQueryChange={setCommandQuery}
        onSelectProjectView={selectProjectView}
        onSelectView={setActiveView}
      />
      <NewTaskModal
        apiBaseUrl={apiBaseUrl}
        dashboard={dashboard}
        preferredProjectId={activeProjectScope.project?.id ?? null}
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        onCreated={invalidateDashboard}
      />
    </div>
  );
}
