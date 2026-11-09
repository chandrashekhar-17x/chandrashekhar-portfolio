"""Entry point: `uv run python -m portfolio_worker`."""

import sys

from portfolio_worker import __version__


def main() -> int:
    print(f"portfolio-worker {__version__}: ingestion arrives in Phase 4.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
