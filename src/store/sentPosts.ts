import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";

const DEFAULT_PATH = join(process.cwd(), "data", "sent_posts.json");
// stories older than the 24h fetch window can never come back, so a few days of history is plenty
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export interface SentStore {
  has(id: string): boolean;
  add(id: string): void;
}

// loaded once into memory; each add rewrites the (pruned, small) file so a crash mid-run never resends
export const openSentStore = (path = DEFAULT_PATH): SentStore => {
  const sent = new Map<string, number>(); // post id -> sent-at (ms)
  const now = Date.now();

  if (existsSync(path)) {
    const data: unknown = JSON.parse(readFileSync(path, "utf-8"));
    // legacy format was a bare array of ids
    const entries: [string, number][] = Array.isArray(data)
      ? data.map((id: string) => [id, now])
      : Object.entries(data as Record<string, number>);
    for (const [id, at] of entries)
      if (now - at < RETENTION_MS) sent.set(id, at);
  } else {
    mkdirSync(dirname(path), { recursive: true });
  }

  const flush = () =>
    writeFileSync(path, JSON.stringify(Object.fromEntries(sent), null, 2));

  return {
    has: (id) => sent.has(id),
    add: (id) => {
      sent.set(id, Date.now());
      flush();
    },
  };
};
