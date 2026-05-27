import { createId, getPlan, todayKey } from "@garden/domain";
import { Button, Card, Input, Pill, SectionHeading } from "@garden/ui";
import { Check, Droplets, Plus, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { useGarden } from "../lib/garden-context";
import { changePlan } from "../lib/updates";

export const EatPage = () => {
  const { data, update } = useGarden();
  const date = todayKey();
  const plan = getPlan(data, date);
  const todaysMeals = data.meals.filter((meal) => meal.date === date);
  const totalProtein = todaysMeals.reduce((total, meal) => total + meal.proteinGrams, 0);
  const [meal, setMeal] = useState("");
  const [protein, setProtein] = useState(25);

  return (
    <>
      <header className="mb-8">
        <h1 className="font-serif text-4xl tracking-[-0.045em] sm:text-5xl">Eat</h1>
        <p className="mt-3 text-muted">Nourishment without obsession. A target, a useful idea, and water.</p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-7">
          <div className="flex items-center justify-between">
            <UtensilsCrossed className="text-sage" />
            <Pill tone={totalProtein >= data.profile.proteinTarget ? "sage" : "stone"}>
              {totalProtein} / {data.profile.proteinTarget}g protein
            </Pill>
          </div>
          <h2 className="mt-8 font-serif text-3xl tracking-tight">A simple meal idea</h2>
          <p className="mt-4 text-lg leading-8">{plan.mealSuggestion}</p>
          <p className="mt-6 rounded-2xl bg-mist/60 p-4 text-sm text-muted">Grocery note: pick up leafy greens, salmon, Greek yogurt and lemons.</p>
        </Card>
        <div className="space-y-5">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Droplets className="text-sage" size={20} />
                <p className="font-medium">Hydration</p>
              </div>
              <Button
                variant={plan.hydrationComplete ? "secondary" : "primary"}
                onClick={() => update((current) => changePlan(current, date, (value) => ({ ...value, hydrationComplete: !value.hydrationComplete })))}
              >
                {plan.hydrationComplete ? <Check size={15} /> : null}
                {plan.hydrationComplete ? "Complete" : "Mark complete"}
              </Button>
            </div>
          </Card>
          <Card className="p-6">
            <SectionHeading title="Meal log" />
            <form
              className="mb-5 grid gap-2 sm:grid-cols-[1fr_94px_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                if (!meal.trim()) return;
                update((current) => ({
                  ...current,
                  meals: [...current.meals, { id: createId(), date, name: meal.trim(), proteinGrams: protein }],
                }));
                setMeal("");
              }}
            >
              <Input value={meal} onChange={(event) => setMeal(event.target.value)} placeholder="Meal" />
              <Input type="number" min={0} value={protein} onChange={(event) => setProtein(Number(event.target.value))} aria-label="Protein grams" />
              <Button type="submit"><Plus size={15} /></Button>
            </form>
            <div className="space-y-2">
              {todaysMeals.map((entry) => (
                <div key={entry.id} className="flex justify-between rounded-xl bg-mist/50 px-4 py-3 text-sm">
                  <span>{entry.name}</span><span className="text-muted">{entry.proteinGrams}g</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};
