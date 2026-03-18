import { Bot, session, InlineKeyboard } from "grammy";

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  low: 1.2,
  light: 1.375,
  medium: 1.55,
  high: 1.725,
};

function calculateBMR(weight: number, height: number, age: number, sex: "male" | "female"): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

function calculateTDEE(bmr: number, activity: string): number {
  return bmr * (ACTIVITY_MULTIPLIERS[activity] ?? 1.2);
}

interface Profile {
  age: number;
  height: number;
  weight: number;
  sex: "male" | "female";
  activity: string;
  bmr: number;
  tdee: number;
}

interface SessionData {
  step?: "age" | "height" | "weight" | "sex" | "activity";
  age?: number;
  height?: number;
  weight?: number;
  sex?: "male" | "female";
  profile?: Profile;
}

type MyContext = import("grammy").Context & { session: SessionData };

const bot = new Bot<MyContext>(process.env.BOT_TOKEN!);

bot.use(session({ initial: (): SessionData => ({}) }));

bot.command("start", (ctx) =>
  ctx.reply("Привіт! 👋\nДоступні команди:\n/set_profile — налаштувати профіль\n/my_profile — переглянути профіль")
);

bot.command("set_profile", async (ctx) => {
  ctx.session = { step: "age" };
  await ctx.reply("Крок 1️⃣ Введіть ваш вік:");
});

bot.command("my_profile", async (ctx) => {
  const p = ctx.session.profile;
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

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim();
  const s = ctx.session;

  if (!s.step) return;

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

  const activity = ctx.match[1]!;
  const bmr = calculateBMR(s.weight!, s.height!, s.age!, s.sex!);
  const tdee = calculateTDEE(bmr, activity);

  s.profile = {
    age: s.age!,
    height: s.height!,
    weight: s.weight!,
    sex: s.sex!,
    activity,
    bmr,
    tdee,
  };
  s.step = undefined;

  await ctx.answerCallbackQuery();
  await ctx.editMessageReplyMarkup();

  await ctx.reply(
    `✅ Профіль збережено!\n\n🔥 BMR: ${bmr.toFixed(0)} ккал/день\n⚡ TDEE: ${tdee.toFixed(0)} ккал/день\n\nВикористайте /my_profile для перегляду.`
  );
});

bot.start();
console.log("Bot started");
