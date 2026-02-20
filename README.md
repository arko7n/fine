# Myst (aka Fine)

OpenClaw on the cloud. Autonomous agents that are multi-tenant, secure, on-cloud by default, with 1-click on-prem deployment. Users OAuth (Plaid, Gmail, etc.) to securely connect apps.

## Repo

- `apps/web` — Next.js frontend
- `apps/api` — Express API + OpenClaw agent runtime

## Dev

```bash
# install (from root)
yarn install

# api (starts Express + OpenClaw gateway)
cd apps/api && yarn dev
# → http://localhost:3001

# web
cd apps/web && yarn dev
# → http://localhost:3000
```

Set `ANTHROPIC_API_KEY` and other keys in your env (or `apps/api/.env`) before running the API.

## Deploy

Deployed using Amplify (web app) and AWS Copilot on ECS (api).
