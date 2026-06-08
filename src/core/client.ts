import {
  makeWASocket,
  fetchLatestBaileysVersion,
  Browsers,
  type WASocket,
} from "baileys";
import { env } from "../config/env.ts";
import { loadAuthState } from "./auth.ts";
import { logger } from "./logger.ts";
import { handleConnection } from "../events/connection.ts";

export class Bot {
  private sock!: WASocket;
  private reconnecting = false;

  async start(): Promise<void> {
    await this.connect(async (sock) => {
      sock.ev.on("messages.upsert", async (upsert) => {
        if (upsert.type !== "notify") return;
        for (const msg of upsert.messages) {
          if (!msg.message || msg.key.fromMe) continue;

          const jid = msg.key.remoteJid;
          const text =
            msg.message.conversation || msg.message.extendedTextMessage?.text;
          if (jid?.endsWith("@g.us")) {
            logger.info(`[FOUND GROUP JID] Group: ${jid} | Said: "${text}"`);
          }
        }
      });
    });
  }

  private async connect(
    register: (sock: WASocket) => Promise<void>,
  ): Promise<void> {
    const { state, saveCreds } = await loadAuthState();
    const { version, isLatest } = await fetchLatestBaileysVersion();
    logger.info({ version, isLatest }, "using baileys version");

    const sock = makeWASocket({
      version,
      auth: state,
      logger: logger.child({ module: "baileys" }) as any, // a masterpiece in type annotation from Pranav Sir as always
      browser: Browsers.appropriate(env.botName),
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    this.sock = sock;
    sock.ev.on("creds.update", saveCreds);

    sock.ev.on(
      "connection.update",
      handleConnection(sock, {
        onOpen: () => {
          this.reconnecting = false;
        },
        onClose: (shouldReconnect) => {
          if (shouldReconnect) void this.reconnect(register);
          else
            logger.fatal(
              "logged out, please delete the session directory and restart",
            );
        },
      }),
    );

    if (env.usePairingCode && !state.creds.registered) {
      await Bun.sleep(2000);
      const number = env.pairingNumber.replace(/\D/g, "");
      if (!number)
        throw new Error("PAIRING_NUMBER required when USE_PAIRING_CODE=true");
      const code = await sock.requestPairingCode(number);
      logger.info({ code }, "pairing code");
    }

    await register(sock);
  }

  private async reconnect(
    register: (sock: WASocket) => Promise<void>,
  ): Promise<void> {
    if (this.reconnecting) return;
    this.reconnecting = true;
    await Bun.sleep(2000);
    await this.connect(register);
  }

  socket(): WASocket {
    return this.sock;
  }
}
