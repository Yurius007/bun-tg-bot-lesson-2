import { db } from "./database";
import { localISOString, localDateString } from "../utils/time";

export interface MealRow {
  raw_text: string;
  calories_estimated: number;
  ai_json: string | null;
  notes: string | null;
  timestamp: string;
}

export function saveMeal(
  userId: number,
  rawText: string,
  caloriesEstimated: number,
  aiJson?: string,
  notes?: string,
): void {
  db.prepare(`
    INSERT INTO meals (user_id, raw_text, calories_estimated, ai_json, notes, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, rawText, caloriesEstimated, aiJson ?? null, notes ?? null, localISOString());
}

export function getTodayMeals(userId: number): MealRow[] {
  const today = localDateString();
  return db.prepare(`
    SELECT raw_text, calories_estimated, ai_json, notes, timestamp
    FROM meals
    WHERE user_id = ? AND substr(timestamp, 1, 10) = ?
    ORDER BY timestamp ASC
  `).all(userId, today) as MealRow[];
}
