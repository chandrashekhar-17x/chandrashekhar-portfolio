import pytest
from pydantic import SecretStr, ValidationError

from portfolio_api.core.config import Settings
from portfolio_api.main import create_app


def test_docs_hidden_in_production() -> None:
    app = create_app(Settings(environment="production", ip_hash_salt=SecretStr("x" * 32)))
    assert app.docs_url is None


def test_docs_available_locally() -> None:
    app = create_app(Settings(environment="local"))
    assert app.docs_url == "/docs"


def test_invalid_environment_fails_fast() -> None:
    with pytest.raises(ValidationError):
        Settings(environment="prod")  # type: ignore[arg-type]


def test_secrets_are_masked_in_repr() -> None:
    settings = Settings(anthropic_api_key="sk-test-123")  # type: ignore[arg-type]
    assert "sk-test-123" not in repr(settings)


def test_empty_env_value_means_unset(monkeypatch: pytest.MonkeyPatch) -> None:
    # Regression: `ANTHROPIC_API_KEY=` in .env used to become an empty secret.
    monkeypatch.setenv("ANTHROPIC_API_KEY", "")
    assert Settings().anthropic_api_key is None
