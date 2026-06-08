import { Bot } from "./core/client.ts";
import { logger } from "./core/logger.ts";
import { runHackerNewsJob } from "./jobs/hn.ts";

const THIRTY_MINUTES = 30 * 60 * 1000;

const start = async () => {
  const bot = new Bot();
  await bot.start();

  logger.info("bot initialized! waiting for connection to stabilize...");
  await Bun.sleep(15000);
  await runHackerNewsJob(bot.socket());

  setInterval(async () => {
    try {
      // get fresh reference after any reconnect
      await runHackerNewsJob(bot.socket());
    } catch (err) {
      logger.error(err, "HN job failed, will retry next interval");
    }
  }, THIRTY_MINUTES);
};

start().catch((err) => logger.fatal(err, "fatal error"));
