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
