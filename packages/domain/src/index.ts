import type { Bet, DailyPlan, DailyTask, GardenData, TaskTier } from "@garden/types";

export const todayKey = () => new Date().toISOString().slice(0, 10);

export const nextDayKey = (date: string) => {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + 1);
  return value.toISOString().slice(0, 10);
};

export const createId = () => crypto.randomUUID();

export const capacityForTier: Record<TaskTier, number> = {
  big: 1,
  medium: 3,
  small: 5,
};

export const tierLabel: Record<TaskTier, string> = {
  big: "One Big Thing",
  medium: "Three Medium Things",
  small: "Five Small Things",
};

export const getPlan = (data: GardenData, date: string): DailyPlan =>
  data.plans.find((plan) => plan.date === date) ?? {
    date,
    tasks: [],
    focusHours: 2,
    energy: 3,
    hydrationComplete: false,
    activeClarityGoal: "Choose what matters and release the rest.",
    reflectionPrompt: "What would make today feel well spent?",
    mealSuggestion: "Build a simple protein-forward lunch.",
  };

export const orderedTasks = (tasks: DailyTask[], tier?: TaskTier) =>
  tasks
    .filter((task) => !tier || task.tier === tier)
    .sort((a, b) => a.order - b.order);

export const categorizeBet = (bet: Bet) => {
  if (bet.impact >= 3 && bet.effort <= 2) return "Quick Wins";
  if (bet.impact >= 3 && bet.effort >= 3) return "Major Projects";
  if (bet.impact <= 2 && bet.effort <= 2) return "Fill-ins";
  return "Hard Slogs";
};

const task = (
  title: string,
  tier: TaskTier,
  order: number,
  scheduledDate: string,
  estimateMinutes: number,
): DailyTask => ({
  id: createId(),
  title,
  tier,
  order,
  status: "active",
  scheduledDate,
  estimateMinutes,
});

