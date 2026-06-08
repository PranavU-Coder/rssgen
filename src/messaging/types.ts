import type { WAMessage, WAMessageKey, AnyMessageContent } from "baileys";

export interface ParsedMessage {
  raw: WAMessage;
  key: WAMessageKey;
  id: string;
  chat: string;
  sender: string;
  senderPn: string;
  pushName?: string;
  fromMe: boolean; // did bro send it?
  isGroup: boolean;
  text: string;
  body: string;
  mentions: string[]; // incase
  timestamp: number;
}

export type Outgoing = AnyMessageContent;
