import { ModuleHeader, ModuleTabs, StatCard } from "@garden/design-system";
import { createId, todayKey } from "@garden/domain";
import { changePlan, useGarden } from "@garden/shared-state";
import type { FoodPreset, MacroBreakdown, MealLogItem, MealSlot, NutritionSettings, NutritionUnit, RecipeIngredient } from "@garden/types";
import { Button, Card, cn, Input, Label, Pill, SectionHeading } from "@garden/ui";
import { Check, Droplets, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getTodaySummary } from "./lib";
import { addMacros, foodMacros, mealMacros, recipeMacros, recipeToItems, zeroMacros } from "./nutrition";

export { getTodaySummary } from "./lib";

const tabs = [
  { to: "/eat", label: "Today", end: true },
  { to: "/eat/recipes", label: "Recipes" },
  { to: "/eat/foods", label: "Foods" },
  { to: "/eat/targets", label: "Targets" },
  { to: "/eat/groceries", label: "Groceries" },
];

const mealSlots: MealSlot[] = ["breakfast", "lunch", "dinner", "snack", "peri-workout"];
const nutritionUnits: NutritionUnit[] = ["g", "ml", "scoop", "unit", "serving"];
const foodCategories: FoodPreset["category"][] = ["protein", "carb", "fat", "supplement", "sauce", "other"];

const selectClass = "h-11 w-full rounded-xl border border-ink/8 bg-white px-3.5 text-sm text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/15";

const format = (value: number, digits = 0) => new Intl.NumberFormat("en-GB", { maximumFractionDigits: digits }).format(value);
const cleanNumber = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback;

const macroValue = (macros: MacroBreakdown) =>
  `${format(macros.calories)} kcal · ${format(macros.proteinGrams, 1)}P ${format(macros.carbsGrams, 1)}C ${format(macros.fatGrams, 1)}F`;

const progress = (value: number, target: number) => Math.min(Math.max((value / Math.max(target, 1)) * 100, 0), 100);

export const EatRoutes = () => {
  const { data } = useGarden();
  const summary = getTodaySummary(data);
  return (
    <>
      <ModuleHeader
        title="Eat"
        description="Repeatable macros for training, cutting and lean mass."
        aside={<Pill tone={summary.estimatedDeficit >= 0 ? "sage" : "clay"}>{format(Math.abs(summary.estimatedDeficit))} kcal {summary.estimatedDeficit >= 0 ? "under" : "over"} maintenance</Pill>}
      />
      <ModuleTabs tabs={tabs} />
      <Routes>
        <Route index element={<EatToday />} />
        <Route path="recipes" element={<Recipes />} />
        <Route path="foods" element={<Foods />} />
        <Route path="targets" element={<Targets />} />
        <Route path="groceries" element={<Groceries />} />
        <Route path="plan" element={<Navigate replace to="/eat/recipes" />} />
        <Route path="*" element={<Navigate replace to="/eat" />} />
      </Routes>
    </>
  );
};

const MacroProgress = ({ label, value, target, unit = "g" }: { label: string; value: number; target: number; unit?: string }) => (
  <div>
    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
      <span className="font-medium">{label}</span>
      <span className="text-muted">{format(value, unit === "mg" ? 0 : 1)} / {format(target)}{unit}</span>
    </div>
    <div className="h-2 rounded-full bg-mist">
      <div className="h-full rounded-full bg-forest" style={{ width: `${progress(value, target)}%` }} />
    </div>
  </div>
);

const TotalsStrip = ({ macros }: { macros: MacroBreakdown }) => (
  <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-6">
    {[
      ["Calories", `${format(macros.calories)} kcal`],
      ["Protein", `${format(macros.proteinGrams, 1)}g`],
      ["Carbs", `${format(macros.carbsGrams, 1)}g`],
      ["Fat", `${format(macros.fatGrams, 1)}g`],
      ["Fiber", `${format(macros.fiberGrams, 1)}g`],
      ["Sodium", `${format(macros.sodiumMg)}mg`],
    ].map(([label, value]) => (
      <div key={label} className="rounded-xl bg-mist/55 px-3 py-2">
        <p className="text-[11px] uppercase tracking-[0.13em] text-muted">{label}</p>
        <p className="mt-1 font-medium">{value}</p>
      </div>
    ))}
  </div>
);

