import type { GardenData, WorkTodaySummary } from "@garden/types";

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
  };
};
