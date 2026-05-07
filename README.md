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

- `/start` — привітання та головне меню (➕ Add meal / 📊 Today / ⚙️ Set profile)
- `/set_profile` — налаштувати профіль (вік, зріст, вага, стать, активність); рахує BMR і TDEE
- `/my_profile` — переглянути збережений профіль
- `/add_meal` — записати прийом їжі: бот надсилає опис у Gemini, повертає список продуктів з грамами та калоріями, зберігає в БД
- `/today` — показати всі прийоми їжі за сьогодні з підсумковою кількістю калорій

## Надійність

- Reply-keyboard меню після `/start`, `/add_meal`, `/today`, збереження профілю
- Валідація вводу: вік 10–100, зріст 100–250 см, вага 30–300 кг
- Глобальний `bot.catch` ловить непередбачені помилки → користувач отримує: «Сталася помилка. Спробуйте ще раз пізніше.»
- Запит до Gemini має 1 додаткову повторну спробу при невдачі
- Rate-limit: один запит `/add_meal` на 5 секунд для одного користувача

## Стек

- Bun + TypeScript
- grammy (Telegram Bot API)
- bun:sqlite (локальна БД `food_tracker.db`)
- @google/genai (модель `gemini-2.5-flash`)
