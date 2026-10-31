import pino from "pino";
import { env } from "../config/env.ts";

export const logger = pino({
  level: env.logLevel,
  transport: {
    targets: [
      {
        target: "pino-pretty",
        level: env.logLevel,
        options: { colorize: true, translateTime: "SYS:HH:MM:ss" },
      },
      {
        target: "pino/file",
        level: env.logLevel,
        options: { destination: "logs/bot.log", mkdir: true },
      },
    ],
  },
});
