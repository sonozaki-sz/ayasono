// src/bot/features/message-delete/commands/messageDeleteCommand.execute.ts
// /message-delete コマンド実行処理

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
  type ChatInputCommandInteraction,
  type GuildTextBasedChannel,
  type MessageComponentInteraction,
} from "discord.js";
import { getTimezoneOffsetForLocale } from "../../../../shared/locale/helpers";
import type { AllParseKeys } from "../../../../shared/locale/i18n";
import { tDefault } from "../../../../shared/locale/localeManager";
import { logger } from "../../../../shared/utils/logger";
import { handleCommandError } from "../../../errors/interactionErrorHandler";
import {
  createErrorEmbed,
  createInfoEmbed,
  createWarningEmbed,
} from "../../../utils/messageResponse";
import {
  MSG_DEL_COMMAND,
  MSG_DEL_CONFIRM_TIMEOUT_MS,
  MSG_DEL_CUSTOM_ID,
  MSG_DEL_DEFAULT_COUNT,
  MSG_DEL_MODAL_TIMEOUT_MS,
  MSG_DEL_PAGE_SIZE,
  MS_PER_DAY,
  type MessageDeleteFilter,
  type ScannedMessage,
  type ScannedMessageWithChannel,
} from "../constants/messageDeleteConstants";
import {
  deleteScannedMessages,
  parseDateStr,
  scanMessages,
  type DeleteProgressData,
  type ScanProgressData,
} from "../services/messageDeleteService";
import {
  buildCommandConditionsEmbed,
  buildCompletionEmbed,
  buildFilteredMessages,
  buildFinalConfirmComponents,
  buildFinalConfirmEmbed,
  buildPreviewComponents,
  buildPreviewEmbed,
} from "./messageDeleteEmbedBuilder";

// ===== サーバー単位の処理中ロック =====
// Phase 1〜3 の実行中はロックを保持し、同一サーバー内の重複実行を防止する
// Bot 再起動でクリアされるメモリ管理のため、永続化は不要
const executingGuilds = new Set<string>();

// ===== 型定義 =====

/** コマンドオプションのパース・バリデーション結果 */
interface ParsedOptions {
  count: number;
  /** ユーザーが count を明示指定したかどうか（ログ出力の有無に使用） */
  countSpecified: boolean;
  targetUserId?: string;
  keyword?: string;
  afterTs: number;
  beforeTs: number;
  afterStr?: string;
  beforeStr?: string;
  daysOption?: number;
  channelId?: string;
}

/** モーダルフィルター設定 */
interface ModalFilterConfig {
  readonly modalId: string;
  readonly inputId: string;
  readonly titleKey: AllParseKeys;
  readonly labelKey: AllParseKeys;
  readonly placeholderKey: AllParseKeys;
  readonly apply: (
    value: string,
    current: MessageDeleteFilter,
    timezoneOffset: string,
  ) => { filter: MessageDeleteFilter; errorKey?: AllParseKeys };
}

const DIALOG_TYPE = {
  Confirm: "confirm",
  Cancel: "cancel",
  Timeout: "timeout",
  Back: "back",
} as const;

type PreviewResult =
  | {
      type: typeof DIALOG_TYPE.Cancel;
      lastInteraction: MessageComponentInteraction;
    }
  | { type: typeof DIALOG_TYPE.Timeout }
  | {
      type: typeof DIALOG_TYPE.Confirm;
      filter: MessageDeleteFilter;
      excludedIds: Set<string>;
      confirmInteraction: MessageComponentInteraction;
    };

type FinalResult =
  | {
      type: typeof DIALOG_TYPE.Confirm;
      interaction: MessageComponentInteraction;
    }
  | {
      type: typeof DIALOG_TYPE.Cancel;
      interaction: MessageComponentInteraction;
    }
  | { type: typeof DIALOG_TYPE.Timeout }
  | { type: typeof DIALOG_TYPE.Back; interaction: MessageComponentInteraction };

// ===== モーダルフィルター設定マップ =====

