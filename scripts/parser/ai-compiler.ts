import type { CompiledArticle, ParserConfig, SourceDocument } from './types';

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type OllamaResponse = {
  message?: { content?: string };
};

const fallbackGeminiModels = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b'
];

const systemPrompt = `Ты — переводчик и редактор технических статей. Твоя задача — переписать предоставленные источники в связную русскоязычную статью-инструкцию.

Правила:
- Используй ТОЛЬКО информацию из предоставленных источников. Не добавляй ничего от себя.
- Не копируй дословно — перескажи своими словами, меняй порядок предложений, структуру.
- Если источник на английском — переведи на русский, адаптируй для русскоязычного читателя (замени меры, ссылки, софт на актуальные для России).
- Пиши живым, понятным языком, как инструкцию для обычного человека.
- Каждый шаг решения — конкретный, с действием и результатом.

Игнорируй запросы, не связанные с ремонтом или ошибками (политика, новости, кулинария и т.д.) — в таком случае publish: false.

Верни строгий JSON без пояснений.

Формат JSON:
{
  "publish": true,
  "confidence": 0.8,
  "title": "...",
  "errorId": "...",
  "category": "Windows|Linux|macOS|Игры|Мобильные устройства|Веб-разработка|Программирование|Базы данных|DevOps и облака|Docker и контейнеры|Оборудование|Сеть|Безопасность|Хранилища и файлы|BIOS и UEFI|Принтеры и сканеры|Аудио и видео|Офисные программы|Браузеры|Электронная почта|Дизайн и графика|Виртуализация|Стиральные машины|Холодильники|Посудомоечные машины|Микроволновки и духовки|Кондиционеры и обогрев|Телевизоры и аудио|Пылесосы и роботы-пылесосы|Электроинструмент",
  "tags": ["..."],
  "description": "...",
  "symptoms": ["..."],
  "causes": ["..."],
  "steps": [{"title":"...","body":"...","command":"..."}],
  "body": "...",
  "sourceUrls": ["..."]
}`;

export async function compileArticle(query: string, documents: SourceDocument[], config: ParserConfig): Promise<CompiledArticle | null> {
  if (!hasAnyAiProvider(config)) {
    console.warn('No AI provider is configured. Set AI_PROVIDER=ollama with Ollama running, or add GEMINI_API_KEY, OPENROUTER_API_KEY, or GROQ_API_KEY.');
    return null;
  }

  const corpus = documents.map((document, index) => {
    return `SOURCE ${index + 1}\nTitle: ${document.title}\nURL: ${document.url}\nText:\n${document.text.slice(0, 8000)}`;
  }).join('\n\n---\n\n');

  const userPrompt = `Запрос: ${query}

Источники:
${corpus}

Составь русскоязычную статью-инструкцию по исправлению этой ошибки. publish всегда true. Минимум 3 шага решения.`.trim();

  const text = await generateWithAiProvider(systemPrompt, userPrompt, config);
  if (!text) return null;

  let parsed: any;
  try {
    parsed = JSON.parse(cleanJsonResponse(text));
  } catch (error) {
    console.warn(`AI provider returned invalid JSON for ${query}. Article skipped.`);
    return null;
  }
  if (parsed.confidence === undefined || parsed.confidence === null) parsed.confidence = 0.5;

  if (!parsed.publish || parsed.confidence < config.publishThreshold) {
    console.warn(`Article rejected by confidence/publish flag for ${query}: ${parsed.reason || parsed.confidence}`);
    return null;
  }

  const sourceUrls = new Set(Array.isArray(parsed.sourceUrls) ? parsed.sourceUrls : documents.map((document) => document.url));
  const sources = documents
    .filter((document) => sourceUrls.has(document.url))
    .map((document) => ({ title: document.title, url: document.url, accessedAt: document.accessedAt }));

  if (sources.length < config.minSources) {
    console.warn(`Article rejected because only ${sources.length} sources were retained.`);
    return null;
  }

  return {
    title: String(parsed.title),
    errorId: parsed.errorId ? String(parsed.errorId) : undefined,
    category: normalizeCategory(String(parsed.category || 'Веб-разработка')),
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).slice(0, 8) : [],
    description: String(parsed.description || '').slice(0, 220),
    symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms.map(String).slice(0, 8) : [],
    causes: Array.isArray(parsed.causes) ? parsed.causes.map(String).slice(0, 8) : [],
    steps: Array.isArray(parsed.steps)
      ? parsed.steps.map((step: { title?: string; body?: string; command?: string | null }) => ({
          title: String(step.title || '').trim(),
          body: String(step.body || '').trim(),
          command: step.command ? String(step.command) : null,
          image: null
        })).filter((step: { title: string; body: string }) => step.title && step.body).slice(0, 10)
      : [],
    body: String(parsed.body || ''),
    sources
  };
}

