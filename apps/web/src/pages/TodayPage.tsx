import { buildTodayIntelligence } from "@garden/ai";
import { capacityForTier, createId, getPlan, orderedTasks, tierLabel, todayKey } from "@garden/domain";
import { getTodaySummary as getEatSummary } from "@garden/module-eat/summary";
import { getTodaySummary as getThinkSummary } from "@garden/module-think/summary";
import { getTodaySummary as getTrainSummary } from "@garden/module-train/summary";
import { getTodaySummary as getWorkSummary } from "@garden/module-work/summary";
import { changePlan, deferTask, useGarden } from "@garden/shared-state";
import type { DailyTask, TaskTier } from "@garden/types";
import { Button, Card, cn, Input, Pill, SectionHeading } from "@garden/ui";
import { ArrowRight, CalendarDays, Check, GripVertical, Plus, RotateCcw } from "lucide-react";
import { type DragEvent, type ReactNode, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const formatDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export const TodayPage = () => {
  const { data, userContext, update } = useGarden();
  const date = todayKey();
  const plan = getPlan(data, date);
  const train = getTrainSummary(data);
  const think = getThinkSummary(data);
  const work = getWorkSummary(data);
  const eat = getEatSummary(data);
  const briefing = buildTodayIntelligence({ context: userContext, summaries: [train, think, work, eat] });
  const [addingTier, setAddingTier] = useState<TaskTier | null>(null);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [dragged, setDragged] = useState<string | null>(null);
  const completedCount = plan.tasks.filter((task) => task.status === "completed").length;

  const attentionCount = useMemo(
    () => work.blockers,
    [work.blockers],
  );

  const addTask = (tier: TaskTier) => {
    if (!draft.trim()) return;
    update((current) =>
      changePlan(current, date, (currentPlan) => ({
        ...currentPlan,
        tasks: [
          ...currentPlan.tasks,
          {
            id: createId(),
            title: draft.trim(),
            tier,
            order: currentPlan.tasks.filter((task) => task.tier === tier).length,
            status: "active",
            scheduledDate: date,
          },
        ],
      })),
    );
    setDraft("");
    setAddingTier(null);
  };

  const reorder = (target: DailyTask) => {
    if (!dragged || dragged === target.id) return;
    update((current) =>
      changePlan(current, date, (currentPlan) => {
        const source = currentPlan.tasks.find((item) => item.id === dragged);
        if (!source || source.tier !== target.tier) return currentPlan;
        const group = orderedTasks(currentPlan.tasks, target.tier).filter((item) => item.id !== source.id);
        group.splice(group.findIndex((item) => item.id === target.id), 0, source);
        const orders = new Map(group.map((item, index) => [item.id, index]));
        return {
          ...currentPlan,
          tasks: currentPlan.tasks.map((item) => ({ ...item, order: orders.get(item.id) ?? item.order })),
        };
      }),
    );
    setDragged(null);
  };

  return (
    <>
      <section className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-serif text-[2.55rem] leading-[1.1] tracking-[-0.045em] text-ink sm:text-[3.25rem]">
            {greeting()}, {data.profile.name}.
          </h1>
          <p className="mt-3 text-base text-muted">{formatDate(date)}</p>
        </div>
        <div className="text-sm text-muted">
          <span className="font-medium text-forest">{completedCount}</span> of {plan.tasks.length} tended today
        </div>
      </section>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(500px,1.15fr)_minmax(320px,.85fr)]">
        <div className="space-y-6">
          {(["big", "medium", "small"] as TaskTier[]).map((tier) => {
            const tasks = orderedTasks(plan.tasks, tier);
            return (
              <Card key={tier} className={cn("p-5 sm:p-7", tier === "big" && "border-forest/10")}>
                <SectionHeading
                  title={tierLabel[tier]}
                  supporting={tier === "big" ? "Protect this before the day gets noisy." : undefined}
                  action={
                    tasks.length < capacityForTier[tier] ? (
                      <Button variant="quiet" className="min-h-9 px-2" onClick={() => setAddingTier(tier)}>
                        <Plus size={16} />
                        Add
                      </Button>
                    ) : undefined
                  }
                />
                <div className="space-y-2.5">
                  {tasks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-ink/10 bg-mist/30 p-5 text-sm leading-6 text-muted">
                      {tier === "big"
                        ? "Start by naming one meaningful thing. This is the work the day protects."
                        : tier === "medium"
                          ? "Add supporting moves only if they make the day clearer."
                          : "Small tasks belong here when they reduce friction, not when they create noise."}
                    </div>
                  ) : null}
                  {tasks.map((task, index) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDragged(task.id)}
                      onDragOver={(event: DragEvent) => event.preventDefault()}
                      onDrop={() => reorder(task)}
                      className={cn(
                        "group flex items-center gap-2 rounded-2xl border px-2.5 py-2 transition",
                        tier === "big" ? "border-forest/8 bg-mist/45 py-4" : "border-transparent hover:border-ink/5 hover:bg-mist/35",
                        task.status === "completed" && "opacity-55",
                      )}
                    >
                      <GripVertical className="shrink-0 text-muted/45" size={15} />
                      <button
                        aria-label={`Complete ${task.title}`}
                        onClick={() =>
                          update((current) =>
                            changePlan(current, date, (currentPlan) => ({
                              ...currentPlan,
                              tasks: currentPlan.tasks.map((item) =>
                                item.id === task.id
                                  ? { ...item, status: item.status === "completed" ? "active" : "completed" }
                                  : item,
                              ),
                            })),
                          )
                        }
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full border transition",
                          task.status === "completed" ? "border-forest bg-forest text-white" : "border-sage/55 hover:border-forest",
                        )}
                      >
                        {task.status === "completed" ? <Check size={14} /> : null}
                      </button>
                      {editing === task.id ? (
                        <Input
                          autoFocus
                          defaultValue={task.title}
                          onBlur={(event) => {
                            const title = event.target.value.trim();
                            if (title) {
                              update((current) =>
                                changePlan(current, date, (currentPlan) => ({
                                  ...currentPlan,
                                  tasks: currentPlan.tasks.map((item) => (item.id === task.id ? { ...item, title } : item)),
                                })),
                              );
                            }
                            setEditing(null);
                          }}
                          onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
                          className="h-9"
                        />
                      ) : (
                        <button
                          onDoubleClick={() => setEditing(task.id)}
                          className={cn(
                            "min-w-0 flex-1 text-left text-sm text-ink sm:text-[15px]",
                            tier === "big" && "text-base font-medium",
                            task.status === "completed" && "line-through",
                          )}
                        >
                          {index === 0 && tier === "medium" ? <span className="mr-2 text-xs text-muted">NEXT</span> : null}
                          {task.title}
                        </button>
                      )}
                      {task.estimateMinutes ? <span className="hidden text-xs text-muted sm:inline">{task.estimateMinutes}m</span> : null}
                      <Button
                        variant="quiet"
                        className="h-8 min-h-8 px-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        title="Move to tomorrow"
                        onClick={() => update((current) => deferTask(current, date, task.id))}
                      >
                        <RotateCcw size={14} />
                      </Button>
                    </div>
                  ))}
                  {addingTier === tier ? (
                    <form
                      className="flex gap-2 pt-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        addTask(tier);
                      }}
                    >
                      <Input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Add a clear next action" />
                      <Button type="submit">Add</Button>
                    </form>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
        <div className="space-y-5">
          <Card className="!border-sage/25 !bg-[#f1f2eb] p-6 shadow-none">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-forest/70">Daily briefing</p>
            <p className="mt-4 font-serif text-2xl leading-8 tracking-tight text-ink">{briefing.summary}</p>
            <p className="mt-4 text-sm leading-6 text-muted">{briefing.recommendations[0]}</p>
            {briefing.warnings[0] ? <p className="mt-3 text-sm leading-6 text-clay">{briefing.warnings[0]}</p> : null}
            <div className="mt-6 border-t border-forest/10 pt-4 text-sm text-forest">{briefing.suggestedNextAction}</div>
          </Card>
          <Card className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-1 text-sage" size={19} />
              <div>
                <p className="text-sm text-muted">Calendar reality</p>
                <p className="mt-2 text-lg font-medium tracking-tight">You realistically have</p>
                <p className="font-serif text-[2.25rem] tracking-tight text-forest">{plan.focusHours} focused hours today.</p>
              </div>
            </div>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <SupportCard title="Train" href="/train">
              <p className="font-medium">{train.workout}</p>
              <p className="mt-2 text-sm text-muted">{train.weeklyHardSets} hard sets · {train.intensity} intensity</p>
              <p className="mt-3 text-sm leading-6 text-muted">{train.recovery}</p>
            </SupportCard>
            <SupportCard title="Think" href="/think">
              <p className="text-sm leading-6 text-muted">{think.prompt}</p>
              <p className="mt-3 text-sm font-medium">{think.insight}</p>
            </SupportCard>
            <SupportCard title="Work" href="/work">
              <p className="font-medium">{work.priority}</p>
              <p className="mt-2 text-sm text-muted">{work.activeBets} strategic bets · {work.sprintLoad} sprint</p>
              <Pill tone="clay">{attentionCount} need attention</Pill>
            </SupportCard>
            <SupportCard title="Eat" href="/eat">
              <p className="font-medium">{eat.proteinLogged} / {eat.proteinTarget}g protein</p>
              <p className="mt-2 text-sm leading-6 text-muted">{plan.mealSuggestion}</p>
              <Pill tone={eat.hydrationComplete ? "sage" : "stone"}>
                {eat.hydrationComplete ? "Hydrated" : "Hydration pending"}
              </Pill>
            </SupportCard>
          </div>
          <Link
            to="/review"
            className="flex items-center justify-between rounded-[1.55rem] bg-clay px-6 py-5 text-white transition hover:bg-clay/90"
          >
            <div>
              <p className="font-medium">Evening review</p>
              <p className="mt-1 text-sm text-white/72">Close the day in two minutes.</p>
            </div>
            <ArrowRight size={19} />
          </Link>
        </div>
      </div>
    </>
  );
};

const SupportCard = ({ title, href, children }: { title: string; href: string; children: ReactNode }) => (
  <Link to={href}>
    <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:border-sage/20">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{title}</p>
        <ArrowRight size={15} className="text-sage" />
      </div>
      <div className="space-y-3">{children}</div>
    </Card>
  </Link>
);
