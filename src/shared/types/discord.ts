// src/shared/types/discord.ts
// Discord関連の型定義

import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  type Client,
  type ClientEvents,
  Collection,
  ModalBuilder,
  ModalSubmitInteraction,
  SharedSlashCommand,
} from "discord.js";

/**
 * スラッシュコマンドインターフェース
 */
export interface Command {
  /** コマンドデータ */
  data: SharedSlashCommand;

  /** コマンド実行関数 */
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;

  /** オートコンプリート関数（オプション） */
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;

  /** クールダウン時間（秒）（オプション） */
  cooldown?: number;
}

/**
 * モーダルインターフェース
 */
export interface Modal {
  /** モーダルビルダー */
  modal: ModalBuilder;

  /** 追加データ（オプション） */
  data?: unknown;

  /** モーダル送信時の実行関数 */
  execute: (interaction: ModalSubmitInteraction) => Promise<void>;
}

/**
 * Botイベントインターフェース
 */
export interface BotEvent<K extends keyof ClientEvents = keyof ClientEvents> {
  /** イベント名 */
  name: K;

  /** 一度だけ実行するか */
  once?: boolean;

  /** イベント実行関数 */
  execute: (...args: ClientEvents[K]) => Promise<void>;
}

/**
 * Discord.js Client の型拡張
 * BotClient に実装されたプロパティを Client インターフェースに宣言する
 * クールダウン管理は CooldownManager を使用するため cooldowns は宣言しない
 */
declare module "discord.js" {
  interface Client {
    /** 登録されたコマンド */
    commands: Collection<string, Command>;

    /** 登録されたモーダル */
    modals: Collection<string, Modal>;
  }
}

/**
 * BotEvent を Client に登録するヘルパー関数
 *
 * TypeScript のイベントエミッタージェネリクスの制限により、イベント名とハンドラの
 * 型相関をユニオン全体に渡して表現できないため、キャストはこの関数内に集約している。
 * BotEvent<K> の型整合性はインターフェース定義時に保証されている。
 * `BotEvent<any>` を受け入れることで呼び出し側でのキャストを不要にする。
 */
export function registerBotEvent(
  emitter: Client,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: BotEvent<any>,
): void {
  if (event.once) {
    emitter.once(event.name as never, event.execute as never);
  } else {
    emitter.on(event.name as never, event.execute as never);
  }
}
