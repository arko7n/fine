import pinoHttp from "pino-http";
import logger from "../lib/logger.js";

export const requestLogger = (pinoHttp as unknown as typeof pinoHttp.default)({
  logger,
  quietReqLogger: true,
  genReqId: (() => undefined) as never,
  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage(req, res) {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customLogLevel(_req, res, error) {
    if (error || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    if (_req.url === "/health") return "trace";
    return "info";
  },
  serializers: {
    req: () => undefined,
    res: () => undefined,
  },
  customProps(_req, res) {
    if (res.statusCode >= 400) {
      return {
        request: {
          method: _req.method,
          url: _req.url,
          headers: _req.headers,
        },
        response: { statusCode: res.statusCode },
      };
    }
    return {};
  },
});
