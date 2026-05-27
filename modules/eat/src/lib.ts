import { getPlan, todayKey } from "@garden/domain";
import type { EatTodaySummary, GardenData } from "@garden/types";

export const getTodaySummary = (data: GardenData): EatTodaySummary => {
  const date = todayKey();
  const plan = getPlan(data, date);
  return {
    module: "eat",
    proteinTarget: data.profile.proteinTarget,
    proteinLogged: data.meals.filter((meal) => meal.date === date).reduce((total, meal) => total + meal.proteinGrams, 0),
    hydrationComplete: plan.hydrationComplete,
    energySupport: data.mealPlans.find((meal) => meal.date === date)?.energySupport ?? "steady",
  };
};
