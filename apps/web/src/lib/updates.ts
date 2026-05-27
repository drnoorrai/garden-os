import { getPlan, nextDayKey } from "@garden/domain";
import type { DailyPlan, GardenData } from "@garden/types";

export const changePlan = (
  data: GardenData,
  date: string,
  change: (plan: DailyPlan) => DailyPlan,
): GardenData => {
  const existing = data.plans.some((plan) => plan.date === date);
  const plan = change(getPlan(data, date));
  return {
    ...data,
    plans: existing
      ? data.plans.map((current) => (current.date === date ? plan : current))
      : [...data.plans, plan],
  };
};

export const deferTask = (data: GardenData, date: string, taskId: string): GardenData => {
  const current = getPlan(data, date);
  const item = current.tasks.find((task) => task.id === taskId);
  if (!item) return data;
  const tomorrow = nextDayKey(date);
  const without = changePlan(data, date, (plan) => ({
    ...plan,
    tasks: plan.tasks.filter((task) => task.id !== taskId),
  }));
  return changePlan(without, tomorrow, (plan) => ({
    ...plan,
    tasks: [
      ...plan.tasks,
      {
        ...item,
        status: "active",
        scheduledDate: tomorrow,
        order: plan.tasks.filter((task) => task.tier === item.tier).length,
      },
    ],
  }));
};
