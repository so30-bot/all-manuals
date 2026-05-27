import path from 'node:path';
import rules from '../../src/data/source-rules.json' assert { type: 'json' };
import type { ParserConfig } from './types';

export function getParserConfig(): ParserConfig {
  return {
    contentDir: path.join(process.cwd(), 'src', 'content', 'errors'),
    imagesDir: path.join(process.cwd(), 'public', 'images', 'errors'),
    minSources: Number(process.env.PARSER_MIN_SOURCES || rules.minSources || 3),
    trustedDomains: rules.trustedDomains,
    blockedDomains: rules.blockedDomains,
    aiProvider: process.env.AI_PROVIDER || 'auto',
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
    ollamaModel: process.env.OLLAMA_MODEL || 'qwen2.5:7b',
    openRouterApiKey: process.env.OPENROUTER_API_KEY,
    openRouterModel: process.env.OPENROUTER_MODEL || 'qwen/qwen-2.5-7b-instruct:free',
    groqApiKey: process.env.GROQ_API_KEY,
    groqModel: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS || 180000),
    serperApiKey: process.env.SERPER_API_KEY,
    publishThreshold: Number(process.env.PARSER_PUBLISH_THRESHOLD || 0.72)
  };
}
