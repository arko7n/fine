import { CountryCode, Products } from "plaid";
import plaidClient from "../../../lib/plaid.js";
import logger from "../../../lib/logger.js";

const log = logger.child({ module: "plaid-provider" });

export async function createLinkToken(userId: string) {
  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: "Fine",
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: "en",
  });
  return response.data;
}

export async function exchangePublicToken(publicToken: string) {
  const response = await plaidClient.itemPublicTokenExchange({
    public_token: publicToken,
  });
  return response.data;
}

export async function getAccounts(accessToken: string) {
  const response = await plaidClient.accountsGet({ access_token: accessToken });
  return response.data.accounts;
}

export async function getBalance(accessToken: string) {
  const response = await plaidClient.accountsBalanceGet({ access_token: accessToken });
  return response.data.accounts;
}

export async function getTransactions(
  accessToken: string,
  startDate: string,
  endDate: string
) {
  const response = await plaidClient.transactionsGet({
    access_token: accessToken,
    start_date: startDate,
    end_date: endDate,
  });
  return response.data;
}

export async function syncTransactions(accessToken: string, cursor?: string) {
  const response = await plaidClient.transactionsSync({
    access_token: accessToken,
    ...(cursor ? { cursor } : {}),
  });
  return response.data;
}

export async function initiateTransfer(
  accessToken: string,
  accountId: string,
  amount: string,
  description: string
) {
  // First, authorize the transfer
  const authResponse = await plaidClient.transferAuthorizationCreate({
    access_token: accessToken,
    account_id: accountId,
    type: "debit" as any,
    network: "ach" as any,
    amount,
    ach_class: "ppd" as any,
    user: { legal_name: "Fine User" },
  });

  const response = await plaidClient.transferCreate({
    access_token: accessToken,
    account_id: accountId,
    authorization_id: authResponse.data.authorization.id,
    description,
  });
  return response.data;
}

export async function getTransferStatus(transferId: string) {
  const response = await plaidClient.transferGet({ transfer_id: transferId });
  return response.data;
}
