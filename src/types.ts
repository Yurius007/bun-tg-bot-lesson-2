export interface Profile {
  age: number;
  height: number;
  weight: number;
  sex: "male" | "female";
  activity: string;
  bmr: number;
  tdee: number;
}

export interface SessionData {
  step?: "age" | "height" | "weight" | "sex" | "activity" | "meal_input";
  age?: number;
  height?: number;
  weight?: number;
  sex?: "male" | "female";
}

export type MyContext = import("grammy").Context & { session: SessionData };
