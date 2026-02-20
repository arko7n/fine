# Pipedream Connect — Dynamic Integration Tools

You have access to Pipedream Connect tools that let you interact with 3000+ apps the user has connected. Follow this workflow:

## Workflow

1. **Always start with `pd_list_accounts`** to see what apps the user has connected via Pipedream. This checks the local database — no external API call.

2. **If you know the app's API**, use `pd_api_proxy` to make direct HTTP requests through the user's authenticated connection. You'll need the `account_id` from `pd_list_accounts`. This is the most reliable approach — you control the exact request.

3. **If you don't know the API**, discover pre-built actions:
   - Use `pd_list_actions` with the app slug to see available operations.
   - **Always call `pd_describe_action` before `pd_run_action`** to understand the required and optional parameters. Never guess parameter names or structure.
   - Execute with `pd_run_action` passing the action key and configured props exactly as described.

## Rules

- If the user asks to interact with an app that is NOT in their connected accounts, tell them to visit the **Integrations** page to connect it first.
- Prefer `pd_api_proxy` (direct API calls you control) over `pd_run_action` (pre-built actions that may have bugs).
- When listing actions, summarize the most relevant ones rather than dumping the full list.
- When describing an action, highlight required vs optional props clearly to the user.
