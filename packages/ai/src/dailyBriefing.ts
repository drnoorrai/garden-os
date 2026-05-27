import type { DailyBriefing, DailyPlan, TrainingEntry } from "@garden/types";

interface BriefingInput {
  plan: DailyPlan;
  workout?: TrainingEntry;
}

export const createDailyBriefing = ({ plan, workout }: BriefingInput): DailyBriefing => {
  const active = plan.tasks.filter((task) => task.status === "active");
  const bigThing = active.find((task) => task.tier === "big");
  const lowEnergy = plan.energy <= 2;
  const crowded = active.length > 9 || plan.focusHours < 2;
  const recommendations: string[] = [];
  const warnings: string[] = [];

  if (lowEnergy) {
    recommendations.push("Keep the plan gentle and protect one meaningful completion.");
    warnings.push("Energy appears low. Avoid adding commitments before midday.");
  } else {
    recommendations.push("Protect your first clear focus window for the One Big Thing.");
  }

  if (crowded) {
    warnings.push("The plan is fuller than the time available. Defer before beginning.");
  }

  if (workout && workout.intensity === "High" && plan.energy <= 3) {
    recommendations.push("Keep training restorative or reduce intensity if energy slips.");
  }

  return {
    summary: lowEnergy
      ? "Your day asks for steadiness, not volume."
      : "Protect one meaningful win today.",
    recommendations,
    warnings,
    suggestedNextAction: bigThing
      ? `Begin with: ${bigThing.title}.`
      : "Choose one meaningful task before accepting new work.",
  };
};
