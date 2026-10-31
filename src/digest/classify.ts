import type { DigestTopic } from "../config/groups.ts";
import type { Post } from "../hn/api.ts";

export interface Match {
  topic: DigestTopic;
  term: string; // the title keyword that triggered the topic
}

// returns a classifier that assigns each post to at most one topic, trying topics by priority
export const createClassifier = (topics: readonly DigestTopic[]) => {
  const byPriority = [...topics].sort((a, b) => a.priority - b.priority);

  return (post: Post): Match | undefined => {
    for (const topic of byPriority) {
      const hit = post.title.match(topic.match);
      if (hit) return { topic, term: hit[0] };
    }
  };
};
