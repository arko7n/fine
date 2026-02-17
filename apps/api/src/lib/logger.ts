import pino from "pino";
import config from "../config.js";

const logger = pino({
  level: config.logLevel,
  transport:
    config.env === "local"
      ? { target: "pino-pretty", options: { translateTime: "HH:MM:ss.l" } }
      : undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
