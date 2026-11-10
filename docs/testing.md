# Testing

| Layer     | Tool                                     | What                                                        |
|-----------|------------------------------------------|-------------------------------------------------------------|
| FE unit   | Vitest or Jest + Angular Testing Library | Services, pipes, directives (tilt, magnetic), chat store    |
| FE e2e    | Playwright                               | Journeys: recruiter 60 s, chat flow, contact, theme, mobile |
| Visual    | Playwright screenshots                   | Hero, graph, cards in both themes & 3 viewports             |
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
| `make visual` / `make visual-update` | screenshot tests in the Playwright Docker image (40 baselines, both themes) |
| `make lighthouse` | Lighthouse CI on `/`, `/work`, `/resume`: perf/a11y/best-practices/SEO ≥ 95, LCP < 2 s, CLS < 0.05 (median of 3 runs) |
| `node apps/web/scripts/parity-screens.mjs <dir>` | prototype vs app screenshots for side-by-side review |
