import { ModuleHeader, ModuleTabs, StatCard } from "@garden/design-system";
import { DEFAULT_PRIVATE_WORKSPACE_ID, createId, objectPath, todayKey } from "@garden/domain";
import { captureUniversalItem, useGarden } from "@garden/shared-state";
import type { ContentFormat, ContentStage, KanbanColumn, MoscowPriority, ObjectRef, RelationshipKind, RelationshipNoteKind, RelationshipRecord, RelationshipStage, TaskGardenItem, TaskGardenZone, TriageAction, WorkItemKind } from "@garden/types";
import { Button, Card, Input, Label, Pill, SectionHeading, Textarea } from "@garden/ui";
import { Building2, ExternalLink, GripVertical, Plus, UserRound } from "lucide-react";
import { useState } from "react";
import { Link as RouterLink, Navigate, Route, Routes } from "react-router-dom";
import { getTodaySummary } from "./lib";

const tabs = [
  { to: "/work", label: "Overview", end: true },
  { to: "/work/inbox", label: "Inbox" },
  { to: "/work/content", label: "Content" },
  { to: "/work/relationships", label: "Relationships" },
  { to: "/work/task-garden", label: "Task Garden" },
  { to: "/work/execute", label: "Execute" },
  { to: "/work/projects", label: "Projects" },
];

const belongsToWorkspace = (workspaceId: string, item: { workspaceId?: string }) =>
  (item.workspaceId ?? DEFAULT_PRIVATE_WORKSPACE_ID) === workspaceId;

export const WorkRoutes = () => {
  const { activeWorkspace, data } = useGarden();
  const summary = getTodaySummary(data);
  return (
    <>
      <ModuleHeader
        title="Work"
        description={`The capture-first operating surface for ${activeWorkspace.name}: inbox, content, relationships, shared prioritization and execution.`}
        aside={<Pill tone={activeWorkspace.kind === "shared" ? "sage" : summary.sprintLoad === "overloaded" ? "clay" : "stone"}>{activeWorkspace.kind === "shared" ? "shared garden" : `${summary.sprintLoad} sprint`}</Pill>}
      />
      <ModuleTabs tabs={tabs} />
      <Routes>
        <Route index element={<Overview />} />
        <Route path="inbox" element={<InboxPanel />} />
        <Route path="content" element={<ContentStudio />} />
        <Route path="relationships" element={<RelationshipsStudio />} />
        <Route path="task-garden" element={<TaskGarden />} />
        <Route path="prioritize" element={<Navigate replace to="/work" />} />
        <Route path="bets" element={<Navigate replace to="/work" />} />
        <Route path="execute" element={<Execute />} />
        <Route path="kanban" element={<Navigate replace to="/work/execute" />} />
        <Route path="projects" element={<Projects />} />
        <Route path="sprint" element={<Navigate replace to="/work/execute" />} />
      </Routes>
    </>
  );
};

