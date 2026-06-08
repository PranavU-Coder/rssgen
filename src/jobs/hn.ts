import type { WASocket } from "baileys";
import { logger } from "../core/logger.js";
import { getSentPosts, saveSentPost } from "./state.js";

// some basic config

/*
Map each topic (you can obviously change topic to what you want) to the ACTUAL WhatsApp group JID it should be sent to.
One topic can be sent toone group and so can multiple topics be shared to the same group JID.
Run the groupFetchAllParticipating() snippet from the setup guide to get JIDs.
*/

const TOPIC_GROUP_MAP: Record<string, string> = {
  "machine learning": "120363000000000001@g.us",
  "deep learning": "120363000000000001@g.us",
  "large language models": "120363000000000001@g.us",
  "reinforcement learning": "120363000000000001@g.us",
  "computer vision": "120363000000000001@g.us",
  AGI: "120363000000000002@g.us",
  "data science": "120363000000000003@g.us",
};

const HITS_PER_TOPIC = 10;
const SEND_DELAY_MS = 1500;

interface HNArticle {
  objectID: string;
  title: string;
  url: string | null;
  author: string;
  points: number | null;
  num_comments: number | null;
  created_at: string;
}

interface HNResponse {
  hits: HNArticle[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchArticlesForTopic = async (topic: string): Promise<HNArticle[]> => {
  const url = [
    "https://hn.algolia.com/api/v1/search_by_date",
    `?query=${encodeURIComponent(topic)}`,
    `&tags=story`,
    `&hitsPerPage=${HITS_PER_TOPIC}`,
  ].join("");

  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`HTTP ${response.status} for topic "${topic}"`);

  const data = (await response.json()) as HNResponse;
  return data.hits;
};

const formatMessage = (article: HNArticle, topic: string): string => {
  const link =
    article.url ?? `https://news.ycombinator.com/item?id=${article.objectID}`;
  const hnUrl = `https://news.ycombinator.com/item?id=${article.objectID}`;
  const pts = article.points ?? 0;
  const cmts = article.num_comments ?? 0;

  return [
    `*${article.title}*`,
    ``,
    `_Topic: ${topic}_`,
    `By ${article.author}  •  ⬆${pts} pts  •  ${cmts} comments`,
    ``,
    `${link}`,
    `HN: ${hnUrl}`,
  ].join("\n");
};

export const runHackerNewsJob = async (sock: WASocket): Promise<void> => {
  const topics = Object.keys(TOPIC_GROUP_MAP);
  logger.info(
    `Starting HN job, ${topics.length} topics across ${new Set(Object.values(TOPIC_GROUP_MAP)).size} groups`,
  );

  const sentPosts = getSentPosts();
  let totalSent = 0;

  for (const topic of topics) {
    const groupJid = TOPIC_GROUP_MAP[topic];
    logger.info(`Fetching topic: "${topic}" → group ${groupJid}`);

    let articles: HNArticle[];
    try {
      articles = await fetchArticlesForTopic(topic);
    } catch (err) {
      logger.error(`Failed to fetch "${topic}": ${err}`);
      continue; // don't let one bad topic kill the whole job
    }
    for (const article of articles.reverse()) {
      const id = article.objectID;

      if (sentPosts.has(id)) continue;
      if (!article.title) continue;

      try {
        const message = formatMessage(article, topic);
        await sock.sendMessage(groupJid, { text: message });
        await saveSentPost(id);
        sentPosts.add(id); // guard rails for duplicates
        totalSent++;

        logger.info(`Sent [${topic}] "${article.title}"`);
        await sleep(SEND_DELAY_MS);
      } catch (sendErr) {
        logger.error(`Failed to send article ${id}: ${sendErr}`);
      }
    }
  }

  logger.info(
    `HN job has been completed successfully, overall: sent ${totalSent} new articles`,
  );
};
