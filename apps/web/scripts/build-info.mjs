import { execFileSync } from 'node:child_process';

// What the footer's build stamp shows: the latest change that went into this build.
// From git (Cloudflare Pages clones the repo), else Pages' env var, else nothing.

/** "Merge pull request #20 from user/feat/x" → "PR #20 · feat/x"; other subjects unchanged. */
export function tidySubject(subject) {
  const merge = /^Merge pull request #(\d+) from [^/\s]+\/(\S+)/.exec(subject);
  return merge ? `PR #${merge[1]} · ${merge[2]}` : subject;
}

/** Parses `git log -1 --format=%H%n%cI%n%s` output. */
export function parseLog(out) {
  const [sha, date, ...rest] = out.trim().split('\n');
  if (!sha || !/^[0-9a-f]{40}$/.test(sha)) return null;
  return { sha, date: date ?? null, subject: tidySubject(rest.join(' ').trim()) };
}

function git(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

/** { sha, date, subject } of the build, or null when unknown. */
export function buildInfo(env = process.env) {
  const fromGit = parseLog(git(['log', '-1', '--format=%H%n%cI%n%s']));
  if (fromGit) return fromGit;
  const sha = env.CF_PAGES_COMMIT_SHA?.trim();
  return sha ? { sha, date: null, subject: '' } : null;
}
