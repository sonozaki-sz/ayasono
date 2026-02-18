// src/shared/utils/interaction.ts
// Discord Interaction関連のユーティリティ関数

import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  InteractionReplyOptions,
  ModalSubmitInteraction,
} from "discord.js";
import { DiscordAPIError, RESTJSONErrorCodes } from "discord.js";

type AnyInteraction =
  | ChatInputCommandInteraction
  | ButtonInteraction
  | ModalSubmitInteraction;

/**
 * Interactionに安全に応答する
 * 既に応答済みの場合はfollowUpを使用する
 * @param interaction Discord Interaction
 * @param options 応答オプション
 */
export async function safeReply(
  interaction: AnyInteraction,
  options: InteractionReplyOptions,
): Promise<void> {
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(options);
    } else {
      await interaction.reply(options);
    }
  } catch (error) {
    // Discord API エラーコードで応答済みエラーを判定（文字列マッチングより堅牢）
    if (error instanceof DiscordAPIError) {
      const ignoredCodes: number[] = [
        RESTJSONErrorCodes.UnknownInteraction, // 10062: Interactionが期限切れ
        RESTJSONErrorCodes.InteractionHasAlreadyBeenAcknowledged, // 40060: 応答済み
      ];
      if (ignoredCodes.includes(error.code as number)) {
        return;
      }
    }
    throw error;
  }
}
