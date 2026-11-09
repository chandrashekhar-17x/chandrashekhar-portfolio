import portfolio_api
from portfolio_mcp.__main__ import main


def test_entry_point_runs() -> None:
    assert main() == 0


def test_can_import_shared_api_package() -> None:
    # Proves the uv workspace wiring: mcp reuses code from the api package.
    assert portfolio_api.__version__
