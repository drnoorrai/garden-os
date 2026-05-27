import { createId, todayKey } from "@garden/domain";
import { Button, Card, Input, Label, Pill, SectionHeading } from "@garden/ui";
import { Activity, Check, Clock3, Plus } from "lucide-react";
import { useState } from "react";
import { useGarden } from "../lib/garden-context";

export const TrainPage = () => {
  const { data, update } = useGarden();
  const date = todayKey();
  const today = data.training.find((entry) => entry.date === date);
  const [workout, setWorkout] = useState("");
  const [duration, setDuration] = useState(30);

  return (
    <>
      <header className="mb-8">
        <h1 className="font-serif text-4xl tracking-[-0.045em] sm:text-5xl">Train</h1>
        <p className="mt-3 text-muted">Move well today. This is a window into training, not a training platform.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <Card className="p-7">
          <SectionHeading title="Today's workout" supporting="Keep enough in reserve for tomorrow." />
          <div className="rounded-[1.3rem] bg-forest p-6 text-white">
            <Activity className="mb-7 text-white/70" />
            <p className="font-serif text-3xl tracking-tight">{today?.workout ?? "Recovery walk"}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/75">
              <span className="flex items-center gap-1.5"><Clock3 size={15} /> {today?.durationMinutes ?? 25} min</span>
              <span>{today?.movementType ?? "Recovery"}</span>
              <span>{today?.intensity ?? "Low"} intensity</span>
            </div>
            <p className="mt-6 border-t border-white/15 pt-5 text-sm leading-6 text-white/72">{today?.recoveryNote ?? "Easy pace. Leave feeling restored."}</p>
          </div>
          {today ? (
            <Button
              className="mt-5 w-full"
              variant={today.completed ? "secondary" : "primary"}
              onClick={() => update((current) => ({
                ...current,
                training: current.training.map((entry) => entry.id === today.id ? { ...entry, completed: !entry.completed } : entry),
              }))}
            >
              <Check size={16} /> {today.completed ? "Completed" : "Mark complete"}
            </Button>
          ) : null}
        </Card>
        <div className="space-y-5">
          <Card className="p-6">
            <SectionHeading title="Log movement" supporting="Only enough detail to remember it." />
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (!workout.trim()) return;
                update((current) => ({
                  ...current,
                  training: [{
                    id: createId(), date, workout: workout.trim(), movementType: "Movement", durationMinutes: duration,
                    intensity: "Moderate", recoveryNote: "Notice how the body responds tomorrow.", completed: true,
                  }, ...current.training],
                }));
                setWorkout("");
              }}
            >
              <Label htmlFor="training-session">Session</Label>
              <Input id="training-session" value={workout} onChange={(event) => setWorkout(event.target.value)} placeholder="Walk, yoga, strength..." />
              <Label htmlFor="training-duration">Duration</Label>
              <Input id="training-duration" type="number" min={5} max={180} value={duration} onChange={(event) => setDuration(Number(event.target.value))} />
              <Button type="submit"><Plus size={15} /> Log</Button>
            </form>
          </Card>
          <Card className="p-6">
            <SectionHeading title="History" />
            <div className="space-y-3">
              {data.training.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-xl bg-mist/55 px-4 py-3 text-sm">
                  <div><p className="font-medium">{entry.workout}</p><p className="mt-1 text-muted">{entry.date} · {entry.durationMinutes} min</p></div>
                  <Pill tone={entry.completed ? "sage" : "stone"}>{entry.completed ? "Done" : "Planned"}</Pill>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};