export const createSeedData = (date = todayKey()): GardenData => ({
  profile: {
    id: "noor",
    name: "Noor",
    focusTheme: "Build a life with enough space to notice it.",
    proteinTarget: 125,
  },
  plans: [
    {
      date,
      focusHours: 2.5,
      energy: 3,
      hydrationComplete: false,
      activeClarityGoal: "Ship Garden OS without letting scope become the product.",
      reflectionPrompt: "What deserves patient attention today?",
      mealSuggestion: "Lemon salmon, warm grains, greens and tahini.",
      tasks: [
        task("Shape the Garden OS Today experience", "big", 0, date, 90),
        task("Review the product narrative with fresh eyes", "medium", 0, date, 30),
        task("Clear the two decisions blocking launch", "medium", 1, date, 25),
        task("Protect an uninterrupted thinking block", "medium", 2, date, 45),
        task("Reply to Mum about Sunday", "small", 0, date, 5),
        task("Order fresh groceries", "small", 1, date, 10),
        task("Read one saved note", "small", 2, date, 10),
        task("Water the balcony herbs", "small", 3, date, 5),
        task("Lay out training clothes", "small", 4, date, 3),
      ],
    },
  ],
  reviews: [],
  claritySessions: [
    {
      id: createId(),
      createdAt: date,
      title: "Create with steadiness",
      answers: {
        "What do you want?": "A useful first version I would trust every morning.",
        "What’s important to you?": "Calm focus and room for real life.",
        "How are you getting it?": "Finishing the small coherent version first.",
        "What is preventing you from having it?": "Treating possibility as obligation.",
        "How will you know that you have it?": "Today feels clear in under five minutes.",
      },
    },
  ],
  fieldNotes: [
    {
      id: createId(),
      createdAt: date,
      title: "Subtraction is a form of care",
      body: "An operating system should remove decisions before it adds tracking.",
      tags: ["product", "focus"],
      category: "Mental Models",
    },
    {
      id: createId(),
      createdAt: date,
      title: "Morning check-in ritual",
      body: "Plans feel believable when they admit actual available time.",
      tags: ["ritual"],
      category: "Saved Insights",
    },
  ],
  workItems: [
    { id: createId(), createdAt: date, title: "Explore trusted circle sharing", kind: "idea", triage: "untriaged" },
    { id: createId(), createdAt: date, title: "Send design notes to collaborator", kind: "obligation", triage: "defer" },
  ],
  bets: [
    { id: createId(), title: "Today-first operating loop", notes: "Make morning planning genuinely lighter.", impact: 5, effort: 3, status: "active" },
    { id: createId(), title: "Evening reflection habit", notes: "Tiny loop, meaningful learning.", impact: 4, effort: 2, status: "active" },
    { id: createId(), title: "Shared household planning", notes: "Revisit after personal flow is proven.", impact: 2, effort: 4, status: "parked" },
  ],
  kanbanCards: [
    { id: createId(), title: "Define V1 calm defaults", column: "done" },
    { id: createId(), title: "Finish Today interactions", column: "today" },
    { id: createId(), title: "Test evening review loop", column: "sprint" },
    { id: createId(), title: "Trusted circle access", column: "backlog" },
  ],
  training: [
    { id: createId(), date, workout: "Full-body strength", movementType: "Strength", durationMinutes: 42, intensity: "Moderate", recoveryNote: "Keep two reps in reserve; walk afterwards.", completed: false },
    { id: createId(), date: nextDayKey(nextDayKey(date)), workout: "Easy run", movementType: "Cardio", durationMinutes: 30, intensity: "Low", recoveryNote: "Conversational pace.", completed: true },
  ],
  train: {
    phase: "maintain",
    targets: [
      { id: "chest", group: "push", name: "Chest", mev: 8, mav: [12, 16], mrv: 20, recovery: "moderate" },
      { id: "side_delts", group: "push", name: "Side delts", mev: 8, mav: [16, 20], mrv: 25, recovery: "fast" },
      { id: "triceps", group: "push", name: "Triceps", mev: 6, mav: [10, 14], mrv: 18, recovery: "moderate" },
      { id: "lats", group: "pull", name: "Lats", mev: 10, mav: [14, 18], mrv: 22, recovery: "moderate" },
      { id: "mid_back", group: "pull", name: "Mid back", mev: 8, mav: [12, 18], mrv: 25, recovery: "fast" },
      { id: "biceps", group: "pull", name: "Biceps", mev: 8, mav: [12, 16], mrv: 20, recovery: "moderate" },
      { id: "quads", group: "legs", name: "Quads", mev: 8, mav: [12, 18], mrv: 20, recovery: "slow" },
      { id: "hamstrings", group: "legs", name: "Hamstrings", mev: 6, mav: [10, 14], mrv: 16, recovery: "slow" },
      { id: "glutes", group: "legs", name: "Glutes", mev: 4, mav: [8, 12], mrv: 16, recovery: "moderate" },
      { id: "calves", group: "legs", name: "Calves", mev: 8, mav: [12, 16], mrv: 20, recovery: "fast" },
      { id: "abs", group: "core", name: "Abs", mev: 0, mav: [8, 16], mrv: 25, recovery: "fast" },
    ],
    exercises: [
      { id: "barbell_bench", name: "Barbell bench press", contributions: { chest: 1, triceps: 0.5 } },
      { id: "incline_db_press", name: "Incline dumbbell press", contributions: { chest: 1, side_delts: 0.25, triceps: 0.5 } },
      { id: "lateral_raise", name: "Lateral raise", contributions: { side_delts: 1 } },
      { id: "tricep_pushdown", name: "Tricep pushdown", contributions: { triceps: 1 } },
      { id: "pullup", name: "Pull-up", contributions: { lats: 1, biceps: 0.5, mid_back: 0.5 } },
      { id: "chest_supported_row", name: "Chest-supported row", contributions: { mid_back: 1, lats: 0.5, biceps: 0.5 } },
      { id: "dumbbell_curl", name: "Dumbbell curl", contributions: { biceps: 1 } },
      { id: "back_squat", name: "Back squat", contributions: { quads: 1, glutes: 0.5 } },
      { id: "rdl", name: "Romanian deadlift", contributions: { hamstrings: 1, glutes: 0.5 } },
      { id: "leg_press", name: "Leg press", contributions: { quads: 1, glutes: 0.5 } },
      { id: "standing_calf", name: "Standing calf raise", contributions: { calves: 1 } },
      { id: "cable_crunch", name: "Cable crunch", contributions: { abs: 1 } }
    ],
    customExercises: [],
    sets: [],
    templates: [
      { id: "full-body", name: "Full-body strength", exercises: [{ exerciseId: "back_squat", targetSets: 3 }, { exerciseId: "barbell_bench", targetSets: 3 }, { exerciseId: "chest_supported_row", targetSets: 3 }] },
      { id: "pull-focus", name: "Pull and posterior", exercises: [{ exerciseId: "rdl", targetSets: 3 }, { exerciseId: "pullup", targetSets: 3 }, { exerciseId: "dumbbell_curl", targetSets: 2 }] }
    ],
    sessions: [],
  },
  meals: [{ id: createId(), date, name: "Greek yogurt, berries and seeds", proteinGrams: 28 }],
  mealPlans: [
    { id: createId(), date, meal: "Lemon salmon, warm grains, greens and tahini.", proteinGrams: 42, energySupport: "steady" },
  ],
  groceries: [
    { id: createId(), label: "Leafy greens", complete: false },
    { id: createId(), label: "Salmon", complete: false },
    { id: createId(), label: "Greek yogurt", complete: true },
  ],
  projects: [
    {
      id: "garden-v1",
      name: "Garden OS V1",
      outcome: "A quiet daily system Noor genuinely returns to.",
      scope: [
        { id: createId(), label: "Today planning and review loop", priority: "must" },
        { id: createId(), label: "Local-first module snapshots", priority: "should" },
        { id: createId(), label: "Trusted circle sharing", priority: "could" },
        { id: createId(), label: "Complex integrations in V1", priority: "wont" },
      ],
    },
  ],
  journal: [
    { id: createId(), date, title: "Morning attention", body: "Start with a plan that respects actual capacity.", mood: 3 },
  ],
  decisions: [
    { id: createId(), date, decision: "Keep V1 local-first", rationale: "Learn from real daily use before sync complexity.", status: "decided" },
  ],
  mentalModels: [
    { id: createId(), title: "Subtraction is care", principle: "Remove decisions before adding tracking.", application: "Defer anything that does not improve Today." },
  ],
  sprints: [
    { id: createId(), weekOf: date, focus: "Make the daily operating loop trustworthy.", capacity: 3, commitments: ["Today intelligence", "Evening review", "Train integration"] },
  ],
});
