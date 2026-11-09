# MCP

## A. Your portfolio as an MCP server (unique feature)

Let anyone add your portfolio to Claude Desktop / an IDE and ask “Is this candidate a fit for our Angular + RAG role?”.

    from fastmcp import FastMCP
    mcp = FastMCP("chandrashekhar-portfolio")

    @mcp.tool
    def search_portfolio(query: str, k: int = 5) -> list[dict]:
        """Search skills, projects and experience. Returns text + URL."""
        return retrieval.search(query, k)

    @mcp.tool
    def match_job_description(jd: str) -> dict: ...

    @mcp.resource("resume://latest")
    def resume() -> str: ...

- Tools: `get_profile`, `list_projects`, `get_project(slug)`, `search_portfolio`, `match_job_description`
- Resources: `resume://latest`, `project://{slug}`
- Transport: Streamable HTTP at `/mcp`, read-only, rate-limited.
- Also publish `/llms.txt` + `/llms-full.txt` for crawlers.

## B. MCP servers to use while *building*

- **GitHub** — issues/PRs from your AI coding tool
- **Playwright** — let the agent click through and test the site
- **Postgres** — inspect schema/data during dev
- **Figma** (if you design there) — pull tokens
- **Sentry** — read production errors
