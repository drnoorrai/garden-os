import { ModuleHeader, ModuleTabs, StatCard } from "@garden/design-system";
import { createId, todayKey } from "@garden/domain";
import { useGarden } from "@garden/shared-state";
import type { Bet, BetConviction, BetStage, ContentFormat, ContentStage, KanbanColumn, MoscowPriority, TriageAction, WorkItemKind } from "@garden/types";
import { Button, Card, Input, Label, Pill, SectionHeading, Textarea } from "@garden/ui";
import { GripVertical, Plus } from "lucide-react";
import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { classifyBet, getTodaySummary } from "./lib";

export { getTodaySummary } from "./lib";

const tabs = [
  { to: "/work", label: "Overview", end: true },
  { to: "/work/inbox", label: "Inbox" },
  { to: "/work/content", label: "Content" },
  { to: "/work/prioritize", label: "Prioritize" },
  { to: "/work/execute", label: "Execute" },
  { to: "/work/projects", label: "Projects" },
];

export const WorkRoutes = () => {
  const { data } = useGarden();
  const summary = getTodaySummary(data);
  return (
    <>
      <ModuleHeader title="Work" description="Strategy becomes execution here. Capture, choose a bet, then move only committed work forward." aside={<Pill tone={summary.sprintLoad === "overloaded" ? "clay" : "sage"}>{summary.sprintLoad} sprint</Pill>} />
      <ModuleTabs tabs={tabs} />
      <Routes>
        <Route index element={<Overview />} />
        <Route path="inbox" element={<InboxPanel />} />
        <Route path="content" element={<ContentStudio />} />
        <Route path="prioritize" element={<Prioritize />} />
        <Route path="bets" element={<Navigate replace to="/work/prioritize" />} />
        <Route path="execute" element={<Execute />} />
        <Route path="kanban" element={<Navigate replace to="/work/execute" />} />
        <Route path="projects" element={<Projects />} />
        <Route path="sprint" element={<Navigate replace to="/work/execute" />} />
      </Routes>
    </>
  );
};

