import config from "../../config.js";
import { registerProvider } from "./provider-registry.js";
import { bankPlaidDirectHandler } from "./providers/bank-plaid-direct.handler.js";
import { bankPlaidPipedreamHandler } from "./providers/bank-plaid-pipedream.handler.js";

// Single config toggle switches all bank connection logic
const bankHandler =
  config.bankProvider === "plaid-pipedream"
    ? bankPlaidPipedreamHandler
    : bankPlaidDirectHandler;

registerProvider("bank", bankHandler);

export { default as connectionsRouter } from "./connections.router.js";
