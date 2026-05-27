import type { ModuleTodaySummary, TodayIntelligence, UserContext } from "@garden/types";

export interface TodayEngineInput {
  context: UserContext;
  summaries: ModuleTodaySummary[];
}

export const buildTodayIntelligence = ({ context, summaries }: TodayEngineInput): TodayIntelligence => {
  const train = summaries.find((summary) => summary.module === "train");
  const work = summaries.find((summary) => summary.module === "work");
  const think = summaries.find((summary) => summary.module === "think");
  const eat = summaries.find((summary) => summary.module === "eat");
  const overloaded = work?.module === "work" && work.sprintLoad === "overloaded";
  const fatigued = train?.module === "train" && train.load === "high";
  const lowEnergy = context.energy <= 2;
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (overloaded) warnings.push("Your sprint contains more active pressure than today can comfortably hold.");
  if (fatigued) warnings.push("Training load is high; another hard session may reduce recovery.");
  if (lowEnergy) warnings.push("Energy is low. Treat today as a reduced-capacity day.");
  if (eat?.module === "eat" && eat.proteinLogged < eat.proteinTarget * 0.4) {
    recommendations.push("Plan a protein-forward meal before late afternoon energy dips.");
  }
  if (think?.module === "think" && think.unresolvedDecisions > 0) {
    recommendations.push("Resolve one open decision rather than carrying it into more tasks.");
  }

  const constrained = overloaded || fatigued || lowEnergy;
  const priority = work?.module === "work" ? work.priority : context.focusPreference;
  return {
    context,
    summary: constrained ? "Reduce load. Protect one meaningful deliverable." : "Your domains support a focused day.",
    recommendations: [
      constrained ? "Keep one important outcome and defer optional work." : "Use your clearest focus block on the priority that matters.",
      ...recommendations,
    ],
    warnings,
    suggestedNextAction: `Begin with: ${priority}.`,
    suggestedFocus: priority,
    suggestedRecovery: fatigued || lowEnergy
      ? "Choose recovery movement or reduce planned intensity."
      : "Your planned training load is compatible with today.",
    tomorrowPlanning: overloaded
      ? "Move at least one sprint commitment out before tomorrow begins."
      : "Carry forward only unfinished work that remains meaningful.",
  };
};
