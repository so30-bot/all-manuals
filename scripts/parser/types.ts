export type SourceCandidate = {
  title: string;
  url: string;
  snippet?: string;
  domain: string;
};

export type SourceDocument = SourceCandidate & {
  text: string;
  accessedAt: string;
};

export type CompiledStep = {
  title: string;
  body: string;
  command?: string | null;
  image?: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  } | null;
};

export type CompiledArticle = {
  title: string;
  errorId?: string;
  category: string;
  tags: string[];
  description: string;
  symptoms: string[];
  causes: string[];
  steps: CompiledStep[];
  body: string;
  sources: Array<{ title: string; url: string; accessedAt: string }>;
};

export type ExistingArticle = {
  filePath: string;
  title: string;
  slug: string;
  errorId?: string;
  category: string;
  tags: string[];
  dedupe?: {
    titleHash: string;
    solutionHash: string;
    sourceHash: string;
  };
};

export type ParserConfig = {
  contentDir: string;
  imagesDir: string;
  minSources: number;
  trustedDomains: string[];
  blockedDomains: string[];
  aiProvider: string;
  geminiApiKey?: string;
  geminiModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  openRouterApiKey?: string;
  openRouterModel: string;
  groqApiKey?: string;
  groqModel: string;
  aiTimeoutMs: number;
  serperApiKey?: string;
  publishThreshold: number;
};
