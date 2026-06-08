import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DIR_PATH = join(process.cwd(), "data");
const FILE_PATH = join(DIR_PATH, "sent_posts.json");

export const getSentPosts = (): Set<string> => {
  if (!existsSync(FILE_PATH)) {
    if (!existsSync(DIR_PATH)) mkdirSync(DIR_PATH, { recursive: true });
    writeFileSync(FILE_PATH, JSON.stringify([]));
    return new Set();
  }
  const data = JSON.parse(readFileSync(FILE_PATH, "utf-8"));
  return new Set(data);
};

export const saveSentPost = (id: string) => {
  const posts = getSentPosts();
  posts.add(id);
  writeFileSync(FILE_PATH, JSON.stringify([...posts], null, 2));
};