const MODAL_FILTER_CONFIG = new Map<string, ModalFilterConfig>([
  [
    MSG_DEL_CUSTOM_ID.FILTER_KEYWORD,
    {
      modalId: MSG_DEL_CUSTOM_ID.MODAL_KEYWORD,
      inputId: MSG_DEL_CUSTOM_ID.MODAL_INPUT_KEYWORD,
      titleKey: "commands:message-delete.modal.keyword.title",
      labelKey: "commands:message-delete.modal.keyword.label",
      placeholderKey: "commands:message-delete.modal.keyword.placeholder",
      apply: (value, current) => ({
        filter: { ...current, keyword: value || undefined },
      }),
    },
  ],
  [
    MSG_DEL_CUSTOM_ID.FILTER_DAYS,
    {
      modalId: MSG_DEL_CUSTOM_ID.MODAL_DAYS,
      inputId: MSG_DEL_CUSTOM_ID.MODAL_INPUT_DAYS,
      titleKey: "commands:message-delete.modal.days.title",
      labelKey: "commands:message-delete.modal.days.label",
      placeholderKey: "commands:message-delete.modal.days.placeholder",
      apply: (value, current) => {
        if (!value) return { filter: { ...current, days: undefined } };
        const days = parseInt(value, 10);
        if (isNaN(days) || days < 1) {
          return {
            filter: current,
            errorKey:
              "commands:message-delete.errors.days_invalid_value" as const,
          };
        }
        return {
          filter: { ...current, days, after: undefined, before: undefined },
        };
      },
    },
  ],
  [
    MSG_DEL_CUSTOM_ID.FILTER_AFTER,
    {
      modalId: MSG_DEL_CUSTOM_ID.MODAL_AFTER,
      inputId: MSG_DEL_CUSTOM_ID.MODAL_INPUT_AFTER,
      titleKey: "commands:message-delete.modal.after.title",
      labelKey: "commands:message-delete.modal.after.label",
      placeholderKey: "commands:message-delete.modal.after.placeholder",
      apply: (value, current, timezoneOffset) => {
        if (!value) return { filter: { ...current, after: undefined } };
        const afterDate = parseDateStr(value, false, timezoneOffset);
        if (!afterDate) {
          return {
            filter: current,
            errorKey:
              "commands:message-delete.errors.after_invalid_format" as const,
          };
        }
        if (current.before && afterDate >= current.before) {
          return {
            filter: current,
            errorKey:
              "commands:message-delete.errors.date_range_invalid" as const,
          };
        }
        // afterRaw: ボタンラベルにユーザー入力値をそのまま表示するために保存
        return {
          filter: {
            ...current,
            after: afterDate,
            afterRaw: value,
            days: undefined,
          },
        };
      },
    },
  ],
  [
    MSG_DEL_CUSTOM_ID.FILTER_BEFORE,
    {
      modalId: MSG_DEL_CUSTOM_ID.MODAL_BEFORE,
      inputId: MSG_DEL_CUSTOM_ID.MODAL_INPUT_BEFORE,
      titleKey: "commands:message-delete.modal.before.title",
      labelKey: "commands:message-delete.modal.before.label",
      placeholderKey: "commands:message-delete.modal.before.placeholder",
      apply: (value, current, timezoneOffset) => {
        if (!value) return { filter: { ...current, before: undefined } };
        const beforeDate = parseDateStr(value, true, timezoneOffset);
        if (!beforeDate) {
          return {
            filter: current,
            errorKey:
              "commands:message-delete.errors.before_invalid_format" as const,
          };
        }
        if (current.after && current.after >= beforeDate) {
          return {
            filter: current,
            errorKey:
              "commands:message-delete.errors.date_range_invalid" as const,
          };
        }
        // beforeRaw: ボタンラベルにユーザー入力値をそのまま表示するために保存
        return {
          filter: {
            ...current,
            before: beforeDate,
            beforeRaw: value,
            days: undefined,
          },
        };
      },
    },
  ],
]);

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
        embeds: [createErrorEmbed(tDefault("errors:validation.guild_only"))],
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
    }
  } catch (error) {
    await handleCommandError(interaction, error);
  }
}

// ===== オプション解析・バリデーション =====

/**
 * コマンドオプションをパースしてバリデーションを行う
 * @param interaction コマンド実行の ChatInputCommandInteraction
 * @returns バリデーション済みオプション（エラー時は null）
 */
async function parseAndValidateOptions(
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
      // YYYY-MM-DD 形式の当日指定は仕様上許可（00:00:00 UTC が現在以前かどうかで判定）
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

// ===== 権限チェック =====

/**
 * コマンド実行者が ManageMessages 権限を持つかどうかを確認する
 * @param interaction コマンド実行の ChatInputCommandInteraction
 * @returns ManageMessages 権限がある場合は true
 */
function hasManageMessagesPermission(
  interaction: ChatInputCommandInteraction,
): boolean {
  // has() はデフォルトで Administrator フラグを考慮するため個別チェックは不要
  return (
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) ??
    false
  );
}

// ===== 対象チャンネルリスト構築 =====

