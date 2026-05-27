import type { CompiledArticle, ParserConfig, SourceDocument } from './types';

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

export async function compileArticle(query: string, documents: SourceDocument[], config: ParserConfig): Promise<CompiledArticle | null> {
  if (!config.geminiApiKey) {
    console.warn('GEMINI_API_KEY is not set. Parser will not generate new content.');
    return null;
  }

  const corpus = documents.map((document, index) => {
    return `SOURCE ${index + 1}\nTitle: ${document.title}\nURL: ${document.url}\nText:\n${document.text.slice(0, 8000)}`;
  }).join('\n\n---\n\n');

  const prompt = `
You are compiling a Russian technical troubleshooting article.
Hard rules:
- Use ONLY facts present in the provided sources.
- Do not invent commands, registry keys, paths, screenshots, causes, or symptoms.
- Every solution step must be supported by at least one provided source.
- If source evidence is insufficient, return {"publish":false,"reason":"..."}.
- Do not copy source prose verbatim. Rewrite concisely in Russian.
- Do not include unrelated links or promotional text.

Return strict JSON only with this shape:
{
  "publish": true,
  "confidence": 0.0,
  "title": "...",
  "errorId": "optional",
  "category": "Windows|Linux|Игры|Веб-разработка",
  "tags": ["..."],
  "description": "...",
  "symptoms": ["..."],
  "causes": ["..."],
  "steps": [{"title":"...","body":"...","command":null}],
  "body": "additional Markdown notes",
  "sourceUrls": ["..."]
}

Query: ${query}

Sources:
${corpus}
`.trim();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.geminiModel)}:generateContent?key=${encodeURIComponent(config.geminiApiKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed with ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
  if (!text) return null;

  const parsed = JSON.parse(text);
  if (!parsed.publish || Number(parsed.confidence || 0) < config.publishThreshold) {
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

function normalizeCategory(category: string) {
  const allowed = new Set(['Windows', 'Linux', 'Игры', 'Веб-разработка']);
  return allowed.has(category) ? category : 'Веб-разработка';
}
