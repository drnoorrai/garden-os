import { ModuleHeader, ModuleTabs, StatCard } from "@garden/design-system";
import { createId, todayKey } from "@garden/domain";
import { useGarden } from "@garden/shared-state";
import type { LoggedSet, MovementExercise, TrainingPhase, WorkoutTemplate } from "@garden/types";
import { Button, Card, Input, Label, Pill, SectionHeading } from "@garden/ui";
import { ArrowRight, Plus, X } from "lucide-react";
import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import { createLoggedSet, currentWeek, exerciseName, getTodaySummary, hardVolume, targetForPhase, weekSets } from "./lib";

export { getTodaySummary } from "./lib";

const tabs = [
  { to: "/train", label: "Week", end: true },
  { to: "/train/session", label: "Session" },
  { to: "/train/history", label: "History" },
  { to: "/train/settings", label: "Structure" },
];

export const TrainRoutes = () => {
  const { data } = useGarden();
  const summary = getTodaySummary(data);
  return (
    <>
      <ModuleHeader
        title="Train"
        description="Tension, native to Garden OS. Build sessions and manage productive hard-set volume."
        aside={<Pill tone={summary.load === "high" ? "clay" : "sage"}>{summary.weeklyHardSets} hard sets this week</Pill>}
      />
      <ModuleTabs tabs={tabs} />
      <Routes>
        <Route index element={<WeekDashboard />} />
        <Route path="session" element={<SessionBuilder />} />
        <Route path="history" element={<TrainingHistory />} />
        <Route path="settings" element={<TrainingStructure />} />
      </Routes>
    </>
  );
};

