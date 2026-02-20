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
      "Execute a Pipedream action with configured props. The account is resolved automatically from the user's connected accounts. Always call pd_describe_action first to understand the required props.",
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
      "Make a raw HTTP request through a Pipedream-connected account's authenticated proxy. Use this only when no pre-built action exists for what you need. Prefer pd_run_action when possible.",
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
