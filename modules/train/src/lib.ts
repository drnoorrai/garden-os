import type { GardenData, LoggedSet, MuscleTarget, TrainTodaySummary, TrainingPhase, TrainingState } from "@garden/types";

export const phaseScale: Record<TrainingPhase, number> = { bulk: 1, maintain: 1, cut: 0.85, deload: 0.5 };

export const currentWeek = () => {
  const now = new Date();
  const weekday = now.getDay() || 7;
  const start = new Date(now);
  start.setDate(now.getDate() - weekday + 1);
  return start.toISOString().slice(0, 10);
};

export const weekSets = (train: TrainingState) => train.sets.filter((set) => set.date >= currentWeek());

export const targetForPhase = (target: MuscleTarget, phase: TrainingPhase) => ({
  ...target,
  mev: Math.round(target.mev * phaseScale[phase]),
  mav: target.mav.map((value) => Math.round(value * phaseScale[phase])) as [number, number],
  mrv: Math.round(target.mrv * phaseScale[phase]),
});

export const hardVolume = (train: TrainingState, sets = weekSets(train)) => {
  const totals: Record<string, number> = Object.fromEntries(train.targets.map((target) => [target.id, 0]));
  sets.filter((set) => set.rir <= 4).forEach((set) => {
    const exercise = [...train.exercises, ...train.customExercises].find((item) => item.id === set.exerciseId);
    Object.entries(exercise?.contributions ?? {}).forEach(([muscle, value]) => {
      totals[muscle] = (totals[muscle] ?? 0) + value;
    });
  });
  return totals;
};

export const exerciseName = (train: TrainingState, id: string) =>
  [...train.exercises, ...train.customExercises].find((exercise) => exercise.id === id)?.name ?? "Movement";

export const getTodaySummary = (data: GardenData): TrainTodaySummary => {
  const planned = data.training.find((entry) => !entry.completed) ?? data.training[0];
  const hardSets = weekSets(data.train).filter((set) => set.rir <= 4).length;
  const load = hardSets >= 14 ? "high" : hardSets >= 6 ? "moderate" : "low";
  return {
    module: "train",
    workout: planned?.workout ?? data.train.templates[0]?.name ?? "Recovery movement",
    intensity: load === "high" ? "Low" : planned?.intensity ?? "Moderate",
    recovery: load === "high" ? "Volume is high. Keep movement restorative." : planned?.recoveryNote ?? "Leave feeling capable.",
    weeklyHardSets: hardSets,
    load,
  };
};

export const createLoggedSet = (exerciseId: string, sessionId?: string): LoggedSet => ({
  id: crypto.randomUUID(),
  date: new Date().toISOString().slice(0, 10),
  exerciseId,
  reps: 10,
  weightKg: 0,
  rir: 2,
  sessionId,
});
