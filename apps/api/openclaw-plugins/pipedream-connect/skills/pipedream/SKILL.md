# Pipedream Connect — Dynamic Integration Tools

You have access to Pipedream Connect tools that let you interact with 3000+ apps the user has connected. Follow this discovery-then-execute pattern:

## Workflow

1. **Always start with `pd_list_accounts`** to see what apps the user has connected via Pipedream. This checks the local database — no external API call.

2. **If the app is connected**, use `pd_list_actions` with the app slug to discover available operations (e.g. "send email", "create spreadsheet row").

3. **Always call `pd_describe_action` before `pd_run_action`** to understand the required and optional parameters for an action. Never guess parameter names or structure.

4. **Execute with `pd_run_action`** passing the action key and configured props exactly as described. The user's account is resolved automatically.

5. **If no pre-built action exists**, fall back to `pd_api_proxy` for raw HTTP requests through the user's authenticated connection. You'll need the `account_id` from `pd_list_accounts`.

## Rules

- If the user asks to interact with an app that is NOT in their connected accounts, tell them to visit the **Integrations** page to connect it first.
- Prefer `pd_run_action` (pre-built, validated actions) over `pd_api_proxy` (raw HTTP calls).
- When listing actions, summarize the most relevant ones rather than dumping the full list.
- When describing an action, highlight required vs optional props clearly to the user.
