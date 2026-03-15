// src/bot/features/message-delete/commands/messageDeleteEmbedBuilder.ts
// メッセージ削除 Embed ビルダー（プレビュー → 最終確認 2段階ダイアログ）

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { tDefault } from "../../../../shared/locale/localeManager";
import { STATUS_COLORS } from "../../../utils/messageResponse";
import {
  MSG_DEL_CUSTOM_ID,
  MSG_DEL_DEFAULT_COUNT,
  MSG_DEL_PAGE_SIZE,
  MSG_DEL_SELECT_MAX_OPTIONS,
  MS_PER_DAY,
  type CommandConditionsDisplay,
  type MessageDeleteFilter,
  type ScannedMessage,
} from "../constants/messageDeleteConstants";

/**
 * メッセージ 1 件分の Embed フィールド（name/value）を生成する
 *
 * - ヘッダー: `[番号] <t:unix秒:f>`（Discord タイムスタンプ形式）
 * - value: `<@著者ID> | <#チャンネル>` + 本文 + メッセージリンク
 *
 * @param m 対象メッセージ
 * @param displayIndex 表示番号（1-indexed）
 * @param isExcluded 除外済みの場合は打ち消し線を付与する
 * @returns Embed フィールドの name/value オブジェクト
 */
function buildMessageField(
  m: ScannedMessage,
  displayIndex: number,
  isExcluded: boolean,
): { name: string; value: string } {
  // Discord タイムスタンプ形式で表示（クライアントのローカル時刻に自動変換される）
  const header = `[${displayIndex}] <t:${Math.floor(m.createdAt.getTime() / 1000)}:f>`;
  const meta = `<@${m.authorId}> | <#${m.channelId}>`;
  const content =
    m.content || tDefault("commands:message-delete.result.empty_content");
  const messageUrl = `https://discord.com/channels/${m.guildId}/${m.channelId}/${m.messageId}`;
  const linkLabel = tDefault("commands:message-delete.result.jump_to_message");

  if (isExcluded) {
    return {
      name: `~~${header}~~`,
      value: `~~${meta}~~\n~~${content}~~\n[${linkLabel}](${messageUrl})`,
    };
  }

  return {
    name: header,
    value: `${meta}\n${content}\n[${linkLabel}](${messageUrl})`,
  };
}

/**
 * フィルターを適用したスキャン済みメッセージ一覧を返す
 * @param messages 全スキャン済みメッセージ
 * @param filter 適用するフィルター条件
 * @returns フィルター適用後のメッセージ配列
 */
export function buildFilteredMessages<T extends ScannedMessage>(
  messages: T[],
  filter: MessageDeleteFilter,
): T[] {
  let result = messages;

  if (filter.authorId) {
    result = result.filter((m) => m.authorId === filter.authorId);
  }
  if (filter.keyword) {
    const kw = filter.keyword.toLowerCase();
    result = result.filter((m) => m.content.toLowerCase().includes(kw));
  }
  if (filter.days) {
    const threshold = Date.now() - filter.days * MS_PER_DAY;
    result = result.filter((m) => m.createdAt.getTime() >= threshold);
  }
  if (filter.after) {
    const afterDate = filter.after;
    result = result.filter((m) => m.createdAt >= afterDate);
  }
  if (filter.before) {
    const beforeDate = filter.before;
    result = result.filter((m) => m.createdAt <= beforeDate);
  }

  return result;
}

/**
 * ページネーション用ナビゲーションボタン行を生成する
 * @param page 現在のページ番号（0-indexed）
 * @param totalPages 総ページ数
 * @returns ナビゲーション用 ActionRow
 */