const Overview = () => {
  const { activeWorkspace, activeWorkspaceId, data } = useGarden();
  const summary = getTodaySummary(data);
  const activeInbox = data.workItems.filter((item) => belongsToWorkspace(activeWorkspaceId, item) && item.triage !== "delete").length;
  const contentIdeas = data.workItems.filter((item) => belongsToWorkspace(activeWorkspaceId, item) && item.kind === "content" && item.triage !== "delete").length;
  const relationships = data.relationships.filter((record) => belongsToWorkspace(activeWorkspaceId, record) && record.stage !== "archived").length;
  const taskGardenItems = data.taskGardenItems.filter((item) => item.workspaceId === activeWorkspaceId).length;
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Inbox" value={activeInbox} supporting="Captured items to process" />
        <StatCard label="Content" value={contentIdeas} supporting="Ideas in development" />
        <StatCard label="Relationships" value={relationships} supporting="People and companies" />
        <StatCard label="Task Garden" value={taskGardenItems} supporting={activeWorkspace.kind === "shared" ? "Shared priorities" : "Private shaping board"} />
      </div>
      <Card className="p-6">
        <SectionHeading title="Capture lanes" supporting="Quick Capture now routes ideas into the surface that can actually hold them." />
        <div className="grid gap-3 md:grid-cols-4">
          <RouterLink to="/work/inbox" className="rounded-2xl bg-mist/45 p-4 transition hover:bg-mist">
            <Pill tone="stone">Inbox</Pill>
            <p className="mt-3 font-medium">Tasks, thoughts and obligations</p>
            <p className="mt-2 text-sm leading-6 text-muted">Process later without making capture feel heavy.</p>
          </RouterLink>
          <RouterLink to="/work/content" className="rounded-2xl bg-mist/45 p-4 transition hover:bg-mist">
            <Pill tone="sage">Content</Pill>
            <p className="mt-3 font-medium">Ideas, hooks and drafts</p>
            <p className="mt-2 text-sm leading-6 text-muted">Move raw observations toward angles, outlines and drafts.</p>
          </RouterLink>
          <RouterLink to="/work/relationships" className="rounded-2xl bg-mist/45 p-4 transition hover:bg-mist">
            <Pill tone="sage">Relationships</Pill>
            <p className="mt-3 font-medium">People and companies</p>
            <p className="mt-2 text-sm leading-6 text-muted">Keep context, links and ideas attached to the right relationship.</p>
          </RouterLink>
          <RouterLink to="/work/task-garden" className="rounded-2xl bg-mist/45 p-4 transition hover:bg-mist">
            <Pill tone="clay">Task Garden</Pill>
            <p className="mt-3 font-medium">Do Now, Develop, Ask</p>
            <p className="mt-2 text-sm leading-6 text-muted">A shared 3-zone board for prioritizing captured ideas with Sonum.</p>
          </RouterLink>
        </div>
      </Card>
      <Card className="p-6">
        <SectionHeading title="Current focus" supporting={data.projects[0]?.outcome ?? "Choose the project only after the capture lanes are clear."} />
        <p className="font-serif text-3xl tracking-tight">{data.projects[0]?.name ?? summary.priority}</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {data.kanbanCards.filter((card) => card.column === "today" || card.column === "sprint" || card.column === "blocked").map((card) => (
            <div key={card.id} className="rounded-2xl bg-mist/50 p-4">
              <Pill tone={card.column === "blocked" ? "clay" : "stone"}>{card.column}</Pill>
              <p className="mt-3 font-medium">{card.title}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const InboxPanel = () => {
  const { activeWorkspace, activeWorkspaceId, currentMemberId, data, update } = useGarden();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<WorkItemKind>("task");
  const actions: TriageAction[] = ["do-now", "defer", "delegate", "delete"];
  const inboxItems = data.workItems.filter((item) => belongsToWorkspace(activeWorkspaceId, item) && item.triage !== "delete");
  return (
    <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <Card className="p-6">
        <SectionHeading title="GTD capture" supporting="Get it out of your head; decide later." />
        <form className="space-y-4" onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          update((current) => captureUniversalItem(current, title, kind, {
            workspaceId: activeWorkspaceId,
            visibility: activeWorkspace.kind === "shared" ? "shared" : "private",
            createdBy: currentMemberId,
          }).data);
          setTitle("");
        }}>
          <div><Label htmlFor="capture">What has your attention?</Label><Textarea id="capture" rows={4} value={title} onChange={(event) => setTitle(event.target.value)} /></div>
          <select value={kind} onChange={(event) => setKind(event.target.value as WorkItemKind)} className="h-11 w-full rounded-xl border border-ink/8 bg-white px-3 text-sm"><option value="task">Task</option><option value="idea">Idea</option><option value="thought">Thought</option><option value="obligation">Obligation</option><option value="content">Content</option><option value="person">Person</option><option value="company">Company</option></select>
          <Button type="submit" className="w-full">Capture</Button>
        </form>
        <p className="mt-5 rounded-xl bg-mist/55 p-4 text-sm text-muted">People and companies route to Relationships. If a task takes less than 2 minutes, do it now.</p>
      </Card>
      <Card className="p-6">
        <SectionHeading title="Inbox" />
        <div className="space-y-3">{inboxItems.map((item) => (
          <div key={item.id} className="rounded-2xl border border-ink/5 p-4">
            <div className="flex justify-between"><p>{item.title}</p><Pill tone="stone">{item.kind}</Pill></div>
            <div className="mt-3 flex flex-wrap gap-1">{actions.map((action) => <Button key={action} variant={item.triage === action ? "secondary" : action === "delete" ? "danger" : "quiet"} className="h-8 min-h-8 px-3 text-xs" onClick={() => update((current) => ({ ...current, workItems: current.workItems.map((entry) => entry.id === item.id ? { ...entry, triage: action } : entry) }))}>{action.replace("-", " ")}</Button>)}</div>
          </div>
        ))}</div>
      </Card>
    </div>
  );
};

const contentStages: Array<{ id: ContentStage; label: string; guidance: string }> = [
  { id: "seed", label: "Seed", guidance: "Raw observation or thesis." },
  { id: "angle", label: "Angle", guidance: "Who is it for and why now?" },
  { id: "outline", label: "Outline", guidance: "Shape the argument." },
  { id: "draft", label: "Draft", guidance: "Ready to write or record." },
  { id: "published", label: "Published", guidance: "Shipped or archived." },
];

const contentFormats: ContentFormat[] = ["post", "essay", "thread", "video", "newsletter"];

const ContentStudio = () => {
  const { activeWorkspace, activeWorkspaceId, currentMemberId, data, update } = useGarden();
  const [draft, setDraft] = useState("");
  const [audience, setAudience] = useState("Creators and operators");
  const [format, setFormat] = useState<ContentFormat>("post");
  const contentItems = data.workItems.filter((item) => belongsToWorkspace(activeWorkspaceId, item) && item.kind === "content" && item.triage !== "delete");
  const convertedSourceIds = new Set(data.objectRelations
    .filter((relation) => (relation.workspaceId ?? DEFAULT_PRIVATE_WORKSPACE_ID) === activeWorkspaceId && relation.label === "source-for" && relation.from.kind === "source")
    .map((relation) => relation.from.id));
  const sourceQueue = data.sources.filter((source) => belongsToWorkspace(activeWorkspaceId, source) && !convertedSourceIds.has(source.id)).slice(0, 4);

  const updateContent = (id: string, change: Partial<(typeof contentItems)[number]>) =>
    update((current) => ({
      ...current,
      workItems: current.workItems.map((item) => item.id === id ? { ...item, ...change } : item),
    }));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionHeading
          title="Content idea development"
          supporting={`Turn captured thoughts, source notes and shared angles into useful creator output for ${activeWorkspace.name}.`}
        />
        <form
          className="grid gap-3 lg:grid-cols-[1fr_220px_160px_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.trim()) return;
            update((current) => ({
              ...current,
              workItems: [
                {
                  id: createId(),
                  createdAt: todayKey(),
                  title: draft.trim(),
                  kind: "content",
                  triage: "untriaged",
                  contentStage: "seed",
                  contentFormat: format,
                  audience: audience.trim() || undefined,
                  workspaceId: activeWorkspaceId,
                  visibility: activeWorkspace.kind === "shared" ? "shared" : "private",
                  createdBy: currentMemberId,
                },
                ...current.workItems,
              ],
            }));
            setDraft("");
          }}
        >
          <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="A content idea, thesis or observation" />
          <Input value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="Audience" />
          <select value={format} onChange={(event) => setFormat(event.target.value as ContentFormat)} className="h-11 rounded-xl border border-ink/8 bg-white px-3 text-sm">
            {contentFormats.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <Button type="submit"><Plus size={15} /> Add</Button>
        </form>
      </Card>

      <Card className="p-6">
        <SectionHeading
          title="Source queue"
          supporting="Links, podcasts and top news stories captured from Quick Capture before they become content."
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {sourceQueue.length ? sourceQueue.map((source) => (
            <RouterLink key={source.id} to={objectPath({ kind: "source", id: source.id })} className="rounded-2xl bg-mist/45 p-4 transition hover:bg-mist">
              <Pill tone={source.sourceType === "youtube" ? "clay" : "stone"}>{source.sourceType}</Pill>
              <p className="mt-3 text-sm font-medium leading-6">{source.title}</p>
              <p className="mt-2 truncate text-xs text-muted">{source.publisher ?? source.url}</p>
            </RouterLink>
          )) : <p className="rounded-xl border border-dashed border-ink/10 p-4 text-sm text-muted md:col-span-2 xl:col-span-4">Paste a YouTube, podcast or news link into Quick Capture to start a source object.</p>}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-5">
        {contentStages.map((stage) => {
          const items = contentItems.filter((item) => (item.contentStage ?? "seed") === stage.id);
          return (
            <Card key={stage.id} className="min-h-64 p-4">
              <div className="mb-4">
                <Pill tone={stage.id === "published" ? "sage" : "stone"}>{stage.label}</Pill>
                <p className="mt-3 text-xs leading-5 text-muted">{stage.guidance}</p>
              </div>
              <div className="space-y-3">
                {items.map((item) => {
                  const stageIndex = contentStages.findIndex((entry) => entry.id === (item.contentStage ?? "seed"));
                  const nextStage = contentStages[Math.min(stageIndex + 1, contentStages.length - 1)]?.id ?? "published";
                  return (
                    <div key={item.id} className="rounded-2xl bg-mist/45 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <RouterLink to={objectPath({ kind: "content", id: item.id })} className="text-sm font-medium leading-6 hover:text-forest hover:underline">{item.title}</RouterLink>
                        <Pill>{item.contentFormat ?? "post"}</Pill>
                      </div>
                      <p className="mt-2 text-xs text-muted">{item.audience ?? "Audience not named"}</p>
                      <Textarea
                        className="mt-3 min-h-20 bg-white/75"
                        value={item.hook ?? ""}
                        onChange={(event) => updateContent(item.id, { hook: event.target.value })}
                        placeholder="Hook, angle or outline notes..."
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        {stage.id !== "published" ? (
                          <Button variant="secondary" className="h-8 min-h-8 px-3 text-xs" onClick={() => updateContent(item.id, { contentStage: nextStage })}>
                            Move to {contentStages.find((entry) => entry.id === nextStage)?.label}
                          </Button>
                        ) : null}
                        <Button variant="quiet" className="h-8 min-h-8 px-3 text-xs" onClick={() => updateContent(item.id, { triage: "delete" })}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 ? <p className="rounded-xl border border-dashed border-ink/10 p-4 text-sm leading-6 text-muted">No ideas here yet.</p> : null}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const relationshipKinds: Array<{ id: RelationshipKind; label: string }> = [
  { id: "person", label: "Person" },
  { id: "company", label: "Company" },
];

const relationshipStages: Array<{ id: RelationshipStage; label: string }> = [
  { id: "new", label: "New" },
  { id: "active", label: "Active" },
  { id: "follow-up", label: "Follow-up" },
  { id: "warm", label: "Warm" },
  { id: "archived", label: "Archived" },
];

const relationshipNoteKinds: Array<{ id: RelationshipNoteKind; label: string }> = [
  { id: "note", label: "Note" },
  { id: "idea", label: "Idea" },
  { id: "link", label: "Link" },
];

const relationshipTone = (stage: RelationshipStage) =>
  stage === "active" || stage === "warm" ? "sage" : stage === "follow-up" ? "clay" : "stone";

const noteIsUrl = (value: string) => /^https?:\/\//i.test(value.trim());

const RelationshipsStudio = () => {
  const { activeWorkspace, activeWorkspaceId, currentMemberId, data, update } = useGarden();
  const [draft, setDraft] = useState({ name: "", kind: "person" as RelationshipKind, role: "", companyId: "" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteKind, setNoteKind] = useState<RelationshipNoteKind>("note");
  const records = data.relationships.filter((record) => belongsToWorkspace(activeWorkspaceId, record) && record.stage !== "archived");
  const people = records.filter((record) => record.kind === "person");
  const companies = records.filter((record) => record.kind === "company");
  const selected = records.find((record) => record.id === selectedId) ?? records[0];
  const selectedCompany = selected?.companyId ? companies.find((company) => company.id === selected.companyId) : null;

  const updateRelationship = (id: string, change: Partial<RelationshipRecord>) =>
    update((current) => ({
      ...current,
      relationships: current.relationships.map((record) => record.id === id ? { ...record, ...change } : record),
    }));

  const addNote = (recordId: string) => {
    const body = noteDraft.trim();
    if (!body) return;
    update((current) => ({
      ...current,
      relationships: current.relationships.map((record) =>
        record.id === recordId
          ? {
            ...record,
            notes: [
              { id: createId(), createdAt: new Date().toISOString(), kind: noteKind, body },
              ...record.notes,
            ],
          }
          : record,
      ),
    }));
    setNoteDraft("");
  };

  const addRelationship = () => {
    const name = draft.name.trim();
    if (!name) return;
    const id = createId();
    update((current) => ({
      ...current,
      relationships: [
        {
          id,
          createdAt: new Date().toISOString(),
          kind: draft.kind,
          name,
          role: draft.role.trim() || undefined,
          companyId: draft.kind === "person" ? draft.companyId || undefined : undefined,
          stage: "new",
          notes: [],
          workspaceId: activeWorkspaceId,
          visibility: activeWorkspace.kind === "shared" ? "shared" : "private",
          createdBy: currentMemberId,
        },
        ...current.relationships,
      ],
    }));
    setSelectedId(id);
    setDraft({ name: "", kind: draft.kind, role: "", companyId: "" });
  };

  const renderRecordButton = (record: RelationshipRecord) => {
    const company = record.companyId ? companies.find((item) => item.id === record.companyId) : null;
    const Icon = record.kind === "person" ? UserRound : Building2;
    return (
      <RouterLink
        key={record.id}
        to={objectPath({ kind: record.kind, id: record.id })}
        className={`w-full rounded-2xl p-4 text-left transition ${selected?.id === record.id ? "bg-forest text-white" : "bg-mist/45 hover:bg-mist"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon size={16} />
            <p className="font-medium">{record.name}</p>
          </div>
          <Pill tone={selected?.id === record.id ? "stone" : relationshipTone(record.stage)}>{record.stage}</Pill>
        </div>
        <p className={`mt-2 text-sm ${selected?.id === record.id ? "text-white/75" : "text-muted"}`}>
          {record.role || company?.name || `${record.notes.length} notes`}
        </p>
      </RouterLink>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionHeading
          title="Relationships"
          supporting="A light CRM for people and companies you want to remember, help, follow up with or think beside."
        />
        <form
          className="grid gap-3 lg:grid-cols-[150px_1fr_220px_220px_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            addRelationship();
          }}
        >
          <select
            value={draft.kind}
            onChange={(event) => setDraft({ ...draft, kind: event.target.value as RelationshipKind, companyId: "" })}
            className="h-11 rounded-xl border border-ink/8 bg-white px-3 text-sm"
          >
            {relationshipKinds.map((kind) => <option key={kind.id} value={kind.id}>{kind.label}</option>)}
          </select>
          <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder={draft.kind === "person" ? "Person name" : "Company name"} />
          <Input value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} placeholder={draft.kind === "person" ? "Role or context" : "Relationship context"} />
          <select
            value={draft.companyId}
            onChange={(event) => setDraft({ ...draft, companyId: event.target.value })}
            disabled={draft.kind === "company"}
            className="h-11 rounded-xl border border-ink/8 bg-white px-3 text-sm disabled:opacity-45"
          >
            <option value="">No company</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
          </select>
          <Button type="submit"><Plus size={15} /> Add</Button>
        </form>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
          <Card className="p-5">
            <SectionHeading title="People" supporting={`${people.length} active`} />
            <div className="space-y-3">
              {people.length ? people.map(renderRecordButton) : <p className="rounded-xl border border-dashed border-ink/10 p-4 text-sm text-muted">Capture a person to begin.</p>}
            </div>
          </Card>
          <Card className="p-5">
            <SectionHeading title="Companies" supporting={`${companies.length} active`} />
            <div className="space-y-3">
              {companies.length ? companies.map(renderRecordButton) : <p className="rounded-xl border border-dashed border-ink/10 p-4 text-sm text-muted">Capture a company to begin.</p>}
            </div>
          </Card>
        </div>

        <Card className="p-6">
          {selected ? (
            <div>
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <Pill tone={relationshipTone(selected.stage)}>{selected.kind}</Pill>
                  <h2 className="mt-4 font-serif text-4xl tracking-[-0.045em]">{selected.name}</h2>
                  <p className="mt-2 text-sm text-muted">{selected.role || selectedCompany?.name || "Add context so future you understands why this matters."}</p>
                </div>
                <Button variant="quiet" onClick={() => updateRelationship(selected.id, { stage: "archived" })}>Archive</Button>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label htmlFor="relationship-stage">Stage</Label>
                  <select
                    id="relationship-stage"
                    value={selected.stage}
                    onChange={(event) => updateRelationship(selected.id, { stage: event.target.value as RelationshipStage })}
                    className="h-11 w-full rounded-xl border border-ink/8 bg-white px-3 text-sm"
                  >
                    {relationshipStages.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="relationship-role">Role / context</Label>
                  <Input id="relationship-role" value={selected.role ?? ""} onChange={(event) => updateRelationship(selected.id, { role: event.target.value })} placeholder="Collaborator, client, friend, partner..." />
                </div>
                <div>
                  <Label htmlFor="relationship-company">Company</Label>
                  <select
                    id="relationship-company"
                    value={selected.companyId ?? ""}
                    onChange={(event) => updateRelationship(selected.id, { companyId: event.target.value || undefined })}
                    disabled={selected.kind === "company"}
                    className="h-11 w-full rounded-xl border border-ink/8 bg-white px-3 text-sm disabled:opacity-45"
                  >
                    <option value="">No company</option>
                    {companies.filter((company) => company.id !== selected.id).map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
                  </select>
                </div>
              </div>

              <form
                className="mt-6 grid gap-3 md:grid-cols-[150px_1fr_auto]"
                onSubmit={(event) => {
                  event.preventDefault();
                  addNote(selected.id);
                }}
              >
                <select value={noteKind} onChange={(event) => setNoteKind(event.target.value as RelationshipNoteKind)} className="h-11 rounded-xl border border-ink/8 bg-white px-3 text-sm">
                  {relationshipNoteKinds.map((kind) => <option key={kind.id} value={kind.id}>{kind.label}</option>)}
                </select>
                <Input value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder={noteKind === "link" ? "Paste a URL or resource" : "Add an idea, note or next context"} />
                <Button type="submit">Add note</Button>
              </form>

              <div className="mt-6 space-y-3">
                {selected.notes.length ? selected.notes.map((note) => (
                  <div key={note.id} className="rounded-2xl bg-mist/45 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <Pill tone={note.kind === "idea" ? "sage" : "stone"}>{note.kind}</Pill>
                      <p className="text-xs text-muted">{new Date(note.createdAt).toLocaleDateString()}</p>
                    </div>
                    {note.kind === "link" && noteIsUrl(note.body) ? (
                      <a href={note.body} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-forest hover:underline">
                        {note.body}
                        <ExternalLink size={14} />
                      </a>
                    ) : (
                      <p className="text-sm leading-6">{note.body}</p>
                    )}
                  </div>
                )) : <p className="rounded-xl border border-dashed border-ink/10 p-4 text-sm leading-6 text-muted">No notes yet. Add the first useful detail, link or idea.</p>}
              </div>
            </div>
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center text-center">
              <Pill tone="stone">CRM mock</Pill>
              <h2 className="mt-5 font-serif text-4xl tracking-[-0.045em]">Capture a person or company.</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-muted">Quick Capture creates the record. This section helps you keep context attached to the relationship.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

const taskGardenZones: Array<{ id: TaskGardenZone; label: string; guidance: string }> = [
  { id: "do-now", label: "Do Now", guidance: "Clear, important and ready for action." },
  { id: "develop", label: "Develop", guidance: "Needs shaping, context or a better angle." },
  { id: "ask-delegate", label: "Ask / Delegate", guidance: "Needs Sonum, Noor or someone else to move it forward." },
];

const TaskGarden = () => {
  const { activeWorkspace, activeWorkspaceId, currentMemberId, data, update } = useGarden();
  const [title, setTitle] = useState("");
  const [zone, setZone] = useState<TaskGardenZone>("develop");
  const [ownerId, setOwnerId] = useState("");
  const [dragging, setDragging] = useState<string | null>(null);
  const members = activeWorkspace.memberIds
    .map((memberId) => data.members.find((member) => member.id === memberId))
    .filter(Boolean);
  const items = data.taskGardenItems.filter((item) => item.workspaceId === activeWorkspaceId);

  const memberName = (memberId?: string) => members.find((member) => member?.id === memberId)?.name ?? "Both";
  const objectTitle = (ref?: ObjectRef) => {
    if (!ref) return null;
    if (ref.kind === "person" || ref.kind === "company") return data.relationships.find((record) => record.id === ref.id)?.name ?? null;
    if (ref.kind === "content") return data.workItems.find((item) => item.id === ref.id)?.title ?? null;
    if (ref.kind === "note") return data.fieldNotes.find((note) => note.id === ref.id)?.title ?? null;
    return data.sources.find((source) => source.id === ref.id)?.title ?? null;
  };

  const updateItem = (id: string, change: Partial<TaskGardenItem>) =>
    update((current) => ({
      ...current,
      taskGardenItems: current.taskGardenItems.map((item) =>
        item.id === id ? { ...item, ...change, updatedAt: new Date().toISOString() } : item,
      ),
    }));

  const createContentIdea = (item: TaskGardenItem) => {
    const id = createId();
    const ref: ObjectRef = { kind: "content", id };
    const createdAt = new Date().toISOString();
    update((current) => ({
      ...current,
      workItems: [
        {
          id,
          createdAt,
          title: item.title,
          kind: "content",
          triage: "untriaged",
          contentStage: "seed",
          contentFormat: "post",
          audience: "Creators and operators",
          hook: item.notes ?? item.title,
          workspaceId: activeWorkspaceId,
          visibility: activeWorkspace.kind === "shared" ? "shared" : "private",
          createdBy: currentMemberId,
        },
        ...current.workItems,
      ],
      taskGardenItems: current.taskGardenItems.map((card) =>
        card.id === item.id ? { ...card, objectRef: ref, updatedAt: createdAt } : card,
      ),
      objectRelations: item.objectRef
        ? [
          {
            id: createId(),
            from: item.objectRef,
            to: ref,
            label: "inspired-by",
            workspaceId: activeWorkspaceId,
          },
          ...current.objectRelations,
        ]
        : current.objectRelations,
      objectActivity: [
        {
          id: createId(),
          object: ref,
          createdAt,
          action: "Created from Task Garden",
          detail: item.title,
          workspaceId: activeWorkspaceId,
          visibility: activeWorkspace.kind === "shared" ? "shared" : "private",
          createdBy: currentMemberId,
        },
        ...current.objectActivity,
      ],
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionHeading
          title="Shared Task Garden"
          supporting="A calm 3-zone board for deciding what deserves action, what needs shaping and what should be asked of someone else."
        />
        <form
          className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim()) return;
            update((current) => ({
              ...current,
              taskGardenItems: [
                {
                  id: createId(),
                  workspaceId: activeWorkspaceId,
                  zone,
                  title: title.trim(),
                  ownerId: ownerId || undefined,
                  createdBy: currentMemberId,
                  createdAt: new Date().toISOString(),
                },
                ...current.taskGardenItems,
              ],
            }));
            setTitle("");
          }}
        >
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Capture something that needs prioritizing or shaping" />
          <select value={zone} onChange={(event) => setZone(event.target.value as TaskGardenZone)} className="h-11 rounded-xl border border-ink/8 bg-white px-3 text-sm">
            {taskGardenZones.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)} className="h-11 rounded-xl border border-ink/8 bg-white px-3 text-sm">
            <option value="">Owner: both</option>
            {members.map((member) => <option key={member?.id} value={member?.id}>Owner: {member?.name}</option>)}
          </select>
          <Button type="submit"><Plus size={15} /> Add</Button>
        </form>
        <p className="mt-4 rounded-2xl bg-mist/55 p-4 text-sm leading-6 text-muted">
          No fourth quadrant here. If something is not worth attention, quietly delete it or let it stay out of the Garden.
        </p>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        {taskGardenZones.map((column) => {
          const columnItems = items.filter((item) => item.zone === column.id);
          return (
            <Card
              key={column.id}
              className="min-h-[28rem] p-4"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (!dragging) return;
                updateItem(dragging, { zone: column.id });
                setDragging(null);
              }}
            >
              <div className="mb-4">
                <Pill tone={column.id === "do-now" ? "clay" : column.id === "develop" ? "sage" : "stone"}>{column.label}</Pill>
                <p className="mt-3 text-xs leading-5 text-muted">{column.guidance}</p>
              </div>
              <div className="space-y-3">
                {columnItems.map((item) => {
                  const titleForObject = objectTitle(item.objectRef);
                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => setDragging(item.id)}
                      className="rounded-2xl border border-ink/5 bg-mist/45 p-4"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical size={15} className="mt-1 shrink-0 text-muted" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-6">{item.title}</p>
                          <p className="mt-1 text-xs text-muted">
                            Owner: {memberName(item.ownerId)} · Added by {memberName(item.createdBy)}
                          </p>
                        </div>
                      </div>
                      {item.objectRef && titleForObject ? (
                        <RouterLink to={objectPath(item.objectRef)} className="mt-3 inline-flex text-xs font-medium text-forest hover:underline">
                          Open object: {titleForObject}
                        </RouterLink>
                      ) : null}
                      <Textarea
                        className="mt-3 min-h-20 bg-white/80"
                        value={item.notes ?? ""}
                        onChange={(event) => updateItem(item.id, { notes: event.target.value })}
                        placeholder="Notes, Sonum comments, hooks, angles or context..."
                      />
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <select
                          value={item.ownerId ?? ""}
                          onChange={(event) => updateItem(item.id, { ownerId: event.target.value || undefined })}
                          className="h-9 rounded-xl border border-ink/8 bg-white px-3 text-xs"
                        >
                          <option value="">Both</option>
                          {members.map((member) => <option key={member?.id} value={member?.id}>{member?.name}</option>)}
                        </select>
                        <select
                          value={item.zone}
                          onChange={(event) => updateItem(item.id, { zone: event.target.value as TaskGardenZone })}
                          className="h-9 rounded-xl border border-ink/8 bg-white px-3 text-xs"
                        >
                          {taskGardenZones.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
                        </select>
                      </div>
                      {item.objectRef?.kind !== "content" ? (
                        <Button variant="secondary" className="mt-3 h-8 min-h-8 px-3 text-xs" onClick={() => createContentIdea(item)}>
                          Create content idea
                        </Button>
                      ) : null}
                    </div>
                  );
                })}
                {columnItems.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-ink/10 p-4 text-sm leading-6 text-muted">Nothing here yet.</p>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const columns: Array<{ id: KanbanColumn; label: string }> = [{ id: "backlog", label: "Backlog" }, { id: "sprint", label: "This Sprint" }, { id: "today", label: "Today" }, { id: "blocked", label: "Blocked" }, { id: "done", label: "Done" }];
const Execute = () => {
  const { data, update } = useGarden();
  const [title, setTitle] = useState("");
  const [dragging, setDragging] = useState<string | null>(null);
  return (
    <div className="space-y-5">
      <Card className="p-5"><SectionHeading title="Task Garden execution" supporting="Only committed work should enter the board." /><form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); if (!title.trim()) return; update((current) => ({ ...current, kanbanCards: [...current.kanbanCards, { id: createId(), title: title.trim(), column: "backlog" }] })); setTitle(""); }}><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Add an executable next action" /><Button type="submit">Add</Button></form></Card>
      <div className="grid gap-3 md:grid-cols-5">{columns.map((column) => (
        <Card key={column.id} className="min-h-64 p-3" onDragOver={(event) => event.preventDefault()} onDrop={() => { if (!dragging) return; update((current) => ({ ...current, kanbanCards: current.kanbanCards.map((card) => card.id === dragging ? { ...card, column: column.id } : card) })); setDragging(null); }}>
          <p className="mb-3 p-2 text-sm font-medium text-muted">{column.label}</p>
          {data.kanbanCards.filter((card) => card.column === column.id).map((card) => <div key={card.id} draggable onDragStart={() => setDragging(card.id)} className="mb-2 flex gap-2 rounded-xl bg-mist/55 p-3 text-sm"><GripVertical size={14} className="shrink-0 text-muted" />{card.title}</div>)}
        </Card>
      ))}</div>
    </div>
  );
};

const Projects = () => {
  const { data, update } = useGarden();
  const [scope, setScope] = useState("");
  const [priority, setPriority] = useState<MoscowPriority>("must");
  const [projectDraft, setProjectDraft] = useState({ name: "", outcome: "" });
  const project = data.projects[0];
  const createProject = () => {
    const name = projectDraft.name.trim();
    if (!name) return;
    update((current) => ({
      ...current,
      projects: [
        {
          id: createId(),
          name,
          outcome: projectDraft.outcome.trim() || "Define what done looks like before adding scope.",
          scope: [],
        },
        ...current.projects,
      ],
    }));
    setProjectDraft({ name: "", outcome: "" });
  };

  if (!project) {
    return (
      <div className="grid gap-5 lg:grid-cols-[1fr_.9fr]">
        <Card className="p-6 sm:p-8">
          <Pill tone="stone">Scope control</Pill>
          <h2 className="mt-5 font-serif text-4xl tracking-[-0.045em] sm:text-5xl">Projects are for bigger bodies of work.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
            Quick Capture is for anything. Task Garden is for prioritizing what deserves attention. Projects are only for work that needs a roadmap, boundaries and explicit MoSCoW scope.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-mist/45 p-4">
              <p className="text-sm font-medium">Use Projects for</p>
              <p className="mt-2 text-sm leading-6 text-muted">A launch, course, product, move, collaboration or multi-week creative sprint.</p>
            </div>
            <div className="rounded-2xl bg-mist/45 p-4">
              <p className="text-sm font-medium">Do not use it for</p>
              <p className="mt-2 text-sm leading-6 text-muted">Loose thoughts, links, tiny tasks or half-formed content ideas.</p>
            </div>
            <div className="rounded-2xl bg-mist/45 p-4">
              <p className="text-sm font-medium">Why it exists</p>
              <p className="mt-2 text-sm leading-6 text-muted">To stop good ideas from quietly turning into overbuilt commitments.</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <SectionHeading title="Create first project" supporting="Only add one when the work needs real boundaries." />
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              createProject();
            }}
          >
            <div>
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                value={projectDraft.name}
                onChange={(event) => setProjectDraft({ ...projectDraft, name: event.target.value })}
                placeholder="Launch the creator newsletter"
              />
            </div>
            <div>
              <Label htmlFor="project-outcome">Desired outcome</Label>
              <Textarea
                id="project-outcome"
                rows={4}
                value={projectDraft.outcome}
                onChange={(event) => setProjectDraft({ ...projectDraft, outcome: event.target.value })}
                placeholder="A simple weekly publishing rhythm that feels sustainable."
              />
            </div>
            <Button type="submit" className="w-full">Create project</Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <SectionHeading
        title={project.name}
        supporting={project.outcome}
      />
      <p className="mb-5 rounded-2xl bg-mist/55 p-4 text-sm leading-6 text-muted">
        Use this page to decide what belongs in the project before execution starts. It is intentionally slower than Quick Capture.
      </p>
      <div className="grid gap-3 sm:grid-cols-4">
        {(["must", "should", "could", "wont"] as MoscowPriority[]).map((value) => (
          <div key={value} className="rounded-xl bg-mist/45 p-4">
            <Pill tone={value === "must" ? "sage" : value === "wont" ? "clay" : "stone"}>{value === "wont" ? "Won't" : value}</Pill>
            {project.scope.filter((item) => item.priority === value).map((item) => <p className="mt-3 text-sm" key={item.id}>{item.label}</p>)}
            {project.scope.filter((item) => item.priority === value).length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-muted">No scope decisions yet.</p>
            ) : null}
          </div>
        ))}
      </div>
      <form
        className="mt-6 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (!scope.trim()) return;
          update((current) => ({
            ...current,
            projects: current.projects.map((item) =>
              item.id === project.id ? { ...item, scope: [...item.scope, { id: createId(), label: scope.trim(), priority }] } : item,
            ),
          }));
          setScope("");
        }}
      >
        <Input value={scope} onChange={(event) => setScope(event.target.value)} placeholder="Add scope decision" />
        <select value={priority} onChange={(event) => setPriority(event.target.value as MoscowPriority)} className="h-11 rounded-xl border border-ink/8 bg-white px-3 text-sm">
          <option value="must">Must</option>
          <option value="should">Should</option>
          <option value="could">Could</option>
          <option value="wont">Won't</option>
        </select>
        <Button type="submit">Add</Button>
      </form>
    </Card>
  );
};
