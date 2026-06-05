import type { Goal } from "../types";

export const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  low: 1.2,
  light: 1.375,
  medium: 1.55,
  high: 1.725,
};

export function calculateBMR(weight: number, height: number, age: number, sex: "male" | "female"): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function calculateTDEE(bmr: number, activity: string): number {
  return bmr * (ACTIVITY_MULTIPLIERS[activity] ?? 1.2);
}

export const GOAL_ADJUSTMENT: Record<Goal, number> = {
  lose: -400,
  maintain: 0,
  gain: 300,
};

export const GOAL_LABEL: Record<Goal, string> = {
  lose: "🔻 Схуднення",
  maintain: "⚖️ Підтримка",
  gain: "🔺 Набір маси",
};

export const GOAL_DESCRIPTION: Record<Goal, string> = {
  lose: "Це помірний дефіцит калорій для поступового зниження ваги.",
  maintain: "Калорії дорівнюють TDEE — поточна вага має зберігатися.",
  gain: "Це невеликий профіцит для поступового набору переважно м'язової маси.",
};

export function recommendedCalories(tdee: number, goal: Goal): number {
  return tdee + GOAL_ADJUSTMENT[goal];
}
