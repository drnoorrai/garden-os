import { ModuleHeader, ModuleTabs } from "@garden/design-system";
import { DEFAULT_PRIVATE_WORKSPACE_ID, DEFAULT_SHARED_WORKSPACE_ID, SONUM_MEMBER_ID, createId, objectPath, todayKey } from "@garden/domain";
import { captureUniversalItem, useGarden } from "@garden/shared-state";
import type { ContentFormat, GardenMember, ObjectRef, PartnerSharingLevel, RelationshipKind, RelationshipNoteKind, RelationshipRecord, RelationshipStage, TaskGardenItem, TaskGardenZone, TriageAction, WorkItem, WorkItemKind } from "@garden/types";
import { Button, Card, cn, Input, Label, Pill, SectionHeading, Textarea } from "@garden/ui";
import { ArrowRight, Building2, ExternalLink, GripVertical, MessageSquare, Plus, Trash2, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Link as RouterLink, Navigate, Route, Routes } from "react-router-dom";

const tabs = [
  { to: "/think", label: "Inbox", end: true },
  { to: "/think/content", label: "Content" },
  { to: "/think/relationships", label: "Relationships" },
  { to: "/think/task-garden", label: "Task Garden" },
  { to: "/think/clarity", label: "Clarity" },
];

const belongsToWorkspace = (workspaceId: string, item: { workspaceId?: string }) =>
  (item.workspaceId ?? DEFAULT_PRIVATE_WORKSPACE_ID) === workspaceId;

const clarityStages = [
  { id: "want", label: "Want", question: "What do you want?", guidance: "Name what you are reaching for, before justifying it." },
  { id: "values", label: "Values", question: "What's important to you?", guidance: "What should remain intact as you pursue it?" },
  { id: "strategy", label: "Strategy", question: "How are you getting it?", guidance: "Look honestly at choices, attention and energy." },
  { id: "blockers", label: "Blockers", question: "What is preventing you from having it?", guidance: "Name the constraint precisely." },
  { id: "evidence", label: "Evidence", question: "How will you know that you have it?", guidance: "Define visible signs of progress and enough." },
] as const;

