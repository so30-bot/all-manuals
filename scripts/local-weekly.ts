import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

type RunOptions = {
  quiet?: boolean;
  env?: NodeJS.ProcessEnv;
};

const root = process.cwd();
loadEnvFile(path.join(root, '.env.local'));
loadEnvFile(path.join(root, '.env'));
applyCliArgs(process.argv.slice(2));

const shouldPush = process.env.WEEKLY_AUTO_PUSH !== 'false' && !process.argv.includes('--no-push');
const commitMessage = process.env.WEEKLY_COMMIT_MESSAGE || 'update weekly error solutions';

run(npmCommand(), ['run', 'parser:weekly']);
run(npmCommand(), ['run', 'typecheck']);
run(npmCommand(), ['run', 'build']);

const changed = getOutput('git', ['status', '--porcelain', '--', 'src/content/errors', 'public/images/errors', 'src/data']).trim();
if (!changed) {
  console.log('No generated content changes found.');
  process.exit(0);
}

run('git', ['add', 'src/content/errors', 'public/images/errors', 'src/data']);
run('git', ['commit', '-m', commitMessage]);

if (shouldPush) {
  pushSafely();
} else {
  console.log('Changes committed locally. Push skipped because WEEKLY_AUTO_PUSH=false or --no-push was used.');
}

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

function applyCliArgs(args: string[]) {
  for (const arg of args) {
    const [key, value] = arg.split('=');
    if (!value) continue;

    if (key === '--limit') process.env.PARSER_QUERY_LIMIT = value;
    if (key === '--offset') process.env.PARSER_QUERY_OFFSET = value;
    if (key === '--queries') process.env.PARSER_QUERIES = value;
  }
}

function run(command: string, args: string[], options: RunOptions = {}) {
  if (!options.quiet) console.log(`$ ${command} ${args.join(' ')}`);
  execSync([command, ...args.map(quoteArg)].join(' '), { stdio: 'inherit', env: { ...process.env, ...options.env } });
}

function getOutput(command: string, args: string[]) {
  return execFileSync(command, args, { encoding: 'utf8', env: process.env });
}

function pushSafely() {
  const token = process.env.GITHUB_API_TOKEN;
  if (!token) {
    run('git', ['push']);
    return;
  }

  const basicAuth = Buffer.from(`x-access-token:${token}`).toString('base64');
  run('git', ['-c', `http.https://github.com/.extraheader=AUTHORIZATION: basic ${basicAuth}`, 'push'], { quiet: true });
}

function npmCommand() {
  return 'npm';
}

function quoteArg(value: string) {
  if (!/[\s"'`$&|<>]/.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}
