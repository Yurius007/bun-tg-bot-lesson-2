import { InlineKeyboard, type Bot } from "grammy";
import type { Goal, MyContext } from "../types";
import { saveUser } from "../db/users";
import { calculateBMR, calculateTDEE, GOAL_LABEL } from "../utils/calories";
import { mainMenu } from "../utils/menu";

export function registerCallbackHandlers(bot: Bot<MyContext>): void {
  bot.callbackQuery(/^sex:(male|female)$/, async (ctx) => {
    const s = ctx.session;
    if (s.step !== "sex") return ctx.answerCallbackQuery();

    s.sex = ctx.match[1] as "male" | "female";
    s.step = "activity";
    await ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup();

    const activityKeyboard = new InlineKeyboard()
      .text("🛋️ Мінімальна (low)", "activity:low").row()
      .text("🚶 Легка (light)", "activity:light").row()
      .text("🏃 Середня (medium)", "activity:medium").row()
      .text("💪 Висока (high)", "activity:high");

    await ctx.reply("Крок 5️⃣ Оберіть рівень активності:", { reply_markup: activityKeyboard });
  });

  bot.callbackQuery(/^activity:(low|light|medium|high)$/, async (ctx) => {
    const s = ctx.session;
    if (s.step !== "activity") return ctx.answerCallbackQuery();

    s.activity = ctx.match[1]!;
    s.bmr = calculateBMR(s.weight!, s.height!, s.age!, s.sex!);
    s.tdee = calculateTDEE(s.bmr, s.activity);
    s.step = "goal";

    await ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup();

    const goalKeyboard = new InlineKeyboard()
      .text(GOAL_LABEL.lose, "goal:lose").row()
      .text(GOAL_LABEL.maintain, "goal:maintain").row()
      .text(GOAL_LABEL.gain, "goal:gain");

    await ctx.reply("Крок 6️⃣ Яка ваша ціль?", { reply_markup: goalKeyboard });
  });

  bot.callbackQuery(/^goal:(lose|maintain|gain)$/, async (ctx) => {
    const s = ctx.session;
    if (s.step !== "goal") return ctx.answerCallbackQuery();

    const userId = ctx.from?.id;
    if (!userId) return ctx.answerCallbackQuery();

    const goal = ctx.match[1] as Goal;

    try {
      saveUser(userId, {
        age: s.age!,
        height: s.height!,
        weight: s.weight!,
        sex: s.sex!,
        activity: s.activity!,
        bmr: s.bmr!,
        tdee: s.tdee!,
        goal,
      });
    } catch (e) {
      console.error("[DB] saveUser failed:", e);
      s.step = undefined;
      await ctx.answerCallbackQuery();
      await ctx.editMessageReplyMarkup();
      await ctx.reply("Сталася помилка. Спробуйте ще раз пізніше.", { reply_markup: mainMenu });
      return;
    }

    s.step = undefined;

    await ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup();

    await ctx.reply(
      `✅ Профіль збережено!\n\n` +
      `🔥 BMR: ${s.bmr!.toFixed(0)} ккал/день\n` +
      `⚡ TDEE: ${s.tdee!.toFixed(0)} ккал/день\n` +
      `🎯 Ціль: ${GOAL_LABEL[goal]}\n\n` +
      `Натисніть 📋 Plan для персональної рекомендації.`,
      { reply_markup: mainMenu }
    );
  });
}
