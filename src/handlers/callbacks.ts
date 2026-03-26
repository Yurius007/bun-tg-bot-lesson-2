import { InlineKeyboard, type Bot } from "grammy";
import type { MyContext } from "../types";
import { saveUser } from "../db/users";
import { calculateBMR, calculateTDEE } from "../utils/calories";

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

    const userId = ctx.from?.id;
    if (!userId) return ctx.answerCallbackQuery();

    const activity = ctx.match[1]!;
    const bmr = calculateBMR(s.weight!, s.height!, s.age!, s.sex!);
    const tdee = calculateTDEE(bmr, activity);

    saveUser(userId, {
      age: s.age!,
      height: s.height!,
      weight: s.weight!,
      sex: s.sex!,
      activity,
      bmr,
      tdee,
    });

    s.step = undefined;

    await ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup();

    await ctx.reply(
      `✅ Профіль збережено!\n\n🔥 BMR: ${bmr.toFixed(0)} ккал/день\n⚡ TDEE: ${tdee.toFixed(0)} ккал/день\n\nВикористайте /my_profile для перегляду.`
    );
  });
}
