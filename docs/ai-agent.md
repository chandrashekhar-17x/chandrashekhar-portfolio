# AI agent: design and build plan (₹0 budget)

> Status: **PR 1 done** (agent core + evals, 2026-11-14); next PR 2 (Pages Function + free LLM). Owner decisions: no paid APIs; answers must
> come only from my resume + portfolio; correct, consistent and fast. Replaces the
> "Claude + pgvector RAG" plan in `agents.md` for the public chat (that plan stays the
> long-term path once there is a lot more content, e.g. a journal).

## 1. Goal and quality bar

A visitor asks anything about me (chat now, voice in /lab later) and gets an answer that is:

| Quality        | What it means here                                            | How we check it                         |
| -------------- | ------------------------------------------------------------- | --------------------------------------- |
| **Correct**    | Every fact comes from `content/` or my resume. No outside data | eval set + grounding verifier (§5)      |
| **Honest**     | Unknown → "isn't in his profile", never a guess               | `honest-no` eval cases                  |
| **Safe**       | No client / internal names, no prompt leaks                   | `confidential` eval cases + checker     |
| **Consistent** | Same question → same answer                                   | temperature 0 + answer cache            |
| **Fast**       | First words < 1 s, retrieval < 5 ms                           | timings in the `done` event             |
| **Cited**      | Answer lists the graph nodes it used; they light up           | citation must be in the retrieved set   |
| **Free**       | ₹0 at portfolio traffic                                       | free tier maths (§7), hard fallback     |

## 2. Why not "train my own model"?

- **From scratch:** language models learn language from billions of words. My data is
  ~5,000 words. The result could not even form sentences.
- **Fine-tuning** a small model on my data teaches it my *style*, not reliable *facts*;
  fine-tuned models still invent dates and skills with confidence, and every content
  change would need retraining.
- **Retrieval-augmented generation (RAG)** is the standard answer: find the right
  pieces of *my* data, then let a model phrase an answer **only from those pieces**,
  and verify it. Content changes are live after a rebuild, no training.

## 3. Research summary (Nov 2026)

