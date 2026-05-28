import { createId, getPlan, todayKey } from "@garden/domain";
import { deferTask, useGarden } from "@garden/shared-state";
import { Button, Card, Label, Textarea } from "@garden/ui";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export const ReviewPage = () => {
  const { data, update } = useGarden();
  const navigate = useNavigate();
  const date = todayKey();
  const plan = getPlan(data, date);
  const bigThing = plan.tasks.find((task) => task.tier === "big");
  const existing = data.reviews.find((review) => review.date === date);
  const [wentWell, setWentWell] = useState(existing?.wentWell ?? "");
  const [difficult, setDifficult] = useState(existing?.difficult ?? "");
  const [tomorrowNote, setTomorrowNote] = useState(existing?.tomorrowNote ?? "");
  const [energy, setEnergy] = useState(existing?.energy ?? 3);
  const [mood, setMood] = useState(existing?.mood ?? 3);
  const [moveUnfinished, setMoveUnfinished] = useState(true);
  const completedBigThing = bigThing?.status === "completed";
  const completedCount = plan.tasks.filter((task) => task.status === "completed").length;
  const carriedOver = plan.tasks
    .filter((task) => task.status !== "completed" && (task.deferCount ?? 0) >= 2)
    .sort((a, b) => (b.deferCount ?? 0) - (a.deferCount ?? 0));

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8">
        <p className="text-sm text-muted">Evening review</p>
        <h1 className="mt-3 font-serif text-4xl tracking-[-0.045em] sm:text-5xl">Close today gently.</h1>
        <p className="mt-4 text-muted">Keep what you learned. Leave the rest here.</p>
      </header>
      <Card className="mb-5 !bg-[#f1f2eb] !border-sage/25 p-5 shadow-none">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-forest/70">Today in numbers</p>
        <p className="mt-3 text-sm leading-6 text-ink">
          You tended <span className="font-medium text-forest">{completedCount}</span> of {plan.tasks.length} planned, and the
          One Big Thing is {completedBigThing ? "done" : "still open"}.
        </p>
        {carriedOver.length ? (
          <p className="mt-2 text-sm leading-6 text-clay">
            {carriedOver.length === 1
              ? `"${carriedOver[0].title}" has been carried ${carriedOver[0].deferCount}× — worth a decision tonight.`
              : `${carriedOver.length} tasks keep slipping (e.g. "${carriedOver[0].title}"). Consider dropping or scheduling one.`}
          </p>
        ) : null}
      </Card>
      <Card className="p-6 sm:p-8">
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            update((current) => {
              const entry = { id: existing?.id ?? createId(), date, wentWell, difficult, energy, mood, completedBigThing: Boolean(completedBigThing), tomorrowNote };
              let next = {
                ...current,
                reviews: existing
                  ? current.reviews.map((review) => review.id === existing.id ? entry : review)
                  : [entry, ...current.reviews],
              };
              if (moveUnfinished) {
                plan.tasks.filter((task) => task.status !== "completed").forEach((task) => {
                  next = deferTask(next, date, task.id);
                });
              }
              return next;
            });
            navigate("/weekly-review");
          }}
        >
          <ReviewPrompt label="What went well?" value={wentWell} onChange={setWentWell} />
          <ReviewPrompt label="What was difficult?" value={difficult} onChange={setDifficult} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Rating label="Energy" value={energy} onChange={setEnergy} />
            <Rating label="Mood" value={mood} onChange={setMood} />
          </div>
          <div className="rounded-2xl bg-mist/60 p-4 text-sm">
            <p className="text-muted">One Big Thing</p>
            <p className="mt-2 font-medium">{bigThing?.title ?? "No big thing chosen."}</p>
            <p className="mt-2 text-forest">{completedBigThing ? "Completed today." : "Not completed yet."}</p>
          </div>
          <ReviewPrompt label="What moves to tomorrow?" value={tomorrowNote} onChange={setTomorrowNote} />
          <label className="flex items-center gap-3 text-sm text-muted">
            <input type="checkbox" checked={moveUnfinished} onChange={(event) => setMoveUnfinished(event.target.checked)} className="size-4 accent-[#304c42]" />
            Move unfinished priority tasks into tomorrow's plan
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" className="flex-1">Save review</Button>
            <Link to="/today" className="inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm text-muted">Back to Today</Link>
          </div>
        </form>
      </Card>
    </div>
  );
};

const ReviewPrompt = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => {
  const id = `review-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} rows={3} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
};

const Rating = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => (
  <div>
    <Label>{label} (1-5)</Label>
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          type="button"
          key={score}
          onClick={() => onChange(score)}
          className={`flex size-10 items-center justify-center rounded-full text-sm ${value === score ? "bg-forest text-white" : "bg-mist text-muted"}`}
        >
          {score}
        </button>
      ))}
    </div>
  </div>
);
