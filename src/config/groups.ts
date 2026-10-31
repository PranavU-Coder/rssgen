import { env } from "./env.ts";

/*
Each topic is matched against the titles of the day's top HN stories.
`group` is the WhatsApp group JID the topic's posts are sent to. JIDs live in .env, never in code
(run src/utils/listGroups.ts to find them). Several topics can share a group.
Topics are matched in `priority` order (lowest first) so a post lands in exactly one topic,
e.g. "Fine-tuning Llama with RL" goes to LLMs rather than Machine Learning.
*/

export interface DigestTopic {
  name: string;
  group: string;
  priority: number;
  match: RegExp;
}

const groupJid = (key: string, value: string): string => {
  if (!/^\d+@g\.us$/.test(value))
    throw new Error(
      `${key} must be a WhatsApp group JID like 120363xxxxxxxxxxxx@g.us (run: bun src/utils/listGroups.ts)`,
    );
  return value;
};

const READING_GROUP = groupJid("DIGEST_GROUP", env.digestGroup);

export const DIGEST_TOPICS: DigestTopic[] = [
  {
    name: "Machine Learning",
    group: READING_GROUP,
    priority: 2,
    match:
      /\b(machine[- ]learning|ML|deep[- ]learning|neural[- ]net(work)?s?|reinforcement[- ]learning|RL|computer[- ]vision|transformers?|diffusion|pytorch|tensorflow|jax|backprop(agation)?|gradient descent|fine[- ]?tun(e|ing|ed)|embeddings?|model training|CUDA)\b/i,
  },
  {
    name: "Data Science",
    group: READING_GROUP,
    priority: 3,
    match:
      /\b(data[- ]scien(ce|tists?)|data analy(sis|tics)|analytics|statistic(s|al)|pandas|polars|duckdb|jupyter|datasets?|data visuali[sz]ation|bayesian|time[- ]series|forecasting|kaggle)\b/i,
  },
  {
    name: "Mathematics",
    group: READING_GROUP,
    priority: 4,
    match:
      /\b(math(s|ematics?|ematicians?)?|theorems?|proofs?|conjectures?|algebra(ic)?|geometry|topology|calculus|primes?|number theory|probability|equations?|combinatorics|lean ?4|fourier|integrals?)\b/i,
  },
  {
    name: "LLMs",
    group: READING_GROUP,
    priority: 1,
    match:
      /\b(LLMs?|large language models?|language models?|GPT[- ]?\w*|ChatGPT|OpenAI|Anthropic|Claude|Gemini|Llama|Mistral|DeepSeek|Qwen|Copilot|prompt(s|ing)?|RAG|AI agents?|agentic|chatbots?|inference|context window)\b/i,
  },
];
