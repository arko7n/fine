import { Type, type TObject } from "@sinclair/typebox";

export type ToolDefinition = {
  name: string;
  label: string;
  description: string;
  app: string;
  action: string;
  parameters: TObject;
};

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "pd_list_accounts",
    label: "List Connected Accounts",
    description:
      "List all Pipedream-connected accounts for the current user. Returns provider name, account ID, app name, and connection status. Always call this first to check what apps the user has connected.",
    app: "pipedream",
    action: "list_accounts",
    parameters: Type.Object({}),
  },
  {
    name: "pd_list_actions",
    label: "List App Actions",
    description:
      "List available actions for a Pipedream-connected app. Returns action keys, names, and descriptions. Use the app's nameSlug (e.g. 'gmail', 'slack', 'google_sheets').",
    app: "pipedream",
    action: "list_actions",
    parameters: Type.Object({
      app_slug: Type.String({
        description: "The Pipedream app slug (e.g. 'gmail', 'slack', 'google_sheets')",
      }),
    }),
  },
  {
    name: "pd_describe_action",
    label: "Describe Action",
    description:
      "Get full details of a Pipedream action including its configurable props/parameters. Always call this before running an action to understand required and optional parameters.",
    app: "pipedream",
    action: "describe_action",
    parameters: Type.Object({
      action_key: Type.String({
        description: "The action key returned from pd_list_actions",
      }),
    }),
  },
  {
    name: "pd_run_action",
    label: "Run Action",
    description:
      "Execute a pre-built Pipedream action with configured props. The account is resolved automatically. Always call pd_describe_action first. Use this as a fallback when you don't know the app's API — prefer pd_api_proxy when you do.",
    app: "pipedream",
    action: "run_action",
    parameters: Type.Object({
      action_key: Type.String({
        description: "The action key to execute",
      }),
      configured_props: Type.Optional(
        Type.Record(Type.String(), Type.Unknown(), {
          description: "Action parameters as described by pd_describe_action",
        }),
      ),
    }),
  },
  {
    name: "pd_api_proxy",
    label: "API Proxy",
    description:
      "Make an authenticated HTTP request through a Pipedream-connected account. Prefer this when you know the app's API — it gives you direct control and is more reliable than pre-built actions. Use pd_run_action only when you don't know the API.",
    app: "pipedream",
    action: "api_proxy",
    parameters: Type.Object({
      method: Type.String({
        description: "HTTP method (GET, POST, PUT, PATCH, DELETE)",
      }),
      url: Type.String({
        description: "The full API URL to call",
      }),
      account_id: Type.String({
        description: "The Pipedream account ID from pd_list_accounts",
      }),
      body: Type.Optional(
        Type.Record(Type.String(), Type.Unknown(), {
          description: "Request body for POST/PUT/PATCH requests",
        }),
      ),
      headers: Type.Optional(
        Type.Record(Type.String(), Type.String(), {
          description: "Additional HTTP headers",
        }),
      ),
    }),
  },
];
