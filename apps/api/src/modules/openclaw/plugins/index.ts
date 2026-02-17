import type { OpenClawPlugin } from "./base-plugin.js";
import { PlaidPlugin } from "./plaid-plugin.js";
import { IBKRPlugin } from "./ibkr-plugin.js";
import { RobinhoodPlugin } from "./robinhood-plugin.js";
import logger from "../../../lib/logger.js";

const log = logger.child({ module: "plugins" });

const plugins: OpenClawPlugin[] = [
  new PlaidPlugin(),
  new IBKRPlugin(),
  new RobinhoodPlugin(),
];

export async function initializePlugins() {
  for (const plugin of plugins) {
    log.info({ plugin: plugin.name }, "Initializing plugin");
    await plugin.initialize();
  }
}

export async function disposePlugins() {
  for (const plugin of plugins) {
    await plugin.dispose();
  }
}

export function getPlugins(): readonly OpenClawPlugin[] {
  return plugins;
}
