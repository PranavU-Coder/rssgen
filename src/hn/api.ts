export interface Post {
  id: string;
  title: string;
  url: string; // article link, or the HN thread for text posts
  discussionUrl: string;
  author: string;
  points: number;
  comments: number;
}

interface AlgoliaHit {
  objectID: string;
  title: string | null;
  url: string | null;
  author: string;
  points: number | null;
  num_comments: number | null;
}

const toPost = (hit: AlgoliaHit): Post => {
  const discussionUrl = `https://news.ycombinator.com/item?id=${hit.objectID}`;
  return {
    id: hit.objectID,
    title: hit.title ?? "",
    url: hit.url ?? discussionUrl,
    discussionUrl,
    author: hit.author,
    points: hit.points ?? 0,
    comments: hit.num_comments ?? 0,
  };
};

export const fetchTopStories = async (
  limit: number,
  windowMs: number,
): Promise<Post[]> => {
  const since = Math.floor((Date.now() - windowMs) / 1000);
  const url =
    "https://hn.algolia.com/api/v1/search" +
    `?tags=story&numericFilters=created_at_i>${since}&hitsPerPage=${limit}`;

  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`HTTP ${response.status} fetching top stories`);

  const { hits } = (await response.json()) as { hits: AlgoliaHit[] };
  return hits
    .map(toPost)
    .filter((p) => p.title)
    .sort((a, b) => b.points - a.points);
};
