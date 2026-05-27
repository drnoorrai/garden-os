import { categorizeBet, createId, todayKey } from "@garden/domain";
import type { Bet, KanbanColumn, MoscowPriority, TriageAction, WorkItemKind } from "@garden/types";
import { Button, Card, cn, Input, Label, Pill, SectionHeading, Textarea } from "@garden/ui";
import { ArrowRight, GripVertical, Inbox, LayoutGrid, Lightbulb, PanelsTopLeft, Plus } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useGarden } from "../lib/garden-context";

const navigation = [
  { path: "/work", label: "Overview", icon: PanelsTopLeft },
  { path: "/work/inbox", label: "Inbox", icon: Inbox },
  { path: "/work/bets", label: "Strategic bets", icon: Lightbulb },
  { path: "/work/kanban", label: "Kanban", icon: LayoutGrid },
];

export const WorkPage = () => {
  const location = useLocation();
  const active = location.pathname;

  return (
    <>
      <header className="mb-8">
        <h1 className="font-serif text-4xl tracking-[-0.045em] sm:text-5xl">Work</h1>
        <p className="mt-3 max-w-xl text-muted">Capture freely. Commit deliberately. Keep projects smaller than your life.</p>
      </header>
      <nav className="mb-8 flex gap-2 overflow-x-auto pb-1">
        {navigation.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-muted",
              active === path && "bg-white text-forest shadow-card",
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
      {active === "/work/inbox" ? <InboxPanel /> : null}
      {active === "/work/bets" ? <BetsPanel /> : null}
      {active === "/work/kanban" ? <KanbanPanel /> : null}
      {active === "/work" ? <WorkOverview /> : null}
    </>
  );
};

const WorkOverview = () => {
  const { data, update } = useGarden();
  const [scope, setScope] = useState("");
  const [priority, setPriority] = useState<MoscowPriority>("must");
  const project = data.projects[0];
  if (!project) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[.92fr_1.08fr]">
      <Card className="p-6">
        <SectionHeading title="Current top project" supporting={project?.outcome} />
        <p className="font-serif text-3xl tracking-tight">{project?.name}</p>
        <div className="mt-7 space-y-3">
          {data.bets.filter((bet) => bet.status === "active").map((bet) => (
            <div key={bet.id} className="rounded-2xl bg-mist/55 p-4">
              <p className="font-medium">{bet.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{bet.notes}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-6">
        <SectionHeading title="MoSCoW scope" supporting="A boundary is part of the product." />
        <div className="grid gap-3 sm:grid-cols-2">
          {(["must", "should", "could", "wont"] as MoscowPriority[]).map((group) => (
            <div key={group} className="rounded-2xl border border-ink/5 p-4">
              <Pill tone={group === "must" ? "sage" : group === "wont" ? "clay" : "stone"}>
                {group === "wont" ? "Won't have" : `${group[0].toUpperCase()}${group.slice(1)} have`}
              </Pill>
              <div className="mt-3 space-y-2 text-sm">
                {project?.scope.filter((item) => item.priority === group).map((item) => <p key={item.id}>{item.label}</p>)}
              </div>
            </div>
          ))}
        </div>
        <form
          className="mt-5 flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            if (!scope.trim()) return;
            update((current) => ({
              ...current,
              projects: current.projects.map((item) =>
                item.id === project.id
                  ? { ...item, scope: [...item.scope, { id: createId(), label: scope.trim(), priority }] }
                  : item,
              ),
            }));
            setScope("");
          }}
        >
          <Input value={scope} onChange={(event) => setScope(event.target.value)} placeholder="Add a scope decision" />
          <select value={priority} onChange={(event) => setPriority(event.target.value as MoscowPriority)} className="rounded-xl border border-ink/8 bg-white px-3 text-sm">
            <option value="must">Must</option>
            <option value="should">Should</option>
            <option value="could">Could</option>
            <option value="wont">Won't</option>
          </select>
          <Button type="submit">Add</Button>
        </form>
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
        <SectionHeading title="Capture" supporting="Get it out of your head first." />
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim()) return;
            update((current) => ({
              ...current,
              workItems: [{ id: createId(), title: title.trim(), kind, triage: "untriaged", createdAt: todayKey() }, ...current.workItems],
            }));
            setTitle("");
          }}
        >
          <div>
            <Label htmlFor="capture-title">What has your attention?</Label>
            <Textarea id="capture-title" rows={3} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Task, idea, thought or obligation..." />
          </div>
          <div>
            <Label htmlFor="capture-kind">Type</Label>
            <select id="capture-kind" value={kind} onChange={(event) => setKind(event.target.value as WorkItemKind)} className="h-11 w-full rounded-xl border border-ink/8 bg-white px-3 text-sm">
              <option>task</option>
              <option>idea</option>
              <option>thought</option>
              <option>obligation</option>
            </select>
          </div>
          <Button type="submit" className="w-full">Capture</Button>
        </form>
        <p className="mt-6 rounded-2xl bg-mist/60 p-4 text-sm text-muted">If it takes less than 2 minutes, do it now.</p>
      </Card>
      <Card className="p-6">
        <SectionHeading title="Inbox" supporting={`${data.workItems.filter((item) => item.triage !== "delete").length} items waiting for a decision`} />
        <div className="space-y-3">
          {data.workItems.filter((item) => item.triage !== "delete").map((item) => (
            <div key={item.id} className="rounded-2xl border border-ink/5 p-4">
              <div className="flex justify-between gap-3">
                <p className="font-medium">{item.title}</p>
                <Pill tone="stone">{item.kind}</Pill>
              </div>
              <div className="mt-4 flex flex-wrap gap-1">
                {actions.map((action) => (
                  <Button
                    key={action}
                    variant={item.triage === action ? "secondary" : action === "delete" ? "danger" : "quiet"}
                    className="h-8 min-h-8 px-3 text-xs"
                    onClick={() =>
                      update((current) => ({
                        ...current,
                        workItems: current.workItems.map((value) => value.id === item.id ? { ...value, triage: action } : value),
                      }))
                    }
                  >
                    {action.replace("-", " ")}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const BetsPanel = () => {
  const { data, update } = useGarden();
  const [draft, setDraft] = useState<Omit<Bet, "id">>({ title: "", notes: "", impact: 3, effort: 2, status: "considering" });
  const quadrants = ["Quick Wins", "Major Projects", "Fill-ins", "Hard Slogs"];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionHeading title="Strategic bet" supporting="Choose for expected value, not novelty." />
        <form
          className="grid gap-3 md:grid-cols-[1fr_1fr_92px_92px_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.title.trim()) return;
            update((current) => ({ ...current, bets: [...current.bets, { ...draft, id: createId() }] }));
            setDraft({ title: "", notes: "", impact: 3, effort: 2, status: "considering" });
          }}
        >
          <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Name the bet" />
          <Input value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Why might this matter?" />
          <Input type="number" min={1} max={5} value={draft.impact} onChange={(event) => setDraft({ ...draft, impact: Number(event.target.value) })} aria-label="Impact" />
          <Input type="number" min={1} max={5} value={draft.effort} onChange={(event) => setDraft({ ...draft, effort: Number(event.target.value) })} aria-label="Effort" />
          <Button type="submit"><Plus size={15} /> Add</Button>
        </form>
        <p className="mt-3 text-xs text-muted">Impact and effort use a 1-5 scale.</p>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {quadrants.map((quadrant) => (
          <Card key={quadrant} className="min-h-48 p-5">
            <SectionHeading title={quadrant} />
            <div className="space-y-3">
              {data.bets.filter((bet) => categorizeBet(bet) === quadrant).map((bet) => (
                <div key={bet.id} className="rounded-2xl bg-mist/55 p-4">
                  <div className="flex justify-between gap-2">
                    <p className="font-medium">{bet.title}</p>
                    <Pill tone={bet.status === "active" ? "sage" : "stone"}>{bet.status}</Pill>
                  </div>
                  <p className="mt-2 text-sm text-muted">{bet.notes}</p>
                  <p className="mt-3 text-xs text-muted">Impact {bet.impact} · Effort {bet.effort}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const columns: Array<{ id: KanbanColumn; label: string }> = [
  { id: "backlog", label: "Backlog" },
  { id: "sprint", label: "This Sprint" },
  { id: "today", label: "Today" },
  { id: "blocked", label: "Blocked" },
  { id: "done", label: "Done" },
];

const KanbanPanel = () => {
  const { data, update } = useGarden();
  const [dragging, setDragging] = useState<string | null>(null);
  const [title, setTitle] = useState("");

  return (
    <div className="space-y-5">
      <form
        className="flex max-w-xl gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          update((current) => ({ ...current, kanbanCards: [...current.kanbanCards, { id: createId(), title: title.trim(), column: "backlog" }] }));
          setTitle("");
        }}
      >
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Add card to backlog" />
        <Button type="submit">Add</Button>
      </form>
      <div className="grid gap-3 md:grid-cols-5">
        {columns.map((column) => (
          <Card
            key={column.id}
            className="min-h-64 p-3"
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (!dragging) return;
              update((current) => ({
                ...current,
                kanbanCards: current.kanbanCards.map((card) => card.id === dragging ? { ...card, column: column.id } : card),
              }));
              setDragging(null);
            }}
          >
            <p className="mb-3 px-2 py-1 text-sm font-medium text-muted">{column.label}</p>
            <div className="space-y-2">
              {data.kanbanCards.filter((card) => card.column === column.id).map((card) => (
                <div draggable onDragStart={() => setDragging(card.id)} key={card.id} className="flex gap-2 rounded-xl border border-ink/5 bg-white p-3 text-sm shadow-sm">
                  <GripVertical size={14} className="mt-0.5 shrink-0 text-muted" />
                  {card.title}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <Link className="inline-flex items-center gap-2 text-sm text-forest" to="/today">Return to today <ArrowRight size={14} /></Link>
    </div>
  );
};
