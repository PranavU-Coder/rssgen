# rssgen

A small WhatsApp bot that sends you a daily digest of Hacker News, filtered down to the topics you care about.

Every day at **10 PM IST** it pulls the **top 100 HN stories of the last 24 hours**, keeps only the ones matching your topics (Machine Learning, Data Science, Mathematics and LLMs, which I have chosen by default), and sends them to a WhatsApp group: a short header, then one message per post.

Example: 

```
*HN Daily Digest — 31 Oct 2026*
13 posts for you today
```

```
*Backdoors in official Claude Code extensions*
LLMs · matched "Claude"_
⬆655 pts  •  17 comments  •  by dsr_

https://cyberplace.social/@GossiTheDog/117528831681803563
HN: https://news.ycombinator.com/item?id=50302334
```

Each post also gets a link preview card.

## Features

- **Keyword topics**: each post is assigned to exactly one topic, using regexes you can edit
- **One message per post**: within each topic, highest points first
- **No repeats**: sent posts are remembered (for 7 days) and never sent twice
- **Survives reconnects**: if the connection drops around 10 PM, the digest waits for it to come back

## Requirements

- [Bun](https://bun.sh) 1.1 or newer
- A WhatsApp account for the bot (a spare number is recommended) that is a member of the target group

## Setup

```bash
git clone git@github.com:PranavU-Coder/rssgen.git
cd rssgen
bun install
cp .env.example .env
```

### 1. Log in

```bash
bun start
```

Scan the QR code printed in the terminal from WhatsApp → **Linked devices → Link a device**. You have 5 minutes before the bot gives up. The session is saved to `.session/`, so you only do this once.

If you'd rather use a pairing code than a QR code, set `USE_PAIRING_CODE=true` and `PAIRING_NUMBER=<your number with country code>` in `.env`.

### 2. Find your group's JID

```bash
bun src/utils/listGroups.ts
```

This lists every group the bot is in, together with its JID (something like `120363xxxxxxxxxxxx@g.us`).

### 3. Set the target group

Put the JID in `.env`:

```bash
DIGEST_GROUP=120363xxxxxxxxxxxx@g.us
```

Group IDs are kept out of the code on purpose: `.env` is gitignored, so they never end up in the repo. If `DIGEST_GROUP` is missing or malformed, the bot refuses to start and tells you how to find it.

### 4. Configure topics (optional)

Topics live in `src/config/groups.ts`. Each topic has:

| Field      | Meaning                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------- |
| `name`     | Label shown on each message                                                                  |
| `group`    | WhatsApp group JID to send to (read from `.env`); topics can share a group or use different ones |
| `priority` | Order topics are tried in; a post goes to the first topic it matches (lower number wins)      |
| `match`    | Case-insensitive regex tested against the post title                                         |

The order of topics in the array is the order they are sent in. `priority` exists so specific topics can claim posts first: LLMs is priority 1, so "Fine-tuning Llama" is filed under LLMs rather than Machine Learning.

To add a topic, add another entry with its own regex. To send some topics to a different group, add a variable to `.env` (e.g. `MATHS_GROUP=...`), expose it in `src/config/env.ts`, and use `groupJid("MATHS_GROUP", env.mathsGroup)` as that topic's `group`. Keep keywords specific: titles are short, and broad words like "regression" or "tokens" pull in off-topic posts.

### 5. Run it

```bash
bun start
```

The bot logs how long until the next digest and then sits idle until 10 PM IST. It has to be running at that time; if it starts after 10 PM, the first digest goes out the next night.

To change the send time, edit `DIGEST_TIME_IST` in `src/index.ts`.

## Configuration

`.env`:

| Variable           | Default    | Description                                  |
| ------------------ | ---------- | -------------------------------------------- |
| `BOT_NAME`         | `rssgen`   | Device name shown under Linked devices       |
| `SESSION_DIR`      | `.session` | Where WhatsApp credentials are stored        |
| `LOG_LEVEL`        | `info`     | `debug`, `info`, `warn` or `error`           |
| `USE_PAIRING_CODE` | `false`    | Log in with a pairing code instead of a QR code |
| `PAIRING_NUMBER`   |            | Phone number for pairing-code login          |
| `DIGEST_GROUP`     | (required) | Group JID the digest is sent to              |

Logs go to the terminal and to `logs/bot.log`. Sent-post history lives in `data/sent_posts.json`.

## Notes

- Built on [Baileys](https://github.com/WhiskeySockets/Baileys), an unofficial WhatsApp Web client. Automated accounts can be restricted by WhatsApp, so use a number you don't mind losing. Messages are spaced 1.5 s apart to stay well within rate limits.
- Stories come from the public [HN Algolia API](https://hn.algolia.com/api); no API key needed.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)
