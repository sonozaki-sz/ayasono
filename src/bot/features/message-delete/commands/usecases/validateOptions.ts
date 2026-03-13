// src/bot/features/message-delete/commands/usecases/validateOptions.ts
// コマンドオプションのパース・バリデーション

import {
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import { getTimezoneOffsetForLocale } from "../../../../../shared/locale/helpers";
import { tDefault } from "../../../../../shared/locale/localeManager";
import { createWarningEmbed } from "../../../../utils/messageResponse";
import {
  MSG_DEL_COMMAND,
  MSG_DEL_DEFAULT_COUNT,
  MS_PER_DAY,
} from "../../constants/messageDeleteConstants";
import { parseDateStr } from "../../services/messageDeleteService";
import type { ParsedOptions } from "./dialogUtils";

/**
 * コマンド実行者が ManageMessages 権限を持つかどうかを確認する
 * @param interaction コマンド実行の ChatInputCommandInteraction
 * @returns ManageMessages 権限がある場合は true
 */
export function hasManageMessagesPermission(
  interaction: ChatInputCommandInteraction,
): boolean {
  // has() はデフォルトで Administrator フラグを考慮するため個別チェックは不要
  return (
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) ??
    false
  );
}

/**
 * コマンドオプションをパースしてバリデーションを行う
 * @param interaction コマンド実行の ChatInputCommandInteraction
 * @returns バリデーション済みオプション（エラー時は null）
 */
export async function parseAndValidateOptions(
  interaction: ChatInputCommandInteraction,
): Promise<ParsedOptions | null> {
  const countOption = interaction.options.getInteger(
    MSG_DEL_COMMAND.OPTION.COUNT,
  );
  const userInput = interaction.options.getString(
    MSG_DEL_COMMAND.OPTION.USER,
    false,
  );
  const keyword = interaction.options.getString(
    MSG_DEL_COMMAND.OPTION.KEYWORD,
    false,
  );
  const daysOption = interaction.options.getInteger(
    MSG_DEL_COMMAND.OPTION.DAYS,
    false,
  );
  const afterStr = interaction.options.getString(
    MSG_DEL_COMMAND.OPTION.AFTER,
    false,
  );
  const beforeStr = interaction.options.getString(
    MSG_DEL_COMMAND.OPTION.BEFORE,
    false,
  );
  // channelId はコマンドオプションで明示指定された場合のみセット（全チャンネルスキャン時は undefined）
  const channelId =
    interaction.options.getChannel(MSG_DEL_COMMAND.OPTION.CHANNEL, false)?.id ??
    undefined;

  // user オプション: メンション or 生ID をパース
  let targetUserId: string | undefined;
  if (userInput) {
    const mentionMatch = userInput.match(/^<@!?(\d+)>$/);
    const rawId = mentionMatch
      ? mentionMatch[1]
      : /^\d{17,20}$/.test(userInput)
        ? userInput
        : null;
    if (!rawId) {
      await interaction.editReply({
        embeds: [
          createWarningEmbed(
            tDefault("commands:message-delete.errors.user_invalid_format"),
          ),
        ],
      });
      return null;
    }
    targetUserId = rawId;
  }

  // 少なくとも1つのフィルター必須
  if (
    !countOption &&
    !targetUserId &&
    !keyword &&
    !daysOption &&
    !afterStr &&
    !beforeStr
  ) {
    await interaction.editReply({
      embeds: [
        createWarningEmbed(
          tDefault("commands:message-delete.errors.no_filter"),
        ),
      ],
    });
    return null;
  }

  // days と after/before は排他
  if (daysOption && (afterStr || beforeStr)) {
    await interaction.editReply({
      embeds: [
        createWarningEmbed(
          tDefault("commands:message-delete.errors.days_and_date_conflict"),
        ),
      ],
    });
    return null;
  }

  // タイムスタンプ計算
  let afterTs = 0;
  let beforeTs = Infinity;
  const timezoneOffset = getTimezoneOffsetForLocale(interaction.locale);

  if (daysOption) {
    afterTs = Date.now() - daysOption * MS_PER_DAY;
  } else {
    if (afterStr) {
      const d = parseDateStr(afterStr, false, timezoneOffset);
      if (!d) {
        await interaction.editReply({
          embeds: [
            createWarningEmbed(
              tDefault("commands:message-delete.errors.after_invalid_format"),
            ),
          ],
        });
        return null;
      }
      afterTs = d.getTime();
      if (afterTs > Date.now()) {
        await interaction.editReply({
          embeds: [
            createWarningEmbed(
              tDefault("commands:message-delete.errors.after_future"),
            ),
          ],
        });
        return null;
      }
    }
    if (beforeStr) {
      const d = parseDateStr(beforeStr, true, timezoneOffset);
      if (!d) {
        await interaction.editReply({
          embeds: [
            createWarningEmbed(
              tDefault("commands:message-delete.errors.before_invalid_format"),
            ),
          ],
        });
        return null;
      }
      beforeTs = d.getTime();
      // YYYY-MM-DD 形式の当日指定は仕様上許可（ロケールタイムゾーンの 00:00:00 が現在以前かどうかで判定）
      // 当日の 23:59:59 が未来であっても有効なため、00:00:00 で未来チェックを行う
      const checkDate = /^\d{4}-\d{2}-\d{2}$/.test(beforeStr)
        ? parseDateStr(beforeStr, false, timezoneOffset)
        : d;
      if (checkDate && checkDate.getTime() > Date.now()) {
        await interaction.editReply({
          embeds: [
            createWarningEmbed(
              tDefault("commands:message-delete.errors.before_future"),
            ),
          ],
        });
        return null;
      }
    }
    if (afterTs !== 0 && beforeTs !== Infinity && afterTs >= beforeTs) {
      await interaction.editReply({
        embeds: [
          createWarningEmbed(
            tDefault("commands:message-delete.errors.date_range_invalid"),
          ),
        ],
      });
      return null;
    }
  }

  return {
    count: countOption ?? MSG_DEL_DEFAULT_COUNT,
    countSpecified: countOption !== null,
    targetUserId,
    keyword: keyword ?? undefined,
    afterTs,
    beforeTs,
    afterStr: afterStr ?? undefined,
    beforeStr: beforeStr ?? undefined,
    daysOption: daysOption ?? undefined,
    channelId,
  };
}
