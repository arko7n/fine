# Fine

OpenClaw to optimize your financial health www.getfine.ai.

## Expected UX
Autonomous agent for finance similar to OpenClaw with web/ios/android apps where users can OAuth APIs (Plaid, IKBR, etc.) to connect their banks and portfolios.
Like ChatGPT, users will have threads (sessions). Users will start an agent session, agent will analyze portfolios, create a report and action plan involving trades, etc., and user will 1-click execute it (agent will then execute those trades). User should also be able to schedule the agent to do this daily, weekly, etc. Agent should have long term memory across sessions, runs.

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

Set `ANTHROPIC_API_KEY` in your env (or `apps/api/.env`) before running the API.

## Deploy

### API (ECS via Copilot)

```bash
# One-time: init app and env (run from repo root)
copilot app init fine
copilot env init --name dev --profile default

# Store your Anthropic key
copilot secret init --name ANTHROPIC_API_KEY

# Deploy
copilot svc deploy --name api --env dev

# Set up pipeline (GitHub push → auto deploy)
copilot pipeline init
copilot pipeline deploy
```

### Web (Amplify)

Connect repo in AWS Amplify console. Set:
- Build dir: `apps/web`
- Env: `NEXT_PUBLIC_API_URL` → the Copilot ALB URL from `copilot svc show --name api`

See [ARCHITECTURE.md](./ARCHITECTURE.md) for design.
