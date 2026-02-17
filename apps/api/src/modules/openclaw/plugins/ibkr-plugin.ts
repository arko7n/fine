import type { OpenClawPlugin } from "./base-plugin.js";

export class IBKRPlugin implements OpenClawPlugin {
  name = "ibkr";
  description = "Provides trading capabilities via Interactive Brokers";

  async initialize() {
    // TODO: register IBKR tools with OpenClaw
  }

  async dispose() {
    // cleanup
  }
}
