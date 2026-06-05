import type { Bot } from "grammy";
import type { MyContext } from "../types";
import { loadUser } from "../db/users";
import { getTodayMeals } from "../db/meals";
import { suggestMeals, type CalorieEstimate } from "../utils/gemini";
import { ADD_MEAL, PLAN, SET_PROFILE, TODAY, mainMenu } from "../utils/menu";
import { GOAL_DESCRIPTION, GOAL_LABEL, recommendedCalories } from "../utils/calories";

async function startSetProfile(ctx: MyContext): Promise<void> {
  ctx.session = { step: "age" };
  await ctx.reply("Крок 1️⃣ Введіть ваш вік (повних років, число від 10 до 100):");
}

async function startAddMeal(ctx: MyContext): Promise<void> {
  ctx.session = { step: "meal_input" };
  await ctx.reply("🍽️ Що ви їли? Опишіть звичайними словами (напр. «2 яйця і тост»):");
}

async function showPlan(ctx: MyContext): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  let p;
  try {
    p = loadUser(userId);
  } catch (e) {
    console.error("[DB] loadUser failed:", e);
    await ctx.reply("Сталася помилка. Спробуйте ще раз пізніше.", { reply_markup: mainMenu });
    return;
  }

  if (!p) {
    await ctx.reply("Спочатку заповніть профіль через /set_profile", { reply_markup: mainMenu });
    return;
  }

  if (!p.goal) {
    await ctx.reply("Оновіть профіль і виберіть вашу ціль", { reply_markup: mainMenu });
    return;
  }

  const target = recommendedCalories(p.tdee, p.goal);

  await ctx.reply(
    `🎯 *Ваш план*\n\n` +
    `Ваша ціль: ${GOAL_LABEL[p.goal]}\n\n` +
    `Рекомендована норма:\n*${target.toFixed(0)} ккал / день*\n\n` +
    `${GOAL_DESCRIPTION[p.goal]}`,
    { parse_mode: "Markdown", reply_markup: mainMenu }
  );

  const ideas = await suggestMeals(target, p.goal);
  if (ideas && ideas.length > 0) {
    await ctx.reply(
      `🍽️ *Ідеї страв:*\n` +
      ideas.map((m) => `• ${m}`).join("\n") +
      `\n\n_Це загальні рекомендації, а не медична порада._`,
      { parse_mode: "Markdown", reply_markup: mainMenu }
    );
  } else {
    await ctx.reply(
      `_Це загальні рекомендації, а не медична порада._`,
      { parse_mode: "Markdown", reply_markup: mainMenu }
    );
  }
}

async function showToday(ctx: MyContext): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  let meals;
  try {
    meals = getTodayMeals(userId);
  } catch (e) {
    console.error("[DB] getTodayMeals failed:", e);
    await ctx.reply("Сталася помилка. Спробуйте ще раз пізніше.", { reply_markup: mainMenu });
    return;
  }

  if (meals.length === 0) {
    await ctx.reply("Сьогодні ще немає записаних прийомів їжі.", { reply_markup: mainMenu });
    return;
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
    { parse_mode: "Markdown", reply_markup: mainMenu }
  );
}

export function registerCommandHandlers(bot: Bot<MyContext>): void {
  bot.command("start", (ctx) =>
    ctx.reply(
      "Привіт! 👋\nОберіть дію в меню нижче або скористайтесь командами:\n" +
      "/set_profile — налаштувати профіль\n" +
      "/my_profile — переглянути профіль\n" +
      "/add_meal — записати прийом їжі\n" +
      "/today — що з'їли сьогодні\n" +
      "/plan — денна норма калорій під вашу ціль",
      { reply_markup: mainMenu }
    )
  );

  bot.command("set_profile", startSetProfile);
  bot.hears(SET_PROFILE, startSetProfile);

  bot.command("add_meal", startAddMeal);
  bot.hears(ADD_MEAL, startAddMeal);

  bot.command("today", showToday);
  bot.hears(TODAY, showToday);

  bot.command("plan", showPlan);
  bot.hears(PLAN, showPlan);

  bot.command("my_profile", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    let p;
    try {
      p = loadUser(userId);
    } catch (e) {
      console.error("[DB] loadUser failed:", e);
      return ctx.reply("Сталася помилка. Спробуйте ще раз пізніше.", { reply_markup: mainMenu });
    }
    if (!p) return ctx.reply("Профіль ще не заповнено. Використайте /set_profile", { reply_markup: mainMenu });
    const goalLine = p.goal
      ? `Ціль: ${GOAL_LABEL[p.goal]}\n`
      : `Ціль: не обрана (пройдіть /set_profile, щоб додати)\n`;
    await ctx.reply(
      `📋 Ваш профіль:\n` +
      `Вік: ${p.age} р.\n` +
      `Зріст: ${p.height} см\n` +
      `Вага: ${p.weight} кг\n` +
      `Стать: ${p.sex === "male" ? "Чоловіча" : "Жіноча"}\n` +
      `Активність: ${p.activity}\n` +
      goalLine +
      `\n🔥 BMR: ${p.bmr.toFixed(0)} ккал/день\n` +
      `⚡ TDEE: ${p.tdee.toFixed(0)} ккал/день`,
      { reply_markup: mainMenu }
    );
  });
}
