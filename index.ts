import { Bot, GrammyError, HttpError, session } from "grammy";
import type { MyContext, SessionData } from "./src/types";
import "./src/db/database";
import { registerCommandHandlers } from "./src/handlers/commands";
import { registerMessageHandlers } from "./src/handlers/messages";
import { registerCallbackHandlers } from "./src/handlers/callbacks";
import { mainMenu } from "./src/utils/menu";

const bot = new Bot<MyContext>(process.env.BOT_TOKEN!);

bot.use(session({ initial: (): SessionData => ({}) }));

registerCommandHandlers(bot);
registerMessageHandlers(bot);
registerCallbackHandlers(bot);

bot.catch(async (err) => {
  const ctx = err.ctx;
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("[Bot] Telegram API error:", e.description);
  } else if (e instanceof HttpError) {
    console.error("[Bot] Network error:", e);
  } else {
    console.error("[Bot] Unhandled error:", e);
  }
  try {
    await ctx.reply("Сталася помилка. Спробуйте ще раз пізніше.", { reply_markup: mainMenu });
  } catch {
    // best-effort: if even the reply fails, just log and move on
  }
});

bot.start();
console.log("Bot started");
