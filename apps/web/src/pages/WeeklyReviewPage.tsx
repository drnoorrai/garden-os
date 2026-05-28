import { recurringBlockers, tendedDaysCount, tendingStreak } from "@garden/domain";
import { Card, Pill, SectionHeading } from "@garden/ui";
import { useGarden } from "@garden/shared-state";
import { Link } from "react-router-dom";

export const WeeklyReviewPage = () => {
  const { data } = useGarden();
  const completed = data.plans.flatMap((plan) => plan.tasks).filter((task) => task.status === "completed");
  const bestTraining = data.training.find((entry) => entry.completed);
  const latest = data.reviews[0];
  const blockers = recurringBlockers(data);
  const tendedDays = tendedDaysCount(data, 7);
  const streak = tendingStreak(data);

  return (
    <>
      <header className="mb-8">
        <h1 className="font-serif text-4xl tracking-[-0.045em] sm:text-5xl">Weekly review</h1>
        <p className="mt-3 text-muted">Notice what is growing, what keeps catching, and what next week deserves.</p>
        <div className="mt-5 flex flex-wrap gap-2.5 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sage/12 px-3 py-1 font-medium text-forest">
            Tended {tendedDays} of the last 7 days
          </span>
          {streak > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mist px-3 py-1 font-medium text-muted">
              {streak}-day streak
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mist px-3 py-1 font-medium text-muted">
            {completed.length} wins logged
          </span>
        </div>
      </header>
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="p-6">
          <SectionHeading title="Completed wins" />
          {completed.length ? completed.map((task) => <p key={task.id} className="mb-3 rounded-xl bg-mist/55 p-3 text-sm">{task.title}</p>) : <p className="text-sm text-muted">Completions will collect here as the week unfolds.</p>}
        </Card>
        <Card className="p-6">
          <SectionHeading title="Recurring blockers" />
          {blockers.length ? (
            <ul className="space-y-2">
              {blockers.slice(0, 4).map((blocker) => (
                <li key={blocker.title} className="flex items-center justify-between gap-3 rounded-xl bg-clay/8 px-3 py-2 text-sm">
                  <span className="min-w-0 truncate text-ink">{blocker.title}</span>
                  <span className="shrink-0 text-xs font-medium text-clay">carried {blocker.carries}×</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-7 text-muted">{latest?.difficult || "Nothing keeps slipping — the week is staying clear."}</p>
          )}
        </Card>
        <Card className="p-6">
          <SectionHeading title="Best work progress" />
          <Pill>{data.projects[0]?.name}</Pill>
          <p className="mt-4 text-sm leading-7">{data.projects[0]?.outcome}</p>
        </Card>
        <Card className="p-6">
          <SectionHeading title="Best training day" />
          <p className="font-medium">{bestTraining?.workout ?? "No completed training logged yet."}</p>
          {bestTraining ? <p className="mt-2 text-sm text-muted">{bestTraining.durationMinutes} min · {bestTraining.intensity}</p> : null}
        </Card>
        <Card className="p-6 md:col-span-2">
          <SectionHeading title="Next week focus" />
          <p className="font-serif text-2xl tracking-tight">{latest?.tomorrowNote || data.profile.focusTheme}</p>
          <Link to="/today" className="mt-7 inline-flex rounded-full bg-forest px-5 py-3 text-sm font-medium text-white">Return to Today</Link>
        </Card>
      </div>
    </>
  );
};
