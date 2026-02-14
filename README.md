# Fine

Finance agent for getfine.ai: portfolio analysis, reports, 1-click execution. Multi-session with cross-session memory.

## Stack

- **Auth:** Clerk
- **Frontend:** Next.js (shadcn), deploy to AWS Amplify
- **Backend:** API + WebSocket, OpenClaw as agent runtime, deploy to ECS (AWS Copilot)
- **DB:** Postgres (sessions, history, user memory)

## Repo

- `apps/web` — Next.js + Clerk + chat UI
- `apps/backend` — REST + WS gateway, OpenClaw, persistence

## Dev

```bash
# backend
cd apps/backend && pnpm install && pnpm dev

# frontend
cd apps/web && pnpm install && pnpm dev
```

## Deploy

- **Web:** Amplify → connect repo, build `apps/web`, set env (NEXT_PUBLIC_CLERK_*, backend URL)
- **Backend:** Copilot ECS + pipeline from `apps/backend`; env: DB URL, Clerk keys, OpenClaw config

See [ARCHITECTURE.md](./ARCHITECTURE.md) for UX vision and system design.
