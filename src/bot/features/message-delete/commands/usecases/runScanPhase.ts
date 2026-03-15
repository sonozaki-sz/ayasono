// src/bot/features/message-delete/commands/usecases/runScanPhase.ts
// Phase 1: メッセージスキャンフェーズ

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type GuildTextBasedChannel,
  type MessageComponentInteraction,
} from "discord.js";
import { tDefault } from "../../../../../shared/locale/localeManager";
import { logger } from "../../../../../shared/utils/logger";
import {
  createErrorEmbed,
  createInfoEmbed,
} from "../../../../utils/messageResponse";
import {
  MSG_DEL_PHASE_TIMEOUT_MS,
  MSG_DEL_CUSTOM_ID,
  type ScannedMessageWithChannel,
} from "../../constants/messageDeleteConstants";
import {
  scanMessages,
  type ScanProgressData,
} from "../../services/messageDeleteService";
import type { ParsedOptions } from "./dialogUtils";

/**
 * Phase 1: メッセージのプレスキャンを実行する
 * - 「収集分を確認」ボタンで中断可能
 * - 14分タイムアウトでスキャンを自動中断
 * - 中断/タイムアウト時に収集済みメッセージがあればプレビューへ遷移
 * @param interaction 条件設定ステップから渡された interaction（fresh な 15分 token）
 * @param channels スキャン対象のチャンネル一覧
 * @param options パース済みコマンドオプション
 * @returns 収集済みメッセージ配列（null の場合は処理終了）
 */
export async function runScanPhase(
  interaction: ChatInputCommandInteraction | MessageComponentInteraction,
  channels: GuildTextBasedChannel[],
  options: ParsedOptions,
): Promise<ScannedMessageWithChannel[] | null> {
  const { count, targetUserIds, keyword, afterTs, beforeTs } = options;
  const controller = new AbortController();

  // タイムアウト原因の追跡（タイムアウト vs ユーザー中断）
  // オブジェクト参照にすることで TypeScript の制御フロー解析による誤ナローイングを回避
  const cancelState = { reason: "user" as "user" | "timeout" };

  const buildProgressContent = (totalScanned: number, collected: number) =>
    tDefault("commands:message-delete.confirm.scan_progress", {
      totalScanned,
      collected,
      limit: count,
    });

  const cancelRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(MSG_DEL_CUSTOM_ID.SCAN_CANCEL)
      .setLabel(tDefault("commands:message-delete.confirm.btn_scan_cancel"))
      .setStyle(ButtonStyle.Secondary),
  );

  const scanReply = await interaction.editReply({
    content: buildProgressContent(0, 0),
    embeds: [],
    components: [cancelRow],
  });

  // Phase 1 タイムアウトタイマー（14分でスキャンを中断）
  const scanTimeoutId = setTimeout(() => {
    cancelState.reason = "timeout";
    controller.abort();
  }, MSG_DEL_PHASE_TIMEOUT_MS);

  // 「収集分を確認」ボタンコレクター（ユーザーによる任意中断）
  const cancelCollector = scanReply.createMessageComponentCollector({
    filter: (i) =>
      i.customId === MSG_DEL_CUSTOM_ID.SCAN_CANCEL &&
      i.user.id === interaction.user.id,
    max: 1,
  });
  const cancelWatcher = new Promise<void>((resolve) => {
    cancelCollector.on("collect", async (i) => {
      cancelState.reason = "user";
      controller.abort();
      await i.deferUpdate().catch(() => {});
      resolve();
    });
    cancelCollector.on("end", (_, reason) => {
      // "user" 以外（messageDelete / channelDelete 等）でメッセージが削除された場合は
      // スキャンを即座に中断する。"user" は finally の cancelCollector.stop() による通常停止。
      logger.debug(
        tDefault("system:message-delete.cancel_collector_ended", {
          reason: String(reason),
        }),
      );
      if (reason !== "user") {
        logger.debug(tDefault("system:message-delete.aborting_non_user_end"));
        controller.abort();
      }
      resolve();
    });
  });

  let scannedMessages: ScannedMessageWithChannel[];
  try {
    scannedMessages = await scanMessages(channels, {
      count,
      targetUserIds,
      keyword,
      afterTs,
      beforeTs,
      signal: controller.signal,
      onProgress: async (data: ScanProgressData) => {
        await interaction.editReply({
          content: buildProgressContent(data.totalScanned, data.collected),
          embeds: [],
          components: [cancelRow],
        });
      },
    });
  } catch (error) {
    logger.error(
      tDefault("system:message-delete.scan_error", { error: String(error) }),
    );
    await interaction.editReply({
      embeds: [
        createErrorEmbed(
          tDefault("commands:message-delete.errors.scan_failed"),
        ),
      ],
      content: "",
      components: [],
    });
    return null;
  } finally {
    clearTimeout(scanTimeoutId);
    cancelCollector.stop();
    await cancelWatcher;
  }

  // ── 中断・タイムアウト処理 ──
  if (controller.signal.aborted) {
    if (scannedMessages.length === 0) {
      // 収集0件: タイムアウトとユーザー中断で別メッセージを表示して終了
      const msgKey =
        cancelState.reason === "timeout"
          ? ("commands:message-delete.confirm.scan_timed_out_empty" as const)
          : ("commands:message-delete.confirm.cancelled" as const);
      await interaction.editReply({
        embeds: [createInfoEmbed(tDefault(msgKey))],
        content: "",
        components: [],
      });
      return null;
    }

    // 収集1件以上: タイムアウト時のみ通知メッセージを表示してからプレビューへ遷移
    if (cancelState.reason === "timeout") {
      await interaction.editReply({
        embeds: [
          createInfoEmbed(
            tDefault("commands:message-delete.confirm.scan_timed_out"),
          ),
        ],
        content: "",
        components: [],
      });
    }
    // ユーザー中断で収集1件以上: 中間画面なしで直接プレビューへ遷移
  }

  return scannedMessages;
}
