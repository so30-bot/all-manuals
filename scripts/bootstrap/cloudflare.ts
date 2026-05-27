import type { BootstrapEnv } from './env';

type CloudflareResult<T> = {
  success: boolean;
  errors: Array<{ message: string }>;
  result: T;
};

type Account = { id: string; name: string };
type Zone = { id: string; account: { id: string; name: string } };
type PagesProject = { name: string; subdomain: string };

async function cloudflareFetch<T>(env: BootstrapEnv, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${env.cloudflareToken}`,
      'content-type': 'application/json',
      ...(init.headers || {})
    }
  });

  const data = await response.json() as CloudflareResult<T>;
  if (!response.ok || !data.success) {
    throw new Error(`Cloudflare API ${path} failed with ${response.status}: ${JSON.stringify(data.errors)}`);
  }

  return data.result;
}

export async function resolveAccountId(env: BootstrapEnv): Promise<string> {
  if (env.cloudflareAccountId) return env.cloudflareAccountId;

  try {
    const zone = await cloudflareFetch<Zone>(env, `/zones/${env.cloudflareZoneId}`);
    if (zone.account?.id) return zone.account.id;
  } catch {
    console.warn('Could not resolve Cloudflare account from zone. Trying /accounts fallback.');
  }

  const accounts = await cloudflareFetch<Account[]>(env, '/accounts');
  if (!accounts.length) throw new Error('No Cloudflare accounts available for this token. Set CLOUDFLARE_ACCOUNT_ID manually.');
  return accounts[0].id;
}

export async function createPagesProject(env: BootstrapEnv, accountId: string, githubFullName: string) {
  const projectName = env.repositoryName.replace(/[^a-z0-9-]/gi, '-').toLowerCase();

  try {
    return await createPagesProjectRequest(env, accountId, {
      name: projectName,
      production_branch: 'main',
      build_config: {
        build_command: 'npm run build',
        destination_dir: 'dist',
        root_dir: '',
        web_analytics_tag: null,
        web_analytics_token: null
      },
      source: {
        type: 'github',
        config: {
          owner: githubFullName.split('/')[0],
          repo_name: githubFullName.split('/')[1],
          production_branch: 'main',
          pr_comments_enabled: true,
          deployments_enabled: true,
          production_deployment_enabled: true,
          preview_deployment_setting: 'custom',
          preview_branch_includes: ['*'],
          preview_branch_excludes: ['main']
        }
      }
    });
  } catch (sourceError) {
    try {
      console.warn(`Pages project creation with GitHub source returned an error. Trying to reuse ${projectName}.`);
      return await cloudflareFetch<PagesProject>(env, `/accounts/${accountId}/pages/projects/${projectName}`);
    } catch {
      console.warn('Cloudflare GitHub source integration is unavailable. Creating Pages project for API deployments.');
      return createPagesProjectRequest(env, accountId, {
        name: projectName,
        production_branch: 'main',
        build_config: {
          build_command: 'npm run build',
          destination_dir: 'dist',
          root_dir: '',
          web_analytics_tag: null,
          web_analytics_token: null
        }
      });
    }
  }
}

async function createPagesProjectRequest(env: BootstrapEnv, accountId: string, body: Record<string, unknown>) {
  return cloudflareFetch<PagesProject>(env, `/accounts/${accountId}/pages/projects`, {
      method: 'POST',
      body: JSON.stringify(body)
  });
}

export async function addPagesDomain(env: BootstrapEnv, accountId: string, projectName: string) {
  try {
    await cloudflareFetch(env, `/accounts/${accountId}/pages/projects/${projectName}/domains`, {
      method: 'POST',
      body: JSON.stringify({ name: env.domainName })
    });
    console.log(`Cloudflare Pages custom domain configured: ${env.domainName}`);
  } catch (error) {
    console.warn(`Custom domain may already exist: ${env.domainName}`);
  }
}

export async function upsertDnsRecord(env: BootstrapEnv, target: string) {
  const records = await cloudflareFetch<Array<{ id: string; name: string; type: string }>>(
    env,
    `/zones/${env.cloudflareZoneId}/dns_records?type=CNAME&name=${encodeURIComponent(env.domainName)}`
  );

  const payload = {
    type: 'CNAME',
    name: env.domainName,
    content: target,
    proxied: true,
    ttl: 1,
    comment: 'Managed by All Manuals bootstrap script'
  };

  if (records.length) {
    await cloudflareFetch(env, `/zones/${env.cloudflareZoneId}/dns_records/${records[0].id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  } else {
    await cloudflareFetch(env, `/zones/${env.cloudflareZoneId}/dns_records`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  console.log(`DNS CNAME configured: ${env.domainName} -> ${target}`);
}

export async function configureZoneSecurity(env: BootstrapEnv) {
  const settings = [
    ['always_use_https', { value: 'on' }],
    ['automatic_https_rewrites', { value: 'on' }],
    ['brotli', { value: 'on' }]
  ] as const;

  for (const [setting, body] of settings) {
    try {
      await cloudflareFetch(env, `/zones/${env.cloudflareZoneId}/settings/${setting}`, {
        method: 'PATCH',
        body: JSON.stringify(body)
      });
      console.log(`Cloudflare setting enabled: ${setting}`);
    } catch (error) {
      console.warn(`Could not configure Cloudflare setting ${setting}. Check token permissions.`);
    }
  }
}