export const WorkRoutes = () => {
  const { activeWorkspace, data } = useGarden();
  const inboxCount = data.workItems.filter((item) => item.triage !== "delete").length;
  return (
    <>
      <ModuleHeader
        title="Think"
        description={`Capture, clarify and shape ${activeWorkspace.name}: inbox, content, relationships, task garden and guided clarity.`}
        aside={<Pill tone={activeWorkspace.kind === "shared" ? "sage" : "stone"}>{activeWorkspace.kind === "shared" ? "shared garden" : `${inboxCount} active captures`}</Pill>}
      />
      <ModuleTabs tabs={tabs} />
      <Routes>
        <Route index element={<InboxPanel />} />
        <Route path="inbox" element={<Navigate replace to="/think" />} />
        <Route path="content" element={<ContentStudio />} />
        <Route path="relationships" element={<RelationshipsStudio />} />
        <Route path="task-garden" element={<TaskGarden />} />
        <Route path="clarity" element={<Clarity />} />
        <Route path="prioritize" element={<Navigate replace to="/think" />} />
        <Route path="bets" element={<Navigate replace to="/think" />} />
        <Route path="execute" element={<Navigate replace to="/think/task-garden" />} />
        <Route path="kanban" element={<Navigate replace to="/think/task-garden" />} />
        <Route path="projects" element={<Navigate replace to="/think" />} />
        <Route path="sprint" element={<Navigate replace to="/think/task-garden" />} />
      </Routes>
    </>
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

const Clarity = () => {
  const { data, update } = useGarden();
  const [stage, setStage] = useState(0);
  const [title, setTitle] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const prompt = clarityStages[stage];
  const complete = stage === clarityStages.length - 1;
  const report = useMemo(() => ({
    want: answers.want || "Not yet named.",
    blockers: answers.blockers || "Not yet named.",
    next: answers.evidence || "Choose one practical test.",
  }), [answers]);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_.78fr]">
      <Card className="p-6 sm:p-8">
        <div className="mb-8 flex flex-wrap gap-2">
          {clarityStages.map((item, index) => (
            <button
              key={item.id}
              onClick={() => index <= stage && setStage(index)}
              className={cn(
                "rounded-full px-3 py-2 text-xs font-medium",
                index === stage ? "bg-forest text-white" : index < stage ? "bg-sage/15 text-forest" : "bg-mist text-muted",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted">{prompt.label} · {String(stage + 1).padStart(2, "0")}</p>
        <h2 className="mt-4 font-serif text-4xl tracking-tight">{prompt.question}</h2>
        <p className="mt-3 text-sm leading-7 text-muted">{prompt.guidance}</p>
        {stage === 0 ? <Input className="mt-7" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Name this session" /> : null}
        <Textarea
          className="mt-4 min-h-52"
          value={answers[prompt.id] ?? ""}
          onChange={(event) => setAnswers({ ...answers, [prompt.id]: event.target.value })}
          placeholder="Write freely. Your response stays in this browser."
        />
        <div className="mt-5 flex justify-between">
          <Button variant="quiet" disabled={stage === 0} onClick={() => setStage((value) => Math.max(value - 1, 0))}>Back</Button>
          {!complete ? (
            <Button onClick={() => setStage((value) => Math.min(value + 1, clarityStages.length - 1))}>Continue <ArrowRight size={15} /></Button>
          ) : (
            <Button
              onClick={() => {
                update((current) => ({
                  ...current,
                  claritySessions: [
                    {
                      id: createId(),
                      title: title.trim() || "Clarity session",
                      createdAt: todayKey(),
                      answers: Object.fromEntries(clarityStages.map((item) => [item.question, answers[item.id] ?? ""])),
                    },
                    ...current.claritySessions,
                  ],
                }));
                setStage(0);
                setTitle("");
                setAnswers({});
              }}
            >
              Save report
            </Button>
          )}
        </div>
      </Card>
      <div className="space-y-4">
        <Card className="p-6">
          <SectionHeading title="Private report preview" supporting="A considered reading, not an answer imposed on you." />
          <Insight label="What you want" text={report.want} />
          <Insight label="Constraint" text={report.blockers} />
          <Insight label="Success signal" text={report.next} />
        </Card>
        {data.claritySessions.map((session) => (
          <Card key={session.id} className="p-5">
            <p className="text-xs text-muted">{session.createdAt}</p>
            <p className="mt-2 font-medium">{session.title}</p>
            <p className="mt-2 text-sm text-muted">{session.answers["What do you want?"]}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

const Insight = ({ label, text }: { label: string; text: string }) => (
  <div className="mb-4 rounded-xl bg-mist/55 p-4">
    <p className="text-xs uppercase tracking-[0.13em] text-muted">{label}</p>
    <p className="mt-2 text-sm leading-6">{text}</p>
  </div>
);

const contentFormats: ContentFormat[] = ["post", "essay", "thread", "video", "newsletter"];

const ContentStudio = () => {
  const { activeWorkspace, activeWorkspaceId, currentMemberId, data, update } = useGarden();
  const [draft, setDraft] = useState("");
  const [format, setFormat] = useState<ContentFormat>("post");
  const [tileDrafts, setTileDrafts] = useState<Record<string, { title: string; notes: string; format: ContentFormat }>>({});
  const contentItems = data.workItems.filter((item): item is WorkItem => belongsToWorkspace(activeWorkspaceId, item) && item.kind === "content" && item.triage !== "delete");
  const convertedSourceIds = new Set(data.objectRelations
    .filter((relation) => (relation.workspaceId ?? DEFAULT_PRIVATE_WORKSPACE_ID) === activeWorkspaceId && relation.label === "source-for" && relation.from.kind === "source")
    .map((relation) => relation.from.id));
  const sourceQueue = data.sources.filter((source) => belongsToWorkspace(activeWorkspaceId, source) && !convertedSourceIds.has(source.id)).slice(0, 4);

  const updateContent = (id: string, change: Partial<WorkItem>) =>
    update((current) => ({
      ...current,
      workItems: current.workItems.map((item) => item.id === id ? { ...item, ...change } : item),
    }));

  const draftForTile = (item: WorkItem) => tileDrafts[item.id] ?? {
    title: item.title,
    notes: item.hook ?? "",
    format: item.contentFormat ?? "post",
  };

  const updateTileDraft = (id: string, change: Partial<{ title: string; notes: string; format: ContentFormat }>, item: WorkItem) => {
    const current = draftForTile(item);
    setTileDrafts((drafts) => ({ ...drafts, [id]: { ...current, ...change } }));
  };

  const saveTile = (item: WorkItem) => {
    const tileDraft = draftForTile(item);
    updateContent(item.id, {
      title: tileDraft.title.trim() || item.title,
      hook: tileDraft.notes,
      contentFormat: tileDraft.format,
    });
    setTileDrafts((drafts) => {
      const next = { ...drafts };
      delete next[item.id];
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionHeading
          title="Content Ideas"
          supporting={`Simple idea tiles with notes directly underneath for ${activeWorkspace.name}.`}
        />
        <form
          className="grid gap-3 lg:grid-cols-[1fr_150px_auto]"
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
          <select aria-label="Content format" value={format} onChange={(event) => setFormat(event.target.value as ContentFormat)} className="h-11 rounded-xl border border-ink/8 bg-white px-3 text-sm">
            {contentFormats.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <Button type="submit"><Plus size={15} /> Add</Button>
        </form>
      </Card>

      {contentItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/10 bg-white/70 p-8 text-center text-sm text-muted">
          No content ideas yet. Add one above.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {contentItems.map((item) => {
            const tileDraft = draftForTile(item);
            const dirty = tileDraft.title !== item.title || tileDraft.notes !== (item.hook ?? "") || tileDraft.format !== (item.contentFormat ?? "post");
            return (
              <div key={item.id} className="rounded-2xl border border-ink/6 bg-white p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Label htmlFor={`content-title-${item.id}`}>Idea</Label>
                    <Input
                      id={`content-title-${item.id}`}
                      value={tileDraft.title}
                      onChange={(event) => updateTileDraft(item.id, { title: event.target.value }, item)}
                    />
                  </div>
                  <Button variant="quiet" type="button" aria-label={`Remove ${item.title}`} onClick={() => updateContent(item.id, { triage: "delete" })}>
                    <Trash2 size={15} />
                  </Button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <Label htmlFor={`content-format-${item.id}`}>Format</Label>
                    <select
                      id={`content-format-${item.id}`}
                      className="h-11 w-full rounded-xl border border-ink/8 bg-white px-3 text-sm"
                      value={tileDraft.format}
                      onChange={(event) => updateTileDraft(item.id, { format: event.target.value as ContentFormat }, item)}
                    >
                      {contentFormats.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </div>
                  <Pill tone={item.contentStage === "published" ? "sage" : "stone"}>{item.contentStage === "published" ? "published" : "idea"}</Pill>
                </div>
                <div className="mt-3">
                  <Label htmlFor={`content-notes-${item.id}`}>Notes</Label>
                  <Textarea
                    id={`content-notes-${item.id}`}
                    className="min-h-28 bg-mist/35"
                    value={tileDraft.notes}
                    onChange={(event) => updateTileDraft(item.id, { notes: event.target.value }, item)}
                    placeholder="Hooks, examples, source notes, structure or the first line..."
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant={dirty ? "primary" : "secondary"}
                    className="h-8 min-h-8 px-3 text-xs"
                    type="button"
                    disabled={!dirty}
                    onClick={() => saveTile(item)}
                  >
                    {dirty ? "Save changes" : "Saved"}
                  </Button>
                  <Button
                    variant={item.contentStage === "published" ? "secondary" : "quiet"}
                    className="h-8 min-h-8 px-3 text-xs"
                    type="button"
                    onClick={() => updateContent(item.id, { contentStage: item.contentStage === "published" ? "seed" : "published" })}
                  >
                    {item.contentStage === "published" ? "Published" : "Mark published"}
                  </Button>
                  <RouterLink
                    to={objectPath({ kind: "content", id: item.id })}
                    className="inline-flex min-h-8 items-center gap-1 rounded-full border border-ink/8 bg-white px-3 text-xs font-medium text-ink transition hover:bg-mist"
                  >
                    <MessageSquare size={14} /> Open
                  </RouterLink>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sourceQueue.length ? (
        <section className="space-y-3">
          <SectionHeading
            title="Source Sparks"
            supporting="Captured links that may become a tile."
          />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {sourceQueue.map((source) => (
              <RouterLink key={source.id} to={objectPath({ kind: "source", id: source.id })} className="rounded-2xl bg-white p-4 shadow-card transition hover:bg-mist">
                <Pill tone={source.sourceType === "youtube" ? "clay" : "stone"}>{source.sourceType}</Pill>
                <p className="mt-3 text-sm font-medium leading-6">{source.title}</p>
                <p className="mt-2 truncate text-xs text-muted">{source.publisher ?? source.url}</p>
              </RouterLink>
            ))}
          </div>
        </section>
      ) : null}
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
  const [assignment, setAssignment] = useState("both");
  const [filter, setFilter] = useState("all");
  const [dragging, setDragging] = useState<string | null>(null);
  const coupleMemberIds = [...new Set([
    data.profile.id,
    SONUM_MEMBER_ID,
    ...(data.workspaces.find((workspace) => workspace.id === DEFAULT_SHARED_WORKSPACE_ID)?.memberIds ?? []),
  ])];
  const members = coupleMemberIds
    .map((memberId) => data.members.find((member) => member.id === memberId))
    .filter((member): member is GardenMember => Boolean(member));
  const memberIds = members.map((member) => member.id);
  const sharedTaskItems = data.taskGardenItems.filter((item) =>
    item.visibility === "shared" ||
    item.workspaceId === DEFAULT_SHARED_WORKSPACE_ID ||
    item.workspaceId === DEFAULT_PRIVATE_WORKSPACE_ID
  );
  const items = sharedTaskItems.filter((item) => {
    const assigneeIds = item.assigneeIds ?? (item.ownerId ? [item.ownerId] : []);
    if (filter === "all") return true;
    if (filter === "unassigned") return assigneeIds.length === 0;
    if (filter === "both") return memberIds.length > 0 && memberIds.every((memberId) => assigneeIds.includes(memberId));
    return assigneeIds.includes(filter);
  });

  const memberName = (memberId?: string) => members.find((member) => member?.id === memberId)?.name ?? "Unknown";
  const assignmentIds = (value: string) => {
    if (value === "both") return memberIds;
    if (value === "unassigned") return [];
    return [value];
  };
  const assignmentLabel = (item: TaskGardenItem) => {
    const assigneeIds = item.assigneeIds ?? (item.ownerId ? [item.ownerId] : []);
    if (assigneeIds.length === 0) return "Unassigned";
    if (memberIds.length > 0 && memberIds.every((memberId) => assigneeIds.includes(memberId))) return "Both";
    return assigneeIds.map(memberName).join(", ");
  };
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

  const updateAssignment = (id: string, value: string) => {
    const assigneeIds = assignmentIds(value);
    updateItem(id, {
      assigneeIds,
      ownerId: assigneeIds.length === 1 ? assigneeIds[0] : undefined,
      visibility: "shared",
    });
  };

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
          supporting="One couple-visible board. Either of you can create, assign and move tasks without switching gardens."
        />
        <form
          className="grid gap-3 lg:grid-cols-[1fr_180px_190px_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim()) return;
            const assigneeIds = assignmentIds(assignment);
            update((current) => ({
              ...current,
              taskGardenItems: [
                {
                  id: createId(),
                  workspaceId: DEFAULT_PRIVATE_WORKSPACE_ID,
                  visibility: "shared",
                  zone,
                  title: title.trim(),
                  ownerId: assigneeIds.length === 1 ? assigneeIds[0] : undefined,
                  assigneeIds,
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
          <select aria-label="Task zone" value={zone} onChange={(event) => setZone(event.target.value as TaskGardenZone)} className="h-11 rounded-xl border border-ink/8 bg-white px-3 text-sm">
            {taskGardenZones.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <select aria-label="Task assignee" value={assignment} onChange={(event) => setAssignment(event.target.value)} className="h-11 rounded-xl border border-ink/8 bg-white px-3 text-sm">
            <option value="both">Assign: both</option>
            <option value="unassigned">Assign: unassigned</option>
            {members.map((member) => <option key={member.id} value={member.id}>Assign: {member.name}</option>)}
          </select>
          <Button type="submit"><Plus size={15} /> Add</Button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setFilter("all")} className={cn("rounded-full px-3 py-1.5 text-xs font-medium", filter === "all" ? "bg-forest text-white" : "bg-mist text-muted hover:bg-sage/15 hover:text-forest")}>All</button>
          <button type="button" onClick={() => setFilter(data.profile.id)} className={cn("rounded-full px-3 py-1.5 text-xs font-medium", filter === data.profile.id ? "bg-forest text-white" : "bg-mist text-muted hover:bg-sage/15 hover:text-forest")}>Mine</button>
          <button type="button" onClick={() => setFilter(SONUM_MEMBER_ID)} className={cn("rounded-full px-3 py-1.5 text-xs font-medium", filter === SONUM_MEMBER_ID ? "bg-forest text-white" : "bg-mist text-muted hover:bg-sage/15 hover:text-forest")}>Sonum</button>
          <button type="button" onClick={() => setFilter("both")} className={cn("rounded-full px-3 py-1.5 text-xs font-medium", filter === "both" ? "bg-forest text-white" : "bg-mist text-muted hover:bg-sage/15 hover:text-forest")}>Both</button>
          <button type="button" onClick={() => setFilter("unassigned")} className={cn("rounded-full px-3 py-1.5 text-xs font-medium", filter === "unassigned" ? "bg-forest text-white" : "bg-mist text-muted hover:bg-sage/15 hover:text-forest")}>Unassigned</button>
        </div>
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
                            Assigned to {assignmentLabel(item)} · Added by {memberName(item.createdBy)}
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
                          aria-label={`Assign ${item.title}`}
                          value={memberIds.length > 0 && memberIds.every((memberId) => (item.assigneeIds ?? (item.ownerId ? [item.ownerId] : [])).includes(memberId))
                            ? "both"
                            : (item.assigneeIds ?? (item.ownerId ? [item.ownerId] : [])).length === 0
                              ? "unassigned"
                              : (item.assigneeIds ?? (item.ownerId ? [item.ownerId] : []))[0]}
                          onChange={(event) => updateAssignment(item.id, event.target.value)}
                          className="h-9 rounded-xl border border-ink/8 bg-white px-3 text-xs"
                        >
                          <option value="both">Both</option>
                          <option value="unassigned">Unassigned</option>
                          {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                        </select>
                        <select
                          aria-label={`Move ${item.title}`}
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

      <Card className="p-6">
        <SectionHeading
          title="Couple Sharing"
          supporting="Choose what can appear in a partner's Garden. Task Garden is shared by default; more private surfaces can stay summary-only or private."
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.partnerSharingSettings.map((setting) => (
            <div key={setting.id} className="rounded-2xl bg-mist/45 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{setting.label}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{setting.description}</p>
                </div>
                <Pill tone={setting.level === "shared" ? "sage" : setting.level === "summary" ? "stone" : "clay"}>{setting.level}</Pill>
              </div>
              <select
                aria-label={`${setting.label} sharing level`}
                value={setting.level}
                onChange={(event) => update((current) => ({
                  ...current,
                  partnerSharingSettings: current.partnerSharingSettings.map((item) =>
                    item.id === setting.id ? { ...item, level: event.target.value as PartnerSharingLevel } : item,
                  ),
                }))}
                className="mt-4 h-10 w-full rounded-xl border border-ink/8 bg-white px-3 text-sm"
              >
                <option value="private">Private</option>
                <option value="summary">Summary only</option>
                <option value="shared">Shared</option>
              </select>
            </div>
          ))}
        </div>
      </Card>
	    </div>
	  );
	};
