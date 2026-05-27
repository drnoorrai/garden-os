import { Card, Pill, SectionHeading } from "@garden/ui";
import { useGarden } from "@garden/shared-state";
import { Link } from "react-router-dom";

export const WeeklyReviewPage = () => {
  const { data } = useGarden();
  const completed = data.plans.flatMap((plan) => plan.tasks).filter((task) => task.status === "completed");
  const bestTraining = data.training.find((entry) => entry.completed);
  const latest = data.reviews[0];

  return (
    <>
      <header className="mb-8">
        <h1 className="font-serif text-4xl tracking-[-0.045em] sm:text-5xl">Weekly review</h1>
        <p className="mt-3 text-muted">Notice what is growing, what keeps catching, and what next week deserves.</p>
      </header>
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="p-6">
          <SectionHeading title="Completed wins" />
          {completed.length ? completed.map((task) => <p key={task.id} className="mb-3 rounded-xl bg-mist/55 p-3 text-sm">{task.title}</p>) : <p className="text-sm text-muted">Completions will collect here as the week unfolds.</p>}
        </Card>
        <Card className="p-6">
          <SectionHeading title="Recurring blockers" />
          <p className="text-sm leading-7 text-muted">{latest?.difficult || "Capture friction in an evening review to reveal a pattern."}</p>
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