/**
 * 削除対象のチャンネルリストを構築する
 * channel オプション指定時は単一チャンネル、未指定時は Bot がアクセス可能な全チャンネルを返す
 * @param interaction コマンド実行の ChatInputCommandInteraction
 * @returns 対象チャンネル配列（エラー時は null）
 */
async function buildTargetChannels(
  interaction: ChatInputCommandInteraction,
): Promise<GuildTextBasedChannel[] | null> {
  const guild = interaction.guild;
  if (!guild) return null;
  const channelOption = interaction.options.getChannel(
    MSG_DEL_COMMAND.OPTION.CHANNEL,
    false,
  );

  if (channelOption) {
    const isTextBased =
      channelOption.type === ChannelType.GuildText ||
      channelOption.type === ChannelType.GuildAnnouncement ||
      channelOption.type === ChannelType.AnnouncementThread ||
      channelOption.type === ChannelType.PublicThread ||
      channelOption.type === ChannelType.PrivateThread ||
      channelOption.type === ChannelType.GuildVoice;

    if (!isTextBased) {
      await interaction.editReply({
        embeds: [
          createWarningEmbed(
            tDefault("commands:message-delete.errors.text_channel_only"),
          ),
        ],
      });
      return null;
    }

    // 指定チャンネルへの Bot アクセス権チェック
    const me = guild.members.me;
    const hasAccess =
      !me ||
      (channelOption as GuildTextBasedChannel)
        .permissionsFor(me)
        ?.has([
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages,
        ]) === true;

    if (!hasAccess) {
      await interaction.editReply({
        embeds: [
          createErrorEmbed(
            tDefault("commands:message-delete.errors.channel_no_access"),
          ),
        ],
      });
      return null;
    }

    return [channelOption as GuildTextBasedChannel];
  }

  logger.debug(tDefault("system:message-delete.cmd_all_channels_start"));
  const allChannels = await guild.channels.fetch();
  logger.debug(
    tDefault("system:message-delete.cmd_channel_count", {
      count: allChannels.size,
    }),
  );

  const me = guild.members.me;
  if (!me) {
    return [...allChannels.values()].filter(
      (ch) => ch !== null && ch.isTextBased(),
    ) as GuildTextBasedChannel[];
  }
  return [...allChannels.values()].filter(
    (ch) =>
      ch !== null &&
      ch.isTextBased() &&
      (ch
        .permissionsFor(me)
        ?.has([
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages,
        ]) ??
        false),
  ) as GuildTextBasedChannel[];
}

// ===== スキャンフェーズ =====

/**
 * Phase 1: メッセージのプレスキャンを実行する
 * - 「収集分を確認」ボタンで中断可能
 * - 14分タイムアウトでスキャンを自動中断
 * - 中断/タイムアウト時に収集済みメッセージがあればプレビューへ遷移
 * @param interaction コマンド実行の ChatInputCommandInteraction
 * @param channels スキャン対象のチャンネル一覧
 * @param options パース済みコマンドオプション
 * @returns 収集済みメッセージ配列（null の場合は処理終了）
 */
