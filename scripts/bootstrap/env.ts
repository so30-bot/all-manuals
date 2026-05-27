export type BootstrapEnv = {
  githubToken: string;
  cloudflareToken: string;
  cloudflareAccountId?: string;
  cloudflareZoneId: string;
  domainName: string;
  repositoryName: string;
  repositoryPrivate: boolean;
  geminiApiKey?: string;
  serperApiKey?: string;
};

export function getBootstrapEnv(): BootstrapEnv {
  const required = {
    githubToken: process.env.GITHUB_API_TOKEN,
    cloudflareToken: process.env.CLOUDFLARE_API_TOKEN,
    cloudflareZoneId: process.env.CLOUDFLARE_ZONE_ID,
    domainName: process.env.DOMAIN_NAME || 'all-manuals.ru'
  };

  const missing = Object.entries(required).filter(([, value]) => !value).map(([key]) => key);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    githubToken: required.githubToken!,
    cloudflareToken: required.cloudflareToken!,
    cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    cloudflareZoneId: required.cloudflareZoneId!,
    domainName: required.domainName!,
    repositoryName: process.env.REPOSITORY_NAME || 'all-manuals',
    repositoryPrivate: process.env.REPOSITORY_PRIVATE === 'true',
    geminiApiKey: process.env.GEMINI_API_KEY,
    serperApiKey: process.env.SERPER_API_KEY
  };
}
