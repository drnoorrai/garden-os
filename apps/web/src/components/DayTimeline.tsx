import { dayWindow, minuteLabel, plannedMinutes, scheduledTasks, taskDuration } from "@garden/domain";
import type { DailyTask } from "@garden/types";
import { Card, cn } from "@garden/ui";
import { Clock, X } from "lucide-react";

const HOUR_PX = 48;
const PX_PER_MIN = HOUR_PX / 60;

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
};

export const DayTimeline = ({
  tasks,
  focusHours,
  onUnschedule,
}: {
  tasks: DailyTask[];
  focusHours: number;
  onUnschedule: (taskId: string) => void;
}) => {
  const placed = scheduledTasks(tasks);
  const planned = plannedMinutes(tasks);
  const available = Math.round(focusHours * 60);
  const over = planned > available;
  const fill = available > 0 ? Math.min(planned / available, 1) : 0;
  const { start, end } = dayWindow(tasks);
  const totalMinutes = end - start;
  const hours: number[] = [];
  for (let h = Math.ceil(start / 60); h <= Math.floor(end / 60); h += 1) hours.push(h);

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium tracking-[-0.025em] text-ink">Today's shape</h2>
          <p className="mt-1 text-sm text-muted">
            {placed.length === 0 ? "Plan when, not just what." : `${placed.length} placed on the day`}
          </p>
        </div>
        <div className="text-right">
          <p className={cn("text-sm font-medium", over ? "text-clay" : "text-forest")}>
            {formatDuration(planned)} <span className="text-muted">/ {focusHours}h</span>
          </p>
          <p className="mt-0.5 text-xs text-muted">{over ? `${formatDuration(planned - available)} over budget` : "focus planned"}</p>
        </div>
      </div>

      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-mist">
        <div
          className={cn("h-full rounded-full transition-all", over ? "bg-clay" : "bg-sage")}
          style={{ width: `${Math.round(fill * 100)}%` }}
        />
      </div>

      <div className="relative" style={{ height: totalMinutes * PX_PER_MIN }}>
        {hours.map((hour) => {
          const top = (hour * 60 - start) * PX_PER_MIN;
          return (
            <div key={hour} className="absolute inset-x-0 flex items-center gap-2" style={{ top }}>
              <span className="w-12 shrink-0 text-right text-[11px] tabular-nums text-muted/70">{minuteLabel(hour * 60)}</span>
              <span className="h-px flex-1 bg-ink/5" />
            </div>
          );
        })}

        <div className="absolute inset-y-0 left-14 right-0">
          {placed.map((task) => {
            const offsetMinutes = (task.startMinute ?? start) - start;
            const duration = taskDuration(task);
            const completed = task.status === "completed";
            return (
              <div
                key={task.id}
                className={cn(
                  "group absolute inset-x-0 flex items-start justify-between gap-2 overflow-hidden rounded-xl border px-3 py-1.5 text-left",
                  task.tier === "big" ? "border-forest/20 bg-forest/10" : "border-ink/8 bg-mist",
                  completed && "opacity-55",
                )}
                style={{ top: offsetMinutes * PX_PER_MIN, height: Math.max(duration * PX_PER_MIN - 4, 26) }}
              >
                <div className="min-w-0">
                  <p className={cn("truncate text-sm font-medium text-ink", completed && "line-through")}>{task.title}</p>
                  <p className="text-[11px] text-muted">
                    {minuteLabel(task.startMinute ?? start)} · {formatDuration(duration)}
                  </p>
                </div>
                <button
                  aria-label={`Unschedule ${task.title}`}
                  onClick={() => onUnschedule(task.id)}
                  className="shrink-0 rounded-md p-1 text-muted/60 opacity-100 transition hover:bg-white hover:text-ink sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>

        {placed.length === 0 ? (
          <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2 text-center text-sm text-muted">
            <Clock size={20} className="text-sage" />
            <p className="max-w-[15rem] leading-6">Add a time to any task to place it on your day.</p>
          </div>
        ) : null}
      </div>
    </Card>
  );
};