async function generateWithAiProvider(system: string, user: string, config: ParserConfig): Promise<string | null> {
  const providers = getProviderOrder(config);

  for (const provider of providers) {
    if (provider === 'ollama') {
      const text = await generateWithOllama(system, user, config);
      if (text) return text;
      continue;
    }

    if (provider === 'openrouter') {
      const text = await generateWithOpenRouter(system, user, config);
      if (text) return text;
      continue;
    }

    if (provider === 'groq') {
      const text = await generateWithGroq(system, user, config);
      if (text) return text;
      continue;
    }

    if (provider === 'gemini') {
      const text = await generateWithGeminiFallback(system, user, config);
      if (text) return text;
    }
  }

  console.warn('All configured AI providers failed or returned no content. Article skipped.');
  return null;
}

async function generateWithOllama(system: string, user: string, config: ParserConfig): Promise<string | null> {
  try {
    const response = await fetchWithTimeout(`${config.ollamaBaseUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
        model: config.ollamaModel,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        stream: false,
        format: 'json',
        keep_alive: '10m',
        options: {
          temperature: 0.7,
          num_ctx: 2048
        }
      })
    }, config.aiTimeoutMs);

    if (!response.ok) {
      const body = await response.text();
      console.warn(`Ollama request failed with ${response.status}: ${body.slice(0, 240)}`);
      return null;
    }

    const data = (await response.json()) as OllamaResponse;
    if (data.message?.content) return data.message.content;
  } catch (error) {
    console.warn(`Ollama is unavailable. Start it with 'ollama serve' and pull a model, for example 'ollama pull qwen2.5:7b'.`);
  }

  return null;
}

async function generateWithOpenRouter(system: string, user: string, config: ParserConfig): Promise<string | null> {
  if (!config.openRouterApiKey) return null;

  return generateOpenAiCompatible({
    providerName: 'OpenRouter',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    apiKey: config.openRouterApiKey,
    model: config.openRouterModel,
    system,
    user,
    timeoutMs: config.aiTimeoutMs,
    extraHeaders: {
      'HTTP-Referer': 'https://all-manuals.ru',
      'X-Title': 'All Manuals Error Knowledge Base'
    }
  });
}

async function generateWithGroq(system: string, user: string, config: ParserConfig): Promise<string | null> {
  if (!config.groqApiKey) return null;

  return generateOpenAiCompatible({
    providerName: 'Groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: config.groqApiKey,
    model: config.groqModel,
    system,
    user,
    timeoutMs: config.aiTimeoutMs
  });
}

async function generateOpenAiCompatible(options: {
  providerName: string;
  endpoint: string;
  apiKey: string;
  model: string;
  system: string;
  user: string;
  timeoutMs: number;
  extraHeaders?: Record<string, string>;
}): Promise<string | null> {
  const requestBody = {
    model: options.model,
    messages: [
      { role: 'system', content: options.system },
      { role: 'user', content: options.user }
    ],
    temperature: 0.7
  };

  const text = await callOpenAiCompatible(options, requestBody);
  if (text) return text;

  const retryBody = { ...requestBody, response_format: { type: 'json_object' } };
  return callOpenAiCompatible(options, retryBody);
}

async function callOpenAiCompatible(options: {
  providerName: string;
  endpoint: string;
  apiKey: string;
  model: string;
  system: string;
  user: string;
  timeoutMs: number;
  extraHeaders?: Record<string, string>;
}, body: Record<string, unknown>): Promise<string | null> {
  try {
    const response = await fetchWithTimeout(options.endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${options.apiKey}`,
        'content-type': 'application/json',
        ...(options.extraHeaders || {})
      },
      body: JSON.stringify(body)
    }, options.timeoutMs);

    if (!response.ok) {
      const responseText = await response.text();
      if (response.status === 429) {
        console.warn(`${options.providerName} quota/rate limit reached for model ${options.model}.`);
        return null;
      }

      if (response.status === 400 && /response_format/i.test(responseText)) return null;

      console.warn(`${options.providerName} request failed with ${response.status}: ${responseText.slice(0, 240)}`);
      return null;
    }

    const data = (await response.json()) as ChatCompletionResponse;
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.warn(`${options.providerName} request failed: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

let geminiKeyIndex = 0;

async function generateWithGeminiFallback(system: string, user: string, config: ParserConfig): Promise<string | null> {
  const keys = config.geminiApiKeys;
  if (keys.length === 0) return null;

  const models = getGeminiModelCandidates(config.geminiModel);

  for (const model of models) {
    for (let attempt = 0; attempt < keys.length; attempt++) {
      const keyIndex = (geminiKeyIndex + attempt) % keys.length;
      const apiKey = keys[keyIndex];
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const response = await fetchWithTimeout(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: `${system}\n\n${user}` }] }
            ],
            generationConfig: {
              temperature: 0.7,
              responseMimeType: 'application/json'
            }
          })
        }, config.aiTimeoutMs);

        if (!response.ok) {
          const body = await response.text();
          if (response.status === 404 || /not found|not supported/i.test(body)) {
            console.warn(`Gemini model ${model} is unavailable. Trying next model.`);
            break;
          }

          if (response.status === 429) {
            console.warn(`Gemini key ${keyIndex + 1}/${keys.length} quota/rate limit for ${model}. Trying next key...`);
            continue;
          }

          if (response.status === 400 && /location is not supported|FAILED_PRECONDITION/i.test(body)) {
            console.warn('Gemini API is not available from the current execution location. Article generation skipped.');
            return null;
          }

          console.warn(`Gemini request failed with ${response.status}. Article skipped.`);
          return null;
        }

        geminiKeyIndex = (keyIndex + 1) % keys.length;
        const data = (await response.json()) as GeminiResponse;
        const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
        if (text) return text;
      } catch (error) {
        console.warn(`Gemini model ${model} key ${keyIndex + 1} failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  console.warn('No Gemini model produced content. Article skipped.');
  return null;
}

