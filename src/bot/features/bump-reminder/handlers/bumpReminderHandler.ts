// src/bot/features/bump-reminder/handlers/bumpReminderHandler.ts
// Bump検知ユースケースのオーケストレーション

import type { Client } from "discord.js";
import { tDefault } from "../../../../shared/locale/localeManager";
import { logger } from "../../../../shared/utils/logger";
import {
  getBotBumpReminderConfigService,
  getBotBumpReminderRepository,
} from "../../../services/botCompositionRoot";
import type { BumpServiceName } from "../constants/bumpReminderConstants";
import { getReminderDelayMinutes } from "../constants/bumpReminderConstants";
import { scheduleBumpReminder } from "./usecases/scheduleBumpReminder";
import { sendBumpPanel } from "./usecases/sendBumpPanel";

/**
 * Bump 検知時に設定確認、パネル送信、リマインダー登録を行う関数
 * @param client Discord クライアント
 * @param guildId 検知ギルドID
 * @param channelId 検知チャンネルID
 * @param messageId 検知元メッセージID
 * @param serviceName 検知サービス名
 */
export async function handleBumpDetected(
  client: Client,
  guildId: string,
  channelId: string,
  messageId: string,
  serviceName: BumpServiceName,
): Promise<void> {
  try {
    // Bump 設定サービスを取得し、機能有効状態を確認
    const bumpReminderConfigService = getBotBumpReminderConfigService();

    const config =
      await bumpReminderConfigService.getBumpReminderConfigOrDefault(guildId);
    if (!config.enabled) {
      // 機能無効ギルドでは検知のみ行い何もしない
      logger.debug(
        tDefault("system:scheduler.bump_reminder_disabled", { guildId }),
      );
      return;
    }

    // 設定チャンネル固定時は、検知チャンネル一致時のみ処理する
    if (config.channelId && config.channelId !== channelId) {
      // 設定チャンネル外の検知はノイズとしてスキップ
      logger.debug(
        tDefault("system:scheduler.bump_reminder_unregistered_channel", {
          channelId,
          expectedChannelId: config.channelId,
          guildId,
        }),
      );
      return;
    }

    // 同一サービスの前回パネルメッセージが残っていれば削除する
    // 異なるサービスのパネルはリマインド完了まで残す
    await deleteOldPanel(client, guildId, channelId, serviceName);

    // 通知予定を示すパネルを先に送信し、メッセージIDを保持
    // 予約キーは manager 側で guild/channel/message 単位に正規化される
    const panelMessageId = await sendBumpPanel(
      client,
      guildId,
      channelId,
      messageId,
      getReminderDelayMinutes(),
    );
    // panelMessageId は未送信時 undefined のまま許容する

    await scheduleBumpReminder(
      client,
      guildId,
      channelId,
      messageId,
      serviceName,
      bumpReminderConfigService,
      panelMessageId,
    );

    // 登録完了時点で検知ログを残す
    logger.info(
      tDefault("system:bump-reminder.detected", {
        guildId,
        service: serviceName,
      }),
    );
  } catch (error) {
    logger.error(
      tDefault("system:bump-reminder.detection_failed", {
        guildId,
      }),
      error,
    );
  }
}

/**
 * 同一サービスの前回 Bump パネルメッセージを削除する関数
 * DB の pending レコードから panelMessageId を取得して削除を試みる
 * @param client Discord クライアント
 * @param guildId 対象ギルドID
 * @param channelId パネルが存在するチャンネルID
 * @param serviceName 削除対象のサービス名
 */
async function deleteOldPanel(
  client: Client,
  guildId: string,
  channelId: string,
  serviceName: BumpServiceName,
): Promise<void> {
  try {
    const repository = getBotBumpReminderRepository();
    const pendingReminder = await repository.findPendingByGuildAndService(
      guildId,
      serviceName,
    );

    if (!pendingReminder?.panelMessageId) {
      return;
    }

    // 前回パネルのチャンネルIDを使用（現在のchannelIdと異なる場合もある）
    const panelChannelId = pendingReminder.channelId || channelId;
    const channel = await client.channels
      .fetch(panelChannelId)
      .catch(() => null);
    if (channel?.isTextBased()) {
      const panelMessage = await channel.messages
        .fetch(pendingReminder.panelMessageId)
        .catch(() => null);
      if (panelMessage) {
        await panelMessage.delete();
        logger.debug(
          tDefault("system:scheduler.bump_reminder_panel_deleted", {
            panelMessageId: pendingReminder.panelMessageId,
            guildId,
          }),
        );
      }
    }
  } catch (error) {
    // 旧パネル削除の失敗は新パネル送信を妨げない
    logger.debug(
      tDefault("system:scheduler.bump_reminder_panel_delete_failed", {
        panelMessageId: "unknown",
      }),
      error,
    );
  }
}
