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
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    serperApiKey: process.env.SERPER_API_KEY,
    publishThreshold: Number(process.env.PARSER_PUBLISH_THRESHOLD || 0.72)
  };
}
