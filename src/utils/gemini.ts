import { GoogleGenAI } from "@google/genai";

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
