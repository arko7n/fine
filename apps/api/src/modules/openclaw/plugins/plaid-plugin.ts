import type { OpenClawPlugin } from "./base-plugin.js";

export class PlaidPlugin implements OpenClawPlugin {
  name = "plaid";
  description = "Provides financial account data via Plaid";

  async initialize() {
    // TODO: register Plaid tools with OpenClaw
  }

  async dispose() {
    // cleanup
  }
}
