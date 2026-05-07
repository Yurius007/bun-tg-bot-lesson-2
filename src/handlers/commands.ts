import type { Bot } from "grammy";
import type { MyContext } from "../types";
import { loadUser } from "../db/users";
import { getTodayMeals } from "../db/meals";
import type { CalorieEstimate } from "../utils/gemini";

export function registerCommandHandlers(bot: Bot<MyContext>): void {
  bot.command("start", (ctx) =>
    ctx.reply(
      "Привіт! 👋\nДоступні команди:\n" +
      "/set_profile — налаштувати профіль\n" +
      "/my_profile — переглянути профіль\n" +
      "/add_meal — записати прийом їжі\n" +
      "/today — що з'їли сьогодні"
    )
  );

  bot.command("set_profile", async (ctx) => {
    ctx.session = { step: "age" };
    await ctx.reply("Крок 1️⃣ Введіть ваш вік:");
  });

  bot.command("my_profile", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const p = loadUser(userId);
    if (!p) return ctx.reply("Профіль ще не заповнено. Використайте /set_profile");
    await ctx.reply(
      `📋 Ваш профіль:\n` +
      `Вік: ${p.age} р.\n` +
      `Зріст: ${p.height} см\n` +
      `Вага: ${p.weight} кг\n` +
      `Стать: ${p.sex === "male" ? "Чоловіча" : "Жіноча"}\n` +
      `Активність: ${p.activity}\n\n` +
      `🔥 BMR: ${p.bmr.toFixed(0)} ккал/день\n` +
      `⚡ TDEE: ${p.tdee.toFixed(0)} ккал/день`
    );
  });

  bot.command("add_meal", async (ctx) => {
    ctx.session = { step: "meal_input" };
    await ctx.reply("🍽️ Що ви їли?");
  });

  bot.command("today", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const meals = getTodayMeals(userId);
    if (meals.length === 0) {
      return ctx.reply("Сьогодні ще немає записаних прийомів їжі.");
    }

    const totalKcal = meals.reduce((sum, m) => sum + m.calories_estimated, 0);

    const MEAL_ICONS = ["🥣", "🥗", "🍽️", "🥙", "🍱", "🫕", "🥘", "🍲"];

    const lines = meals.map((m, i) => {
      const time = new Date(m.timestamp).toLocaleTimeString("uk-UA", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Kyiv",
      });
      const icon = MEAL_ICONS[i % MEAL_ICONS.length];
      const notes = m.notes ? `\n    📝 ${m.notes}` : "";

      let itemLines = "";
      if (m.ai_json) {
        try {
          const est = JSON.parse(m.ai_json) as CalorieEstimate;
          itemLines =
            "\n" +
            est.items
              .map((it) => `    • ${it.name} — ${Math.round(it.calories)} ккал`)
              .join("\n");
        } catch {
          // ignore malformed json
        }
      }

      const kcal = m.calories_estimated > 0
        ? ` *(${Math.round(m.calories_estimated)} ккал)*`
        : "";

      return `${icon} *${m.raw_text}*${kcal}\n    🕐 ${time}${itemLines}${notes}`;
    });

    const date = new Date().toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "long",
      timeZone: "Europe/Kyiv",
    });

    await ctx.reply(
      `📅 *${date}*\n` +
      `━━━━━━━━━━━━━━━\n\n` +
      `${lines.join("\n\n")}\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `📊 Всього: *${totalKcal.toFixed(0)} ккал*`,
      { parse_mode: "Markdown" }
    );
  });
}
