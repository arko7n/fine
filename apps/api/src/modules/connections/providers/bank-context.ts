import type { ConnectionRow } from "../connection-store.js";

/**
 * Shared agent context for bank connections. Works identically regardless of
 * whether the bank was connected via direct Plaid or Pipedream-wrapped Plaid.
 * The OC plaid_* tools just need access_token values.
 */
export function bankAgentContext(connections: ConnectionRow[]): string | null {
  if (connections.length === 0) return null;

  const lines = connections.map((c) => {
    const label =
      (c.body.metadata.institutionName as string) ??
      (c.body.credentials.itemId as string) ??
      "Bank";
    return `- ${label}: access_token="${c.body.credentials.accessToken}"`;
  });

  return [
    "The user has the following connected bank accounts.",
    "When they ask about finances, use the appropriate plaid_* tools with these access tokens:",
    "",
    ...lines,
  ].join("\n");
}
