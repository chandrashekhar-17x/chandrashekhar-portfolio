# Product Requirements

## 1 · Problem

Recruiters and hiring managers spend under a minute on a portfolio and can't easily verify depth. A frontend engineer moving into AI engineering has no single place that **proves** both skill sets. Static CV sites can't answer specific questions (“has he worked with large datasets in tables?”).

## 2 · Users

| User                               | Goal                                        | Time budget |
|------------------------------------|---------------------------------------------|-------------|
| **Recruiter**                      | Quick fit check, resume, contact            | 30–90 s     |
| **Hiring manager / engineer**      | Judge technical depth, code, case studies   | 5–15 min    |
| **Freelance client**               | See relevant work, book a call              | 3–5 min     |
| **Developer peers**                | Explore, learn, share                       | open        |
| **AI agents** (via MCP / llms.txt) | Fetch structured facts about you            | machine     |
| **Owner (you)**                    | Update content, review chats, see analytics | —           |

## 3 · Goals & success metrics

- Lighthouse performance ≥ 95 desktop / ≥ 85 mobile; LCP \< 2.0 s
- ≥ 25% of visitors interact with graph or agent
- Agent groundedness ≥ 95% on eval set; zero fabricated skills
- Contact / resume-download conversion ≥ 3%
- LLM cost ≤ a fixed monthly cap (hard kill-switch)

## 4 · Core features

1.  Hero with animated canvas, typed role, CTA
2.  Interactive knowledge graph (skills ↔ projects ↔ roles)
3.  AI agent chat, grounded in your data, with citations that highlight graph nodes
4.  Projects + case-study pages
5.  Experience timeline, skills, resume download
6.  Contact form (spam-protected)
7.  Dark / light theme, command palette, custom cursor, motion system
8.  Admin: edit content, re-index, read chat logs

## 5 · User journeys

**Recruiter (60 s)**

**LAND**Hero: role + availability

**SCAN**Stats + top 3 projects

**ASK**“Does he know RxJS?” → cited answer

**ACT**Download resume / contact

**Hiring manager (10 min)**

**EXPLORE**Graph → click “CAD editor”

**READ**Case study + live demo

**VERIFY**GitHub + architecture notes

**MATCH**Paste JD → fit report

**AI agent**

**DISCOVER**/llms.txt

**CONNECT**MCP endpoint

**CALL**search_portfolio()

**CITE**Returns URLs to pages

## 6 · Pages & roles

| Route                  | Purpose                                           | Role        |
|------------------------|---------------------------------------------------|-------------|
| `/`                    | Home: hero, graph, work, lab, experience, contact | Public      |
| `/work`, `/work/:slug` | Project index & case studies                      | Public      |
| `/lab`                 | AI lab: agents, voice “Jarvis” mode, evals        | Public      |
| `/graph`               | Full-screen knowledge graph                       | Public      |
| `/journal`             | Learning-in-public log / blog                     | Public      |
| `/resume`              | HTML resume + PDF                                 | Public      |
| `/admin/*`             | Content, ingest, chat logs, analytics             | Owner (JWT) |

## 7 · MVP scope

**In:** Angular SSR site, home sections, 3–5 projects, graph from static JSON, scripted chat fallback → real RAG chat (Phase 3), contact form, theme, a11y, SEO.

**Out (backlog):** voice, Jarvis dashboard, MCP server, recruiter JD match, admin UI (use JSON/MD files first), blog, i18n, 3D scene.
