# Debugging

## Toolbox

- Angular DevTools (signals, change detection profiler)
- Chrome Performance + Rendering → FPS meter, paint flashing, layer borders
- Spector.js for WebGL frames; `renderer.info` for draw calls
- FastAPI: structured logs with `request_id`, `/docs` to replay calls
- Langfuse trace per chat: retrieved chunks, prompt, tokens, latency
- Sentry with source maps for both apps

## Common issues → fix

| Symptom                   | Likely cause                         | Fix                                                |
|---------------------------|--------------------------------------|----------------------------------------------------|
| Hydration mismatch        | Canvas/window used during SSR        | `afterNextRender`, `isPlatformBrowser`, `@defer`   |
| Janky scroll              | RAF loop triggering change detection | runOutsideAngular / zoneless, pause off-screen     |
| Agent answers wrong facts | Bad chunks / low k                   | Inspect trace, re-chunk, add eval case             |
| SSE stops on prod         | Proxy buffering                      | `X-Accel-Buffering: no`, keep-alive pings          |
| CORS errors               | Origin not allow-listed              | Exact origins in settings; no `*` with credentials |
| Bill spike                | Bot traffic                          | Turnstile, rate limit, daily cap kill-switch       |

## Bug log

| Date | Symptom | Root cause | Fix | Regression test |
|---|---|---|---|---|
| 2026-11-09 | `ANTHROPIC_API_KEY=` (empty) in `.env` made the key look configured | pydantic-settings turns an empty env value into `SecretStr("")`, not `None` | `env_ignore_empty=True` in `Settings` | `apps/api/tests/test_config.py::test_empty_env_value_means_unset` |
| 2026-11-09 | Built SSR server answered every request with `400 Bad Request` | Angular 22 SSR validates the `Host` header (SSRF protection); `security.allowedHosts` was empty | Allow `localhost`/`127.0.0.1` in `angular.json`; production domains via `NG_ALLOWED_HOSTS` | `scripts/smoke-ssr.sh` (`make smoke-web`, runs in CI) |
| 2026-11-09 | Home `<h1>` "Chandrashekhar" broke mid-word (2 lines at 1440px, overflowed at 320px) | `.intro` capped at 60ch (~470px) while the 86px name is ~780px wide, and `overflow-wrap: break-word` split it; display token min of 40px too big for 320px screens | `.intro` is the size container (64rem), `--text-display: clamp(1.75rem, 10cqi, 5.375rem)`, `overflow-wrap: normal` on h1; 60ch only on the paragraph | `apps/web/e2e/home-heading.spec.ts` (320/390/1440px) |
| 2026-11-09 | Home page layout shift of 0.17 right after load (hero title 3 → 2 lines, everything below jumped) | Angular's critical-CSS inlining (Beasties) loads the real stylesheet async (`media="print"` swap); first paint had no `@font-face`/tokens, then reflowed. Found by logging `document.fonts` + layout-shift sources, not the font swap first suspected | `inlineCritical: false` (stylesheet is 2.5 KB gz) + self-hosted fonts with `preload` and `font-display: optional` | `apps/web/e2e/lazy-sections.spec.ts` (CLS < 0.05 while scrolling) |
| 2026-11-09 | Theme crash during prerender (`Cannot read properties of undefined (reading 'theme')`) | Server DOM (Domino) has no `element.dataset` | `getAttribute`/`setAttribute` in `ThemeService` | prerender in `make build` + `theme.service.spec.ts` |
| 2026-11-09 | Graph filter "Frontend" still showed BACKEND / AI / TOOLS hubs bright (reported by Chandrashekhar) | `isDimmed()` exempted every hub from filter dimming (rule copied from the prototype) | Dim everything outside the chosen category; its own hub stays lit because it belongs to it | `graph-renderer.spec.ts` → "filtering keeps only the chosen category bright" |
| 2026-11-09 | Esc never closed the ⌘K palette (`<dialog>` got no `cancel` event) | Chat widget's host listener `(document:keydown.escape)="store.isOpen() && close()"` evaluated to `false` when the chat was closed; Angular treats a `false` return as `preventDefault()`, so every Esc on the page was cancelled | Handler is now a void method `onEscape()` | `apps/web/e2e/palette.spec.ts` (Esc closes after reopening) |
| 2026-11-09 | ⌘K right after running a palette command sometimes reopened and instantly closed the palette (intermittent e2e failure) | Race: `dialog.close()` queues an async `close` event; a fast ⌘K set `isOpen` before the open-effect ran, and the stale event reset it. A first fix ("ignore if dialog is open") was incomplete because the effect hadn't opened it yet; found by tracing `open` transitions | Remember closes started in code (`closingInCode`) and ignore their `close` event; only user closes (Esc) update the service | `apps/web/e2e/palette.spec.ts` run with `--repeat-each` |
| 2026-11-10 | Python CI job failed at "Set up job" on every run that touched Python | `astral-sh/setup-uv@v10` doesn't exist (the action publishes exact tags only); missed locally because CI was never checked after Phase 0 | Pin `@v10.3.3`; CI steps verified in a clean `python:3.13` container | CI itself (the job now runs) |
| 2026-11-10 | Screenshot CI job: "A snapshot doesn't exist" for all 40 tests | Root `.gitignore` kept Angular's `__screenshots__/` entry, so the baselines were never committed | Removed the entry; committed the baselines | `git ls-files apps/web/e2e-visual/__screenshots__` = 40 |