function buildPaginationNavRow(
  page: number,
  totalPages: number,
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(MSG_DEL_CUSTOM_ID.FIRST)
      .setEmoji("⏮")
      .setLabel(tDefault("commands:message-delete.pagination.btn_first"))
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(MSG_DEL_CUSTOM_ID.PREV)
      .setEmoji("◀")
      .setLabel(tDefault("commands:message-delete.pagination.btn_prev"))
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(MSG_DEL_CUSTOM_ID.JUMP)
      .setLabel(
        tDefault("commands:message-delete.pagination.btn_jump", {
          page: page + 1,
          total: Math.max(1, totalPages),
        }),
      )
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(totalPages <= 1),
    new ButtonBuilder()
      .setCustomId(MSG_DEL_CUSTOM_ID.NEXT)
      .setEmoji("▶")
      .setLabel(tDefault("commands:message-delete.pagination.btn_next"))
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
    new ButtonBuilder()
      .setCustomId(MSG_DEL_CUSTOM_ID.LAST)
      .setEmoji("⏭")
      .setLabel(tDefault("commands:message-delete.pagination.btn_last"))
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
  );
}

/**
 * プレビュー Embed（Stage 1）を生成する
 * @param filteredMessages フィルター適用済みのスキャン済みメッセージ
 * @param page 現在のページ番号（0-indexed）
 * @param totalPages 総ページ数
 * @param excludedIds 除外対象のメッセージID セット
 * @returns プレビュー EmbedBuilder
 */
export function buildPreviewEmbed(
  filteredMessages: ScannedMessage[],
  page: number,
  totalPages: number,
  excludedIds: ReadonlySet<string>,
): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(STATUS_COLORS.info).setTitle(
    tDefault("commands:message-delete.confirm.embed_title", {
      page: page + 1,
      total: Math.max(1, totalPages),
    }),
  );

  const start = page * MSG_DEL_PAGE_SIZE;
  const slice = filteredMessages.slice(start, start + MSG_DEL_PAGE_SIZE);

  if (slice.length === 0) {
    embed.setDescription(
      tDefault("commands:message-delete.confirm.zero_targets"),
    );
    return embed;
  }

  for (let i = 0; i < slice.length; i++) {
    const m = slice[i];
    embed.addFields(
      buildMessageField(m, start + i + 1, excludedIds.has(m.messageId)),
    );
  }

  return embed;
}

/**
 * プレビューダイアログ コンポーネント（Stage 1）を生成する
 * @param allMessagesForAuthorSelect 投稿者フィルターセレクトの選択肢構築に使用する全スキャン済みメッセージ
 * @param filteredMessages フィルター適用済みメッセージ
 * @param page 現在のページ番号（0-indexed）
 * @param totalPages 総ページ数
 * @param filter 現在のフィルター条件
 * @param deleteCount 削除予定件数（スキャン結果全体から除外済みを差し引いた件数）
 * @param excludedIds 除外済みメッセージIDのセット（選択状態の復元に使用）
 * @param timezoneOffset 除外セレクトのラベルに使用するタイムゾーンオフセット（例: "+09:00"）
 * @returns 5行の ActionRow 配列
 */
