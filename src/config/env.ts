import "dotenv/config";

const str = (key: string, fallback?: string): string => {
  const v = process.env[key];
  if (v === undefined || v === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing env: ${key}`);
  }
  return v;
};

const list = (key: string): string[] =>
  (process.env[key] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const bool = (key: string, fallback = false): boolean => {
  const v = process.env[key];
  if (v === undefined) return fallback;
  return /^(1|true|yes|on)$/i.test(v);
};

export const env = {
  botName: str("BOT_NAME", "rssgen"),
  prefix: str("PREFIX", "!"),
  owners: list("OWNERS"),
  sessionDir: str("SESSION_DIR", ".session"),
  logLevel: str("LOG_LEVEL", "info"),
  usePairingCode: bool("USE_PAIRING_CODE"),
  pairingNumber: str("PAIRING_NUMBER", ""),
} as const;

export type Env = typeof env;
