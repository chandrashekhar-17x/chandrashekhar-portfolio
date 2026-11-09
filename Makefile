# One entry point for every task. Run `make` to see the list.
# Web uses pnpm, Python uses uv; CI runs the same targets.

SHELL := /bin/bash
.DEFAULT_GOAL := help

PY_DIRS := apps/api apps/worker apps/mcp scripts
# Pass the root .env to docker compose only if it exists.
COMPOSE := docker compose -f infra/docker-compose.yml $(if $(wildcard .env),--env-file .env,)

##@ Setup
.PHONY: setup
setup: ## Install all dependencies and git hooks
	pnpm install --frozen-lockfile
	pnpm --filter @portfolio/web exec playwright install chromium
	uv sync --frozen
	uv tool run pre-commit install --install-hooks
	@test -f .env || (cp .env.example .env && echo "Created .env from .env.example")

##@ Services (Docker)
.PHONY: up up-ai down logs ps
up: ## Start Postgres + Redis and wait until healthy
	$(COMPOSE) up -d --wait db redis

up-ai: ## Also start Ollama (local LLM)
	$(COMPOSE) --profile ai up -d --wait

down: ## Stop services (data is kept in volumes)
	$(COMPOSE) --profile ai down

logs: ## Follow service logs
	$(COMPOSE) logs -f

ps: ## Show service status
	$(COMPOSE) ps

##@ Develop
.PHONY: dev-web dev-api
dev-web: ## Angular dev server → http://localhost:4200
	pnpm --filter @portfolio/web start

dev-api: ## FastAPI with reload → http://localhost:8000/docs
	uv run uvicorn portfolio_api.main:create_app --factory --reload --port 8000

##@ Quality
.PHONY: lint lint-web lint-py format typecheck test test-web test-py build smoke-web e2e-web content-check check
lint: lint-web lint-py ## Lint everything

lint-web:
	pnpm format:check
	pnpm --filter @portfolio/web lint

lint-py:
	uv run ruff check .
	uv run ruff format --check .

format: ## Auto-format all code
	pnpm format
	uv run ruff format .
	uv run ruff check --fix .

typecheck: ## Type-check web (tsc) and Python (mypy strict)
	pnpm --filter @portfolio/web typecheck
	uv run mypy $(PY_DIRS)

test: test-web test-py ## Run all unit tests

test-web:
	pnpm --filter @portfolio/web test

test-py: ## Python tests with coverage
	uv run pytest --cov --cov-report=term --cov-report=xml

build: ## Production build of the web app
	pnpm --filter @portfolio/web build

smoke-web: ## Start the built SSR server and check it renders (after build)
	scripts/smoke-ssr.sh

e2e-web: ## Playwright e2e tests against the built SSR app (after build)
	pnpm --filter @portfolio/web e2e

content-check: ## Validate content/ (schemas, references, placeholders)
	uv run python scripts/validate_content.py

check: lint typecheck content-check test build smoke-web e2e-web ## Everything CI runs

##@ Misc
.PHONY: clean help
clean: ## Remove build output and caches (not node_modules/.venv)
	rm -rf apps/web/dist apps/web/.angular coverage coverage.xml .pytest_cache .mypy_cache .ruff_cache

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"} /^##@/ {printf "\n\033[1m%s\033[0m\n", substr($$0, 5)} \
	/^[a-zA-Z_-]+:.*##/ {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
