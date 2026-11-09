# AI-native Portfolio

## Problem

Recruiters spend under a minute on a portfolio and can't verify depth. A frontend engineer moving into
AI engineering needs one place that proves both skill sets.

## Approach

Angular 22 (SSR, signals, zoneless, `@defer`) on the front; FastAPI, PostgreSQL + pgvector and Redis
on the back. A RAG agent answers questions about me and cites knowledge-graph nodes, which light up
while the answer streams in. Content is editable from an admin panel; an MCP server lets other AI
agents query the portfolio.

## Result

In progress, built in public phase by phase.

## What I'd do differently

To be written at launch.