const Overview = () => {
  const { data } = useGarden();
  const summary = getTodaySummary(data);
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Priority" value={summary.priority} />
        <StatCard label="Active bets" value={summary.activeBets} supporting="Strategic commitments" />
        <StatCard label="Blockers" value={summary.blockers} supporting="Needs attention before capacity grows" />
      </div>
      <Card className="p-6">
        <SectionHeading title="Current project" supporting={data.projects[0]?.outcome} />
        <p className="font-serif text-3xl tracking-tight">{data.projects[0]?.name}</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {data.bets.filter((bet) => bet.status === "active").map((bet) => (
            <div key={bet.id} className="rounded-2xl bg-mist/50 p-4">
              <Pill>{classifyBet(bet)}</Pill><p className="mt-3 font-medium">{bet.title}</p><p className="mt-2 text-sm text-muted">{bet.notes}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const InboxPanel = () => {
  const { data, update } = useGarden();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<WorkItemKind>("task");
  const actions: TriageAction[] = ["do-now", "defer", "delegate", "delete"];
  return (
    <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <Card className="p-6">
        <SectionHeading title="GTD capture" supporting="Get it out of your head; decide later." />
        <form className="space-y-4" onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          update((current) => ({
            ...current,
            workItems: [
              {
                id: createId(),
                createdAt: todayKey(),
                title: title.trim(),
                kind,
                triage: "untriaged",
                ...(kind === "content" ? { contentStage: "seed" as const, contentFormat: "post" as const } : {}),
              },
              ...current.workItems,
            ],
          }));
          setTitle("");
        }}>
          <div><Label htmlFor="capture">What has your attention?</Label><Textarea id="capture" rows={4} value={title} onChange={(event) => setTitle(event.target.value)} /></div>
          <select value={kind} onChange={(event) => setKind(event.target.value as WorkItemKind)} className="h-11 w-full rounded-xl border border-ink/8 bg-white px-3 text-sm"><option value="task">Task</option><option value="idea">Idea</option><option value="thought">Thought</option><option value="obligation">Obligation</option><option value="content">Content</option></select>
          <Button type="submit" className="w-full">Capture</Button>
        </form>
        <p className="mt-5 rounded-xl bg-mist/55 p-4 text-sm text-muted">If it takes less than 2 minutes, do it now.</p>
      </Card>
      <Card className="p-6">
        <SectionHeading title="Inbox" />
        <div className="space-y-3">{data.workItems.filter((item) => item.triage !== "delete").map((item) => (
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
  const { data, update } = useGarden();
  const [draft, setDraft] = useState("");
  const [audience, setAudience] = useState("Healthtech founders");
  const [format, setFormat] = useState<ContentFormat>("post");
  const contentItems = data.workItems.filter((item) => item.kind === "content" && item.triage !== "delete");

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
          supporting="Turn captured thoughts into useful founder content without mixing them into execution work."
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
                        <p className="text-sm font-medium leading-6">{item.title}</p>
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

const Prioritize = () => {
  const { data, update } = useGarden();
  const [draft, setDraft] = useState({ title: "", notes: "", why: "", impact: 3, effort: 2, conviction: "medium" as BetConviction, stage: "triage" as BetStage });
  const quadrants = ["Quick wins", "Major projects", "Fill-ins", "Hard slogs"];
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionHeading title="Strategic prioritization" supporting="Rai Bets: outcomes and rationale before tasks." />
        <form className="grid gap-3 lg:grid-cols-[1fr_1fr_82px_82px_auto]" onSubmit={(event) => {
          event.preventDefault(); if (!draft.title.trim()) return;
          const bet: Bet = { id: createId(), title: draft.title.trim(), notes: draft.notes, why: draft.why, impact: draft.impact, effort: draft.effort, conviction: draft.conviction, stage: draft.stage, status: "active" };
          update((current) => ({ ...current, bets: [...current.bets, bet] }));
          setDraft({ title: "", notes: "", why: "", impact: 3, effort: 2, conviction: "medium", stage: "triage" });
        }}>
          <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="The bet" />
          <Input value={draft.why} onChange={(event) => setDraft({ ...draft, why: event.target.value, notes: event.target.value })} placeholder="What does this unlock?" />
          <Input type="number" min={1} max={5} value={draft.impact} onChange={(event) => setDraft({ ...draft, impact: Number(event.target.value) })} aria-label="Impact" />
          <Input type="number" min={1} max={5} value={draft.effort} onChange={(event) => setDraft({ ...draft, effort: Number(event.target.value) })} aria-label="Effort" />
          <Button type="submit"><Plus size={15} /> Add</Button>
        </form>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">{quadrants.map((quadrant) => (
        <Card key={quadrant} className="min-h-44 p-5"><SectionHeading title={quadrant} />
          <div className="space-y-3">{data.bets.filter((bet) => classifyBet(bet) === quadrant).map((bet) => (
            <div key={bet.id} className="rounded-xl bg-mist/55 p-4"><div className="flex justify-between"><p className="font-medium">{bet.title}</p><Pill>{bet.stage ?? bet.status}</Pill></div><p className="mt-2 text-sm text-muted">{bet.why ?? bet.notes}</p></div>
          ))}</div>
        </Card>
      ))}</div>
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
      <Card className="p-5"><SectionHeading title="Task Garden execution" supporting="Only prioritized work should enter the board." /><form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); if (!title.trim()) return; update((current) => ({ ...current, kanbanCards: [...current.kanbanCards, { id: createId(), title: title.trim(), column: "backlog" }] })); setTitle(""); }}><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Add an executable next action" /><Button type="submit">Add</Button></form></Card>
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
  const project = data.projects[0];
  if (!project) return null;
  return (
    <Card className="p-6"><SectionHeading title={project.name} supporting={project.outcome} /><div className="grid gap-3 sm:grid-cols-4">{(["must", "should", "could", "wont"] as MoscowPriority[]).map((value) => <div key={value} className="rounded-xl bg-mist/45 p-4"><Pill tone={value === "must" ? "sage" : value === "wont" ? "clay" : "stone"}>{value === "wont" ? "Won't" : value}</Pill>{project.scope.filter((item) => item.priority === value).map((item) => <p className="mt-3 text-sm" key={item.id}>{item.label}</p>)}</div>)}</div><form className="mt-6 flex gap-2" onSubmit={(event) => { event.preventDefault(); if (!scope.trim()) return; update((current) => ({ ...current, projects: current.projects.map((item) => item.id === project.id ? { ...item, scope: [...item.scope, { id: createId(), label: scope.trim(), priority }] } : item) })); setScope(""); }}><Input value={scope} onChange={(event) => setScope(event.target.value)} placeholder="Add scope decision" /><select value={priority} onChange={(event) => setPriority(event.target.value as MoscowPriority)} className="rounded-xl border border-ink/8 bg-white px-3 text-sm"><option value="must">Must</option><option value="should">Should</option><option value="could">Could</option><option value="wont">Won't</option></select><Button type="submit">Add</Button></form></Card>
  );
};
