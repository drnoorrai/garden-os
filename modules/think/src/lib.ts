import type { GardenData, ThinkTodaySummary } from "@garden/types";

export const clarityStages = [
  { id: "want", label: "Want", question: "What do you want?", guidance: "Name what you are reaching for, before justifying it." },
  { id: "values", label: "Values", question: "What's important to you?", guidance: "What should remain intact as you pursue it?" },
  { id: "strategy", label: "Strategy", question: "How are you getting it?", guidance: "Look honestly at choices, attention and energy." },
  { id: "blockers", label: "Blockers", question: "What is preventing you from having it?", guidance: "Name the constraint precisely." },
  { id: "evidence", label: "Evidence", question: "How will you know that you have it?", guidance: "Define visible signs of progress and enough." },
] as const;

export const getTodaySummary = (data: GardenData): ThinkTodaySummary => {
  const note = data.fieldNotes[0];
  const decisionCount = data.decisions.filter((decision) => decision.status !== "decided").length;
  const mood = data.journal[0]?.mood ?? data.reviews[0]?.mood;
  return {
    module: "think",
    prompt: data.plans[0]?.reflectionPrompt ?? "What deserves attention today?",
    insight: note?.title ?? data.mentalModels[0]?.title ?? "Capture one useful insight.",
    unresolvedDecisions: decisionCount,
    latestMood: mood,
  };
};
