# Настройка API-ключей для GitHub Actions (CI)

## Что нужно

Для автоматической еженедельной генерации статей на GitHub Actions нужно добавить **один** AI-ключ:

### OpenRouter (рекомендую)
1. Зарегистрироваться: https://openrouter.ai
2. Получить API-ключ в разделе Keys
3. Бесплатные модели: `qwen/qwen-2.5-7b-instruct:free`, `google/gemma-2-9b-it:free`
4. Добавить в `https://github.com/so30-bot/all-manuals/settings/secrets/actions`:
   - `OPENROUTER_API_KEY` = ключ

### Groq (альтернатива)
1. Зарегистрироваться: https://console.groq.com
2. Получить API-ключ
3. Добавить в Secrets: `GROQ_API_KEY` = ключ

### Serper (для качества поиска — желательно)
1. Зарегистрироваться: https://serper.dev (2500 бесплатных запросов)
2. Добавить в Secrets: `SERPER_API_KEY` = ключ

## После добавления ключей

CI будет запускаться каждое воскресенье автоматически.
Можно также запустить вручную: https://github.com/so30-bot/all-manuals/actions/workflows/weekly-parser.yml
