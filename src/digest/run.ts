import { logger } from "../core/logger.ts";
import type { DigestTopic } from "../config/groups.ts";
import { fetchTopStories, type Post } from "../hn/api.ts";
import type { SentStore } from "../store/sentPosts.ts";
import { createClassifier, type Match } from "./classify.ts";
import { formatHeader, formatPost } from "./format.ts";

const TOP_N = 100; // size of the daily pool that topics are filtered from
const WINDOW_MS = 24 * 60 * 60 * 1000;
const SEND_DELAY_MS = 1500; // spacing between messages to stay clear of WhatsApp rate limits

export type SendText = (jid: string, text: string) => Promise<unknown>;

export interface DigestDeps {
  topics: readonly DigestTopic[];
  send: SendText;
  store: SentStore;
}

interface Item {
  post: Post;
  match: Match;
}

// unsent matching posts per group; within a group, topics keep config order and posts keep points order
const planDigests = (
  posts: Post[],
  topics: readonly DigestTopic[],
  store: SentStore,
): Map<string, Item[]> => {
  const classify = createClassifier(topics);
  const groups = new Map<string, Item[]>();

  for (const post of posts) {
    if (store.has(post.id)) continue;
    const match = classify(post);
    if (!match) continue;
    const items = groups.get(match.topic.group) ?? [];
    items.push({ post, match });
    groups.set(match.topic.group, items);
  }

  const order = new Map(topics.map((t, i) => [t, i]));
  for (const items of groups.values()) {
    items.sort((a, b) => order.get(a.match.topic)! - order.get(b.match.topic)!); // stable, so points order survives
  }
  return groups;
};

export const runDigest = async ({ topics, send, store }: DigestDeps) => {
  logger.info(`Starting HN digest — filtering top ${TOP_N} stories of the day`);

  const posts = await fetchTopStories(TOP_N, WINDOW_MS);
  const digests = planDigests(posts, topics, store);

  let totalSent = 0;
  for (const [jid, items] of digests) {
    try {
      await send(jid, formatHeader(items.length));
      await Bun.sleep(SEND_DELAY_MS);
    } catch (err) {
      logger.error(`Failed to send digest header to ${jid}: ${err}`);
      continue;
    }

    for (const { post, match } of items) {
      try {
        await send(jid, formatPost(post, match));
        store.add(post.id);
        totalSent++;
        logger.info(
          `Sent [${match.topic.name}] "${post.title}" (${post.points} pts)`,
        );
        await Bun.sleep(SEND_DELAY_MS);
      } catch (err) {
        logger.error(`Failed to send post ${post.id}: ${err}`);
      }
    }
  }

  logger.info(
    `HN digest done, sent ${totalSent} of ${posts.length} top stories matching your topics`,
  );
};
