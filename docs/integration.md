# Integrations

| Service                                    | Use                              | Notes                                      |
|--------------------------------------------|----------------------------------|--------------------------------------------|
| Anthropic / OpenAI / Groq                  | Chat + embeddings                | Server-side only; provider switch via env  |
| Ollama                                     | Local LLM for dev                | Zero cost while learning                   |
| GitHub REST/GraphQL                        | Pinned repos, contribution graph | Cache 6h; token server-side                |
| LinkedIn                                   | Experience                       | No public API — use data export → content/ |
| Cloudflare Turnstile                       | Bot protection                   | Chat, match, contact                       |
| Resend (or SMTP)                           | Contact emails                   | —                                          |
| Cal.com                                    | Book a call                      | Link or embed                              |
| Langfuse                                   | LLM tracing & evals              | Self-host or cloud free tier               |
| Sentry                                     | FE + BE errors                   | Source maps uploaded in CI                 |
| Umami / Plausible                          | Privacy analytics                | Events: chat_open, graph_click, resume_dl  |
| Neon / Supabase                            | Postgres + pgvector              | Free tiers fine for MVP                    |
| ElevenLabs / Deepgram / realtime voice API | Voice v2                         | Behind feature flag + budget               |
