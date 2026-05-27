import { blake2b } from 'blakejs';
import nacl from 'tweetnacl';
import type { BootstrapEnv } from './env';

type GitHubRepo = {
  name: string;
  full_name: string;
  clone_url: string;
  ssh_url: string;
  html_url: string;
  owner: { login: string };
};

type GitHubPublicKey = {
  key_id: string;
  key: string;
};

async function githubFetch<T>(env: BootstrapEnv, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${env.githubToken}`,
      'x-github-api-version': '2022-11-28',
      ...(init.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API ${path} failed with ${response.status}: ${await response.text()}`);
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  const text = await response.text();
  if (!text.trim()) return undefined as T;

  return JSON.parse(text) as T;
}

export async function getGitHubUser(env: BootstrapEnv) {
  return githubFetch<{ login: string }>(env, '/user');
}

export async function createRepository(env: BootstrapEnv): Promise<GitHubRepo> {
  try {
    return await githubFetch<GitHubRepo>(env, '/user/repos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: env.repositoryName,
        private: env.repositoryPrivate,
        auto_init: false,
        description: 'SEO-friendly static knowledge base for computer and software error solutions.'
      })
    });
  } catch (error) {
    const user = await getGitHubUser(env);
    console.warn(`Repository creation returned an error. Trying to reuse ${user.login}/${env.repositoryName}.`);
    return githubFetch<GitHubRepo>(env, `/repos/${user.login}/${env.repositoryName}`);
  }
}

export async function addGitHubSecret(env: BootstrapEnv, repo: GitHubRepo, name: string, value: string) {
  const publicKey = await githubFetch<GitHubPublicKey>(env, `/repos/${repo.full_name}/actions/secrets/public-key`);
  const encryptedBytes = sealGitHubSecret(Buffer.from(value), Buffer.from(publicKey.key, 'base64'));
  const encryptedValue = Buffer.from(encryptedBytes).toString('base64');

  await githubFetch(env, `/repos/${repo.full_name}/actions/secrets/${name}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ encrypted_value: encryptedValue, key_id: publicKey.key_id })
  });
}

function sealGitHubSecret(message: Uint8Array, publicKey: Uint8Array): Uint8Array {
  const ephemeral = nacl.box.keyPair();
  const nonceInput = new Uint8Array(ephemeral.publicKey.length + publicKey.length);
  nonceInput.set(ephemeral.publicKey);
  nonceInput.set(publicKey, ephemeral.publicKey.length);

  const nonce = blake2b(nonceInput, undefined, 24);
  const box = nacl.box(message, nonce, publicKey, ephemeral.secretKey);
  const sealed = new Uint8Array(ephemeral.publicKey.length + box.length);
  sealed.set(ephemeral.publicKey);
  sealed.set(box, ephemeral.publicKey.length);
  return sealed;
}

export async function seedRepositorySecrets(env: BootstrapEnv, repo: GitHubRepo) {
  const secrets: Record<string, string | undefined> = {
    CLOUDFLARE_API_TOKEN: env.cloudflareToken,
    CLOUDFLARE_ZONE_ID: env.cloudflareZoneId,
    CLOUDFLARE_ACCOUNT_ID: env.cloudflareAccountId,
    GEMINI_API_KEY: env.geminiApiKey,
    GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    SERPER_API_KEY: env.serperApiKey
  };

  for (const [name, value] of Object.entries(secrets)) {
    if (!value) continue;
    await addGitHubSecret(env, repo, name, value);
    console.log(`GitHub secret configured: ${name}`);
  }
}