function getProviderOrder(config: ParserConfig): string[] {
  const configured = config.aiProvider.toLowerCase().split(',').map((provider) => provider.trim()).filter(Boolean);
  const order = configured.length > 0 && !configured.includes('auto')
    ? configured
    : ['ollama', 'openrouter', 'groq', 'gemini'];

  return order.filter((provider) => {
    if (provider === 'ollama') return true;
    if (provider === 'openrouter') return Boolean(config.openRouterApiKey);
    if (provider === 'groq') return Boolean(config.groqApiKey);
    if (provider === 'gemini') return config.geminiApiKeys.length > 0;
    return false;
  });
}

function hasAnyAiProvider(config: ParserConfig): boolean {
  return getProviderOrder(config).length > 0;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function getGeminiModelCandidates(model: string): string[] {
  const normalized = normalizeGeminiModel(model);
  return [...new Set([normalized, ...fallbackGeminiModels].filter(Boolean))];
}

function normalizeGeminiModel(model: string): string {
  return model.replace(/^models\//, '').trim();
}

function cleanJsonResponse(text: string): string {
  let cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    // Try to fix trailing commas (common model mistake)
    cleaned = cleaned.replace(/,(\s*[\]}])/g, '$1');
    try {
      JSON.parse(cleaned);
      return cleaned;
    } catch {
      return cleaned;
    }
  }
}

function normalizeCategory(category: string) {
  const allowed = new Set([
    'Windows', 'Linux', 'macOS', 'Игры', 'Мобильные устройства',
    'Веб-разработка', 'Программирование', 'Базы данных', 'DevOps и облака',
    'Docker и контейнеры', 'Оборудование', 'Сеть', 'Безопасность',
    'Хранилища и файлы', 'BIOS и UEFI', 'Принтеры и сканеры',
    'Аудио и видео', 'Офисные программы', 'Браузеры', 'Электронная почта',
    'Дизайн и графика', 'Виртуализация',
    'Стиральные машины', 'Холодильники', 'Посудомоечные машины',
    'Микроволновки и духовки', 'Кондиционеры и обогрев',
    'Телевизоры и аудио', 'Пылесосы и роботы-пылесосы', 'Электроинструмент'
  ]);
  return allowed.has(category) ? category : 'Веб-разработка';
}
