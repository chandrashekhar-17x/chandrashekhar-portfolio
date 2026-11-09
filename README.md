# chandrashekhar.dev — AI-native portfolio (planning + prototype)

Angular · FastAPI · PostgreSQL + pgvector · RAG agent · Knowledge graph · Voice · MCP

## What's here
| Path | What |
|---|---|
| `CLAUDE.md` | Project memory: Claude Code reads it automatically. Context, decisions, next steps |
| `prototype/index.html` | Clickable prototype + review + architecture + docs + backlog (open in any browser) |
| `docs/` | PRD, Design, Architecture, database, API, agents, mcp, integration, features, plan, testing, debuging, review, backlog, conversation log |
| `reference/` | The 5 inspiration images |

## Open it
1. Unzip anywhere, e.g. `~/projects/chandrashekhar-portfolio`
2. `code chandrashekhar-portfolio` (or File → Open Folder in VS Code)
3. Preview the prototype: right-click `prototype/index.html` → *Open with Live Server*, or just double-click it.
4. Start Claude Code in this folder (VS Code extension panel, or `claude` in the terminal).
   First message suggestion:
   > Read CLAUDE.md and docs/conversation-log.md, then propose the Phase 0 plan.

## Save it to GitHub (recommended)
```bash
git init && git add . && git commit -m "Portfolio blueprint: docs + prototype"
git branch -M main
git remote add origin https://github.com/<you>/chandrashekhar-portfolio.git
git push -u origin main
```
