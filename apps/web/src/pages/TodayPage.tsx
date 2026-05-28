import { buildTodayIntelligence } from "@garden/ai";
import {
  capacityForTier,
  createId,
  getPlan,
  minuteLabel,
  minuteToTimeValue,
  orderedTasks,
  parseTimeValue,
  tendingStreak,
  tierLabel,
  todayKey,
} from "@garden/domain";
import { getTodaySummary as getEatSummary } from "@garden/module-eat/summary";
import { getTodaySummary as getThinkSummary } from "@garden/module-think/summary";
import { getTodaySummary as getTrainSummary } from "@garden/module-train/summary";
import { getTodaySummary as getWorkSummary } from "@garden/module-work/summary";
import { changePlan, deferTask, scheduleTask, useGarden } from "@garden/shared-state";
import type { DailyTask, TaskTier } from "@garden/types";
import { Button, Card, cn, Input, Pill, SectionHeading } from "@garden/ui";
import { ArrowRight, Check, Clock, GripVertical, Plus, RotateCcw, Sprout } from "lucide-react";
import { type DragEvent, type ReactNode, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DayTimeline } from "../components/DayTimeline";
import { SwipeableRow } from "../components/SwipeableRow";
import { useLongPress } from "../components/useLongPress";

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
  const streak = tendingStreak(data, date);

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

  const toggleComplete = (taskId: string) =>
    update((current) =>
      changePlan(current, date, (currentPlan) => ({
        ...currentPlan,
        tasks: currentPlan.tasks.map((item) =>
          item.id === taskId ? { ...item, status: item.status === "completed" ? "active" : "completed" } : item,
        ),
      })),
    );

  const defer = (taskId: string) => update((current) => deferTask(current, date, taskId));

  const schedule = (taskId: string, startMinute: number | null) =>
    update((current) => scheduleTask(current, date, taskId, startMinute));

  const submitEdit = (taskId: string, rawTitle: string) => {
    const title = rawTitle.trim();
    if (title) {
      update((current) =>
        changePlan(current, date, (currentPlan) => ({
          ...currentPlan,
          tasks: currentPlan.tasks.map((item) => (item.id === taskId ? { ...item, title } : item)),
        })),
      );
    }
    setEditing(null);
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
        <div className="flex items-center gap-4 text-sm text-muted">
          {streak > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sage/12 px-2.5 py-1 font-medium text-forest" title="Consecutive days you tended your garden">
              <Sprout size={14} />
              {streak}-day streak
            </span>
          ) : null}
          <span>
            <span className="font-medium text-forest">{completedCount}</span> of {plan.tasks.length} tended today
          </span>
        </div>
      </section>
      <Card className="mb-6 !border-sage/25 !bg-[#f1f2eb] p-5 shadow-none xl:hidden">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-forest/70">Daily briefing</p>
          <span className="text-sm font-medium text-forest">{plan.focusHours}h focus</span>
        </div>
        <p className="mt-3 font-serif text-xl leading-7 tracking-tight text-ink">{briefing.summary}</p>
        {briefing.recommendations[0] ? <p className="mt-2 text-sm leading-6 text-muted">{briefing.recommendations[0]}</p> : null}
        {briefing.warnings[0] ? <p className="mt-2 text-sm leading-6 text-clay">{briefing.warnings[0]}</p> : null}
        <p className="mt-3 border-t border-forest/10 pt-3 text-sm text-forest">{briefing.suggestedNextAction}</p>
      </Card>
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
                  {tasks.map((task, index) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      isBig={tier === "big"}
                      showNextBadge={index === 0 && tier === "medium"}
                      isEditing={editing === task.id}
                      onStartEdit={() => setEditing(task.id)}
                      onSubmitEdit={(title) => submitEdit(task.id, title)}
                      onToggle={() => toggleComplete(task.id)}
                      onDefer={() => defer(task.id)}
                      onSchedule={(startMinute) => schedule(task.id, startMinute)}
                      onDragStart={() => setDragged(task.id)}
                      onDrop={() => reorder(task)}
                    />
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
          <DayTimeline tasks={plan.tasks} focusHours={plan.focusHours} onUnschedule={(taskId) => schedule(taskId, null)} />
          <Card className="hidden !border-sage/25 !bg-[#f1f2eb] p-6 shadow-none xl:block">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-forest/70">Daily briefing</p>
            <p className="mt-4 font-serif text-2xl leading-8 tracking-tight text-ink">{briefing.summary}</p>
            {briefing.recommendations.slice(0, 2).map((line) => (
              <p key={line} className="mt-4 text-sm leading-6 text-muted">{line}</p>
            ))}
            {briefing.warnings[0] ? <p className="mt-3 text-sm leading-6 text-clay">{briefing.warnings[0]}</p> : null}
            <div className="mt-6 border-t border-forest/10 pt-4 text-sm text-forest">{briefing.suggestedNextAction}</div>
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

const TaskRow = ({
  task,
  isBig,
  showNextBadge,
  isEditing,
  onStartEdit,
  onSubmitEdit,
  onToggle,
  onDefer,
  onSchedule,
  onDragStart,
  onDrop,
}: {
  task: DailyTask;
  isBig: boolean;
  showNextBadge: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onSubmitEdit: (title: string) => void;
  onToggle: () => void;
  onDefer: () => void;
  onSchedule: (startMinute: number | null) => void;
  onDragStart: () => void;
  onDrop: () => void;
}) => {
  const completed = task.status === "completed";
  const neglected = (task.deferCount ?? 0) >= 2 && !completed;
  const longPress = useLongPress(onStartEdit);
  const [picking, setPicking] = useState(false);
  return (
    <SwipeableRow completed={completed} onComplete={onToggle} onDefer={onDefer}>
      <div
        draggable
        onDragStart={onDragStart}
        onDragOver={(event: DragEvent) => event.preventDefault()}
        onDrop={onDrop}
        className={cn(
          "group flex items-center gap-2 rounded-2xl border px-2.5 py-2 transition",
          isBig ? "border-forest/8 bg-mist/45 py-4" : "border-transparent bg-white hover:border-ink/5 hover:bg-mist/35",
          completed && "opacity-55",
        )}
      >
        <GripVertical className="hidden shrink-0 text-muted/45 lg:block" size={15} />
        <button
          aria-label={`Complete ${task.title}`}
          onClick={onToggle}
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border transition",
            completed ? "border-forest bg-forest text-white" : "border-sage/55 hover:border-forest",
          )}
        >
          {completed ? <Check size={14} /> : null}
        </button>
        {isEditing ? (
          <Input
            autoFocus
            defaultValue={task.title}
            onBlur={(event) => onSubmitEdit(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
            className="h-9"
          />
        ) : (
          <button
            onDoubleClick={onStartEdit}
            {...longPress}
            className={cn(
              "min-w-0 flex-1 text-left text-sm text-ink sm:text-[15px]",
              isBig && "text-base font-medium",
              completed && "line-through",
            )}
          >
            {showNextBadge ? <span className="mr-2 text-xs text-muted">NEXT</span> : null}
            {task.title}
          </button>
        )}
        {neglected ? (
          <span
            title={`Carried over ${task.deferCount} times — maybe today?`}
            className="flex shrink-0 items-center gap-1 text-clay"
          >
            <span className="size-1.5 rounded-full bg-clay" />
            <span className="hidden text-[11px] font-medium sm:inline">carried {task.deferCount}×</span>
          </span>
        ) : null}
        {task.estimateMinutes ? <span className="hidden text-xs text-muted sm:inline">{task.estimateMinutes}m</span> : null}
        {picking ? (
          <input
            type="time"
            autoFocus
            defaultValue={task.startMinute != null ? minuteToTimeValue(task.startMinute) : ""}
            onChange={(event) => {
              const minute = parseTimeValue(event.target.value);
              if (minute != null) onSchedule(minute);
            }}
            onBlur={() => setPicking(false)}
            className="h-8 rounded-lg border border-ink/8 bg-white px-2 text-xs text-ink outline-none focus:border-sage"
          />
        ) : task.startMinute != null ? (
          <button
            onClick={() => setPicking(true)}
            title="Change time"
            className="flex shrink-0 items-center gap-1 rounded-full bg-forest/8 px-2 py-1 text-[11px] font-medium text-forest transition hover:bg-forest/15"
          >
            <Clock size={12} />
            {minuteLabel(task.startMinute)}
          </button>
        ) : (
          <button
            aria-label="Schedule a time"
            title="Schedule a time"
            onClick={() => setPicking(true)}
            className="shrink-0 rounded-md p-1.5 text-muted/55 transition hover:bg-mist hover:text-ink sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Clock size={15} />
          </button>
        )}
        <span className="hidden sm:block">
          <Button
            variant="quiet"
            className="h-8 min-h-8 px-2 opacity-0 transition group-hover:opacity-100"
            title="Move to tomorrow"
            onClick={onDefer}
          >
            <RotateCcw size={14} />
          </Button>
        </span>
      </div>
    </SwipeableRow>
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
