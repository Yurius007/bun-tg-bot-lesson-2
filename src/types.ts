export type Goal = "lose" | "maintain" | "gain";

export interface Profile {
  age: number;
  height: number;
  weight: number;
  sex: "male" | "female";
  activity: string;
  bmr: number;
  tdee: number;
  goal: Goal | null;
}

export interface SessionData {
  step?: "age" | "height" | "weight" | "sex" | "activity" | "goal" | "meal_input";
  age?: number;
  height?: number;
  weight?: number;
  sex?: "male" | "female";
  activity?: string;
  bmr?: number;
  tdee?: number;
}

export type MyContext = import("grammy").Context & { session: SessionData };
