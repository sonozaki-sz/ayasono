// src/bot/features/message-delete/commands/usecases/runPreviewDialog.ts
// Stage 1: プレビューダイアログ処理

import {
  MessageFlags,
  type ChatInputCommandInteraction,
  type MessageComponentInteraction,
} from "discord.js";
import { getTimezoneOffsetForLocale } from "../../../../../shared/locale/helpers";
import { tDefault } from "../../../../../shared/locale/localeManager";
import { logger } from "../../../../../shared/utils/logger";
import { createWarningEmbed } from "../../../../utils/messageResponse";
import {
  MSG_DEL_COLLECTOR_IDLE_MS,
  MSG_DEL_CUSTOM_ID,
  MSG_DEL_PAGE_SIZE,
  type MessageDeleteFilter,
  type ScannedMessageWithChannel,
} from "../../constants/messageDeleteConstants";
import {
  buildCommandConditionsEmbed,
  buildFilteredMessages,
  buildPreviewComponents,
  buildPreviewEmbed,
} from "../messageDeleteEmbedBuilder";
import {
  DIALOG_TYPE,
  MODAL_FILTER_CONFIG,
  applyModalFilterValue,
  showFilterModal,
  showJumpModal,
  type ParsedOptions,
  type PreviewResult,
} from "./dialogUtils";

/**
 * Stage 1: プレビューダイアログを表示し、ユーザーの操作を待機する
 * フィルター・除外操作・ページネーションを処理し、削除確認またはキャンセルを返す
 * @param baseInteraction ベースとなる Interaction（初回は ChatInput、「戻る」後は MessageComponent）
 * @param allMessages スキャン済み全メッセージ（フィルター前）
 * @param initialFilter 初期フィルター状態（「戻る」後は前回の状態を引き継ぐ）
 * @param initialExcludedIds 初期除外セット（「戻る」後は前回の状態を引き継ぐ）
 * @param options パース済みコマンドオプション（コマンド条件 Embed の表示に使用）
 * @param timeoutMs コレクターのタイムアウト（最終確認と共有する残り時間）
 * @returns プレビューダイアログの結果（confirm / cancel / timeout）
 */
