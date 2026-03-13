// src/bot/features/message-delete/constants/messageDeleteConstants.ts
// message-delete 機能の定数・型定義

import type { GuildTextBasedChannel } from "discord.js";

/** UI コンポーネントの customId 定数 */
export const MSG_DEL_CUSTOM_ID = {
  // スキャン中キャンセルボタン
  SCAN_CANCEL: "msgdel_scan_cancel",
  // 確認ダイアログ（プレビュー：Stage 1）
  CONFIRM_YES: "msgdel_confirm_yes",
  CONFIRM_NO: "msgdel_confirm_no",
  CONFIRM_EXCLUDE: "msgdel_confirm_exclude",
  // ページネイション（Stage 1 プレビュー）
  FIRST: "msgdel_first",
  PREV: "msgdel_prev",
  NEXT: "msgdel_next",
  LAST: "msgdel_last",
  JUMP: "msgdel_jump",
  // 最終確認ダイアログ（Stage 2）ナビゲーションは Stage 1 と同一 customId（FIRST/PREV/JUMP/NEXT/LAST）を使用
  FINAL_YES: "msgdel_final_yes",
  FINAL_BACK: "msgdel_final_back",
  FINAL_NO: "msgdel_final_no",
  // フィルター（Stage 1 共通）
  FILTER_AUTHOR: "msgdel_filter_author",
  FILTER_KEYWORD: "msgdel_filter_keyword",
  FILTER_DAYS: "msgdel_filter_days",
  FILTER_AFTER: "msgdel_filter_after",
  FILTER_BEFORE: "msgdel_filter_before",
  FILTER_RESET: "msgdel_filter_reset",
  // フィルターモーダル
  MODAL_KEYWORD: "msgdel_modal_keyword",
  MODAL_DAYS: "msgdel_modal_days",
  MODAL_AFTER: "msgdel_modal_after",
  MODAL_BEFORE: "msgdel_modal_before",
  MODAL_JUMP: "msgdel_modal_jump",
  // モーダル入力フィールド
  MODAL_INPUT_KEYWORD: "msgdel_modal_input_keyword",
  MODAL_INPUT_DAYS: "msgdel_modal_input_days",
  MODAL_INPUT_AFTER: "msgdel_modal_input_after",
  MODAL_INPUT_BEFORE: "msgdel_modal_input_before",
  MODAL_INPUT_JUMP: "msgdel_modal_input_jump",
} as const;

/** 1ページあたりの表示件数 */
export const MSG_DEL_PAGE_SIZE = 5;

/** 確認ダイアログのタイムアウト（14分）- Discord Interaction token 15分制限に対して1分のバッファ */
export const MSG_DEL_CONFIRM_TIMEOUT_MS = 840_000;

/**
 * Phase 2 コレクターのアイドルタイムアウト（3分）
 * エフェメラルメッセージをユーザーが非表示にしても MESSAGE_DELETE イベントは発火しないため、
 * 無操作が続いた場合にコレクターを自動終了してロックを解放する
 */
export const MSG_DEL_COLLECTOR_IDLE_MS = 180_000;

/** モーダル送信タイムアウト（60秒） */
export const MSG_DEL_MODAL_TIMEOUT_MS = 60_000;

/** k-way マージのリフィル間待機時間（ms） */
export const MSG_DEL_REFILL_WAIT_MS = 200;

/** bulkDelete 1バッチあたりの最大件数 */
export const MSG_DEL_BULK_BATCH_SIZE = 100;

/** メッセージ取得 1バッチあたりの最大件数 */
export const MSG_DEL_FETCH_BATCH_SIZE = 100;

/** bulkDelete バッチ間の待機時間（ms） */
export const MSG_DEL_BULK_WAIT_MS = 1000;

/** 個別削除 1件あたりの待機時間（ms） */
export const MSG_DEL_INDIVIDUAL_WAIT_MS = 500;

/** Discord の bulkDelete 対象となる最大メッセージ年齢（14日） */
export const MSG_DEL_BULK_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

/** 削除結果メッセージの本文最大文字数 */
export const MSG_DEL_CONTENT_MAX_LENGTH = 200;

/** count オプション未指定時のデフォルト収集件数 */
export const MSG_DEL_DEFAULT_COUNT = 1000;

/** Discord Epoch（Snowflake 計算用） */
export const DISCORD_EPOCH = 1420070400000n;

/** 1日あたりのミリ秒数 */
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** コマンド名定数 */
export const MSG_DEL_COMMAND = {
  NAME: "message-delete",
  OPTION: {
    COUNT: "count",
    USER: "user",
    KEYWORD: "keyword",
    DAYS: "days",
    AFTER: "after",
    BEFORE: "before",
    CHANNEL: "channel",
  },
} as const;

/**
 * スキャン済みメッセージ型
 * プレスキャンで収集したメッセージの情報と Discord Message オブジェクトを保持する
 */
export interface ScannedMessage {
  /** Discord のメッセージID */
  messageId: string;
  /** 所属するギルドID */
  guildId: string;
  /** 投稿者のユーザーID */
  authorId: string;
  /** 表示名（サーバーニックネーム → グローバル表示名 → ユーザー名 の優先順） */
  authorDisplayName: string;
  /** 投稿されたチャンネルID */
  channelId: string;
  /** 投稿されたチャンネル名 */
  channelName: string;
  /** メッセージの投稿日時 */
  createdAt: Date;
  /** 表示用本文（添付ファイル・Embed 概要を含む、最大 MSG_DEL_CONTENT_MAX_LENGTH 文字） */
  content: string;
}

/** 削除実行時に使用するチャンネル参照付きメッセージ型（内部専用） */
export interface ScannedMessageWithChannel extends ScannedMessage {
  _channel: GuildTextBasedChannel;
}

/**
 * コマンド条件 Embed の表示用データ型
 * buildCommandConditionsEmbed に渡す情報をまとめた表示専用インターフェース
 */
export interface CommandConditionsDisplay {
  /** count オプション値（未指定時は MSG_DEL_DEFAULT_COUNT） */
  count: number;
  /** 対象ユーザーID（未指定で全員対象） */
  targetUserId?: string;
  /** キーワード（未指定でフィルタなし） */
  keyword?: string;
  /** days オプション値（未指定で undefined） */
  daysOption?: number;
  /** after オプションの入力文字列 */
  afterStr?: string;
  /** before オプションの入力文字列 */
  beforeStr?: string;
  /** 対象チャンネルID（未指定でサーバー全体） */
  channelId?: string;
}

/**
 * フィルター状態型（Stage 1 プレビューダイアログで使用）
 *
 * days と after/before は排他関係を型レベルで保証する Discriminated Union。
 * - days ブランチ: 過去N日間フィルター（after・before は undefined のみ許容）
 * - absolute ブランチ: 日付範囲フィルター（days は undefined のみ許容）
 */
export type MessageDeleteFilter =
  | {
      authorId?: string;
      keyword?: string;
      days: number;
      after?: undefined;
      before?: undefined;
    }
  | {
      authorId?: string;
      keyword?: string;
      days?: undefined;
      after?: Date;
      /** after に対応するユーザー入力文字列（フィルターボタンのラベル表示用） */
      afterRaw?: string;
      before?: Date;
      /** before に対応するユーザー入力文字列（フィルターボタンのラベル表示用） */
      beforeRaw?: string;
    };
