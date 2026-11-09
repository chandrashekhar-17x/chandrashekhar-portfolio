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