export async function showPreviewDialog(
  baseInteraction: ChatInputCommandInteraction | MessageComponentInteraction,
  allMessages: ScannedMessageWithChannel[],
  initialFilter: MessageDeleteFilter,
  initialExcludedIds: Set<string>,
  options: ParsedOptions,
  timeoutMs: number,
): Promise<PreviewResult> {
  let filter = { ...initialFilter };
  let excludedIds = new Set(initialExcludedIds);
  let currentPage = 0;
  const timezoneOffset = getTimezoneOffsetForLocale(baseInteraction.locale);

  const getFiltered = () => buildFilteredMessages(allMessages, filter);

  const buildReplyPayload = (page: number) => {
    const filtered = getFiltered();
    const totalPages = Math.ceil(filtered.length / MSG_DEL_PAGE_SIZE);
    const safePage = Math.min(page, Math.max(0, totalPages - 1));
    // 仕様: deleteCount は「スキャン結果全体 − 除外セット件数」で一定（フィルター状態に依存しない）
    const deleteCount = allMessages.filter(
      (m) => !excludedIds.has(m.messageId),
    ).length;
    return {
      embeds: [
        buildCommandConditionsEmbed(options),
        buildPreviewEmbed(filtered, safePage, totalPages, excludedIds),
      ],
      components: buildPreviewComponents(
        allMessages, // allMessagesForAuthorSelect: 投稿者フィルターセレクト用
        filtered,
        safePage,
        totalPages,
        filter,
        deleteCount,
        excludedIds,
        timezoneOffset,
      ),
      content: "",
    };
  };

  const response = await baseInteraction.editReply(buildReplyPayload(0));

  return new Promise((resolve) => {
    const collector = response.createMessageComponentCollector({
      time: timeoutMs,
      idle: MSG_DEL_COLLECTOR_IDLE_MS,
    });

    // collector.stop() は end イベントを同期的に発火させるため、
    // collect ハンドラで処理済みかどうかを end ハンドラが判定できるよう
    // stop() より先にフラグを立てる
    let handledByCollect = false;

    collector.on("collect", async (i) => {
      if (i.user.id !== baseInteraction.user.id) {
        await i.reply({
          embeds: [
            createWarningEmbed(
              tDefault("commands:message-delete.errors.not_authorized"),
              { title: tDefault("common:title_permission_denied") },
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // ── 終端アクション（resolve して collector を停止） ──
      if (i.customId === MSG_DEL_CUSTOM_ID.CONFIRM_YES) {
        await i.deferUpdate().catch(() => {});
        handledByCollect = true;
        collector.stop();
        resolve({
          type: DIALOG_TYPE.Confirm,
          filter,
          excludedIds,
          confirmInteraction: i,
        });
        return;
      }
      if (i.customId === MSG_DEL_CUSTOM_ID.CONFIRM_NO) {
        await i.deferUpdate().catch(() => {});
        handledByCollect = true;
        collector.stop();
        resolve({ type: DIALOG_TYPE.Cancel, lastInteraction: i });
        return;
      }

      // ── 除外セレクト ──
      if (
        i.customId === MSG_DEL_CUSTOM_ID.CONFIRM_EXCLUDE &&
        i.isStringSelectMenu()
      ) {
        const filtered = getFiltered();
        const totalPagesForClamp = Math.ceil(
          filtered.length / MSG_DEL_PAGE_SIZE,
        );
        currentPage = Math.min(
          currentPage,
          Math.max(0, totalPagesForClamp - 1),
        );
        const start = currentPage * MSG_DEL_PAGE_SIZE;
        for (const m of filtered.slice(start, start + MSG_DEL_PAGE_SIZE)) {
          excludedIds.delete(m.messageId);
        }
        for (const id of i.values) {
          if (id !== "__none__") excludedIds.add(id);
        }
        await i.update(buildReplyPayload(currentPage)).catch(() => {});
        return;
      }

      // ── ページネーション ──
      if (i.customId === MSG_DEL_CUSTOM_ID.PREV) {
        currentPage = Math.max(0, currentPage - 1);
        await i.update(buildReplyPayload(currentPage)).catch(() => {});
        return;
      }
      if (i.customId === MSG_DEL_CUSTOM_ID.NEXT) {
        const totalPages = Math.ceil(getFiltered().length / MSG_DEL_PAGE_SIZE);
        currentPage = Math.min(totalPages - 1, currentPage + 1);
        await i.update(buildReplyPayload(currentPage)).catch(() => {});
        return;
      }
      if (i.customId === MSG_DEL_CUSTOM_ID.FIRST) {
        currentPage = 0;
        await i.update(buildReplyPayload(currentPage)).catch(() => {});
        return;
      }
      if (i.customId === MSG_DEL_CUSTOM_ID.LAST) {
        const totalPages = Math.ceil(getFiltered().length / MSG_DEL_PAGE_SIZE);
        currentPage = Math.max(0, totalPages - 1);
        await i.update(buildReplyPayload(currentPage)).catch(() => {});
        return;
      }

      // ── ページジャンプ ──
      if (i.customId === MSG_DEL_CUSTOM_ID.JUMP) {
        const totalPages = Math.ceil(getFiltered().length / MSG_DEL_PAGE_SIZE);
        const raw = await showJumpModal(i, totalPages);
        if (raw === null) {
          await baseInteraction
            .editReply(buildReplyPayload(currentPage))
            .catch(() => {});
          return;
        }
        const pageNum = parseInt(raw, 10);
        if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
          await baseInteraction
            .followUp({
              embeds: [
                createWarningEmbed(
                  tDefault("commands:message-delete.errors.jump_invalid_page", {
                    total: totalPages,
                  }),
                  { title: tDefault("common:title_input_error") },
                ),
              ],
              flags: MessageFlags.Ephemeral,
            })
            .catch(() => {});
        } else {
          currentPage = pageNum - 1;
        }
        await baseInteraction
          .editReply(buildReplyPayload(currentPage))
          .catch(() => {});
        return;
      }

      // ── 投稿者フィルター ──
      if (
        i.customId === MSG_DEL_CUSTOM_ID.FILTER_AUTHOR &&
        i.isStringSelectMenu()
      ) {
        filter =
          i.values.length > 0 && i.values[0] !== "__all__"
            ? { ...filter, authorId: i.values[0] }
            : { ...filter, authorId: undefined };
        currentPage = 0;
        await i.update(buildReplyPayload(currentPage)).catch(() => {});
        return;
      }

      // ── フィルターリセット ──
      if (i.customId === MSG_DEL_CUSTOM_ID.FILTER_RESET) {
        filter = {};
        currentPage = 0;
        await i.update(buildReplyPayload(currentPage)).catch(() => {});
        return;
      }

      // ── モーダルフィルター（keyword / days / after / before）──
      const modalConfig = MODAL_FILTER_CONFIG.get(i.customId);
      if (modalConfig) {
        const value = await showFilterModal(i, modalConfig);
        if (value === null) {
          await baseInteraction
            .editReply(buildReplyPayload(currentPage))
            .catch(() => {});
          return;
        }
        const result = applyModalFilterValue(
          i.customId,
          value,
          filter,
          timezoneOffset,
        );
        if (result.errorKey) {
          await baseInteraction
            .followUp({
              embeds: [createWarningEmbed(tDefault(result.errorKey))],
              flags: MessageFlags.Ephemeral,
            })
            .catch(() => {});
        } else {
          filter = result.filter;
          currentPage = 0;
        }
        await baseInteraction
          .editReply(buildReplyPayload(currentPage))
          .catch(() => {});
      }
    });

    collector.on("end", async (_, reason) => {
      // collect ハンドラで処理済みの場合（通常終了・キャンセル）はスキップ
      // "time" 以外（messageDelete / channelDelete 等）でも未処理なら Timeout として解決し
      // ロックを確実に解放する
      logger.debug(
        `[MsgDel] Preview collector ended: reason=${String(reason)}, handledByCollect=${handledByCollect}`,
      );
      if (handledByCollect) return;
      void reason;
      await baseInteraction
        .editReply({
          embeds: [
            createWarningEmbed(
              tDefault("commands:message-delete.confirm.timed_out"),
              { title: tDefault("common:title_timeout") },
            ),
          ],
          components: [],
          content: "",
        })
        .catch(() => {});
      resolve({ type: DIALOG_TYPE.Timeout });
    });
  });
}
