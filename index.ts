import { Bot, session } from "grammy";
import type { MyContext, SessionData } from "./src/types";
import "./src/db/database";
import { registerCommandHandlers } from "./src/handlers/commands";
import { registerMessageHandlers } from "./src/handlers/messages";
import { registerCallbackHandlers } from "./src/handlers/callbacks";

const bot = new Bot<MyContext>(process.env.BOT_TOKEN!);

bot.use(session({ initial: (): SessionData => ({}) }));

registerCommandHandlers(bot);
registerMessageHandlers(bot);
registerCallbackHandlers(bot);

bot.start();
console.log("Bot started");
