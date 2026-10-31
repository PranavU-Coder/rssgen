import { logger } from "./logger.ts";

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000; // IST is UTC+5:30 with no DST

export const msUntilIst = (
  hour: number,
  minute = 0,
  now = Date.now(),
): number => {
  const nowIst = new Date(now + IST_OFFSET_MS);
  const next = new Date(nowIst);
  next.setUTCHours(hour, minute, 0, 0);
  if (next <= nowIst) next.setUTCDate(next.getUTCDate() + 1);
  return next.getTime() - nowIst.getTime();
};

// runs `task` every day at hour:minute IST; a failing run is logged and the next day is still scheduled
export const scheduleDailyIst = (
  hour: number,
  minute: number,
  task: () => Promise<void>,
): void => {
  const label = `${hour}:${String(minute).padStart(2, "0")} IST`;
  const delay = msUntilIst(hour, minute);
  logger.info(`next run in ${(delay / 3_600_000).toFixed(2)}h (${label})`);

  setTimeout(async () => {
    try {
      await task();
    } catch (err) {
      logger.error(err, `scheduled task failed, will retry at next ${label}`);
    }
    scheduleDailyIst(hour, minute, task);
  }, delay);
};