async function runScanPhase(
  interaction: ChatInputCommandInteraction,
  channels: GuildTextBasedChannel[],
  options: ParsedOptions,
): Promise<ScannedMessageWithChannel[] | null> {
  const { count, targetUserId, keyword, afterTs, beforeTs } = options;
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
  }, MSG_DEL_CONFIRM_TIMEOUT_MS);

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
    cancelCollector.on("end", () => resolve());
  });

  let scannedMessages: ScannedMessageWithChannel[];
  try {
    scannedMessages = await scanMessages(channels, {
      count,
      targetUserId,
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
          tDefault("commands:message-delete.errors.delete_failed"),
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
  let filter: MessageDeleteFilter = {};
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

// ===== 削除実行 =====

/**
 * Phase 3: 確認済みメッセージの削除を実行する
 * - 14分タイムアウトで削除を中断し、削除済み件数を通知する
 * - 削除進捗をリアルタイムで表示
 * @param interaction 削除実行ボタンの MessageComponentInteraction
 * @param targetMessages 削除対象のスキャン済みメッセージ配列（除外済みを含まない）
 * @param options パース済みコマンドオプション（ログ出力に使用）
 * @returns 処理完了を示す Promise
 */
async function executeDelete(
  interaction: MessageComponentInteraction,
  targetMessages: ScannedMessageWithChannel[],
  options: ParsedOptions,
): Promise<void> {
  const deleteController = new AbortController();

  // Phase 3 タイムアウトタイマー（14分で削除を中断）
  const deleteTimeoutId = setTimeout(() => {
    deleteController.abort();
  }, MSG_DEL_CONFIRM_TIMEOUT_MS);

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
      const targetPart = options.targetUserId
        ? ` target=${options.targetUserId}`
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

    // Phase 3 タイムアウト: 削除済み件数を通知して終了
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

/**
 * フィルターモーダルを表示してユーザーの入力値を返す
 * @param i モーダルを表示するトリガーの MessageComponentInteraction
 * @param config モーダルの設定（タイトル・ラベル・プレースホルダー等）
 * @returns ユーザーの入力値（トリム済み）、キャンセル/タイムアウト時は null
 */
async function showFilterModal(
  i: MessageComponentInteraction,
  config: ModalFilterConfig,
): Promise<string | null> {
  const modal = new ModalBuilder()
    .setCustomId(config.modalId)
    .setTitle(tDefault(config.titleKey))
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(config.inputId)
          .setLabel(tDefault(config.labelKey))
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setPlaceholder(tDefault(config.placeholderKey)),
      ),
    );

  await i.showModal(modal);
  const submit = await i
    .awaitModalSubmit({ time: MSG_DEL_MODAL_TIMEOUT_MS })
    .catch(() => null);
  if (!submit) return null;
  await submit.deferUpdate();
  return submit.fields.getTextInputValue(config.inputId).trim();
}

/**
 * モーダル入力値を MODAL_FILTER_CONFIG に基づいてフィルターに適用する
 * @param customId ボタンの customId（フィルター種別を特定するために使用）
 * @param value モーダルに入力された値
 * @param currentFilter 現在のフィルター状態
 * @param timezoneOffset 日付パース時に使用するタイムゾーンオフセット
 * @returns 新しいフィルター状態（エラーの場合は errorKey を含む）
 */
function applyModalFilterValue(
  customId: string,
  value: string,
  currentFilter: MessageDeleteFilter,
  timezoneOffset: string,
): { filter: MessageDeleteFilter; errorKey?: AllParseKeys } {
  return (
    MODAL_FILTER_CONFIG.get(customId)?.apply(
      value,
      currentFilter,
      timezoneOffset,
    ) ?? {
      filter: currentFilter,
    }
  );
}

/**
 * ページジャンプモーダルを表示してユーザーの入力文字列を返す
 * @param i モーダルを表示するトリガーの MessageComponentInteraction
 * @param totalPages 総ページ数（プレースホルダーに使用）
 * @returns ユーザーの入力文字列（トリム済み）、キャンセル/タイムアウト時は null
 */
async function showJumpModal(
  i: MessageComponentInteraction,
  totalPages: number,
): Promise<string | null> {
  const modal = new ModalBuilder()
    .setCustomId(MSG_DEL_CUSTOM_ID.MODAL_JUMP)
    .setTitle(tDefault("commands:message-delete.modal.jump.title"))
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(MSG_DEL_CUSTOM_ID.MODAL_INPUT_JUMP)
          .setLabel(tDefault("commands:message-delete.modal.jump.label"))
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder(
            tDefault("commands:message-delete.modal.jump.placeholder", {
              total: totalPages,
            }),
          ),
      ),
    );

  await i.showModal(modal);
  const submit = await i
    .awaitModalSubmit({ time: MSG_DEL_MODAL_TIMEOUT_MS })
    .catch(() => null);
  if (!submit) return null;
  await submit.deferUpdate();
  return submit.fields
    .getTextInputValue(MSG_DEL_CUSTOM_ID.MODAL_INPUT_JUMP)
    .trim();
}

// ===== プレビューダイアログ（Stage 1）=====

/**
 * Stage 1: プレビューダイアログを表示し、ユーザーの操作を待機する
 * フィルター・除外操作・ページネーションを処理し、削除確認またはキャンセルを返す
 * @param baseInteraction ベースとなる Interaction（初回は ChatInput、「戻る」後は MessageComponent）
 * @param allMessages スキャン済み全メッセージ（フィルター前）
 * @param initialFilter 初期フィルター状態（「戻る」後は前回の状態を引き継ぐ）
 * @param initialExcludedIds 初期除外セット（「戻る」後は前回の状態を引き継ぐ）
 * @param options パース済みコマンドオプション（コマンド条件 Embed の表示に使用）
 * @param timeoutMs コレクターのタイムアウト（Phase 2 の残り時間、最終確認と共有）
 * @returns プレビューダイアログの結果（confirm / cancel / timeout）
 */
