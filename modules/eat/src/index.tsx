import { ModuleHeader, ModuleTabs, StatCard } from "@garden/design-system";
import { createId, todayKey } from "@garden/domain";
import { changePlan, useGarden } from "@garden/shared-state";
import { Button, Card, Input, Pill, SectionHeading } from "@garden/ui";
import { Check, Droplets, Plus } from "lucide-react";
import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import { getTodaySummary } from "./lib";

export { getTodaySummary } from "./lib";

const tabs = [
  { to: "/eat", label: "Today", end: true },
  { to: "/eat/plan", label: "Meal plan" },
  { to: "/eat/groceries", label: "Groceries" },
];

export const EatRoutes = () => (
  <>
    <ModuleHeader title="Eat" description="Food that supports energy and training, without turning life into a dashboard." />
    <ModuleTabs tabs={tabs} />
    <Routes>
      <Route index element={<EatToday />} />
      <Route path="plan" element={<MealPlanning />} />
      <Route path="groceries" element={<Groceries />} />
    </Routes>
  </>
);

const EatToday = () => {
  const { data, update } = useGarden();
  const date = todayKey();
  const summary = getTodaySummary(data);
  const plan = data.plans.find((item) => item.date === date) ?? data.plans[0];
  const [name, setName] = useState("");
  const [protein, setProtein] = useState(25);
  return (
    <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <div className="grid gap-3">
        <StatCard label="Protein" value={`${summary.proteinLogged} / ${summary.proteinTarget}g`} supporting="A guide, not an obsession." />
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><Droplets className="text-sage" /><p className="font-medium">Hydration</p></div>
            <Button variant={summary.hydrationComplete ? "secondary" : "primary"} onClick={() => update((current) => changePlan(current, date, (value) => ({ ...value, hydrationComplete: !value.hydrationComplete })))}>
              {summary.hydrationComplete ? <Check size={15} /> : null}{summary.hydrationComplete ? "Complete" : "Mark complete"}
            </Button>
          </div>
        </Card>
      </div>
      <Card className="p-6">
        <SectionHeading title="Meal log" supporting={plan?.mealSuggestion} />
        <form className="mb-5 flex gap-2" onSubmit={(event) => {
          event.preventDefault(); if (!name.trim()) return;
          update((current) => ({ ...current, meals: [...current.meals, { id: createId(), date, name: name.trim(), proteinGrams: protein }] }));
          setName("");
        }}>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Meal" />
          <Input className="w-24" type="number" min={0} value={protein} onChange={(event) => setProtein(Number(event.target.value))} aria-label="Protein grams" />
          <Button type="submit"><Plus size={15} /></Button>
        </form>
        {data.meals.filter((meal) => meal.date === date).map((meal) => <div key={meal.id} className="mb-2 flex justify-between rounded-xl bg-mist/55 p-4 text-sm"><span>{meal.name}</span><span className="text-muted">{meal.proteinGrams}g</span></div>)}
      </Card>
    </div>
  );
};

const MealPlanning = () => {
  const { data, update } = useGarden();
  const [meal, setMeal] = useState("");
  const [protein, setProtein] = useState(35);
  return (
    <Card className="p-6">
      <SectionHeading title="Meal planning" supporting="Choose meals for stable energy, not perfect measurement." />
      <form className="mb-6 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => {
        event.preventDefault(); if (!meal.trim()) return;
        update((current) => ({ ...current, mealPlans: [...current.mealPlans, { id: createId(), date: todayKey(), meal: meal.trim(), proteinGrams: protein, energySupport: "steady" }] }));
        setMeal("");
      }}>
        <Input value={meal} onChange={(event) => setMeal(event.target.value)} placeholder="Plan a meal" />
        <Input className="sm:w-28" type="number" value={protein} onChange={(event) => setProtein(Number(event.target.value))} aria-label="Planned protein" />
        <Button type="submit">Plan</Button>
      </form>
      <div className="grid gap-3 md:grid-cols-2">{data.mealPlans.map((entry) => <div key={entry.id} className="rounded-2xl bg-mist/50 p-4"><Pill>{entry.energySupport} energy</Pill><p className="mt-3 font-medium">{entry.meal}</p><p className="mt-2 text-sm text-muted">{entry.proteinGrams}g protein</p></div>)}</div>
    </Card>
  );
};

const Groceries = () => {
  const { data, update } = useGarden();
  const [item, setItem] = useState("");
  return (
    <Card className="max-w-2xl p-6">
      <SectionHeading title="Groceries" supporting="Only what supports planned meals." />
      <form className="mb-5 flex gap-2" onSubmit={(event) => { event.preventDefault(); if (!item.trim()) return; update((current) => ({ ...current, groceries: [...current.groceries, { id: createId(), label: item.trim(), complete: false }] })); setItem(""); }}>
        <Input value={item} onChange={(event) => setItem(event.target.value)} placeholder="Add grocery item" /><Button type="submit">Add</Button>
      </form>
      {data.groceries.map((grocery) => <label key={grocery.id} className="mb-2 flex items-center gap-3 rounded-xl bg-mist/50 p-4 text-sm"><input type="checkbox" checked={grocery.complete} onChange={() => update((current) => ({ ...current, groceries: current.groceries.map((value) => value.id === grocery.id ? { ...value, complete: !value.complete } : value) }))} /><span className={grocery.complete ? "text-muted line-through" : ""}>{grocery.label}</span></label>)}
    </Card>
  );
};
