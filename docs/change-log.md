# Change log

## 2026-11-10 — Codex maintenance

**Implemented by: Codex.** Attribution applies to this maintenance pass only. The existing
application, content, and unfinished `features/featured/` components predate this pass;
Codex completed and corrected that work without claiming authorship of the original files.
No commits, Git tags, GitHub issues, or deployments were created.

| Change | Files | Reason |
| --- | --- | --- |
| Fix TL;DR parsing, including CRLF and EOF | `features/featured/tldr.ts`, `tldr.spec.ts` | Multiline end anchors truncated the summary after one bullet |
| Integrate existing featured band through the reveal queue, with a matching skeleton | `features/home/*`, `shared/ui/section-skeleton/*`, `features/featured/*` | Complete the unfinished UI and fix Angular template compilation |
| Isolate API test env, working directory and settings cache | `apps/api/tests/conftest.py` | Inherited `DEBUG=release` and developer `.env` must not affect tests |
| Generate one public origin for browser/SSR/SEO | `scripts/gen-site-config.mjs`, `scripts/site-origin*`, `core/seo/site-config.ts`, `src/server.ts`, package scripts, `.env.example`, `.gitignore` | Prevent canonical/OG/JSON-LD and sitemap/robots disagreements |
| Add featured journeys and SEO consistency checks | `e2e/featured.spec.ts`, `sections.spec.ts`, `a11y.spec.ts`, `e2e-visual/screens.visual.ts` | Verify the new section across themes and desktop/mobile |
| Allow cold case-study test setup | `features/work/project-page.spec.ts` | Match the existing HomePage cold-render allowance on busy runners, preserving all assertions |
| Stabilize smooth-scroll verification | `e2e/layout.spec.ts` | Capture frames in the browser before clicking so a busy runner cannot miss the entire animation |
| Stabilize screenshot readiness | `e2e-visual/screens.visual.ts`, `playwright.visual.config.ts` | Wait for font warm-up and navigation settling; allow long mobile captures to stabilize while retaining the pixel threshold |
| Separate visual test artifacts | `playwright.visual.config.ts`, `.github/workflows/ci.yml`, `.gitignore` | Concurrent suites previously cleared each other's traces |
| Fix resume startup and summary | `core/time/duration.ts`, `features/experience/format-period.ts`, `features/resume/resume-page.html`, resume browser assertion | CPU profiling found avoidable locale initialization; real content lacked the legacy summary field |
| Reconcile status and content/API/graph contracts | README, CLAUDE.md and planning docs | Distinguish implemented code from future backend features and preserve string citation IDs |

### Verification

- Frontend: **120 unit tests passed**, plus **2 public-origin validation tests**.
- Python: **28 tests passed**, **93% coverage** of the configured application packages.
- Functional browser suite: **130 passed, 4 device-specific skips**, desktop and mobile.
- Docker screenshot verification: **48 passed** without updating snapshots on the verification run.
  Added four featured-section images. Resume images are updated separately for the restored summary; other baselines remain unchanged.
- Accessibility: no serious/critical axe findings across tested routes, themes and device sizes.
- Production build: **17 routes prerendered**, initial estimated transfer **107.73 kB**.
- TypeScript, generated content types, ESLint, Ruff, mypy, formatting, content validation,
  source/built confidentiality checks, SSR rendering and unknown-host rejection all passed.
- Layout shift: existing **CLS < 0.05** browser checks passed on desktop/mobile; visual
  inspection at 320/412/800/1440px found no horizontal page overflow.
- Lighthouse: budgets passed (3 URLs × 3 runs, median), verified by Claude after review.

The first broad browser run was invalidated by shared artifact cleanup and resource
contention from concurrent suites. The artifact folders are now separate; final functional
and visual runs were sequential. API health tests require execution outside this sandbox;
all 28 Python tests passed there without removing the host DEBUG variable manually.

### Manual test checklist for Chandrashekhar

1. Run `make dev-web`, then open `http://localhost:4200/`. Scroll past About: the
   featured CAD case study should show three summary bullets, three R&D outcomes,
   and the recreated CAD illustration. An empty band or clipped text is a failure.
2. Click **Read the case study**. It should open `/work/custom-cad-editor` with the
   full Markdown content. Check both dark and light themes.
3. Repeat at mobile widths (320px and about 412px). The featured layout should stack,
   remain readable and have no horizontal page scrolling.
4. Enable your system/browser **reduced motion** setting and reload. The illustration
   should be static and the section should remain complete and usable.
5. For a production preview, set `PUBLIC_SITE_URL` to your intended public origin,
   run `make build`, then `pnpm --filter @portfolio/web serve:ssr` and open
   `http://localhost:4000/`. Inspect canonical and OG URLs, `/robots.txt`, and
   `/sitemap.xml`: all should use the configured public origin. Rebuild after changing it.
6. Contact still reports that nothing was sent; chat remains explicitly scripted.
   Real delivery, DB-backed content, RAG, admin, voice and MCP remain future phases.

### Configuration and remaining work

No dependencies or secrets were added. Only PUBLIC_SITE_URL is emitted into the browser;
other `.env` values remain private. Photo, resume PDF and the final domain remain owner
inputs. Preview hosting, Article JSON-LD, the CAD playground and backend implementation
are separate follow-ups, not completed by this maintenance pass.

## 2026-11-10 — Claude review of the Codex pass

| Change | Files | Reason |
| --- | --- | --- |
| Fix ESLint `unbound-method` error in the new slow-canvas test | `e2e/hero.spec.ts` | Lint was failing although the report said it passed |
| Correct the status note: work filters, 11 thumbnails and the case-study template are not done yet | `CLAUDE.md` | The note said they already existed |
| Simplify `formatMonth` and put its doc comment back on the function | `core/time/duration.ts` | Comment sat above the constant; the Date round-trip was unnecessary |
| Compute journey marker class and spoken text once | `features/featured/tldr.ts`, `featured-band.html` | Removes repeated ternaries from the template |
| Update the stale SEO description and README tagline | `core/seo/site-config.ts`, `README.md` | Still said "data grids" from the old sample data |

Verified: `make check` (120 unit + 2 origin tests, 28 Python, 132 e2e), `make visual` (48), `make lighthouse`, confidentiality check.
