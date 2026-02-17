import type { OpenClawPlugin } from "./base-plugin.js";

export class RobinhoodPlugin implements OpenClawPlugin {
  name = "robinhood";
  description = "Provides trading capabilities via Robinhood";

  async initialize() {
    // TODO: register Robinhood tools with OpenClaw
  }

  async dispose() {
    // cleanup
  }
}
