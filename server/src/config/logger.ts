import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
    level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
    base: {
        service: "chat-app-server",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: isDev
        ? {
              target: "pino-pretty",
              options: {
                  colorize: true,
                  translateTime: "SYS:standard",
                  ignore: "pid,hostname,service",
              },
          }
        : undefined,
});

export function childLogger(bindings: Record<string, unknown>): pino.Logger {
    return logger.child(bindings);
}
