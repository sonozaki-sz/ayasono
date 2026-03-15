// src/bot/features/sticky-message/commands/stickyMessageCommand.constants.ts
// スティッキーメッセージコマンド定数

/**
 * スティッキーメッセージコマンドで使用するコマンド名・サブコマンド名・オプション名を一元管理する
 */
export const STICKY_MESSAGE_COMMAND = {
  NAME: "sticky-message",
  SUBCOMMAND: {
    SET: "set",
    REMOVE: "remove",
    VIEW: "view",
    UPDATE: "update",
  },
  /** view コマンドが送信する StringSelectMenu の customId */
  VIEW_SELECT_CUSTOM_ID: "sticky-message:view-select",
  /** remove コマンドが送信する StringSelectMenu の customId */
  REMOVE_SELECT_CUSTOM_ID: "sticky-message:remove-select",
  /** remove コマンドの「削除する」ボタンの customId */
  REMOVE_BUTTON_CUSTOM_ID: "sticky-message:remove-button",
  /** set プレーンテキストモーダル customId プレフィックス（後ろに channelId を付加） */
  SET_MODAL_ID_PREFIX: "sticky-message:set-modal:",
  /** set Embed モーダル customId プレフィックス（後ろに channelId を付加） */
  SET_EMBED_MODAL_ID_PREFIX: "sticky-message:set-embed-modal:",
  /** update プレーンテキストモーダル customId プレフィックス（後ろに channelId を付加） */
  UPDATE_MODAL_ID_PREFIX: "sticky-message:update-modal:",
  /** update Embed モーダル customId プレフィックス（後ろに channelId を付加） */
  UPDATE_EMBED_MODAL_ID_PREFIX: "sticky-message:update-embed-modal:",
  /** 各モーダル内の入力欄 customId */
  MODAL_INPUT: {
    MESSAGE: "sticky-message:modal:message",
    EMBED_TITLE: "sticky-message:modal:embed-title",
    EMBED_DESCRIPTION: "sticky-message:modal:embed-description",
    EMBED_COLOR: "sticky-message:modal:embed-color",
  },
  OPTION: {
    CHANNEL: "channel",
    STYLE: "style",
  },
  OPTION_VALUE: {
    TEXT: "text",
    EMBED: "embed",
  },
  /** StringSelectMenu に表示できる選択肢の最大件数（Discord 上限） */
  MAX_SELECT_OPTIONS: 25,
} as const;
