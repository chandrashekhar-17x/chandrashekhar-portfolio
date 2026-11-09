"""Entry point: `uv run python -m portfolio_mcp`."""

import sys

from portfolio_mcp import __version__


def main() -> int:
    print(f"portfolio-mcp {__version__}: MCP tools arrive in Phase 7.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
