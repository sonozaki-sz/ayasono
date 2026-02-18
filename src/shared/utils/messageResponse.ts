import { EmbedBuilder } from "discord.js";
import { tDefault } from "../locale";

/**
 * メッセージステータスの種類
 */
export type MessageStatus = "success" | "info" | "warning" | "error";

/**
 * ステータスに応じたカラーコード
 */
const STATUS_COLORS: Record<MessageStatus, number> = {
  success: 0x57f287, // Green
  info: 0x3498db, // Blue
  warning: 0xfee75c, // Yellow
  error: 0xed4245, // Red
};

/**
 * ステータスに応じた絵文字
 */
const STATUS_EMOJIS: Record<MessageStatus, string> = {
  success: "✅",
  info: "ℹ️",
  warning: "⚠️",
  error: "❌",
};

/**
 * Embedメッセージの追加オプション
 */
export interface EmbedOptions {
  /** カスタムタイトル（省略時は各関数のデフォルトタイトルを使用） */
  title?: string;
  /** タイムスタンプを付与するか（デフォルト: false） */
  timestamp?: boolean;
  /** 追加のフィールド */
  fields?: { name: string; value: string; inline?: boolean }[];
}

/**
 * ステータス付きEmbedメッセージを作成
 *
 * @param status メッセージステータス
 * @param title タイトル（絵文字は自動付与）
 * @param description メッセージ本文
 * @param options 追加オプション
 * @returns EmbedBuilder
 *
 * @example
 * ```typescript
 * const embed = createStatusEmbed(
 *   "success",
 *   "設定完了",
 *   "Bumpリマインダー機能を有効化しました",
 *   { timestamp: true }
 * );
 * await interaction.reply({ embeds: [embed], ephemeral: true });
 * ```
 */
export function createStatusEmbed(
  status: MessageStatus,
  title: string,
  description: string,
  options?: EmbedOptions,
): EmbedBuilder {
  const emoji = STATUS_EMOJIS[status];
  const color = STATUS_COLORS[status];

  // タイトルが256文字を超える場合は自動切り詰め
  // 絵文字とスペース（約5文字分）を考慮して250文字に制限
  const maxTitleLength = 250;
  const truncatedTitle =
    title.length > maxTitleLength
      ? title.substring(0, maxTitleLength) + "..."
      : title;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${emoji} ${truncatedTitle}`);

  if (description) {
    embed.setDescription(description);
  }

  if (options?.timestamp) {
    embed.setTimestamp();
  }

  if (options?.fields) {
    embed.addFields(options.fields);
  }

  return embed;
}

/**
 * 成功メッセージを作成
 * タイトルは自動的に「成功」に固定されます
 *
 * @param description メッセージ本文
 * @param options 追加オプション
 * @returns EmbedBuilder
 *
 * @example
 * ```typescript
 * const embed = createSuccessEmbed("Bumpリマインダー機能を有効化しました");
 * await interaction.reply({ embeds: [embed], ephemeral: true });
 * ```
 */
export function createSuccessEmbed(
  description: string,
  options?: EmbedOptions,
): EmbedBuilder {
  return createStatusEmbed(
    "success",
    options?.title ?? tDefault("common:success"),
    description,
    options,
  );
}

/**
 * 情報メッセージを作成
 * デフォルトタイトルは「情報」。options.title で上書き可能。
 *
 * @param description メッセージ本文
 * @param options 追加オプション（title で上書き可能）
 * @returns EmbedBuilder
 *
 * @example
 * ```typescript
 * // デフォルトタイトル
 * const embed = createInfoEmbed("現在の設定状態");
 * // カスタムタイトル
 * const embed = createInfoEmbed("現在の設定状態", { title: "Bumpリマインダー機能" });
 * ```
 */
export function createInfoEmbed(
  description: string,
  options?: EmbedOptions,
): EmbedBuilder {
  return createStatusEmbed(
    "info",
    options?.title ?? tDefault("common:info"),
    description,
    options,
  );
}

/**
 * 警告メッセージを作成
 * デフォルトタイトルは「警告」。options.title で上書き可能。
 *
 * @param description メッセージ本文
 * @param options 追加オプション（title で上書き可能）
 * @returns EmbedBuilder
 *
 * @example
 * ```typescript
 * // デフォルトタイトル
 * const embed = createWarningEmbed("既に有効です");
 * // カスタムタイトル
 * const embed = createWarningEmbed("既に有効です", { title: "既に設定されています" });
 * ```
 */
export function createWarningEmbed(
  description: string,
  options?: EmbedOptions,
): EmbedBuilder {
  return createStatusEmbed(
    "warning",
    options?.title ?? tDefault("common:warning"),
    description,
    options,
  );
}

/**
 * エラーメッセージを作成
 * デフォルトタイトルは「エラー」。options.title で上書き可能。
 *
 * @param description メッセージ本文
 * @param options 追加オプション（title で上書き可能）
 * @returns EmbedBuilder
 *
 * @example
 * ```typescript
 * // デフォルトタイトル
 * const embed = createErrorEmbed("管理者権限が必要です");
 * // カスタムタイトル
 * const embed = createErrorEmbed("管理者権限が必要です", { title: "権限不足" });
 * ```
 */
export function createErrorEmbed(
  description: string,
  options?: EmbedOptions,
): EmbedBuilder {
  return createStatusEmbed(
    "error",
    options?.title ?? tDefault("common:error"),
    description,
    options,
  );
}
