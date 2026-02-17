# Architecture

## UX vision

- **Threads = sessions.** ChatGPT-style: sidebar lists threads; open one to see full history. Resume any thread after days or weeks.
- **Cross-thread memory.** Agent remembers the user across threads (preferences, linked accounts, past decisions). Per-thread history + shared user-level memory.
- **Flow.** Start/resume thread → ask for analysis → agent (subagents if needed) uses memory + tools → report or trade plan → user 1-click executes. Scheduling creates a thread and notifies user.

## Stack

- **Web:** Next.js + Clerk + shadcn (Amplify).
- **API:** TS (Express), Clerk JWT validation, REST + SSE. Single ECS task.
- **Agent:** OpenClaw as npm dependency; API starts gateway in-process on internal port and proxies to it.
- **DB:** Postgres (id + body JSONB pattern for all tables).

## Auth

Clerk for sign-up/sign-in. Backend validates Clerk JWT on REST. `BYPASS_AUTH=true` in local config for dev without Clerk.

## Config: hardcoded values, secrets-only env vars

Only keys and passwords live in environment variables. Everything else (ports, hostnames, feature flags, log levels) is hardcoded per environment in config files.

- **API**: `apps/api/src/config.ts` — env blocks keyed by `APP_ENV` (local/dev/prod)
- **Web**: `apps/web/lib/config.ts` — env blocks keyed by `NEXT_PUBLIC_MODE` (local/dev/prod)
- **Secrets**: `apps/api/.env` (local), SSM Parameter Store via Copilot manifest (deployed)

Defaults to `dev` in cloud (no env vars needed). Local dev sets `APP_ENV=local` / `NEXT_PUBLIC_MODE=local` via `.env`.

Required env vars (secrets only):

| Var | Where | Purpose |
|-----|-------|---------|
| `ANTHROPIC_API_KEY` | API | LLM provider |
| `PGPASSWORD` | API | Database |
| `PLAID_CLIENT_ID` | API | Plaid auth |
| `PLAID_SECRET` | API | Plaid auth |
| `CLERK_PUBLISHABLE_KEY` | API + Web | Auth provider (public key) |
| `CLERK_SECRET_KEY` | API + Web | Auth provider (secret key) |
| `PIPEDREAM_SECRET_KEY` | API | Pipedream auth |

## Database: id + body JSONB

All tables use two columns: `id UUID` + `body JSONB`. Indices on `body ->> 'field'` for common queries.

## Connections: unified provider registry

Single `connections` table for all providers. `ProviderHandler` interface with pluggable handlers. Bank provider strategy (`plaid-direct` vs `plaid-pipedream`) toggled via config.

## OpenClaw: thin proxy plugin

No business logic inside OpenClaw. Single plugin (`fine-tools`) proxies all tool calls to `POST /api/internal/tools/invoke` with `{ app, action, params }`. All SDK calls, credentials, and logic live in `apps/api`.

## Threads and memory

- **Thread** = one conversation. Stored in `threads`; every message in `thread_events`. Resume = load history from API.
- **Crash-safe:** Persist every turn to `thread_events` as it happens.
- **Cross-thread memory:** `user_memory` (user_id, payload JSONB). Inject into OpenClaw at session start.

## Deploy

- **Web:** Amplify, build `apps/web`; env: `NEXT_PUBLIC_MODE`, `CLERK_SECRET_KEY`.
- **Backend:** One ECS task (Copilot). Env: secrets only (see table above). Config hardcoded per `APP_ENV`.
- **Scheduling:** EventBridge → backend API → OpenClaw run for user → results to DB, notify user.
