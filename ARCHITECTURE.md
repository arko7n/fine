# Architecture

## Per-User ECS Task Provisioning

Each user gets a dedicated ECS Fargate task running the same API+OpenClaw image. The shared API handles control plane operations and proxies OC/session requests to the user's task.

```
Frontend (Amplify)
  │
  └──► Shared API (ALB)
        ├── /api/provision       → provisions ECS task for user
        ├── /api/me              → resolves user's task status
        ├── /api/connections     → served directly
        ├── /api/integrations    → served directly
        ├── /v1/*                → proxied to user's ECS task
        └── /api/sessions/*      → proxied to user's ECS task
                                       │
                                 User's ECS Task
                                 (Express + OC gateway)
```

## Key Modules

- **`src/modules/provision/`** — user-store (fc_users CRUD), ECS task lifecycle (RunTask/DescribeTasks), provision router
- **`src/modules/openclaw/`** — OC gateway process management, agent registration, runtime config
- **`src/modules/connections/`** — provider-handler pattern for bank/Pipedream OAuth flows
- **`openclaw-plugins/fine-persistence/`** — S3 backup/restore of agent state (scoped to `USER_ID` when set)

## Proxy Routing

`userTaskProxy` in `app.ts` handles all proxied routes:
- **Local dev** (`useLocalOc: true`): proxies to `127.0.0.1:18789` with `x-openclaw-agent-id` header
- **Production**: looks up user's task IP from `fc_users`, proxies to `taskIp:3001`

## Per-User Task Mode

When `USER_ID` env var is set (on the ECS task):
- `index.ts` registers only that user's agent at startup
- `fine-persistence` plugin restores only that user's state from S3 (direct get, no list)

## Frontend Provision Flow

`ProvisionGate` wraps the app layout. On mount it calls `GET /api/me`:
- **stopped** → shows `ProvisionCard` with a button that calls `POST /api/provision`
- **provisioning** → polls `/api/me` every 3s until running
- **running** → renders children (sidebar, sessions, chat)

## Data

`fc_users` table stores provision state as JSONB: `{ status, taskArn, taskIp, provisionedAt }`.
`connections` table stores linked accounts (bank, Pipedream) as JSONB per user.
