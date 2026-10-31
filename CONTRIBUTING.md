# Contribution Guidelines

Thanks for wanting to help with rssgen! Bug reports, keyword tweaks and code changes are all welcome.

## Reporting bugs and ideas

Open an issue on [GitHub](https://github.com/PranavU-Coder/rssgen/issues) with:

- what you expected and what happened
- relevant lines from `logs/bot.log` (remove phone numbers and group JIDs first)
- your Bun version (`bun --version`)

For misclassified posts, include the post title and the topic it landed in (or should have).

## Development setup

```bash
git clone git@github.com:PranavU-Coder/rssgen.git
cd rssgen
bun install
cp .env.example .env
```

Follow the setup in the [README](README.md#setup) to log in and point the bot at a test group by setting `DIGEST_GROUP` in your `.env`. **Use a throwaway WhatsApp group for development**, not one people actually read.

Useful scripts:

| Command             | What it does                        |
| ------------------- | ----------------------------------- |
| `bun start`         | Run the bot                         |
| `bun run dev`       | Run with auto-restart on file changes |
| `bun run typecheck` | Type-check with `tsc`               |
| `bun run format`    | Format `src/` with Prettier         |

### Testing a digest without waiting for 10 PM

`runDigest` only needs a `send` function, so you can try changes without WhatsApp. Pass a fake sender and a throwaway store file:

```ts
// scratch.ts (don't commit)
import { runDigest } from "./src/digest/run.ts";
import { DIGEST_TOPICS } from "./src/config/groups.ts";
import { openSentStore } from "./src/store/sentPosts.ts";

await runDigest({
  topics: DIGEST_TOPICS,
  store: openSentStore("/tmp/sent.json"),
  send: async (jid, text) => console.log(`--> ${jid}\n${text}\n`),
});
```

```bash
bun scratch.ts
```

This fetches live HN data and prints the messages that would be sent. Use a separate store path so your real `data/sent_posts.json` isn't marked as sent.

## Code layout and principles

The code is split so each module has one responsibility. Please keep it that way:

- **`hn/`** is the only code that knows the Algolia API shape. It returns plain `Post` objects; other modules never touch raw API fields.
- **`digest/`** holds pure logic (`classify.ts`, `format.ts`) plus the orchestrator (`run.ts`). The orchestrator receives its dependencies (`topics`, `send`, `store`) as arguments instead of importing WhatsApp or global state, which keeps it testable.
- **`store/`** owns persistence. Callers only see `has` / `add`.
- **`core/`** is infrastructure: the WhatsApp connection, logging, scheduling.
- **`config/`** is data, not logic. Secrets and per-user values (group JIDs, phone numbers) belong in `.env`, never hard-coded in source.

Adding a new source (Reddit, arXiv, ...)? Write a module that returns `Post[]` and plug it into `run.ts`; classification and formatting should work unchanged.

## Style

- TypeScript, strict mode, ES modules with explicit `.ts` import extensions
- Format with Prettier (`bun run format`) before committing
- Small, focused functions; comments explain *why*, not *what*
- Log with the shared `logger` from `core/logger.ts`, not `console.log` (except CLI utilities such as `listGroups.ts`)

## Tuning topic keywords

Keyword changes in `src/config/groups.ts` are the most common contribution. When proposing one:

- check it against a few days of real top stories (the scratch script above works well)
- prefer specific terms; short titles make broad words like "regression", "tokens" or "matrix" match off-topic posts
- use word boundaries (`\b...\b`) and remember the regex is case-insensitive

## Pull requests

1. Fork the repo and create a branch from `main` (`feat/arxiv-source`, `fix/reconnect-timeout`, ...)
2. Make your change and keep the PR focused on one thing
3. Run `bun run typecheck` and `bun run format`
4. If you touched the digest, include sample output from the scratch script in the PR description
5. Use [Conventional Commits](https://www.conventionalcommits.org) for messages, e.g. `feat: add arXiv source`, `fix: handle empty titles`

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
