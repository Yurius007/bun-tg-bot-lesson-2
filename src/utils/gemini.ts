import { GoogleGenAI } from "@google/genai";
import type { Goal } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface CalorieItem {
  name: string;
  grams: number;
  calories: number;
}

export interface CalorieEstimate {
  items: CalorieItem[];
  total_calories: number;
  confidence: number;
}

const PROMPT = (mealText: string) => `You are a nutrition expert. Analyze the meal description and return ONLY a raw JSON object — no markdown, no code blocks, no explanation.

Meal: "${mealText}"

Required JSON format:
{
  "items": [
    { "name": "food name", "grams": estimated_grams_as_number, "calories": estimated_calories_as_number }
  ],
  "total_calories": sum_of_all_item_calories_as_number,
  "confidence": confidence_score_between_0_and_1
}`;

async function tryEstimate(mealText: string): Promise<CalorieEstimate | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: PROMPT(mealText),
    });

    const raw = response.text?.trim() ?? "";
    // strip markdown code fences if model wraps in them anyway
    const json = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    const parsed = JSON.parse(json) as CalorieEstimate;

    if (
      !Array.isArray(parsed.items) ||
      typeof parsed.total_calories !== "number" ||
      typeof parsed.confidence !== "number"
    ) {
      console.error("[Gemini] Invalid response shape:", parsed);
      return null;
    }

    return parsed;
  } catch (e) {
    console.error("[Gemini] estimateCalories error:", e);
    return null;
  }
}

export async function estimateCalories(mealText: string): Promise<CalorieEstimate | null> {
  const first = await tryEstimate(mealText);
  if (first) return first;
  console.warn("[Gemini] first attempt failed, retrying once...");
  return tryEstimate(mealText);
}

const MEAL_IDEAS_PROMPT = (calories: number, goal: Goal) => `You are a nutrition assistant. Suggest 3 simple meal ideas for a person whose daily target is ~${calories} kcal and whose goal is "${goal}" (lose=weight loss, maintain=maintenance, gain=muscle gain).

Return ONLY a raw JSON array of 3 short strings — no markdown, no code blocks, no explanation. Each string must be a meal name 3–6 words long, in Ukrainian.

Example: ["Омлет з овочами", "Курка з рисом", "Грецький йогурт з ягодами"]`;

async function trySuggestMeals(calories: number, goal: Goal): Promise<string[] | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: MEAL_IDEAS_PROMPT(calories, goal),
    });
    const raw = response.text?.trim() ?? "";
    const json = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed) || parsed.length === 0 || !parsed.every((x) => typeof x === "string")) {
      console.error("[Gemini] Invalid meal ideas shape:", parsed);
      return null;
    }
    return parsed.slice(0, 3);
  } catch (e) {
    console.error("[Gemini] suggestMeals error:", e);
    return null;
  }
}

export async function suggestMeals(calories: number, goal: Goal): Promise<string[] | null> {
  const first = await trySuggestMeals(calories, goal);
  if (first) return first;
  console.warn("[Gemini] suggestMeals first attempt failed, retrying once...");
  return trySuggestMeals(calories, goal);
}