async function showPreviewDialog(
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
      ),
      content: "",
    };
  };

  const response = await baseInteraction.editReply(buildReplyPayload(0));

  return new Promise((resolve) => {
    const collector = response.createMessageComponentCollector({
      time: timeoutMs,
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== baseInteraction.user.id) {
        await i.reply({
          embeds: [
            createWarningEmbed(
              tDefault("commands:message-delete.errors.not_authorized"),
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // ── 終端アクション（resolve して collector を停止） ──
      if (i.customId === MSG_DEL_CUSTOM_ID.CONFIRM_YES) {
        await i.deferUpdate().catch(() => {});
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
      if (reason !== "time") return; // resolve 済み（collect ハンドラで解決）
      await baseInteraction
        .editReply({
          embeds: [
            createWarningEmbed(
              tDefault("commands:message-delete.confirm.timed_out"),
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

// ===== 最終確認ダイアログ（Stage 2）=====

/**
 * Stage 2: 最終確認ダイアログを表示し、ユーザーの操作を待機する
 * フィルターなしで全削除対象を一覧表示し、削除実行・戻る・キャンセルを処理する
 * @param baseInteraction プレビューダイアログで「削除する」を押したときの MessageComponentInteraction
 * @param targetMessages 削除対象メッセージ（除外済みを含まない）
 * @param timeoutMs コレクターのタイムアウト（Phase 2 の残り時間、プレビューと共有）
 * @returns 最終確認ダイアログの結果（confirm / back / cancel / timeout）
 */
async function showFinalConfirmDialog(
  baseInteraction: MessageComponentInteraction,
  targetMessages: ScannedMessage[],
  timeoutMs: number,
): Promise<FinalResult> {
  let currentPage = 0;
  const totalPages = Math.ceil(targetMessages.length / MSG_DEL_PAGE_SIZE);

  const buildReplyPayload = (page: number) => ({
    embeds: [
      buildFinalConfirmEmbed(
        targetMessages,
        page,
        totalPages,
        targetMessages.length,
      ),
    ],
    components: buildFinalConfirmComponents(
      page,
      totalPages,
      targetMessages.length,
    ),
    content: "",
  });

  const response = await baseInteraction.editReply(buildReplyPayload(0));

  return new Promise((resolve) => {
    const collector = response.createMessageComponentCollector({
      time: timeoutMs,
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== baseInteraction.user.id) {
        await i.reply({
          embeds: [
            createWarningEmbed(
              tDefault("commands:message-delete.errors.not_authorized"),
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // ── 終端アクション（resolve して collector を停止） ──
      if (i.customId === MSG_DEL_CUSTOM_ID.FINAL_YES) {
        await i.deferUpdate().catch(() => {});
        collector.stop();
        resolve({ type: DIALOG_TYPE.Confirm, interaction: i });
        return;
      }
      if (i.customId === MSG_DEL_CUSTOM_ID.FINAL_NO) {
        await i.deferUpdate().catch(() => {});
        collector.stop();
        resolve({ type: DIALOG_TYPE.Cancel, interaction: i });
        return;
      }
      if (i.customId === MSG_DEL_CUSTOM_ID.FINAL_BACK) {
        await i.deferUpdate().catch(() => {});
        collector.stop();
        resolve({ type: DIALOG_TYPE.Back, interaction: i });
        return;
      }

      // ── ページネーション（仕様: プレビューと同一 customId を使用） ──
      if (i.customId === MSG_DEL_CUSTOM_ID.FIRST) {
        currentPage = 0;
        await i.update(buildReplyPayload(currentPage)).catch(() => {});
        return;
      }
      if (i.customId === MSG_DEL_CUSTOM_ID.PREV) {
        currentPage = Math.max(0, currentPage - 1);
        await i.update(buildReplyPayload(currentPage)).catch(() => {});
        return;
      }
      if (i.customId === MSG_DEL_CUSTOM_ID.NEXT) {
        currentPage = Math.min(totalPages - 1, currentPage + 1);
        await i.update(buildReplyPayload(currentPage)).catch(() => {});
        return;
      }
      if (i.customId === MSG_DEL_CUSTOM_ID.LAST) {
        currentPage = Math.max(0, totalPages - 1);
        await i.update(buildReplyPayload(currentPage)).catch(() => {});
        return;
      }

      // ── ページジャンプ ──
      if (i.customId === MSG_DEL_CUSTOM_ID.JUMP) {
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
    });

    collector.on("end", async (_, reason) => {
      if (reason !== "time") return; // resolve 済み（collect ハンドラで解決）
      await baseInteraction
        .editReply({
          embeds: [
            createWarningEmbed(
              tDefault("commands:message-delete.confirm.timed_out"),
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