const buildItem = (food: FoodPreset, quantity: number): MealLogItem => ({
  id: createId(),
  foodId: food.id,
  name: food.name,
  quantity,
  unit: food.unit,
  servingLabel: food.servingLabel,
  macros: foodMacros(food, quantity),
});

const EatToday = () => {
  const { data, update } = useGarden();
  const date = todayKey();
  const summary = getTodaySummary(data);
  const plan = data.plans.find((item) => item.date === date) ?? data.plans[0];
  const foods = data.nutrition.foods;
  const recipes = data.nutrition.recipes;
  const [mealName, setMealName] = useState(recipes[0]?.name ?? "");
  const [mealSlot, setMealSlot] = useState<MealSlot>(recipes[0]?.mealSlot ?? "lunch");
  const [selectedRecipeId, setSelectedRecipeId] = useState(recipes[0]?.id ?? "");
  const [items, setItems] = useState<MealLogItem[]>(() => recipes[0] ? recipeToItems(recipes[0], foods).map((item) => ({ ...item, id: createId() })) : []);
  const [foodId, setFoodId] = useState(foods[0]?.id ?? "");
  const [quantity, setQuantity] = useState(100);
  const totals = useMemo(() => addMacros(items.map((item) => item.macros)), [items]);
  const todaysMeals = data.meals.filter((meal) => meal.date === date);

  const loadRecipe = (recipeId: string) => {
    const recipe = recipes.find((item) => item.id === recipeId);
    if (!recipe) return;
    setSelectedRecipeId(recipe.id);
    setMealName(recipe.name);
    setMealSlot(recipe.mealSlot);
    setItems(recipeToItems(recipe, foods).map((item) => ({ ...item, id: createId() })));
  };

  const addFood = () => {
    const food = foods.find((item) => item.id === foodId);
    if (!food) return;
    setItems((current) => [...current, buildItem(food, Math.max(quantity, 0))]);
  };

  const updateItemQuantity = (itemId: string, nextQuantity: number) => {
    setItems((current) => current.map((item) => {
      if (item.id !== itemId) return item;
      const food = foods.find((value) => value.id === item.foodId);
      const quantityValue = Math.max(cleanNumber(nextQuantity), 0);
      return {
        ...item,
        quantity: quantityValue,
        macros: food ? foodMacros(food, quantityValue) : item.macros,
      };
    }));
  };

  const logMeal = () => {
    if (!mealName.trim() || items.length === 0) return;
    const macros = addMacros(items.map((item) => item.macros));
    update((current) => ({
      ...current,
      meals: [
        {
          id: createId(),
          date,
          name: mealName.trim(),
          mealSlot,
          proteinGrams: macros.proteinGrams,
          calories: macros.calories,
          macros,
          items,
          source: selectedRecipeId ? "recipe" : "composer",
          recipeId: selectedRecipeId || undefined,
        },
        ...current.meals,
      ],
    }));
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <div className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard label="Calories" value={`${format(summary.caloriesLogged)} / ${format(summary.calorieTarget)}`} supporting={`${format(summary.calorieTarget - summary.caloriesLogged)} kcal remaining`} />
          <StatCard label="Protein" value={`${format(summary.proteinLogged, 1)} / ${format(summary.proteinTarget)}g`} supporting="The retention anchor." />
          <StatCard label="Carbs / Fat" value={`${format(summary.carbsLogged, 1)}g / ${format(summary.fatLogged, 1)}g`} supporting={`${format(data.nutrition.settings.carbsTargetGrams)}g carbs · ${format(data.nutrition.settings.fatTargetGrams)}g fat targets`} />
          <StatCard label="Deficit" value={`${format(summary.estimatedDeficit)} kcal`} supporting={`${format(summary.estimatedMaintenance)} kcal estimated maintenance`} />
        </div>
        <Card className="p-5">
          <SectionHeading title="Daily Targets" supporting={plan?.mealSuggestion} />
          <div className="grid gap-4">
            <MacroProgress label="Calories" value={summary.caloriesLogged} target={summary.calorieTarget} unit=" kcal" />
            <MacroProgress label="Protein" value={summary.proteinLogged} target={summary.proteinTarget} />
            <MacroProgress label="Carbs" value={summary.carbsLogged} target={data.nutrition.settings.carbsTargetGrams} />
            <MacroProgress label="Fat" value={summary.fatLogged} target={data.nutrition.settings.fatTargetGrams} />
            <MacroProgress label="Fiber" value={summary.fiberLogged} target={data.nutrition.settings.fiberTargetGrams} />
            <MacroProgress label="Sodium" value={summary.sodiumLogged} target={data.nutrition.settings.sodiumLimitMg} unit="mg" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Droplets className="text-sage" />
              <p className="font-medium">Hydration</p>
            </div>
            <Button variant={summary.hydrationComplete ? "secondary" : "primary"} onClick={() => update((current) => changePlan(current, date, (value) => ({ ...value, hydrationComplete: !value.hydrationComplete })))}>
              {summary.hydrationComplete ? <Check size={15} /> : null}{summary.hydrationComplete ? "Complete" : "Mark complete"}
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <SectionHeading title="Meal Composer" supporting="Load a preset, adjust quantities, log the plate." />
          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div>
                <Label htmlFor="recipe-loader">Preset recipe</Label>
                <select id="recipe-loader" className={selectClass} value={selectedRecipeId} onChange={(event) => loadRecipe(event.target.value)}>
                  {recipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.name}</option>)}
                </select>
              </div>
              <Button className="self-end" variant="secondary" onClick={() => setSelectedRecipeId("")}>Custom plate</Button>
            </div>
            <div className="grid gap-3 md:grid-cols-[1.2fr_.8fr]">
              <div>
                <Label htmlFor="meal-name">Meal name</Label>
                <Input id="meal-name" value={mealName} onChange={(event) => setMealName(event.target.value)} placeholder="Chicken, rice and sauce" />
              </div>
              <div>
                <Label htmlFor="meal-slot">Meal slot</Label>
                <select id="meal-slot" className={selectClass} value={mealSlot} onChange={(event) => setMealSlot(event.target.value as MealSlot)}>
                  {mealSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                </select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_8rem_auto]">
              <div>
                <Label htmlFor="food-adder">Food</Label>
                <select id="food-adder" className={selectClass} value={foodId} onChange={(event) => setFoodId(event.target.value)}>
                  {foods.map((food) => <option key={food.id} value={food.id}>{food.name}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="food-quantity">Amount</Label>
                <Input id="food-quantity" min={0} type="number" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
              </div>
              <Button className="self-end" type="button" onClick={addFood}><Plus size={15} />Add</Button>
            </div>
            <div className="grid gap-2">
              {items.map((item) => (
                <div key={item.id} className="grid gap-3 rounded-xl bg-mist/50 p-3 text-sm md:grid-cols-[1fr_7rem_auto] md:items-center">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-muted">{macroValue(item.macros)}</p>
                  </div>
                  <Input min={0} type="number" value={item.quantity} aria-label={`${item.name} amount`} onChange={(event) => updateItemQuantity(item.id, Number(event.target.value))} />
                  <Button variant="quiet" type="button" aria-label={`Remove ${item.name}`} onClick={() => setItems((current) => current.filter((value) => value.id !== item.id))}>
                    <Trash2 size={15} />
                  </Button>
                </div>
              ))}
            </div>
            <TotalsStrip macros={totals} />
            <Button type="button" disabled={!mealName.trim() || items.length === 0} onClick={logMeal}>Log meal</Button>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading title="Today Logged" supporting={`${todaysMeals.length} meals`} />
          <div className="grid gap-3">
            {todaysMeals.length === 0 ? <p className="rounded-xl bg-mist/50 p-4 text-sm text-muted">No meals logged today.</p> : null}
            {todaysMeals.map((meal) => {
              const macros = mealMacros(meal);
              return (
                <div key={meal.id} className="rounded-xl bg-mist/50 p-4">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-medium">{meal.name}</p>
                      <p className="text-sm text-muted">{meal.mealSlot ?? "meal"} · {macroValue(macros)}</p>
                    </div>
                    <Pill tone="stone">{meal.items?.length ?? 1} items</Pill>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

const Recipes = () => {
  const { data, update } = useGarden();
  const foods = data.nutrition.foods;
  const [name, setName] = useState("");
  const [mealSlot, setMealSlot] = useState<MealSlot>("lunch");
  const [ingredients, setIngredients] = useState<Array<{ id: string; foodId: string; quantity: number }>>([]);
  const [foodId, setFoodId] = useState(foods[0]?.id ?? "");
  const [quantity, setQuantity] = useState(100);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const builderMacros = useMemo(() => {
    const recipe = { id: "draft", name, mealSlot, ingredients } satisfies { id: string; name: string; mealSlot: MealSlot; ingredients: RecipeIngredient[] };
    return recipeMacros(recipe, foods);
  }, [foods, ingredients, mealSlot, name]);

  const resetBuilder = () => {
    setName("");
    setMealSlot("lunch");
    setIngredients([]);
    setEditingRecipeId(null);
  };

  const addIngredient = () => {
    if (!foodId) return;
    setIngredients((current) => [...current, { id: createId(), foodId, quantity: Math.max(quantity, 0) }]);
  };

  const saveRecipe = () => {
    if (!name.trim() || ingredients.length === 0) return;
    const recipeId = editingRecipeId ?? createId();
    update((current) => ({
      ...current,
      nutrition: {
        ...current.nutrition,
        recipes: editingRecipeId
          ? current.nutrition.recipes.map((recipe) => recipe.id === editingRecipeId
            ? { ...recipe, name: name.trim(), mealSlot, ingredients, custom: true }
            : recipe)
          : [{ id: recipeId, name: name.trim(), mealSlot, ingredients, custom: true }, ...current.nutrition.recipes],
        deletedRecipeIds: (current.nutrition.deletedRecipeIds ?? []).filter((id) => id !== recipeId),
      },
    }));
    resetBuilder();
  };

  const editRecipe = (recipeId: string) => {
    const recipe = data.nutrition.recipes.find((item) => item.id === recipeId);
    if (!recipe) return;
    setEditingRecipeId(recipe.id);
    setName(recipe.name);
    setMealSlot(recipe.mealSlot);
    setIngredients(recipe.ingredients.map((ingredient) => ({ ...ingredient, id: ingredient.id || createId() })));
  };

  const deleteRecipe = (recipeId: string) => {
    update((current) => ({
      ...current,
      nutrition: {
        ...current.nutrition,
        recipes: current.nutrition.recipes.filter((recipe) => recipe.id !== recipeId),
        deletedRecipeIds: [...new Set([...(current.nutrition.deletedRecipeIds ?? []), recipeId])],
      },
    }));
    if (editingRecipeId === recipeId) resetBuilder();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="p-6">
        <SectionHeading
          title={editingRecipeId ? "Edit Recipe" : "Recipe Builder"}
          supporting={editingRecipeId ? "You are editing this preset in place." : "Preset meals with editable quantities."}
          action={editingRecipeId ? <Button variant="quiet" type="button" onClick={resetBuilder}><X size={15} />Cancel</Button> : null}
        />
        <div className="grid gap-4">
          <div>
            <Label htmlFor="recipe-name">Recipe name</Label>
            <Input id="recipe-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Chicken bowl, high day" />
          </div>
          <div>
            <Label htmlFor="recipe-slot">Meal slot</Label>
            <select id="recipe-slot" className={selectClass} value={mealSlot} onChange={(event) => setMealSlot(event.target.value as MealSlot)}>
              {mealSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_7rem_auto]">
            <div>
              <Label htmlFor="recipe-food">Food</Label>
              <select id="recipe-food" className={selectClass} value={foodId} onChange={(event) => setFoodId(event.target.value)}>
                {foods.map((food) => <option key={food.id} value={food.id}>{food.name}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="recipe-amount">Amount</Label>
              <Input id="recipe-amount" min={0} type="number" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
            </div>
            <Button className="self-end" type="button" onClick={addIngredient}><Plus size={15} />Add</Button>
          </div>
          <div className="grid gap-2">
            {ingredients.map((ingredient) => {
              const food = foods.find((item) => item.id === ingredient.foodId);
              return (
                <div key={ingredient.id} className="grid gap-2 rounded-xl bg-mist/50 p-3 text-sm sm:grid-cols-[1fr_6rem_auto] sm:items-center">
                  <span>{food?.name ?? "Missing food"}</span>
                  <Input min={0} type="number" value={ingredient.quantity} aria-label={`${food?.name ?? "Ingredient"} amount`} onChange={(event) => setIngredients((current) => current.map((item) => item.id === ingredient.id ? { ...item, quantity: Number(event.target.value) } : item))} />
                  <Button variant="quiet" type="button" aria-label={`Remove ${food?.name ?? "ingredient"}`} onClick={() => setIngredients((current) => current.filter((item) => item.id !== ingredient.id))}>
                    <Trash2 size={15} />
                  </Button>
                </div>
              );
            })}
          </div>
          <TotalsStrip macros={builderMacros} />
          <Button type="button" disabled={!name.trim() || ingredients.length === 0} onClick={saveRecipe}>
            <Save size={15} />{editingRecipeId ? "Update recipe" : "Save recipe"}
          </Button>
        </div>
      </Card>

      <div className="grid gap-3">
        {data.nutrition.recipes.map((recipe) => {
          const macros = recipeMacros(recipe, foods);
          return (
            <div key={recipe.id} className="rounded-2xl border border-ink/6 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{recipe.name}</p>
                  <p className="mt-1 text-sm text-muted">{recipe.mealSlot} · {macroValue(macros)}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="quiet" type="button" aria-label={`Edit ${recipe.name}`} onClick={() => editRecipe(recipe.id)}>
                    <Pencil size={15} />
                  </Button>
                  <Button
                    variant="quiet"
                    type="button"
                    aria-label={`Delete ${recipe.name}`}
                    onClick={() => deleteRecipe(recipe.id)}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {recipe.ingredients.map((ingredient) => {
                  const food = foods.find((item) => item.id === ingredient.foodId);
                  return <span key={ingredient.id} className="rounded-full bg-mist px-3 py-1 text-xs text-muted">{food?.name ?? "Missing food"} · {format(ingredient.quantity, 1)}{food?.unit}</span>;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Foods = () => {
  const { data, update } = useGarden();
  const [draft, setDraft] = useState<FoodPreset>({
    id: "draft",
    name: "",
    category: "protein",
    unit: "g",
    baseQuantity: 100,
    servingLabel: "100g",
    macros: zeroMacros(),
    custom: true,
  });
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);

  const updateMacro = (key: keyof MacroBreakdown, value: number) => {
    setDraft((current) => ({ ...current, macros: { ...current.macros, [key]: cleanNumber(value) } }));
  };

  const resetFoodDraft = () => {
    setEditingFoodId(null);
    setDraft({
      id: "draft",
      name: "",
      category: "protein",
      unit: "g",
      baseQuantity: 100,
      servingLabel: "100g",
      macros: zeroMacros(),
      custom: true,
    });
  };

  const saveFood = () => {
    if (!draft.name.trim()) return;
    const foodIdValue = editingFoodId ?? createId();
    const nextFood = { ...draft, id: foodIdValue, name: draft.name.trim(), custom: true };
    update((current) => ({
      ...current,
      nutrition: {
        ...current.nutrition,
        foods: editingFoodId
          ? current.nutrition.foods.map((food) => food.id === editingFoodId ? nextFood : food)
          : [nextFood, ...current.nutrition.foods],
        deletedFoodIds: (current.nutrition.deletedFoodIds ?? []).filter((id) => id !== foodIdValue),
      },
    }));
    resetFoodDraft();
  };

  const editFood = (foodIdValue: string) => {
    const food = data.nutrition.foods.find((item) => item.id === foodIdValue);
    if (!food) return;
    setEditingFoodId(food.id);
    setDraft({ ...food, custom: true });
  };

  const deleteFood = (foodIdValue: string) => {
    update((current) => ({
      ...current,
      nutrition: {
        ...current.nutrition,
        foods: current.nutrition.foods.filter((food) => food.id !== foodIdValue),
        recipes: current.nutrition.recipes.map((recipe) => ({
          ...recipe,
          ingredients: recipe.ingredients.filter((ingredient) => ingredient.foodId !== foodIdValue),
        })),
        deletedFoodIds: [...new Set([...(current.nutrition.deletedFoodIds ?? []), foodIdValue])],
      },
    }));
    if (editingFoodId === foodIdValue) resetFoodDraft();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <Card className="p-6">
        <SectionHeading
          title={editingFoodId ? "Edit Food Preset" : "Food Preset"}
          supporting={editingFoodId ? "Update the macro label for this saved preset." : "Brand labels and repeat ingredients."}
          action={editingFoodId ? <Button variant="quiet" type="button" onClick={resetFoodDraft}><X size={15} />Cancel</Button> : null}
        />
        <div className="grid gap-4">
          <div>
            <Label htmlFor="food-name">Name</Label>
            <Input id="food-name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Nando's peri-peri sauce" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="food-category">Category</Label>
              <select id="food-category" className={selectClass} value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value as FoodPreset["category"] }))}>
                {foodCategories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="food-unit">Unit</Label>
              <select id="food-unit" className={selectClass} value={draft.unit} onChange={(event) => setDraft((current) => ({ ...current, unit: event.target.value as NutritionUnit }))}>
                {nutritionUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="base-quantity">Base amount</Label>
              <Input id="base-quantity" min={1} type="number" value={draft.baseQuantity} onChange={(event) => setDraft((current) => ({ ...current, baseQuantity: Math.max(Number(event.target.value), 1) }))} />
            </div>
            <div>
              <Label htmlFor="serving-label">Serving label</Label>
              <Input id="serving-label" value={draft.servingLabel} onChange={(event) => setDraft((current) => ({ ...current, servingLabel: event.target.value }))} placeholder="15g" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <MacroInput label="Calories" value={draft.macros.calories} onChange={(value) => updateMacro("calories", value)} />
            <MacroInput label="Protein" value={draft.macros.proteinGrams} onChange={(value) => updateMacro("proteinGrams", value)} />
            <MacroInput label="Carbs" value={draft.macros.carbsGrams} onChange={(value) => updateMacro("carbsGrams", value)} />
            <MacroInput label="Fat" value={draft.macros.fatGrams} onChange={(value) => updateMacro("fatGrams", value)} />
            <MacroInput label="Fiber" value={draft.macros.fiberGrams} onChange={(value) => updateMacro("fiberGrams", value)} />
            <MacroInput label="Sodium" value={draft.macros.sodiumMg} onChange={(value) => updateMacro("sodiumMg", value)} />
          </div>
          <Button type="button" disabled={!draft.name.trim()} onClick={saveFood}>
            <Save size={15} />{editingFoodId ? "Update food" : "Save food"}
          </Button>
        </div>
      </Card>

      <div className="grid gap-3">
        {data.nutrition.foods.map((food) => (
          <div key={food.id} className="rounded-2xl border border-ink/6 bg-white p-5 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{food.name}</p>
                <p className="mt-1 text-sm text-muted">{food.servingLabel} · {macroValue(food.macros)}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="quiet" type="button" aria-label={`Edit ${food.name}`} onClick={() => editFood(food.id)}>
                  <Pencil size={15} />
                </Button>
                <Button
                  variant="quiet"
                  type="button"
                  aria-label={`Delete ${food.name}`}
                  onClick={() => deleteFood(food.id)}
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MacroInput = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => (
  <div>
    <Label htmlFor={`macro-${label}`}>{label}</Label>
    <Input id={`macro-${label}`} min={0} type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
  </div>
);

const Targets = () => {
  const { data, update } = useGarden();
  const [settings, setSettings] = useState<NutritionSettings>(data.nutrition.settings);
  const maintenance = settings.bmrCalories + settings.activityCalories + (settings.wearableAdjustmentCalories ?? 0);
  const plannedDeficit = maintenance - settings.calorieTarget;

  const setNumber = (key: keyof NutritionSettings, value: number) => {
    setSettings((current) => ({ ...current, [key]: cleanNumber(value) }));
  };

  const saveSettings = () => {
    update((current) => ({
      ...current,
      profile: {
        ...current.profile,
        proteinTarget: settings.proteinTargetGrams,
      },
      nutrition: {
        ...current.nutrition,
        settings,
      },
    }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="p-6">
        <SectionHeading title="Target Engine" supporting={`${format(maintenance)} kcal maintenance · ${format(plannedDeficit)} kcal planned deficit`} />
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <MacroInput label="BMR" value={settings.bmrCalories} onChange={(value) => setNumber("bmrCalories", value)} />
            <MacroInput label="Activity" value={settings.activityCalories} onChange={(value) => setNumber("activityCalories", value)} />
            <MacroInput label="Wearable adjustment" value={settings.wearableAdjustmentCalories ?? 0} onChange={(value) => setNumber("wearableAdjustmentCalories", value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <MacroInput label="Calories" value={settings.calorieTarget} onChange={(value) => setNumber("calorieTarget", value)} />
            <MacroInput label="Protein" value={settings.proteinTargetGrams} onChange={(value) => setNumber("proteinTargetGrams", value)} />
            <MacroInput label="Carbs" value={settings.carbsTargetGrams} onChange={(value) => setNumber("carbsTargetGrams", value)} />
            <MacroInput label="Fat" value={settings.fatTargetGrams} onChange={(value) => setNumber("fatTargetGrams", value)} />
            <MacroInput label="Fiber" value={settings.fiberTargetGrams} onChange={(value) => setNumber("fiberTargetGrams", value)} />
            <MacroInput label="Sodium" value={settings.sodiumLimitMg} onChange={(value) => setNumber("sodiumLimitMg", value)} />
          </div>
          <Button type="button" onClick={saveSettings}><Save size={15} />Save targets</Button>
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeading title="Cut Math" supporting="Manual now, wearable-ready later." />
        <div className="grid gap-3">
          {[
            ["BMR", settings.bmrCalories],
            ["Activity", settings.activityCalories],
            ["Wearable adjustment", settings.wearableAdjustmentCalories ?? 0],
            ["Estimated maintenance", maintenance],
            ["Calorie target", settings.calorieTarget],
            ["Planned deficit", plannedDeficit],
          ].map(([label, value]) => (
            <div key={label} className={cn("flex items-center justify-between rounded-xl bg-mist/50 px-4 py-3 text-sm", label === "Planned deficit" && "bg-sage/12 text-forest")}>
              <span>{label}</span>
              <span className="font-medium">{format(value as number)} kcal</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const Groceries = () => {
  const { data, update } = useGarden();
  const [item, setItem] = useState("");
  return (
    <Card className="max-w-2xl p-6">
      <SectionHeading title="Groceries" supporting="Only what supports planned meals." />
      <form className="mb-5 flex gap-2" onSubmit={(event) => { event.preventDefault(); if (!item.trim()) return; update((current) => ({ ...current, groceries: [...current.groceries, { id: createId(), label: item.trim(), complete: false }] })); setItem(""); }}>
        <Input value={item} onChange={(event) => setItem(event.target.value)} placeholder="Add grocery item" />
        <Button type="submit">Add</Button>
      </form>
      {data.groceries.map((grocery) => (
        <label key={grocery.id} className="mb-2 flex items-center gap-3 rounded-xl bg-mist/50 p-4 text-sm">
          <input type="checkbox" checked={grocery.complete} onChange={() => update((current) => ({ ...current, groceries: current.groceries.map((value) => value.id === grocery.id ? { ...value, complete: !value.complete } : value) }))} />
          <span className={grocery.complete ? "text-muted line-through" : ""}>{grocery.label}</span>
        </label>
      ))}
    </Card>
  );
};