export function buildPreviewComponents(
  allMessagesForAuthorSelect: ScannedMessage[],
  filteredMessages: ScannedMessage[],
  page: number,
  totalPages: number,
  filter: MessageDeleteFilter,
  deleteCount: number,
  excludedIds: ReadonlySet<string> = new Set(),
  timezoneOffset: string = "+00:00",
): ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] {
  const hasDays = !!filter.days;
  const hasAfterOrBefore = !!(filter.after || filter.before);

  // Row 1: ページ移動ボタン（⏮ 前へ ページ数 次へ ⏭）
  const navRow = buildPaginationNavRow(page, totalPages);

  // Row 2: 投稿者フィルターセレクト
  const uniqueAuthors = [
    ...new Map(
      allMessagesForAuthorSelect.map((m) => [m.authorId, m.authorDisplayName]),
    ).entries(),
  ];
  const authorSelect = new StringSelectMenuBuilder()
    .setCustomId(MSG_DEL_CUSTOM_ID.FILTER_AUTHOR)
    .setPlaceholder(
      tDefault("commands:message-delete.pagination.author_select_placeholder"),
    )
    .setMinValues(0)
    .setMaxValues(1)
    .addOptions([
      {
        label: tDefault("commands:message-delete.pagination.author_all"),
        value: "__all__",
      },
      ...uniqueAuthors
        .slice(0, MSG_DEL_SELECT_MAX_OPTIONS - 1) // Discord SelectMenu は最大25件（先頭の「全員」分を含む）
        .map(([id, tag]) => ({ label: tag, value: id })),
    ]);

  // Row 3: 日付/キーワードフィルターボタン
  const filterRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(MSG_DEL_CUSTOM_ID.FILTER_DAYS)
      .setEmoji(hasDays ? "✏️" : "🔢")
      .setLabel(
        hasDays
          ? tDefault("commands:message-delete.pagination.btn_days_set", {
              days: filter.days,
            })
          : tDefault("commands:message-delete.pagination.btn_days_empty"),
      )
      .setStyle(hasDays ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(hasAfterOrBefore),
    new ButtonBuilder()
      .setCustomId(MSG_DEL_CUSTOM_ID.FILTER_AFTER)
      .setEmoji(filter.after ? "✏️" : "📅")
      .setLabel(
        // afterRaw はユーザーが入力した生の文字列（仕様: toLocaleString 変換は行わない）
        filter.after && filter.afterRaw
          ? tDefault("commands:message-delete.pagination.btn_after_set", {
              date: filter.afterRaw,
            })
          : tDefault("commands:message-delete.pagination.btn_after_empty"),
      )
      .setStyle(filter.after ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(hasDays),
    new ButtonBuilder()
      .setCustomId(MSG_DEL_CUSTOM_ID.FILTER_BEFORE)
      .setEmoji(filter.before ? "✏️" : "📅")
      .setLabel(
        // beforeRaw はユーザーが入力した生の文字列（仕様: toLocaleString 変換は行わない）
        filter.before && filter.beforeRaw
          ? tDefault("commands:message-delete.pagination.btn_before_set", {
              date: filter.beforeRaw,
            })
          : tDefault("commands:message-delete.pagination.btn_before_empty"),
      )
      .setStyle(filter.before ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(hasDays),
    new ButtonBuilder()
      .setCustomId(MSG_DEL_CUSTOM_ID.FILTER_KEYWORD)
      .setEmoji(filter.keyword ? "✏️" : "🔍")
      .setLabel(
        // keyword はユーザーが入力した生の文字列をそのまま表示（仕様: toLocaleString 変換は行わない）
        filter.keyword
          ? tDefault("commands:message-delete.pagination.btn_keyword_set", {
              keyword: filter.keyword,
            })
          : tDefault("commands:message-delete.pagination.btn_keyword"),
      )
      .setStyle(filter.keyword ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(MSG_DEL_CUSTOM_ID.FILTER_RESET)
      .setEmoji("✖️")
      .setLabel(tDefault("commands:message-delete.pagination.btn_reset"))
      .setStyle(ButtonStyle.Danger),
  );

  // Row 4: 除外セレクト（現ページのメッセージ）
  const start = page * MSG_DEL_PAGE_SIZE;
  const pageSlice = filteredMessages.slice(start, start + MSG_DEL_PAGE_SIZE);
  const excludeSelect = new StringSelectMenuBuilder()
    .setCustomId(MSG_DEL_CUSTOM_ID.CONFIRM_EXCLUDE)
    .setPlaceholder(
      tDefault("commands:message-delete.confirm.exclude_placeholder"),
    )
    .setMinValues(0)
    .setMaxValues(pageSlice.length || 1)
    .addOptions(
      pageSlice.length > 0
        ? pageSlice.map((m, idx) => ({
            // SelectMenu ラベルはプレーンテキストのため ISO 形式を使用（タイムスタンプタグは描画されない）
            // ロケールのタイムゾーンオフセットを適用してローカル時刻で表示する
            label: (() => {
              const sign = timezoneOffset.startsWith("-") ? -1 : 1;
              const [h, min] = timezoneOffset.slice(1).split(":").map(Number);
              const offsetMs = sign * (h * 60 + min) * 60_000;
              const local = new Date(m.createdAt.getTime() + offsetMs);
              return `[${start + idx + 1}] ${local.toISOString().slice(0, 16).replace("T", " ")}`.slice(
                0,
                100,
              );
            })(),
            description:
              `${m.authorDisplayName} | ${m.content || tDefault("commands:message-delete.result.empty_content")}`.slice(
                0,
                100,
              ),
            value: m.messageId,
            default: excludedIds.has(m.messageId),
          }))
        : [
            {
              label: tDefault(
                "commands:message-delete.confirm.exclude_no_messages",
              ),
              value: "__none__",
            },
          ],
    );

  // Row 5: 削除ボタン + キャンセルボタン
  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(MSG_DEL_CUSTOM_ID.CONFIRM_YES)
      .setEmoji("🗑️")
      .setLabel(
        tDefault("commands:message-delete.confirm.btn_delete", {
          count: deleteCount,
        }),
      )
      .setStyle(ButtonStyle.Danger)
      .setDisabled(deleteCount === 0),
    new ButtonBuilder()
      .setCustomId(MSG_DEL_CUSTOM_ID.CONFIRM_NO)
      .setEmoji("❌")
      .setLabel(tDefault("commands:message-delete.confirm.btn_no"))
      .setStyle(ButtonStyle.Secondary),
  );

  return [
    navRow,
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(authorSelect),
    filterRow,
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      excludeSelect,
    ),
    actionRow,
  ];
}

/**
 * 最終確認 Embed（Stage 2）を生成する
 * @param targetMessages 削除対象のメッセージ（除外済みを含まない）
 * @param page 現在のページ番号（0-indexed）
 * @param totalPages 総ページ数
 * @param totalDeleteCount 合計削除予定件数
 * @returns 最終確認 EmbedBuilder
 */
export function buildFinalConfirmEmbed(
  targetMessages: ScannedMessage[],
  page: number,
  totalPages: number,
  totalDeleteCount: number,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(STATUS_COLORS.danger)
    .setTitle(
      tDefault("commands:message-delete.final.embed_title", {
        page: page + 1,
        total: Math.max(1, totalPages),
      }),
    )
    .setDescription(
      tDefault("commands:message-delete.final.embed_warning") +
        "\n" +
        tDefault("commands:message-delete.final.embed_desc", {
          count: totalDeleteCount,
        }),
    );

  const start = page * MSG_DEL_PAGE_SIZE;
  const slice = targetMessages.slice(start, start + MSG_DEL_PAGE_SIZE);

  for (let i = 0; i < slice.length; i++) {
    embed.addFields(buildMessageField(slice[i], start + i + 1, false));
  }

  return embed;
}

/**
 * 最終確認ダイアログ コンポーネント（Stage 2）を生成する
 * @param page 現在のページ番号（0-indexed）
 * @param totalPages 総ページ数
 * @param deleteCount 削除予定件数
 * @returns 2行の ActionRow 配列
 */
export function buildFinalConfirmComponents(
  page: number,
  totalPages: number,
  deleteCount: number,
): ActionRowBuilder<ButtonBuilder>[] {
  // 仕様: 最終確認のナビゲーションはプレビューと同一 customId（⏮ 前へ 1/N 次へ ⏭）
  const navRow = buildPaginationNavRow(page, totalPages);

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(MSG_DEL_CUSTOM_ID.FINAL_YES)
      .setEmoji("🗑️")
      .setLabel(
        tDefault("commands:message-delete.final.btn_yes", {
          count: deleteCount,
        }),
      )
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(MSG_DEL_CUSTOM_ID.FINAL_BACK)
      .setEmoji("◀")
      .setLabel(tDefault("commands:message-delete.final.btn_back"))
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(MSG_DEL_CUSTOM_ID.FINAL_NO)
      .setEmoji("❌")
      .setLabel(tDefault("commands:message-delete.final.btn_no"))
      .setStyle(ButtonStyle.Secondary),
  );

  return [navRow, actionRow];
}

