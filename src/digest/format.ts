import type { Post } from "../hn/api.ts";
import type { Match } from "./classify.ts";

export const formatPost = (post: Post, { topic, term }: Match): string =>
  [
    `*${post.title}*`,
    `_${topic.name} · matched "${term}"_`,
    `⬆${post.points} pts  •  ${post.comments} comments  •  by ${post.author}`,
    ``,
    post.url,
    ...(post.url !== post.discussionUrl ? [`HN: ${post.discussionUrl}`] : []),
  ].join("\n");

export const formatHeader = (count: number, now = new Date()): string => {
  const date = now.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `*HN Daily Digest — ${date}*\n${count} post${count === 1 ? "" : "s"} for you today`;
};
