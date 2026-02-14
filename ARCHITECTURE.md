# Architecture

## UX vision

- **Threads = sessions.** ChatGPT-style: sidebar lists threads; open one to see full history. Resume any thread after days or weeks.
- **Cross-thread memory.** Agent remembers the user across threads (preferences, linked accounts, past decisions). Per-thread history + shared user-level memory.
- **Flow.** Start/resume thread → ask for analysis → agent (subagents if needed) uses memory + Plaid/IBKR → report or trade plan → user 1-click executes. Scheduling creates a thread and notifies user.

## Stack

- **Web:** Next.js + Clerk + shadcn (Amplify).
- **Backend:** TS (Express/Fastify or NestJS), Clerk JWT validation, REST + WebSocket. Single ECS task.
- **Agent:** OpenClaw as npm dependency; backend starts gateway in-process on internal port and proxies agent WS to it. One `agent_id` per user; session key = `thread_id`.
- **DB:** Postgres (threads, thread_events, user_memory, OAuth tokens).

## Auth

Clerk for sign-up/sign-in. Backend validates Clerk JWT on REST and WebSocket upgrade.

## Threads and memory

- **Thread** = one conversation. Stored in `threads`; every message in `thread_events`. Resume = load history from API, then open WS for that thread.
- **Crash-safe:** Persist every turn to `thread_events` as it happens. After restart, history comes from Postgres; optionally replay into OpenClaw at session start.
- **Cross-thread memory:** `user_memory` (user_id, payload JSONB). Summarize after runs; inject into OpenClaw at session start so all threads see it.

## OpenClaw

- **Use as abstraction** (no fork). Backend depends on OpenClaw, calls `startGatewayServer(port)` on an internal port, proxies client WS to it.
- **Config:** Env vars for model, API keys (e.g. `ANTHROPIC_API_KEY`). ECS task env from Secrets Manager / Parameter Store.
- **Plaid / IBKR:** OpenClaw plugins that register tools. Per-user tokens in DB; plugin gets them via backend context or internal API.

## Data (Postgres)

- **threads** — id, user_id, title, created_at, updated_at
- **thread_events** — id, thread_id, role, content (JSONB), created_at
- **user_memory** — user_id, payload (JSONB), updated_at
- OAuth tokens per user (table or Secrets Manager)

## Deploy

- **Web:** Amplify, build `apps/web`; env: `NEXT_PUBLIC_CLERK_*`, backend URL.
- **Backend:** One ECS task (Copilot). Env: Postgres URL, Clerk secret, OpenClaw + Plaid/IBKR keys.
- **Scheduling:** EventBridge → backend API → OpenClaw run for user → results to DB, notify user.
