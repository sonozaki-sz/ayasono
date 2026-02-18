// src/bot/events/index.ts
// イベント一覧をエクスポート

import { clientReadyEvent } from "./clientReady";
import { interactionCreateEvent } from "./interactionCreate";
import { messageCreateEvent } from "./messageCreate";

export const events = [
  interactionCreateEvent,
  clientReadyEvent,
  messageCreateEvent,
] as const;
