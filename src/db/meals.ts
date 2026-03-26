import { db } from "./database";
import { localISOString, localDateString } from "../utils/time";

export interface MealRow {
  raw_text: string;
  calories_estimated: number;
  timestamp: string;
  notes: string | null;
}

export function saveMeal(userId: number, rawText: string, notes?: string): void {
  db.prepare(`
    INSERT INTO meals (user_id, raw_text, calories_estimated, notes, timestamp)
    VALUES (?, ?, 0, ?, ?)
  `).run(userId, rawText, notes ?? null, localISOString());
}

export function getTodayMeals(userId: number): MealRow[] {
  const today = localDateString();
  return db.prepare(`
    SELECT raw_text, calories_estimated, notes, timestamp
    FROM meals
    WHERE user_id = ? AND substr(timestamp, 1, 10) = ?
    ORDER BY timestamp ASC
  `).all(userId, today) as MealRow[];
}
