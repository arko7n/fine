import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import config from "../config.js";

const plaidConfig = new Configuration({
  basePath:
    PlaidEnvironments[config.plaidEnv as keyof typeof PlaidEnvironments] ??
    PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": config.plaidClientId,
      "PLAID-SECRET": config.plaidSecret,
    },
  },
});

const plaidClient = new PlaidApi(plaidConfig);

export default plaidClient;
