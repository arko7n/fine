# Agentic Tool Calling via Pipedream Connect

## The Problem

An AI agent that can "do things" needs authenticated access to external APIs — Gmail, Slack, Notion, Stripe, etc. The naive approach is building a dedicated OAuth integration for every app: store client IDs, handle token refresh, map API surfaces. This scales O(N) with the number of apps you want to support.

## The Solution: Pipedream Connect as a Universal Integration Layer

Instead of building N integrations, you build **one** integration with [Pipedream Connect](https://pipedream.com/docs/connect/). Pipedream manages OAuth credentials, token lifecycle, and API authentication for 3,000+ apps. Your agent gets authenticated access to all of them through a single SDK.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend                                               │
│                                                         │
│  ConnectButton  ──initiateConnect()──►  Backend API     │
│       │                                     │           │
│       │ receives short-lived token          │           │
│       ▼                                     │           │
│  Pipedream Frontend SDK                     │           │
│  (opens OAuth popup per app)                │           │
└─────────────────────────────────────────────┼───────────┘
                                              │
┌─────────────────────────────────────────────┼───────────┐
│  Backend                                    │           │
│                                             ▼           │
│  Pipedream Server SDK  ◄──── pd.tokens.create()         │
│       │                                                 │
│       ├── pd.accounts.list()     (list connected apps)  │
│       ├── pd.proxy.{method}()    (make authed API call) │
│       ├── pd.actions.list()      (discover pre-built    │
│       ├── pd.actions.retrieve()     operations)         │
│       └── pd.actions.run()       (run a pre-built op)   │
└─────────────────────────────────────────────────────────┘
```

### Connection Flow (one-time per app, per user)

1. User clicks **Connect** for an app (e.g. Google Sheets).
2. Frontend calls the backend, which creates a short-lived Pipedream token via `pd.tokens.create({ externalUserId })`.
3. Frontend uses the Pipedream browser SDK to open the app's OAuth consent screen.
4. User authorizes. Pipedream stores the credentials — your backend never sees or stores raw tokens.

### Agent Tool Calling Flow (at runtime)

The agent has a small, fixed set of tools — regardless of how many apps the user has connected:

| Tool | Purpose |
|---|---|
| `list_accounts` | Check which apps the user has connected (local DB / Pipedream API) |
| `api_proxy` | Make an authenticated HTTP request to any connected app's API |
| `list_actions` | Discover pre-built operations for an app |
| `describe_action` | Get the schema (required/optional params) for an operation |
| `run_action` | Execute a pre-built operation with configured params |

**The agent workflow:**

1. Call `list_accounts` to see what the user has connected.
2. **If the agent knows the app's API** — use `api_proxy` to make a direct HTTP request through the user's authenticated connection. The agent controls the exact request; this is the most reliable path.
3. **If the agent doesn't know the API** — use `list_actions` / `describe_action` / `run_action` to discover and execute pre-built operations from Pipedream's registry.

## Why This Works

- **O(1) integration effort.** You integrate with Pipedream once. Supporting a new app means zero backend code — just let the user connect it.
- **No credential storage.** Pipedream is the source of truth for OAuth tokens. Your DB only stores the mapping of user to Pipedream `account_id`.
- **Fixed tool surface.** The LLM always sees the same 5 tools. It doesn't need N tool definitions for N apps — it uses `api_proxy` or the action discovery tools to interact with any app dynamically.
- **Two execution strategies.** Direct API calls (`api_proxy`) for well-known APIs the agent understands; pre-built actions (`run_action`) as a fallback for unfamiliar APIs with 10,000+ community-contributed operations.

## Minimal Backend Setup

**Environment variables:**
- `PIPEDREAM_CLIENT_ID`
- `PIPEDREAM_CLIENT_SECRET`

**Server SDK initialization:**
```ts
import { createBackendClient } from "@pipedream/sdk/server";

const pd = createBackendClient({
  clientId: process.env.PIPEDREAM_CLIENT_ID,
  clientSecret: process.env.PIPEDREAM_CLIENT_SECRET,
  projectId: "proj_xxx",
  environment: "production", // or "development"
});
```

**Frontend SDK (for the connect popup):**
```ts
import { createFrontendClient } from "@pipedream/sdk/browser";

const pd = createFrontendClient({
  externalUserId: userId,
  tokenCallback: async () => {
    // fetch short-lived token from your backend
    const { token, expiresAt } = await api.getConnectToken();
    return { token, expiresAt };
  },
});

await pd.connectAccount({ app: "google_sheets" });
```

## Agent Instruction Template

Give the agent these instructions (adapt to your tool naming convention):

```
You have access to tools that let you interact with 3,000+ apps the user
has connected. Follow this workflow:

1. Start with list_accounts to see what apps the user has connected.
2. If you know the app's API, use api_proxy to make direct HTTP requests
   through the user's authenticated connection.
3. If you don't know the API, discover pre-built actions:
   - list_actions to see available operations for an app.
   - describe_action before run_action to understand required params.
   - run_action to execute with configured props.

If the user asks to interact with an app that is NOT connected,
tell them to connect it first via the Integrations page.

Prefer api_proxy over run_action — direct calls you control are more
reliable than pre-built actions.
```