/**
 * 削除完了 Embed を生成する
 * @param totalDeleted 合計削除件数
 * @param channelBreakdown チャンネル別削除件数のマップ
 * @returns 削除完了 EmbedBuilder
 */
export function buildCompletionEmbed(
  totalDeleted: number,
  channelBreakdown: Record<string, { name: string; count: number }>,
): EmbedBuilder {
  const breakdownText =
    Object.entries(channelBreakdown)
      .map(([channelId, { count }]) =>
        tDefault("commands:message-delete.embed.channel_breakdown_item", {
          channelId,
          count,
        }),
      )
      .join("\n") || tDefault("commands:message-delete.embed.breakdown_empty");

  return new EmbedBuilder()
    .setColor(STATUS_COLORS.success)
    .setTitle(tDefault("commands:message-delete.embed.summary_title"))
    .addFields(
      {
        name: tDefault("commands:message-delete.embed.total_deleted"),
        value: tDefault("commands:message-delete.embed.total_deleted_value", {
          count: totalDeleted,
        }),
        inline: true,
      },
      {
        name: tDefault("commands:message-delete.embed.channel_breakdown"),
        value: breakdownText,
      },
    );
}

/**
 * コマンド条件 Embed（プレビューダイアログの上層に常に表示）を生成する
 * @param conditions コマンド実行時のオプション情報
 * @returns コマンド条件 EmbedBuilder
 */
