import { createId, createSeedData, getPlan, nextDayKey, todayKey } from "@garden/domain";
import { localStorageAdapter } from "@garden/storage";
import type { DailyPlan, GardenData, UserContext, WorkItemKind } from "@garden/types";
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "garden-os:v1";
const adapter = localStorageAdapter<Partial<GardenData>>(STORAGE_KEY);

export interface GardenContextValue {
  data: GardenData;
  userContext: UserContext;
  update: (recipe: (current: GardenData) => GardenData) => void;
  reset: () => Promise<void>;
  ready: boolean;
}

const GardenContext = createContext<GardenContextValue | null>(null);

export const migrateGardenData = (stored: Partial<GardenData> | null, date = todayKey()): GardenData => {
  const seed = createSeedData(date);
  if (!stored) return seed;
  return {
    ...seed,
    ...stored,
    profile: { ...seed.profile, ...stored.profile },
    train: stored.train ?? seed.train,
    mealPlans: stored.mealPlans ?? seed.mealPlans,
    groceries: stored.groceries ?? seed.groceries,
    journal: stored.journal ?? seed.journal,
    decisions: stored.decisions ?? seed.decisions,
    mentalModels: stored.mentalModels ?? seed.mentalModels,
    sprints: stored.sprints ?? seed.sprints,
  };
};

export const deriveUserContext = (data: GardenData, date = todayKey()): UserContext => {
  const plan = getPlan(data, date);
  const latestReview = data.reviews[0];
  const activeWork = data.kanbanCards.filter((card) => card.column === "today" || card.column === "blocked").length;
  const hardSets = data.train.sets.filter((set) => set.rir <= 4).length;
  const protein = data.meals.filter((meal) => meal.date === date).reduce((sum, meal) => sum + meal.proteinGrams, 0);
  return {
    goals: [data.profile.focusTheme, data.projects[0]?.outcome ?? "Protect meaningful attention."],
    energy: latestReview?.energy ?? plan.energy,
    mood: latestReview?.mood ?? 3,
    trainingLoad: hardSets >= 14 ? "high" : hardSets >= 6 ? "moderate" : "low",
    workload: activeWork >= 4 ? "overloaded" : activeWork >= 2 ? "balanced" : "clear",
    projects: data.projects.map((project) => project.name),
    proteinProgress: Math.min(protein / data.profile.proteinTarget, 1),
    hydrationComplete: plan.hydrationComplete,
    focusPreference: plan.activeClarityGoal,
  };
};

export const changePlan = (data: GardenData, date: string, change: (plan: DailyPlan) => DailyPlan): GardenData => {
  const existing = data.plans.some((plan) => plan.date === date);
  const plan = change(getPlan(data, date));
  return { ...data, plans: existing ? data.plans.map((item) => item.date === date ? plan : item) : [...data.plans, plan] };
};

export const captureItem = (data: GardenData, title: string, kind: WorkItemKind = "thought"): GardenData => {
  const trimmed = title.trim();
  if (!trimmed) return data;
  return {
    ...data,
    workItems: [
      { id: createId(), createdAt: new Date().toISOString(), title: trimmed, kind, triage: "untriaged" },
      ...data.workItems,
    ],
  };
};

export const scheduleTask = (
  data: GardenData,
  date: string,
  taskId: string,
  startMinute: number | null,
): GardenData =>
  changePlan(data, date, (plan) => ({
    ...plan,
    tasks: plan.tasks.map((task) =>
      task.id === taskId ? { ...task, startMinute: startMinute ?? undefined } : task,
    ),
  }));

export const deferTask = (data: GardenData, date: string, taskId: string): GardenData => {
  const item = getPlan(data, date).tasks.find((task) => task.id === taskId);
  if (!item) return data;
  const tomorrow = nextDayKey(date);
  return changePlan(
    changePlan(data, date, (plan) => ({ ...plan, tasks: plan.tasks.filter((task) => task.id !== taskId) })),
    tomorrow,
    (plan) => ({ ...plan, tasks: [...plan.tasks, { ...item, status: "active", scheduledDate: tomorrow, order: plan.tasks.filter((task) => task.tier === item.tier).length }] }),
  );
};

export const GardenProvider = ({ children }: PropsWithChildren) => {
  const [data, setData] = useState<GardenData>(() => createSeedData(todayKey()));
  const [ready, setReady] = useState(false);
  useEffect(() => { void adapter.load().then((saved) => { setData(migrateGardenData(saved)); setReady(true); }); }, []);
  useEffect(() => { if (ready) void adapter.save(data); }, [data, ready]);
  const userContext = useMemo(() => deriveUserContext(data), [data]);
  const value = useMemo<GardenContextValue>(() => ({
    data, userContext, ready, update: (recipe) => setData((current) => recipe(current)),
    reset: async () => { await adapter.clear(); setData(createSeedData(todayKey())); },
  }), [data, ready, userContext]);
  return <GardenContext.Provider value={value}>{children}</GardenContext.Provider>;
};

export const useGarden = () => {
  const context = useContext(GardenContext);
  if (!context) throw new Error("useGarden must be used within GardenProvider");
  return context;
};
