# Food Tracker Bot

Telegram-бот для трекінгу калорій з оцінкою через Gemini API.

## Встановлення

```bash
bun install
```

Створіть `.env`:

```
BOT_TOKEN=<telegram_bot_token>
GEMINI_API_KEY=<google_ai_studio_key>
```

## Запуск

```bash
bun run index.ts
```

## Команди

- `/start` — привітання та список команд
- `/set_profile` — налаштувати профіль (вік, зріст, вага, стать, активність); рахує BMR і TDEE
- `/my_profile` — переглянути збережений профіль
- `/add_meal` — записати прийом їжі: бот надсилає опис у Gemini, повертає список продуктів з грамами та калоріями, зберігає в БД
- `/today` — показати всі прийоми їжі за сьогодні з підсумковою кількістю калорій

## Стек

- Bun + TypeScript
- grammy (Telegram Bot API)
- bun:sqlite (локальна БД `food_tracker.db`)
- @google/genai (модель `gemini-2.5-flash`)