export function buildCommandConditionsEmbed(
  conditions: CommandConditionsDisplay,
): EmbedBuilder {
  const {
    count,
    targetUserIds,
    keyword,
    daysOption,
    afterStr,
    beforeStr,
    channelIds,
  } = conditions;

  const hasDays = daysOption !== undefined;
  const hasDateRange = !!(afterStr || beforeStr);

  const countValue =
    count === MSG_DEL_DEFAULT_COUNT
      ? tDefault("commands:message-delete.conditions.count_unlimited", {
          count,
        })
      : tDefault("commands:message-delete.conditions.count_limited", { count });

  const userValue =
    targetUserIds.length > 0
      ? targetUserIds.map((id) => `<@${id}>`).join(" ")
      : tDefault("commands:message-delete.conditions.user_all");

  const keywordValue = keyword
    ? `"${keyword}"`
    : tDefault("commands:message-delete.conditions.none");

  const channelValue =
    channelIds.length > 0
      ? channelIds.map((id) => `<#${id}>`).join(" ")
      : tDefault("commands:message-delete.conditions.channel_all");

  // days と after/before は排他。指定されている方のフィールドのみ表示し、もう一方は省略する
  const periodFields: { name: string; value: string; inline: true }[] = [];
  if (hasDays) {
    periodFields.push({
      name: "days",
      value: tDefault("commands:message-delete.conditions.days_value", {
        days: daysOption,
      }),
      inline: true,
    });
  } else if (hasDateRange) {
    if (afterStr) {
      periodFields.push({
        name: "after",
        value: tDefault("commands:message-delete.conditions.after_value", {
          date: afterStr,
        }),
        inline: true,
      });
    }
    if (beforeStr) {
      periodFields.push({
        name: "before",
        value: tDefault("commands:message-delete.conditions.before_value", {
          date: beforeStr,
        }),
        inline: true,
      });
    }
  } else {
    // いずれも未指定の場合は days フィールドのみ「なし」で表示
    periodFields.push({
      name: "days",
      value: tDefault("commands:message-delete.conditions.none"),
      inline: true,
    });
  }

  return new EmbedBuilder()
    .setColor(STATUS_COLORS.muted)
    .setTitle(tDefault("commands:message-delete.conditions.title"))
    .addFields(
      { name: "count", value: countValue, inline: true },
      { name: "user", value: userValue, inline: true },
      { name: "keyword", value: keywordValue, inline: true },
      ...periodFields,
      { name: "channel", value: channelValue, inline: true },
    );
}
