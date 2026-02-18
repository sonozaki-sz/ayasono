// src/bot/events/messageCreate.ts
// メッセージ作成イベント - Bump検知用

import { Events } from "discord.js";
import { NODE_ENV, env } from "../../shared/config/env";
import {
  BUMP_COMMANDS,
  BUMP_SERVICES,
  handleBumpDetected,
  resolveBumpService,
} from "../../shared/features/bump-reminder";
import type { BotEvent } from "../../shared/types/discord";
import type { BotClient } from "../client";

export const messageCreateEvent: BotEvent<typeof Events.MessageCreate> = {
  name: Events.MessageCreate,
  once: false,

  async execute(message) {
    // DMは無視
    if (!message.guild) return;

    const client = message.client as BotClient;
    const guildId = message.guild.id;
    const channelId = message.channel.id;

    // テストモード: "test <command>" で検知（開発環境のみ、本番環境では絶対動作しない）
    if (
      env.NODE_ENV !== NODE_ENV.PRODUCTION &&
      env.TEST_MODE &&
      !message.author.bot
    ) {
      if (message.content.toLowerCase() === `test ${BUMP_COMMANDS.DISBOARD}`) {
        await handleBumpDetected(
          client,
          guildId,
          channelId,
          message.id,
          BUMP_SERVICES.DISBOARD,
        );
        return;
      }
      if (message.content.toLowerCase() === `test ${BUMP_COMMANDS.DISSOKU}`) {
        await handleBumpDetected(
          client,
          guildId,
          channelId,
          message.id,
          BUMP_SERVICES.DISSOKU,
        );
        return;
      }
    }

    // Bot自身のメッセージ以外は無視
    if (message.author.bot === false) return;

    // スラッシュコマンド由来メッセージのみを対象にする
    const commandName = message.interaction?.commandName;
    if (!commandName) return;

    const serviceName = resolveBumpService(message.author.id, commandName);
    if (!serviceName) return;

    // 対応サービスのコマンドを検知
    await handleBumpDetected(
      client,
      guildId,
      channelId,
      message.id,
      serviceName,
    );
    return;
  },
};
