# Testing

| Layer     | Tool                                     | What                                                        |
|-----------|------------------------------------------|-------------------------------------------------------------|
| FE unit   | Vitest or Jest + Angular Testing Library | Services, pipes, directives (tilt, magnetic), chat store    |
| FE e2e    | Playwright                               | Journeys: recruiter 60 s, chat flow, contact, theme, mobile |
| Visual    | Playwright screenshots                   | Hero, graph, cards in both themes & desktop/mobile viewports             |
| A11y      | axe-core in Playwright                   | 0 serious violations                                        |
| Perf      | Lighthouse CI                            | Budgets: LCP \< 2 s, JS initial \< 180 KB gz                |
| API       | pytest + httpx AsyncClient               | Routers, validation, rate limits, auth                      |
| DB        | pytest + testcontainers Postgres         | Migrations, vector queries                                  |
| LLM / RAG | promptfoo or Ragas                       | Faithfulness, citations, refusals, injection red-team set   |
| Load      | k6                                       | /chat at 20 concurrent, cost per 1k chats                   |

## How to run (as built)

| Command | What |
|---|---|
| `make check` | lint, types, content, unit (Vitest + Testing Library), Python tests, build, SSR smoke, e2e (incl. axe) |
| `make e2e-web` | Playwright journeys + axe, desktop (1440×900) and mobile (Pixel 7) |
| `make visual` / `make visual-update` | screenshot tests in the Playwright Docker image (48 baselines including featured, both themes) |
| `make lighthouse` | Lighthouse CI on `/`, `/work`, `/resume`: perf/a11y/best-practices/SEO ≥ 95, LCP < 2 s, CLS < 0.05 (median of 3 runs) |
| `node apps/web/scripts/parity-screens.mjs <dir>` | prototype vs app screenshots for side-by-side review |

Codex maintenance results and the manual checklist are recorded in [change-log.md](change-log.md). Visual artifacts use `apps/web/test-results-visual/`, separate from normal e2e traces.

## CI pipeline (GitHub Actions)

The site is built **once** and reused, and slow suites run in parallel:

```text
changes ─┬─ web-checks  (lint · types · unit tests)
         ├─ web-build   (build · confidentiality · SSR smoke) ─┬─ e2e 1/2 ─┐
         │                                                      ├─ e2e 2/2 ─┤
         │                                                      ├─ visual ──┤
         │                                                      └─ lighthouse ┤
         ├─ python      (lint · mypy · content · tests)                     ├─ CI OK
         └─ secrets     (gitleaks · confidentiality on source) ─────────────┘
```

- e2e, screenshots and Lighthouse run inside `mcr.microsoft.com/playwright:v1.65.0-noble`
  (browsers and system packages preinstalled), using the `web-dist` artifact from `web-build`.
- `CI OK` is still the only required check; skipped jobs (unchanged area) count as passing.
- Rehearse a shard locally: `docker run … npx playwright test --shard=1/2` (see `PW_DOCKER` in the Makefile).
