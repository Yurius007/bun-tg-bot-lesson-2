import { db } from "./database";
import type { Profile } from "../types";

export function saveUser(telegramId: number, p: Profile): void {
  db.prepare(`
    INSERT INTO users (telegram_id, age, weight, height, sex, activity_level, bmr, tdee)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(telegram_id) DO UPDATE SET
      age            = excluded.age,
      weight         = excluded.weight,
      height         = excluded.height,
      sex            = excluded.sex,
      activity_level = excluded.activity_level,
      bmr            = excluded.bmr,
      tdee           = excluded.tdee
  `).run(telegramId, p.age, p.weight, p.height, p.sex, p.activity, p.bmr, p.tdee);
}

export function loadUser(telegramId: number): Profile | null {
  const row = db.prepare(`SELECT * FROM users WHERE telegram_id = ?`).get(telegramId) as any;
  if (!row) return null;
  return {
    age: row.age,
    weight: row.weight,
    height: row.height,
    sex: row.sex as "male" | "female",
    activity: row.activity_level,
    bmr: row.bmr,
    tdee: row.tdee,
  };
}
