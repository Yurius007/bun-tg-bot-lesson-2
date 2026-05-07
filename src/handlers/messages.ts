import { InlineKeyboard, type Bot } from "grammy";
import type { MyContext } from "../types";
import { saveMeal } from "../db/meals";
import { estimateCalories } from "../utils/gemini";
import { mainMenu } from "../utils/menu";
import { checkRateLimit } from "../utils/rateLimit";

export function registerMessageHandlers(bot: Bot<MyContext>): void {
  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text.trim();
    const s = ctx.session;

    if (!s.step) return;

    if (s.step === "meal_input") {
      const userId = ctx.from?.id;
      if (!userId) return;

      const waitSec = checkRateLimit(userId);
      if (waitSec !== null) {
        return ctx.reply(`⏳ Зачекайте ще ${waitSec} с перед наступним запитом.`);
      }

      await ctx.reply("⏳ Аналізую калорії...");

      const estimate = await estimateCalories(text);

      if (!estimate) {
        s.step = undefined;
        return ctx.reply(
          "❌ Не вдалося проаналізувати їжу. Спробуйте описати простіше.",
          { reply_markup: mainMenu }
        );
      }

      try {
        saveMeal(userId, text, estimate.total_calories, JSON.stringify(estimate));
      } catch (e) {
        console.error("[DB] saveMeal failed:", e);
        s.step = undefined;
        return ctx.reply("Сталася помилка. Спробуйте ще раз пізніше.", { reply_markup: mainMenu });
      }
      s.step = undefined;

      const itemLines = estimate.items
        .map((item) => `• ${item.name} — ${Math.round(item.calories)} ккал`)
        .join("\n");

      return ctx.reply(
        `✅ Знайдено:\n\n${itemLines}\n\n` +
        `🔥 Всього: *${Math.round(estimate.total_calories)} ккал*\n` +
        `📊 Confidence: ${estimate.confidence.toFixed(2)}\n\n` +
        `_Примітка: це орієнтовна оцінка калорій._`,
        { parse_mode: "Markdown", reply_markup: mainMenu },
      );
    }

    if (s.step === "age") {
      const age = Number(text);
      if (!Number.isInteger(age) || age < 10 || age > 100) {
        return ctx.reply("❌ Будь ласка, введіть вік від 10 до 100 (ціле число):");
      }
      s.age = age;
      s.step = "height";
      return ctx.reply("Крок 2️⃣ Введіть ваш зріст у см (число від 100 до 250):");
    }

    if (s.step === "height") {
      const height = Number(text);
      if (!Number.isFinite(height) || height < 100 || height > 250) {
        return ctx.reply("❌ Будь ласка, введіть зріст від 100 до 250 см:");
      }
      s.height = height;
      s.step = "weight";
      return ctx.reply("Крок 3️⃣ Введіть вашу вагу в кг (число від 30 до 300):");
    }

    if (s.step === "weight") {
      const weight = Number(text);
      if (!Number.isFinite(weight) || weight < 30 || weight > 300) {
        return ctx.reply("❌ Будь ласка, введіть вагу від 30 до 300 кг:");
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
