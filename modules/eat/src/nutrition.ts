import type { FoodPreset, MacroBreakdown, MealEntry, MealLogItem, RecipePreset } from "@garden/types";

export const zeroMacros = (): MacroBreakdown => ({
  calories: 0,
  proteinGrams: 0,
  carbsGrams: 0,
  fatGrams: 0,
  fiberGrams: 0,
  sodiumMg: 0,
});

const round = (value: number, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round((Number.isFinite(value) ? value : 0) * factor) / factor;
};

export const addMacros = (items: MacroBreakdown[]): MacroBreakdown => items.reduce((total, item) => ({
  calories: round(total.calories + item.calories, 0),
  proteinGrams: round(total.proteinGrams + item.proteinGrams),
  carbsGrams: round(total.carbsGrams + item.carbsGrams),
  fatGrams: round(total.fatGrams + item.fatGrams),
  fiberGrams: round(total.fiberGrams + item.fiberGrams),
  sodiumMg: round(total.sodiumMg + item.sodiumMg, 0),
}), zeroMacros());

export const scaleMacros = (macros: MacroBreakdown, factor: number): MacroBreakdown => ({
  calories: round(macros.calories * factor, 0),
  proteinGrams: round(macros.proteinGrams * factor),
  carbsGrams: round(macros.carbsGrams * factor),
  fatGrams: round(macros.fatGrams * factor),
  fiberGrams: round(macros.fiberGrams * factor),
  sodiumMg: round(macros.sodiumMg * factor, 0),
});

export const foodMacros = (food: FoodPreset, quantity: number): MacroBreakdown =>
  scaleMacros(food.macros, quantity / Math.max(food.baseQuantity, 1));

export const recipeToItems = (recipe: RecipePreset, foods: FoodPreset[]): MealLogItem[] =>
  recipe.ingredients.flatMap((ingredient) => {
    const food = foods.find((item) => item.id === ingredient.foodId);
    if (!food) return [];
    return [{
      id: ingredient.id,
      foodId: food.id,
      name: food.name,
      quantity: ingredient.quantity,
      unit: food.unit,
      servingLabel: food.servingLabel,
      macros: foodMacros(food, ingredient.quantity),
    }];
  });

export const recipeMacros = (recipe: RecipePreset, foods: FoodPreset[]): MacroBreakdown =>
  addMacros(recipeToItems(recipe, foods).map((item) => item.macros));

export const mealMacros = (meal: MealEntry): MacroBreakdown => {
  if (meal.macros) return meal.macros;
  if (meal.items?.length) return addMacros(meal.items.map((item) => item.macros));
  return {
    calories: meal.calories ?? meal.proteinGrams * 4,
    proteinGrams: meal.proteinGrams,
    carbsGrams: 0,
    fatGrams: 0,
    fiberGrams: 0,
    sodiumMg: 0,
  };
};
