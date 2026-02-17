import "./env.js";

import logger from "./lib/logger.js";
import appConfig from "./config.js";
import { createApp } from "./app.js";
import { startOpenClaw, stopOpenClaw } from "./modules/openclaw/openclaw.service.js";

const log = logger.child({ module: "bootstrap" });

async function main() {
  log.info("Starting OpenClaw gateway...");
  await startOpenClaw();
  log.info("OpenClaw gateway started.");

  const app = createApp();

  app.listen(appConfig.port, () => {
    log.info(`Fine backend listening on http://localhost:${appConfig.port}`);
  });
}

process.on("SIGTERM", () => { stopOpenClaw(); process.exit(0); });
process.on("SIGINT", () => { stopOpenClaw(); process.exit(0); });

main();
