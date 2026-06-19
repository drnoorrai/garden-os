import { getPlan, todayKey } from "@garden/domain";
import type { EatTodaySummary, GardenData } from "@garden/types";
import { addMacros, mealMacros } from "./nutrition";

export const getTodaySummary = (data: GardenData): EatTodaySummary => {
  const date = todayKey();
  const plan = getPlan(data, date);
  const settings = data.nutrition.settings;
  const logged = addMacros(data.meals.filter((meal) => meal.date === date).map(mealMacros));
  const estimatedMaintenance = settings.bmrCalories + settings.activityCalories + (settings.wearableAdjustmentCalories ?? 0);
  return {
    module: "eat",
    proteinTarget: settings.proteinTargetGrams,
    proteinLogged: logged.proteinGrams,
    calorieTarget: settings.calorieTarget,
    caloriesLogged: logged.calories,
    carbsLogged: logged.carbsGrams,
    fatLogged: logged.fatGrams,
    fiberLogged: logged.fiberGrams,
    sodiumLogged: logged.sodiumMg,
    estimatedMaintenance,
    estimatedDeficit: estimatedMaintenance - logged.calories,
    hydrationComplete: plan.hydrationComplete,
    energySupport: data.mealPlans.find((meal) => meal.date === date)?.energySupport ?? "steady",
  };
};
