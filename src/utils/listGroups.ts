import { Bot } from "../core/client.ts";
import { logger } from "../core/logger.ts";

const listGroups = async () => {
  const bot = new Bot();
  await bot.start();

  const sock = await bot.ready(5 * 60 * 1000);

  const groups = await sock.groupFetchAllParticipating();
  const entries = Object.entries(groups);

  if (entries.length === 0) {
    console.log(
      "\nNo groups found. Make sure your bot account is in at least one group.\n",
    );
    process.exit(0);
  }

  console.log("\nYour WhatsApp Groups");
  for (const [jid, group] of entries) {
    const name = group.subject.padEnd(45);
    console.log(`  ${name} ${jid}`);
  }
  console.log("Please copy the JIDs you want into src/config/groups.ts\n");
  process.exit(0);
};

listGroups().catch((err) => {
  logger.fatal(err, "Failed to list groups");
  process.exit(1);
});
