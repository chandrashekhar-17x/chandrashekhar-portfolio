# Contributing & Git workflow

## Branches and commits

- `main` is always deployable. Never commit to it directly (a pre-commit hook blocks it).
- Branch per change: `feat/hero-canvas`, `fix/chat-sse-timeout`, `chore/deps`.
- [Conventional Commits](https://www.conventionalcommits.org/): `feat(web): …`, `fix(api): …`,
  `docs: …`, `ci: …`, `build: …`, `chore: …`, `test: …`, `refactor: …`.
- Small commits; each one should pass `make check`.
- Open a PR → CI must be green → squash-merge.

## Local checks

`make setup` installs the git hooks. On every commit they run: whitespace/EOF fixes,
YAML/JSON/TOML checks, private-key + **gitleaks** secret scan, large-file guard, ruff, mypy,
prettier, eslint and the content validator. Run them all manually:

```bash
uv tool run pre-commit run --all-files
```

## Branch protection (GitHub → Settings → Branches → Add rule for `main`)

1. **Require a pull request before merging** (approvals: 0 is fine for a solo repo).
2. **Require status checks to pass** → search and add **`CI OK`** (the `ci-ok` job).
   It is the only check you need: it fails if any CI job failed and passes when jobs were
   skipped because their files didn't change.
3. **Require branches to be up to date before merging**.
4. **Require linear history** (squash merges).
5. **Do not allow force pushes** and **do not allow deletions**.
6. Settings → Code security: enable **Dependabot alerts**, **Dependabot security updates**
   and **Secret scanning + push protection** (free for public repos).

With the GitHub CLI (`gh`), the same rule as one command (run once after the first push):

```bash
gh api -X PUT repos/chandrashekhar-17x/chandrashekhar-portfolio/branches/main/protection \
  --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["CI OK"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

## Secrets

- Real values live only in `.env` (gitignored) and in the hosting providers' secret settings.
- `.env.example` lists every variable with an empty value; keep it complete.
- If a secret is ever committed: **rotate it first**, then remove it from history.
