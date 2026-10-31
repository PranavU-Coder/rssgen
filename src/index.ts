import { Bot } from "./core/client.ts";
import { logger } from "./core/logger.ts";
import { scheduleDailyIst } from "./core/scheduler.ts";
import { DIGEST_TOPICS } from "./config/groups.ts";
import { runDigest } from "./digest/run.ts";
import { openSentStore } from "./store/sentPosts.ts";

const DIGEST_TIME_IST = { hour: 22, minute: 0 };
const CONNECT_TIMEOUT_MS = 5 * 60 * 1000;

const start = async () => {
  const bot = new Bot();
  await bot.start();
  await bot.ready(CONNECT_TIMEOUT_MS);
  logger.info("bot connected");

  const store = openSentStore();

  scheduleDailyIst(DIGEST_TIME_IST.hour, DIGEST_TIME_IST.minute, async () => {
    // wait out any reconnect in progress, then send on the live socket
    const sock = await bot.ready(CONNECT_TIMEOUT_MS);
    await runDigest({
      topics: DIGEST_TOPICS,
      store,
      send: (jid, text) => sock.sendMessage(jid, { text }),
    });
  });
};

start().catch((err) => logger.fatal(err, "fatal error"));
