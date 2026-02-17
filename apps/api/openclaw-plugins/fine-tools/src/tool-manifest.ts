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
    name: "plaid_get_balance",
    label: "Get Account Balances",
    description:
      "Retrieve real-time balance information for all accounts linked via Plaid. Returns current, available, and limit balances for each account.",
    app: "plaid",
    action: "get_balance",
    parameters: Type.Object({
      access_token: Type.String({
        description: "The Plaid access token for the user's linked item",
      }),
    }),
  },
  {
    name: "plaid_get_accounts",
    label: "Get Accounts",
    description:
      "List all bank accounts linked via Plaid, including account names, types, subtypes, and masks.",
    app: "plaid",
    action: "get_accounts",
    parameters: Type.Object({
      access_token: Type.String({
        description: "The Plaid access token for the user's linked item",
      }),
    }),
  },
  {
    name: "plaid_get_transactions",
    label: "Get Transactions",
    description:
      "Fetch transactions for a Plaid-linked account within a date range. Returns transaction details including amount, date, merchant name, and category.",
    app: "plaid",
    action: "get_transactions",
    parameters: Type.Object({
      access_token: Type.String({
        description: "The Plaid access token for the user's linked item",
      }),
      start_date: Type.String({ description: "Start date in YYYY-MM-DD format" }),
      end_date: Type.String({ description: "End date in YYYY-MM-DD format" }),
    }),
  },
  {
    name: "plaid_sync_transactions",
    label: "Sync Transactions",
    description:
      "Incrementally sync transactions using a cursor. Returns added, modified, and removed transactions since the last sync.",
    app: "plaid",
    action: "sync_transactions",
    parameters: Type.Object({
      access_token: Type.String({
        description: "The Plaid access token for the user's linked item",
      }),
      cursor: Type.Optional(
        Type.String({ description: "Cursor from previous sync call. Omit for initial sync." })
      ),
    }),
  },
  {
    name: "plaid_create_transfer",
    label: "Create Transfer",
    description:
      "Initiate an ACH bank transfer (debit) from a linked Plaid account. First authorizes, then creates the transfer.",
    app: "plaid",
    action: "create_transfer",
    parameters: Type.Object({
      access_token: Type.String({
        description: "The Plaid access token for the user's linked item",
      }),
      account_id: Type.String({ description: "The Plaid account ID to debit from" }),
      amount: Type.String({ description: "Transfer amount as a decimal string, e.g. '100.00'" }),
      description: Type.String({ description: "Description for the transfer" }),
    }),
  },
  {
    name: "plaid_get_transfer_status",
    label: "Get Transfer Status",
    description:
      "Check the status of a previously initiated Plaid transfer by its transfer ID.",
    app: "plaid",
    action: "get_transfer_status",
    parameters: Type.Object({
      transfer_id: Type.String({ description: "The Plaid transfer ID to check" }),
    }),
  },
];
