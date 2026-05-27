import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { configureZoneSecurity, addPagesDomain, createPagesProject, resolveAccountId, upsertDnsRecord } from './cloudflare';
import { getBootstrapEnv } from './env';
import { createRepository, seedRepositorySecrets } from './github';

function run(command: string, args: string[], options: { quiet?: boolean } = {}) {
  if (!options.quiet) console.log(`$ ${command} ${args.join(' ')}`);
  execFileSync(command, args, { stdio: 'inherit' });
}

function ensureGitRepository(remoteUrl: string, githubToken: string) {
  if (!existsSync('.git')) {
    run('git', ['init']);
    run('git', ['branch', '-M', 'main']);
  }

  run('git', ['config', '--local', 'user.name', 'all-manuals-bot']);
  run('git', ['config', '--local', 'user.email', 'bot@all-manuals.ru']);

  try {
    run('git', ['remote', 'get-url', 'origin']);
  } catch {
    run('git', ['remote', 'add', 'origin', remoteUrl]);
  }

  run('git', ['add', '.']);
  try {
    run('git', ['commit', '-m', 'initial all manuals site']);
  } catch {
    console.log('No local changes to commit or commit already exists.');
  }
  const basicAuth = Buffer.from(`x-access-token:${githubToken}`).toString('base64');
  run('git', ['-c', `http.https://github.com/.extraheader=AUTHORIZATION: basic ${basicAuth}`, 'push', '-u', 'origin', 'main'], { quiet: true });
}

async function main() {
  const env = getBootstrapEnv();
  const repo = await createRepository(env);

  if (process.env.SKIP_CLOUDFLARE === 'true') {
    await seedRepositorySecrets(env, repo);
    ensureGitRepository(repo.clone_url, env.githubToken);
    console.log('GitHub bootstrap complete. Cloudflare steps were skipped.');
    console.log(`GitHub: ${repo.html_url}`);
    return;
  }

  const accountId = await resolveAccountId(env);
  const envWithAccount = { ...env, cloudflareAccountId: accountId };
  const project = await createPagesProject(envWithAccount, accountId, repo.full_name);
  await addPagesDomain(envWithAccount, accountId, project.name);
  await upsertDnsRecord(envWithAccount, project.subdomain);
  await configureZoneSecurity(envWithAccount);
  await seedRepositorySecrets(envWithAccount, repo);
  ensureGitRepository(repo.clone_url, env.githubToken);

  console.log('Bootstrap complete.');
  console.log(`GitHub: ${repo.html_url}`);
  console.log(`Cloudflare Pages: https://${project.subdomain}`);
  console.log(`Production domain: https://${env.domainName}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
