// src/bot/errors/interactionErrorHandler.ts
// コマンド/インタラクション向けエラーハンドリング

import {
  ChatInputCommandInteraction,
  DiscordAPIError,
  MessageFlags,
  RESTJSONErrorCodes,
  type RepliableInteraction,
} from "discord.js";
import {
  BaseError,
  ConfigurationError,
  DatabaseError,
  DiscordApiError,
  NotFoundError,
  PermissionError,
  RateLimitError,
  TimeoutError,
  ValidationError,
} from "../../shared/errors/customErrors";
import {
  getUserFriendlyMessage,
  logError,
  toError,
} from "../../shared/errors/errorHandler";
import { logPrefixed, tInteraction } from "../../shared/locale/localeManager";
import { logger } from "../../shared/utils/logger";
import { createErrorEmbed, createWarningEmbed } from "../utils/messageResponse";

/** ユーザー操作で回復可能なエラー（warning レベルで表示） */
const WARNING_ERROR_CLASSES: ReadonlyArray<
  new (
    ...args: never[]
  ) => BaseError
> = [ValidationError, NotFoundError, TimeoutError, ConfigurationError];

/** エラークラスと common タイトルキーの対応 */
const ERROR_TITLE_MAP = [
  [ValidationError, "common:title_invalid_input"],
  [PermissionError, "common:title_permission_denied"],
  [NotFoundError, "common:title_resource_not_found"],
  [TimeoutError, "common:title_timeout"],
  [ConfigurationError, "common:title_config_error"],
  [DatabaseError, "common:title_operation_error"],
  [DiscordApiError, "common:title_operation_error"],
  [RateLimitError, "common:title_rate_limited"],
] as const;

/**
 * エラーの種別に応じたEmbedタイトル文字列を取得する
 * @param interaction 返信先インタラクション
 * @param err 発生したエラー
 * @returns Embedタイトル文字列
 */
const getErrorTitle = (
  interaction: RepliableInteraction,
  err: Error | BaseError,
): string => {
  // embedTitle が明示的に設定されている場合は最優先
  if (err instanceof BaseError && err.embedTitle) {
    return err.embedTitle;
  }

  // エラークラスごとの標準タイトルを検索
  for (const [ErrorClass, titleKey] of ERROR_TITLE_MAP) {
    if (err instanceof ErrorClass) {
      return tInteraction(interaction.locale, titleKey);
    }
  }

  // フォールバック
  return tInteraction(interaction.locale, "common:error");
};

/**
 * Discord API の MissingPermissions エラーかどうか判定する
 * @param error 判定対象のエラー
 * @returns MissingPermissions エラーであれば true
 */
const isMissingPermissionsError = (error: unknown): boolean =>
  error instanceof DiscordAPIError &&
  error.code === RESTJSONErrorCodes.MissingPermissions;

/**
 * エラー内容をEmbedで返信する内部関数
 * 返信済または defer済みの場合は editReply、未返信の場合は reply を使用する
 * @param interaction 返信先インタラクション
 * @param error 発生したエラー
 * @returns 実行完了を示す Promise
 */
const replyWithError = async (
  interaction: RepliableInteraction,
  error: unknown,
): Promise<void> => {
  // Discord API の MissingPermissions は専用メッセージで応答する
  if (isMissingPermissionsError(error)) {
    logError(toError(error));
    const title = tInteraction(
      interaction.locale,
      "common:title_bot_permission_denied",
    );
    const message = tInteraction(
      interaction.locale,
      "common:bot_permission.missing",
    );
    const embed = createErrorEmbed(message, { title });

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [embed] });
        return;
      }
      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    } catch (replyError) {
      logger.error(
        logPrefixed("system:log_prefix.bot", "system:error.reply_failed"),
        replyError,
      );
    }
    return;
  }

  const err = toError(error);
  logError(err);

  // messageKey が設定されている場合は interaction.locale で遅延翻訳する
  const message =
    err instanceof BaseError && err.messageKey
      ? tInteraction(
          interaction.locale,
          err.messageKey as Parameters<typeof tInteraction>[1],
          err.messageParams,
        )
      : getUserFriendlyMessage(err);
  const title = getErrorTitle(interaction, err);
  const isWarning =
    err instanceof BaseError &&
    WARNING_ERROR_CLASSES.some((cls) => err instanceof cls);
  const embed = isWarning
    ? createWarningEmbed(message, { title })
    : createErrorEmbed(message, { title });

  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  } catch (replyError) {
    logger.error(
      logPrefixed("system:log_prefix.bot", "system:error.reply_failed"),
      replyError,
    );
  }
};

/**
 * スラッシュコマンド実行時のエラーを整形してユーザーに返信する
 * @param interaction コマンド実行インタラクション
 * @param error 発生したエラー
 * @returns 実行完了を示す Promise
 */
export const handleCommandError = async (
  interaction: ChatInputCommandInteraction,
  error: unknown,
): Promise<void> => replyWithError(interaction, error);

/**
 * 汎用インタラクション（ボタン・モーダル等）のエラーを整形してユーザーに返信する
 * @param interaction 返信可能なインタラクション
 * @param error 発生したエラー
 * @returns 実行完了を示す Promise
 */
export const handleInteractionError = async (
  interaction: RepliableInteraction,
  error: unknown,
): Promise<void> => replyWithError(interaction, error);
