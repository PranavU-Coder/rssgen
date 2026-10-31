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
  private open = false;
  private openWaiters: (() => void)[] = [];

  async start(): Promise<void> {
    await this.connect();
  }

  // resolves with the live socket once the connection is open (immediately if it already is)
  async ready(timeoutMs: number): Promise<WASocket> {
    if (!this.open) {
      let timer: Timer | undefined;
      await Promise.race([
        new Promise<void>((resolve) => this.openWaiters.push(resolve)),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`not connected after ${timeoutMs}ms`)),
            timeoutMs,
          );
        }),
      ]).finally(() => clearTimeout(timer));
    }
    return this.sock;
  }

  private async connect(): Promise<void> {
    const { state, saveCreds } = await loadAuthState();
    const { version, isLatest } = await fetchLatestBaileysVersion();
    logger.info({ version, isLatest }, "using baileys version");

    const sock = makeWASocket({
      version,
      auth: state,
      logger: logger.child({ module: "baileys" }) as any, // a masterpiece in type annotation from Pranav Sir as always
      browser: Browsers.appropriate(env.botName),
      generateHighQualityLinkPreview: true, // article preview card on each post (needs link-preview-js + sharp)
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
          this.open = true;
          this.openWaiters.splice(0).forEach((resolve) => resolve());
        },
        onClose: (shouldReconnect) => {
          this.open = false;
          if (shouldReconnect) void this.reconnect();
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
  }

  private async reconnect(): Promise<void> {
    if (this.reconnecting) return;
    this.reconnecting = true;
    await Bun.sleep(2000);
    await this.connect();
  }
}
