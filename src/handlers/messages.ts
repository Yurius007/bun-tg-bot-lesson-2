import { InlineKeyboard, type Bot } from "grammy";
import type { MyContext } from "../types";
import { saveMeal } from "../db/meals";
import { estimateCalories } from "../utils/gemini";

export function registerMessageHandlers(bot: Bot<MyContext>): void {
  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text.trim();
    const s = ctx.session;

    if (!s.step) return;

    if (s.step === "meal_input") {
      const userId = ctx.from?.id;
      if (!userId) return;

      await ctx.reply("⏳ Аналізую калорії...");

      const estimate = await estimateCalories(text);

      if (!estimate) {
        return ctx.reply("❌ Не вдалося проаналізувати їжу. Спробуйте описати простіше.");
      }

      saveMeal(userId, text, estimate.total_calories, JSON.stringify(estimate));
      s.step = undefined;

      const itemLines = estimate.items
        .map((item) => `• ${item.name} — ${Math.round(item.calories)} ккал`)
        .join("\n");

      return ctx.reply(
        `✅ Знайдено:\n\n${itemLines}\n\n` +
        `🔥 Всього: *${Math.round(estimate.total_calories)} ккал*\n` +
        `📊 Confidence: ${estimate.confidence.toFixed(2)}\n\n` +
        `_Примітка: це орієнтовна оцінка калорій._`,
        { parse_mode: "Markdown" },
      );
    }

    if (s.step === "age") {
      const age = Number(text);
      if (!Number.isInteger(age) || age < 10 || age > 100) {
        return ctx.reply("❌ Ще мало каші з'їв. \n\nВік має бути числом від 10 до 100. Спробуйте ще раз:");
      }
      s.age = age;
      s.step = "height";
      return ctx.reply("Крок 2️⃣ Введіть ваш зріст (см):");
    }

    if (s.step === "height") {
      const height = Number(text);
      if (!Number.isFinite(height) || height < 100 || height > 250) {
        return ctx.reply("❌ Зріст має бути числом від 100 до 250 см. Спробуйте ще раз:");
      }
      s.height = height;
      s.step = "weight";
      return ctx.reply("Крок 3️⃣ Введіть вашу вагу (кг):");
    }

    if (s.step === "weight") {
      const weight = Number(text);
      if (!Number.isFinite(weight) || weight < 30 || weight > 300) {
        return ctx.reply("❌ Вага має бути числом від 30 до 300 кг. Спробуйте ще раз:");
      }
      s.weight = weight;
      s.step = "sex";
      const sexKeyboard = new InlineKeyboard()
        .text("👨 Чоловіча", "sex:male")
        .text("👩 Жіноча", "sex:female");
      return ctx.reply("Крок 4️⃣ Оберіть стать:", { reply_markup: sexKeyboard });
    }
  });
}
