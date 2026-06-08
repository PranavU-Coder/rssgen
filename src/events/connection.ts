import { Boom } from "@hapi/boom";
import { DisconnectReason, type WASocket, type ConnectionState } from "baileys";
import qrcode from "qrcode-terminal";
import { logger } from "../core/logger.ts";

export interface ConnectionHandlers {
  onOpen: () => void;
  onClose: (shouldReconnect: boolean) => void;
}

export const handleConnection = (
  sock: WASocket,
  handlers: ConnectionHandlers,
) => {
  return (update: Partial<ConnectionState>) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
      logger.info("scan QR to authenticate");
    }

    if (connection === "open") {
      logger.info({ user: sock.user?.id }, "connection open");
      handlers.onOpen();
    }

    if (connection === "close") {
      const code = (lastDisconnect?.error as Boom | undefined)?.output
        ?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      logger.warn({ code, loggedOut }, "connection closed");
      handlers.onClose(!loggedOut);
    }
  };
};
