// src/bot/features/sticky-message/commands/stickyMessageCommand.constants.ts
// スティッキーメッセージコマンド定数

/**
 * スティッキーメッセージコマンドで使用するコマンド名・サブコマンド名・オプション名を一元管理する
 */
export const STICKY_MESSAGE_COMMAND = {
  NAME: "sticky-message",
  SUBCOMMAND: {
    SET: "set",
    SET_EMBED: "set-embed",
    REMOVE: "remove",
    VIEW: "view",
    UPDATE: "update",
  },
  /** view コマンドが送信する StringSelectMenu の customId */
  VIEW_SELECT_CUSTOM_ID: "sticky-message:view-select",
  /** set コマンドのモーダル customId プレフィックス（後ろに channelId を付加） */
  SET_MODAL_ID_PREFIX: "sticky-message:set-modal:",
  /** set モーダル内のメッセージ入力欄 customId */
  SET_MODAL_MESSAGE_INPUT_ID: "sticky-message:set-modal:message",
  OPTION: {
    CHANNEL: "channel",
    MESSAGE: "message",
    USE_EMBED: "use-embed",
    EMBED_TITLE: "embed-title",
    EMBED_DESCRIPTION: "embed-description",
    EMBED_COLOR: "embed-color",
  },
} as const;
