// src/bot/features/message-delete/commands/usecases/runDeleteExecution.ts
// 削除実行フェーズ

import { type MessageComponentInteraction } from "discord.js";
import { tDefault } from "../../../../../shared/locale/localeManager";
import { logger } from "../../../../../shared/utils/logger";
import {
  createErrorEmbed,
  createWarningEmbed,
} from "../../../../utils/messageResponse";
import {
  MSG_DEL_PHASE_TIMEOUT_MS,
  type ScannedMessageWithChannel,
} from "../../constants/messageDeleteConstants";
import {
  deleteScannedMessages,
  type DeleteProgressData,
} from "../../services/messageDeleteService";
import { buildCompletionEmbed } from "../messageDeleteEmbedBuilder";
import type { ParsedOptions } from "./dialogUtils";

/**
 * 確認済みメッセージの削除を実行する
 * - 14分タイムアウトで削除を中断し、削除済み件数を通知する
 * - 削除進捗をリアルタイムで表示
 * @param interaction 削除実行ボタンの MessageComponentInteraction
 * @param targetMessages 削除対象のスキャン済みメッセージ配列（除外済みを含まない）
 * @param options パース済みコマンドオプション（ログ出力に使用）
 * @returns 処理完了を示す Promise
 */
export async function executeDelete(
  interaction: MessageComponentInteraction,
  targetMessages: ScannedMessageWithChannel[],
  options: ParsedOptions,
): Promise<void> {
  const deleteController = new AbortController();

  // 削除タイムアウトタイマー（14分で削除を中断）
  const deleteTimeoutId = setTimeout(() => {
    deleteController.abort();
  }, MSG_DEL_PHASE_TIMEOUT_MS);

  // オブジェクト参照にすることで TypeScript の制御フロー解析による誤ナローイングを回避
  const progressRef = { data: null as DeleteProgressData | null };

  try {
    const result = await deleteScannedMessages(
      targetMessages,
      async (data: DeleteProgressData) => {
        progressRef.data = data;
        const header = tDefault(
          "commands:message-delete.confirm.delete_progress",
          { totalDeleted: data.totalDeleted, total: data.total },
        );
        const lines = data.channelStatuses
          .map(({ channelId, deleted, total }) =>
            tDefault(
              "commands:message-delete.confirm.delete_progress_channel",
              { channelId, deleted, total },
            ),
          )
          .join("\n");
        await interaction.editReply({
          content: `${header}\n${lines}`,
          embeds: [],
          components: [],
        });
      },
      deleteController.signal,
    );

    // タイムアウトなし・正常完了
    if (!deleteController.signal.aborted) {
      await interaction.editReply({
        embeds: [
          buildCompletionEmbed(result.totalDeleted, result.channelBreakdown),
        ],
        components: [],
        content: "",
      });

      // 仕様ログフォーマット: [count=N] [target=<id>] [keyword="..."] [days=N | after=... before=...]
      const countPart = options.countSpecified ? ` count=${options.count}` : "";
      const targetPart =
        options.targetUserIds.length > 0
          ? ` target=${options.targetUserIds.join(",")}`
          : "";
      const keywordPart = options.keyword
        ? ` keyword="${options.keyword}"`
        : "";
      const periodPart = options.daysOption
        ? ` days=${options.daysOption}`
        : [
            options.afterStr && `after=${options.afterStr}`,
            options.beforeStr && `before=${options.beforeStr}`,
          ]
            .filter(Boolean)
            .join(" ");
      logger.info(
        tDefault("system:message-delete.deleted", {
          userId: interaction.user.id,
          count: result.totalDeleted,
          countPart,
          targetPart,
          keywordPart,
          periodPart: periodPart ? ` ${periodPart}` : "",
          channels: Object.keys(result.channelBreakdown).join(", "),
        }),
      );
      return;
    }

    // 削除タイムアウト: 削除済み件数を通知して終了
    const deletedCount = progressRef.data?.totalDeleted ?? 0;
    await interaction.editReply({
      embeds: [
        createWarningEmbed(
          tDefault("commands:message-delete.confirm.delete_timed_out", {
            count: deletedCount,
          }),
        ),
      ],
      components: [],
      content: "",
    });
  } catch (error) {
    logger.error(
      tDefault("system:message-delete.delete_error", { error: String(error) }),
    );
    await interaction
      .editReply({
        embeds: [
          createErrorEmbed(
            tDefault("commands:message-delete.errors.delete_failed"),
          ),
        ],
        content: "",
        components: [],
      })
      .catch(() => {});
  } finally {
    clearTimeout(deleteTimeoutId);
  }
}
