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
