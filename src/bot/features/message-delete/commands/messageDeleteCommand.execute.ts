// src/bot/features/message-delete/commands/messageDeleteCommand.execute.ts
// /message-delete コマンド実行処理

import {
  MessageFlags,
  type ChatInputCommandInteraction,
  type MessageComponentInteraction,
} from "discord.js";
import { tDefault } from "../../../../shared/locale/localeManager";
import { logger } from "../../../../shared/utils/logger";
import { handleCommandError } from "../../../errors/interactionErrorHandler";
import { COMMON_I18N_KEYS } from "../../../shared/i18nKeys";
import {
  createErrorEmbed,
  createInfoEmbed,
  createWarningEmbed,
} from "../../../utils/messageResponse";
import { type ScannedMessageWithChannel } from "../constants/messageDeleteConstants";
import { buildTargetChannels } from "./usecases/buildTargetChannels";
import { DIALOG_TYPE, type ParsedOptions } from "./usecases/dialogUtils";
import { executeDelete } from "./usecases/runDeleteExecution";
import { showFinalConfirmDialog } from "./usecases/runFinalConfirmDialog";
import { showPreviewDialog } from "./usecases/runPreviewDialog";
import { runScanPhase } from "./usecases/runScanPhase";
import {
  hasManageMessagesPermission,
  parseAndValidateOptions,
} from "./usecases/validateOptions";
import { MSG_DEL_CONFIRM_TIMEOUT_MS } from "../constants/messageDeleteConstants";

// ===== サーバー単位の処理中ロック =====
// Phase 1〜3 の実行中はロックを保持し、同一サーバー内の重複実行を防止する
// Bot 再起動でクリアされるメモリ管理のため、永続化は不要
const executingGuilds = new Set<string>();

// ===== メインエクスポート =====

/**
 * /message-delete コマンド実行処理
 * @param interaction コマンド実行の ChatInputCommandInteraction
 * @returns 処理完了を示す Promise
 */
export async function executeMessageDeleteCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!interaction.guildId || !interaction.guild) {
      await interaction.editReply({
        embeds: [createErrorEmbed(tDefault(COMMON_I18N_KEYS.GUILD_ONLY))],
      });
      return;
    }

    const options = await parseAndValidateOptions(interaction);
    if (!options) return;

    if (!hasManageMessagesPermission(interaction)) {
      await interaction.editReply({
        embeds: [
          createErrorEmbed(
            tDefault("commands:message-delete.errors.no_permission"),
          ),
        ],
      });
      return;
    }

    // ── 処理中ロック取得（Phase 1〜3 の重複実行防止） ──
    const guildId = interaction.guildId;
    if (executingGuilds.has(guildId)) {
      await interaction.editReply({
        embeds: [
          createWarningEmbed(tDefault("commands:message-delete.errors.locked")),
        ],
      });
      return;
    }
    executingGuilds.add(guildId);
    logger.debug(`[MsgDel] lock acquired: guild=${guildId}`);

    try {
      const targetChannels = await buildTargetChannels(interaction);
      if (!targetChannels) return;

      const scannedMessages = await runScanPhase(
        interaction,
        targetChannels,
        options,
      );
      if (!scannedMessages) return;

      if (scannedMessages.length === 0) {
        await interaction.editReply({
          embeds: [
            createInfoEmbed(
              tDefault("commands:message-delete.errors.no_messages_found"),
            ),
          ],
          content: "",
        });
        return;
      }

      await runConfirmDeletePhase(interaction, scannedMessages, options);
    } finally {
      // 正常完了・キャンセル・タイムアウト・エラーすべての終了パスでロックを解放
      executingGuilds.delete(guildId);
      logger.debug(`[MsgDel] lock released: guild=${guildId}`);
    }
  } catch (error) {
    await handleCommandError(interaction, error);
  }
}

// ===== 確認・削除フェーズ =====

/**
 * Phase 2〜3: プレビュー → 最終確認 → 削除の一連のフローを管理する
 * Stage 2（最終確認）の「戻る」で Stage 1（プレビュー）に戻るループ構造
 * @param interaction コマンド実行の ChatInputCommandInteraction
 * @param scannedMessages スキャン済みメッセージ配列
 * @param options パース済みコマンドオプション
 * @returns 処理完了を示す Promise
 */
async function runConfirmDeletePhase(
  interaction: ChatInputCommandInteraction,
  scannedMessages: ScannedMessageWithChannel[],
  options: ParsedOptions,
): Promise<void> {
  // Stage1 (プレビュー) → Stage2 (最終確認) ループ
  // Stage2 の「戻る」で Stage1 に戻る
  let filter = {};
  let excludedIds = new Set<string>();
  let currentBaseInteraction:
    | ChatInputCommandInteraction
    | MessageComponentInteraction = interaction;

  // Phase 2 全体（プレビュー＋最終確認）で 14 分タイムアウトを共有するため開始時刻を記録
  const phase2StartTs = Date.now();

  while (true) {
    // プレビューダイアログに Phase 2 の残り時間を渡す
    const previewRemainingMs = Math.max(
      1,
      MSG_DEL_CONFIRM_TIMEOUT_MS - (Date.now() - phase2StartTs),
    );
    const previewResult = await showPreviewDialog(
      currentBaseInteraction,
      scannedMessages,
      filter,
      excludedIds,
      options,
      previewRemainingMs,
    );

    if (previewResult.type === DIALOG_TYPE.Timeout) return;
    if (previewResult.type === DIALOG_TYPE.Cancel) {
      await replyAsCancelled(previewResult.lastInteraction);
      return;
    }

    filter = previewResult.filter;
    excludedIds = previewResult.excludedIds;
    // フィルターは表示の絞り込みのみ（仕様）。削除対象はスキャン結果全体から除外分を差し引く
    const targetMessages = scannedMessages.filter(
      (m) => !excludedIds.has(m.messageId),
    );

    // 最終確認ダイアログにもプレビューで消費した時間を差し引いた残り時間を渡す
    const finalRemainingMs = Math.max(
      1,
      MSG_DEL_CONFIRM_TIMEOUT_MS - (Date.now() - phase2StartTs),
    );
    const finalResult = await showFinalConfirmDialog(
      previewResult.confirmInteraction,
      targetMessages,
      finalRemainingMs,
    );

    if (finalResult.type === DIALOG_TYPE.Confirm) {
      await executeDelete(finalResult.interaction, targetMessages, options);
      return;
    }
    if (finalResult.type === DIALOG_TYPE.Back) {
      currentBaseInteraction = finalResult.interaction;
      continue;
    }
    if (finalResult.type === DIALOG_TYPE.Timeout) return;
    // cancel
    await replyAsCancelled(finalResult.interaction);
    return;
  }
}

// ===== ダイアログ共通ヘルパー =====

/**
 * キャンセル完了通知を Ephemeral で送る
 * @param interaction キャンセル操作の MessageComponentInteraction
 * @returns 処理完了を示す Promise
 */
async function replyAsCancelled(
  interaction: MessageComponentInteraction,
): Promise<void> {
  await interaction
    .editReply({
      embeds: [
        createInfoEmbed(tDefault("commands:message-delete.confirm.cancelled")),
      ],
      components: [],
      content: "",
    })
    .catch(() => {});
}