const WeekDashboard = () => {
  const { data, update } = useGarden();
  const totals = hardVolume(data.train);
  const sets = weekSets(data.train);
  const summary = getTodaySummary(data);
  const [exerciseId, setExerciseId] = useState(data.train.exercises[0]?.id ?? "");
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);
  const [rir, setRir] = useState(2);
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Week of" value={currentWeek()} supporting={`${sets.length} total sets logged`} />
        <StatCard label="Training load" value={summary.load} supporting={summary.recovery} />
        <Card className="p-5">
          <Label htmlFor="phase">Phase</Label>
          <select
            id="phase"
            className="h-12 w-full rounded-xl border border-ink/8 bg-white px-3 text-sm"
            value={data.train.phase}
            onChange={(event) => update((current) => ({ ...current, train: { ...current.train, phase: event.target.value as TrainingPhase } }))}
          >
            {(["bulk", "maintain", "cut", "deload"] as TrainingPhase[]).map((phase) => <option key={phase}>{phase}</option>)}
          </select>
          <p className="mt-2 text-xs text-muted">Cut and deload scale target ceilings.</p>
        </Card>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[.95fr_1.05fr]">
        <Card className="p-6">
          <SectionHeading title="Log a set" supporting="Hard sets at RIR 0-4 drive tracked volume." />
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const set: LoggedSet = { ...createLoggedSet(exerciseId), reps, weightKg: weight, rir };
              update((current) => ({ ...current, train: { ...current.train, sets: [set, ...current.train.sets] } }));
            }}
          >
            <div>
              <Label htmlFor="movement">Movement</Label>
              <select id="movement" value={exerciseId} onChange={(event) => setExerciseId(event.target.value)} className="h-11 w-full rounded-xl border border-ink/8 bg-white px-3 text-sm">
                {[...data.train.exercises, ...data.train.customExercises].map((exercise) => <option value={exercise.id} key={exercise.id}>{exercise.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label htmlFor="reps">Reps</Label><Input id="reps" type="number" value={reps} min={1} onChange={(event) => setReps(Number(event.target.value))} /></div>
              <div><Label htmlFor="weight">Kg</Label><Input id="weight" type="number" value={weight} min={0} onChange={(event) => setWeight(Number(event.target.value))} /></div>
              <div><Label htmlFor="rir">RIR</Label><Input id="rir" type="number" value={rir} min={0} max={10} onChange={(event) => setRir(Number(event.target.value))} /></div>
            </div>
            <Button type="submit" className="w-full"><Plus size={15} /> Log set</Button>
          </form>
          <div className="mt-6 space-y-2">
            {sets.slice(0, 5).map((set) => (
              <div key={set.id} className="flex justify-between rounded-xl bg-mist/55 p-3 text-sm">
                <span>{exerciseName(data.train, set.exerciseId)} <span className="text-muted">{set.reps} x {set.weightKg || "BW"}kg</span></span>
                <Pill tone={set.rir <= 4 ? "sage" : "stone"}>RIR {set.rir}</Pill>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <SectionHeading title="Volume by muscle" supporting="MEV floor, MAV productive band, MRV ceiling." />
          <div className="space-y-4">
            {data.train.targets.filter((target) => !target.optional).map((muscle) => {
              const target = targetForPhase(muscle, data.train.phase);
              const total = totals[muscle.id] ?? 0;
              const percent = Math.min((total / Math.max(target.mrv, 1)) * 100, 100);
              return (
                <div key={muscle.id}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>{muscle.name}</span>
                    <span className="text-muted">{total} / {target.mav[0]}-{target.mav[1]} MAV</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-mist">
                    <div className={`h-full rounded-full ${total > target.mrv ? "bg-clay" : "bg-sage"}`} style={{ width: `${percent}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-muted">MEV {target.mev} · MRV {target.mrv}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

const SessionBuilder = () => {
  const { data, update } = useGarden();
  const active = data.train.sessions.find((session) => session.id === data.train.activeSessionId && !session.completedAt);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const startSession = (template: WorkoutTemplate) => {
    const id = createId();
    update((current) => ({ ...current, train: { ...current.train, sessions: [{ id, date: todayKey(), name: template.name, templateId: template.id }, ...current.train.sessions], activeSessionId: id } }));
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_.85fr]">
      <Card className="p-6">
        <SectionHeading title={active ? active.name : "Train from a template"} supporting={active ? "Stay inside the session; log one useful set at a time." : "Reusable structure without rigid programming."} />
        {active ? (
          <div className="space-y-3">
            {data.train.templates.find((template) => template.id === active.templateId)?.exercises.map((planned) => {
              const logged = data.train.sets.filter((set) => set.sessionId === active.id && set.exerciseId === planned.exerciseId).length;
              return (
                <div key={planned.exerciseId} className="flex items-center justify-between rounded-2xl bg-mist/55 p-4">
                  <div><p className="font-medium">{exerciseName(data.train, planned.exerciseId)}</p><p className="text-sm text-muted">{logged} / {planned.targetSets} sets</p></div>
                  <Button variant="secondary" onClick={() => update((current) => ({ ...current, train: { ...current.train, sets: [{ ...createLoggedSet(planned.exerciseId, active.id) }, ...current.train.sets] } }))}>Log</Button>
                </div>
              );
            })}
            <Button className="mt-5 w-full" onClick={() => update((current) => ({ ...current, train: { ...current.train, sessions: current.train.sessions.map((session) => session.id === active.id ? { ...session, completedAt: new Date().toISOString() } : session), activeSessionId: undefined } }))}>Finish session</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {data.train.templates.map((template) => (
              <div key={template.id} className="flex items-center justify-between rounded-2xl border border-ink/5 p-4">
                <div><p className="font-medium">{template.name}</p><p className="text-sm text-muted">{template.exercises.length} exercises</p></div>
                <Button variant="secondary" onClick={() => startSession(template)}>Start <ArrowRight size={14} /></Button>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card className="p-6">
        <SectionHeading title="Workout builder" supporting="Create a repeatable training flow." />
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim() || selected.length === 0) return;
            update((current) => ({ ...current, train: { ...current.train, templates: [...current.train.templates, { id: createId(), name: name.trim(), exercises: selected.map((exerciseId) => ({ exerciseId, targetSets: 3 })) }] } }));
            setName(""); setSelected([]);
          }}
        >
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Routine name" />
          <div className="max-h-64 space-y-1 overflow-auto rounded-xl border border-ink/6 p-2">
            {data.train.exercises.map((exercise) => (
              <label key={exercise.id} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-mist/55">
                <input type="checkbox" checked={selected.includes(exercise.id)} onChange={(event) => setSelected(event.target.checked ? [...selected, exercise.id] : selected.filter((id) => id !== exercise.id))} />
                {exercise.name}
              </label>
            ))}
          </div>
          <Button type="submit" className="w-full">Save template</Button>
        </form>
      </Card>
    </div>
  );
};

const TrainingHistory = () => {
  const { data } = useGarden();
  const sessions = data.train.sessions.filter((session) => session.completedAt);
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card className="p-6">
        <SectionHeading title="Workout history" supporting="Completed structured sessions." />
        {sessions.length ? sessions.map((session) => <div key={session.id} className="mb-3 rounded-xl bg-mist/55 p-4"><p className="font-medium">{session.name}</p><p className="mt-1 text-sm text-muted">{session.date}</p></div>) : <p className="text-sm text-muted">Finish a session to begin your history.</p>}
      </Card>
      <Card className="p-6">
        <SectionHeading title="Recent sets" supporting="Performance history stays available for progression." />
        {data.train.sets.slice(0, 12).map((set) => <div key={set.id} className="mb-2 flex justify-between text-sm"><span>{exerciseName(data.train, set.exerciseId)}</span><span className="text-muted">{set.reps} reps · RIR {set.rir}</span></div>)}
      </Card>
    </div>
  );
};

const TrainingStructure = () => {
  const { data, update } = useGarden();
  const [name, setName] = useState("");
  const [muscle, setMuscle] = useState("chest");
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_.8fr]">
      <Card className="p-6">
        <SectionHeading title="Volume targets" supporting="Reference thresholds from Tension; phase modifies today's display." />
        <div className="space-y-2">
          {data.train.targets.map((target) => <div key={target.id} className="grid grid-cols-[1fr_auto] rounded-xl bg-mist/50 px-4 py-3 text-sm"><span>{target.name}</span><span className="text-muted">MEV {target.mev} · MAV {target.mav.join("-")} · MRV {target.mrv}</span></div>)}
        </div>
      </Card>
      <Card className="p-6">
        <SectionHeading title="Custom exercise" supporting="Add movements with a primary muscle contribution." />
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            const exercise: MovementExercise = { id: createId(), name: name.trim(), contributions: { [muscle]: 1 }, custom: true };
            update((current) => ({ ...current, train: { ...current.train, customExercises: [...current.train.customExercises, exercise] } }));
            setName("");
          }}
        >
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Movement name" />
          <select value={muscle} onChange={(event) => setMuscle(event.target.value)} className="h-11 w-full rounded-xl border border-ink/8 bg-white px-3 text-sm">
            {data.train.targets.map((target) => <option key={target.id} value={target.id}>{target.name}</option>)}
          </select>
          <Button type="submit"><Plus size={15} /> Add movement</Button>
        </form>
        <div className="mt-6 space-y-2">
          {data.train.customExercises.map((exercise) => (
            <div key={exercise.id} className="flex items-center justify-between rounded-xl bg-mist/55 p-3 text-sm">
              {exercise.name}
              <button aria-label={`Remove ${exercise.name}`} onClick={() => update((current) => ({ ...current, train: { ...current.train, customExercises: current.train.customExercises.filter((item) => item.id !== exercise.id) } }))}><X size={15} /></button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
