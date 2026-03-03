// src/bot/features/vc-recruit/commands/vcRecruitConfigCommand.constants.ts
// VC募集設定コマンド定数

/**
 * VC招募設定コマンドで使用するコマンド名・サブコマンド名・オプション名を一元管理する
 */
export const VC_RECRUIT_CONFIG_COMMAND = {
  NAME: "vc-recruit-config",
  SUBCOMMAND: {
    SETUP: "setup",
    TEARDOWN: "teardown",
    ADD_ROLE: "add-role",
    REMOVE_ROLE: "remove-role",
    VIEW: "view",
  },
  OPTION: {
    CATEGORY: "category",
    THREAD_ARCHIVE: "thread-archive",
    ROLE: "role",
  },
  TARGET: {
    TOP: "TOP",
  },
  THREAD_ARCHIVE_CHOICES: [
    { name: "1h (1時間)", value: "1h" },
    { name: "24h (24時間)", value: "24h" },
    { name: "3d (3日)", value: "3d" },
    { name: "1w (1週間)", value: "1w" },
  ],
  CATEGORY_CHANNEL_LIMIT: 50,
} as const;

/** スレッドアーカイブ文字列を分単位に変換するマップ */
export const THREAD_ARCHIVE_DURATION_MAP: Record<
  string,
  60 | 1440 | 4320 | 10080
> = {
  "1h": 60,
  "24h": 1440,
  "3d": 4320,
  "1w": 10080,
};

/**
 * VC募集パネル UI の customId プレフィックス定数
 * setup コマンド・各種ハンドラーで共用する
 */
export const VC_RECRUIT_PANEL_CUSTOM_ID = {
  CREATE_BUTTON_PREFIX: "vc-recruit:create:",
  MODAL_PREFIX: "vc-recruit:modal:",
  SELECT_MENTION_PREFIX: "vc-recruit:select-mention:",
  SELECT_VC_PREFIX: "vc-recruit:select-vc:",
  /** ステップ1セレクト後に押す「次へ（詳細入力）」ボタン */
  MODAL_OPEN_BUTTON_PREFIX: "vc-recruit:open-modal:",
} as const;

/**
 * VC募集 teardown UI の customId プレフィックス定数
 */
export const VC_RECRUIT_TEARDOWN_CUSTOM_ID = {
  SELECT_PREFIX: "vc-recruit-teardown-select:",
  CONFIRM_PREFIX: "vc-recruit-teardown-confirm:",
  CANCEL_PREFIX: "vc-recruit-teardown-cancel:",
  /** 確認パネルから選択に戻るボタン */
  REDO_PREFIX: "vc-recruit-teardown-redo:",
} as const;