| Question | Finding | Source |
| --- | --- | --- |
| Free LLM with no card? | Cloudflare **Workers AI**: 10,000 neurons/day free, resets 00:00 UTC; on the free plan requests over the limit **fail instead of being billed** | [pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) |
| Cost per answer | ~1,500 input + ~200 output tokens. Llama 3.1 8B fp8-fast: 4,119 / 34,868 neurons per M tokens → **≈ 13 neurons ⇒ ~750 answers/day free** | same |
| Embeddings | `@cf/baai/bge-small-en-v1.5`, 384 dims, 512 tokens max; use `pooling: "cls"` (more accurate; cls and mean vectors are **not** compatible) | [model page](https://developers.cloudflare.com/workers-ai/models/bge-small-en-v1.5/) |
| Query embedding cost | ~20 tokens × 1,841 neurons/M ≈ **0.04 neurons** | pricing |
| Reranker | `@cf/baai/bge-reranker-base`: `{query, contexts[], top_k}`; 283 neurons/M → reranking 20 chunks ≈ **1 neuron** | [model page](https://developers.cloudflare.com/workers-ai/models/bge-reranker-base/) |
| Streaming | Text models take `stream: true` and return Server-Sent Events | [qwen3 page](https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/) |
| Where it runs | **Pages Functions** (my site is already on Pages). Bind Workers AI in Settings → Bindings → Workers AI; call `context.env.AI.run(model, input)` | [bindings](https://developers.cloudflare.com/pages/functions/bindings/) |
| Limits | Workers free: **10 ms CPU** per request (waiting on network does not count), 128 MB, 50 subrequests, 100k requests/day | [limits](https://developers.cloudflare.com/workers/platform/limits/) |
| Voice later | Browser Web Speech API (free); Firefox fallback `@cf/openai/whisper` 41 neurons/audio-minute; `speechSynthesis` for output | pricing |

**Consequences for the design**

1. My whole corpus is tiny (~150 chunks). Retrieval can run **in the function itself**, in
   memory, in well under 1 ms of CPU: no vector database needed.
2. Chunk embeddings are computed **once at build time** (same model, cls pooling) and
   committed; only the question is embedded at request time.
3. 10 ms CPU means: no index building per request, no big JSON parsing per request.
   The index is prebuilt and loaded once per isolate.

## 4. Architecture

```
question ─► guard ─► retrieve (hybrid) ─► answer ─► verify ─► stream + citations
             │         │                    │          │
             │         │                    │          └─ fails? → extractive answer
             │         │                    └─ LLM (Workers AI) or extractive (no LLM)
             │         └─ BM25 + entity links (+ embeddings + reranker when AI is bound)
             └─ policy answers: clients / internal names / injection / off-topic
```

One TypeScript package, `packages/agent`, holds all of it as **pure functions** (no
Cloudflare, no Angular imports), so the same code runs in:

- the **Pages Function** `functions/api/chat.ts` (real agent, with Workers AI), and
- the **browser** as an offline fallback (BM25 + extractive answers, no model), and
- **Vitest** for the eval harness.

### 4.1 Knowledge chunks (`chunk.ts`)

Every chunk = one fact-sized piece with the graph nodes it is about:

```ts
{ id: "project:custom-cad-editor#why-custom", nodes: ["project:custom-cad-editor"],
  title: "Custom CAD editor: why custom", text: "...", url: "/work/custom-cad-editor" }
```

Sources: profile + bio, each role, education, each project summary, **each `##` section of
every case study**, skills (grouped per category with proficiency), about areas, lab
timeline, and the resume (`content/resume/resume.html`, per section / bullet). Chunks
are small (≤ 120 words) so a citation points at a precise fact.

### 4.2 Retrieval (`retrieve.ts`)

Small corpora get the best accuracy from **hybrid retrieval**:

1. **Entity linking**: the question is matched against every skill / project / org name
   and alias ("3d" → Three.js, WebGL; "pdf" → PDF.js, viewer projects). Exact, deterministic.
2. **BM25**: classic keyword ranking (what search engines used for decades). Strong
   for names like "R-tree", "SSE", "FastAPI".
3. **Dense embeddings** (when AI is bound): meaning-based ("has he done 3D?" ↔ "Three.js").
4. **Reciprocal Rank Fusion** merges the lists without tuning score scales.
5. **Reranker** (when AI is bound) re-orders the top 20 by reading question + chunk together.

A confidence score decides between "answer" and "I don't know".

### 4.3 Guard (`guard.ts`)

Runs before retrieval, deterministic: length ≤ 500 chars; client / customer / internal
codename questions → fixed policy answer; prompt-injection patterns ("ignore previous",
"system prompt") → refusal; greeting / thanks → canned reply. Policy answers never call a model.

### 4.4 Answer

- **Extractive** (always available): best sentences from the top chunks, joined with
  templates per intent. Can't invent anything because every sentence is mine.
- **Generative** (Workers AI): system prompt + numbered context chunks + question;
  `temperature: 0`, `max_tokens` 300, must cite `[1]`, `[2]`… and answer
  "That isn't in his profile." when context is missing.

### 4.5 Verify (`verify.ts`): the anti-hallucination step

Cheap deterministic checks on the generated answer before it is shown:

- every cited number is one of the retrieved chunks → else drop the citation;
- every **number, year, month and proper name** in the answer appears in the cited
  chunks (or the question) → else **fall back to the extractive answer**;
- no forbidden term (confidential list) → else policy answer;
- at least one valid citation unless it is an "I don't know" answer.

The verify step runs while tokens are buffered per sentence, so a sentence is only
streamed once it passed. That keeps first-word latency low and output safe.

## 5. Consistency and speed

- `temperature: 0` and a fixed prompt; the prompt version is part of the cache key.
- **Answer cache**: normalised question + prompt version + content hash → answer, via the
  Workers Cache API (free). Popular questions cost 0 neurons and answer instantly.
- Index is prebuilt JSON, parsed once per isolate; retrieval is plain loops over ~150 items.
- Stream tokens over SSE in the existing contract (`docs/API.md`): `meta`, `token`,
  `citations`, `done`.

## 6. Evals (the part that makes it not a "college project")

`content/evals/agent-evals.json` grows from 14 to ~40 cases. Each case gets
`expectNodes` (which graph nodes must be retrieved). Metrics, printed as a table:

| Metric | Target |
| --- | --- |
| Retrieval recall@5 (expected nodes in top 5) | ≥ 0.95 |
| Answer pass rate (mustMention / mustNotMention) | 100 % extractive, ≥ 95 % generative |
| Honest-no correctness | 100 % |
| Confidential leaks | 0 |
| p95 retrieval time | < 5 ms |

Retrieval + extractive evals run in CI on every PR (free, deterministic). Generative
evals run with `make eval-agent` against Workers AI when the binding exists.
**Rule: add complexity (embeddings, reranker, bigger model) only when an eval shows it helps.**

## 7. Free-tier budget

10,000 neurons/day ÷ ~13 per uncached answer ≈ 750 answers/day; cached answers are free.
Per-IP limit 20 questions / 10 min. When Workers AI returns an error (limit reached), the
function answers **extractively** instead: the visitor still gets a correct answer.

## 8. Results so far (PR 1, no LLM)

Measured by `make eval-agent` on 41 eval cases (14 original + 27 agent-only: paraphrases,
typos, resume-only facts, unknown tech, off-topic, injection, personal questions):

| Metric | Result | Target |
| --- | --- | --- |
| Context recall (expected facts in the 6 retrieved chunks) | **1.00** | ≥ 0.95 |
| Honest-no + confidential exact | **100 %** | 100 % |
| Extractive answer mentions every expected fact | 70 % | reported only (LLM composes in PR 2) |
| p95 latency (guard + retrieval + answer) | **~2.5 ms** | < 5 ms |
| Wrong claims found by evals and fixed | 3 ("Yes" for learning skills, Keycloak as "learning", wrong flagship) | 0 open |

What the evals caught while building (why they matter):

- "Does he know Django?" answered **"Yes"**; he is learning it. Now: proficiency-aware lead.
- "Keycloak?" answered "learning" via an alias; the resume says production. Alias removed.
  **Data note for the owner:** `skills.json` lists Authentication as *learning* while the
  resume shows production Keycloak / MSAL work. Decide which is true and update one of them.
- "Biggest project?" picked this portfolio; now featured-project order decides.
- Tables, diagrams and ✗/✓ marks in case studies broke sentences; now parsed properly.
- One eval expected the word "chat", which is nowhere in my data; the eval was wrong.

## 9. Build plan

| PR | Content | Needs owner? |
| --- | --- | --- |
| 1 `feat/agent-core` | `packages/agent`: chunker, normaliser, BM25, entity linking, guard, extractive answers, eval harness + metrics; evals extended with `expectNodes` | no |
| 2 `feat/agent-function` | `functions/api/chat.ts` Pages Function: SSE, Workers AI generation, verify, cache, rate limit, fallback; local dev with `wrangler pages dev` | bind Workers AI (5 min) |
| 3 `feat/agent-web` | web chat uses `/api/chat`; offline fallback runs the agent in the browser; scripted chat retired | no |
| 4 `feat/agent-dense` | build-time embeddings + query embedding + reranker, kept only if evals improve | no |
| 5 `feat/voice` | /lab voice mode on the same agent | no |

## 10. Glossary (for me while learning)

- **Chunk**: a small piece of source text that can be retrieved and cited.
- **BM25**: keyword scoring; rare words that appear in a chunk score high.
- **Embedding**: a list of numbers representing meaning; similar meaning → close vectors.
- **RRF (Reciprocal Rank Fusion)**: combine rankings by summing `1 / (60 + rank)`.
- **Reranker**: a model that scores (question, chunk) pairs directly; slower, more precise.
- **Grounding**: every claim in the answer is supported by retrieved text.
- **Eval**: an automatic test for AI behaviour, with a measurable score.
