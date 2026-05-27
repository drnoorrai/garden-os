import type { Bet, GardenData, WorkTodaySummary } from "@garden/types";

export const classifyBet = (bet: Bet) => {
  if (bet.impact >= 3 && bet.effort <= 2) return "Quick wins";
  if (bet.impact >= 3 && bet.effort >= 3) return "Major projects";
  if (bet.impact <= 2 && bet.effort <= 2) return "Fill-ins";
  return "Hard slogs";
};

export const getTodaySummary = (data: GardenData): WorkTodaySummary => {
  const plan = data.plans[0];
  const priority = plan?.tasks.find((task) => task.tier === "big" && task.status !== "completed")?.title
    ?? data.sprints[0]?.focus
    ?? "Choose one deliverable.";
  const blockers = data.kanbanCards.filter((card) => card.column === "blocked").length;
  const active = data.kanbanCards.filter((card) => card.column === "today" || card.column === "sprint").length;
  return {
    module: "work",
    priority,
    blockers,
    sprintLoad: active > (data.sprints[0]?.capacity ?? 3) ? "overloaded" : active >= 2 ? "balanced" : "clear",
    activeBets: data.bets.filter((bet) => bet.status === "active").length,
  };
};
