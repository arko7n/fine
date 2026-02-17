import { registerToolHandler } from "../tool-registry.js";
import {
  getAccounts,
  getBalance,
  getTransactions,
  syncTransactions,
  initiateTransfer,
  getTransferStatus,
} from "../../integrations/providers/plaid.js";

registerToolHandler("plaid", "get_balance", async (params) => {
  const accounts = await getBalance(params.access_token as string);
  return accounts;
});

registerToolHandler("plaid", "get_accounts", async (params) => {
  const accounts = await getAccounts(params.access_token as string);
  return accounts;
});

registerToolHandler("plaid", "get_transactions", async (params) => {
  const data = await getTransactions(
    params.access_token as string,
    params.start_date as string,
    params.end_date as string
  );
  return data;
});

registerToolHandler("plaid", "sync_transactions", async (params) => {
  const data = await syncTransactions(
    params.access_token as string,
    params.cursor as string | undefined
  );
  return data;
});

registerToolHandler("plaid", "create_transfer", async (params) => {
  const data = await initiateTransfer(
    params.access_token as string,
    params.account_id as string,
    params.amount as string,
    params.description as string
  );
  return data;
});

registerToolHandler("plaid", "get_transfer_status", async (params) => {
  const data = await getTransferStatus(params.transfer_id as string);
  return data;
});
