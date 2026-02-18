// src/shared/features/bump-reminder/handler.ts
// Bump検知とリマインダー送信のハンドラー

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Client,
} from "discord.js";
import {
  getGuildConfigRepository,
  type IGuildConfigRepository,
} from "../../database";
import { tDefault } from "../../locale";
import { getGuildTranslator, type GuildTFunction } from "../../locale/helpers";
import { logger } from "../../utils/logger";
import { createInfoEmbed } from "../../utils/messageResponse";
import {
  BUMP_CONSTANTS,
  BUMP_SERVICES,
  type BumpServiceName,
  getReminderDelayMinutes,
  toScheduledAt,
} from "./constants";
import { getBumpReminderManager } from "./manager";

/**
 * Bump検知時の共通処理
 */
export async function handleBumpDetected(
  client: Client,
  guildId: string,
  channelId: string,
  messageId: string,
  serviceName: BumpServiceName,
): Promise<void> {
  try {
    const guildConfigRepository = getGuildConfigRepository();

    // Guild設定を確認
    const config = await guildConfigRepository.getBumpReminderConfig(guildId);
    if (!config?.enabled) {
      logger.debug(
        tDefault("system:scheduler.bump_reminder_disabled", { guildId }),
      );
      return;
    }

    // チャンネルチェック：設定チャンネルと Bump 発生チャンネルが一致しない場合はスキップ
    if (config.channelId && config.channelId !== channelId) {
      logger.debug(
        tDefault("system:scheduler.bump_reminder_unregistered_channel", {
          channelId,
          expectedChannelId: config.channelId,
          guildId,
        }),
      );
      return;
    }

    // パネルUIを送信
    const panelMessageId = await sendBumpPanel(
      client,
      guildId,
      channelId,
      messageId,
      getReminderDelayMinutes(),
    );

    // リマインダータスクを作成（パネルメッセージIDをクロージャで保持）
    const bumpReminderManager = getBumpReminderManager();
    const reminderTask = async () => {
      await sendBumpReminder(
        client,
        guildId,
        channelId,
        messageId,
        serviceName,
        guildConfigRepository,
        panelMessageId,
      );
    };

    // リマインダーを設定
    try {
      await bumpReminderManager.setReminder(
        guildId,
        channelId,
        messageId,
        panelMessageId,
        getReminderDelayMinutes(),
        reminderTask,
        serviceName,
      );
    } catch (setReminderError) {
      // setReminder が失敗した場合はパネルメッセージを削除して孤立を防ぐ
      if (panelMessageId) {
        try {
          const ch = await client.channels.fetch(channelId);
          if (ch?.isTextBased() && "messages" in ch) {
            const panelMsg = await ch.messages.fetch(panelMessageId);
            await panelMsg.delete();
          }
        } catch (deleteError) {
          logger.debug(
            tDefault(
              "system:scheduler.bump_reminder_orphaned_panel_delete_failed",
              {
                panelMessageId,
              },
            ),
            deleteError,
          );
        }
      }
      throw setReminderError;
    }

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
 * Bumpリマインダーを送信
 */
export async function sendBumpReminder(
  client: Client,
  guildId: string,
  channelId: string,
  messageId: string | undefined,
  serviceName: BumpServiceName | undefined,
  guildConfigRepository: IGuildConfigRepository,
  panelMessageId?: string,
): Promise<void> {
  // channels.fetch の結果を finally ブロックでも再利用するため宣言を外側にホイスト
  let channel: Awaited<ReturnType<Client["channels"]["fetch"]>> | undefined;
  try {
    channel = await client.channels.fetch(channelId);
    if (!channel?.isTextBased()) {
      logger.warn(
        tDefault("system:scheduler.bump_reminder_channel_not_found", {
          channelId,
          guildId,
        }),
      );
      return;
    }

    // リマインダー送信時に最新の設定を取得
    const currentConfig =
      await guildConfigRepository.getBumpReminderConfig(guildId);
    if (!currentConfig?.enabled) {
      logger.debug(
        tDefault("system:scheduler.bump_reminder_disabled", {
          guildId,
        }),
      );
      return;
    }

    // メンション文字列を作成
    const mentions: string[] = [];
    if (currentConfig.mentionRoleId) {
      mentions.push(`<@&${currentConfig.mentionRoleId}>`);
    }
    if (
      currentConfig.mentionUserIds &&
      currentConfig.mentionUserIds.length > 0
    ) {
      currentConfig.mentionUserIds.forEach((userId: string) => {
        mentions.push(`<@${userId}>`);
      });
    }

    const mentionText = mentions.length > 0 ? mentions.join(" ") : "";

    // リマインダーメッセージを取得（サービス名に応じて変える）
    const tGuild = await getGuildTranslator(guildId);

    let reminderMessage: string;
    if (serviceName === BUMP_SERVICES.DISBOARD) {
      reminderMessage = tGuild(
        "events:bump-reminder.reminder_message.disboard",
      );
    } else if (serviceName === BUMP_SERVICES.DISSOKU) {
      reminderMessage = tGuild("events:bump-reminder.reminder_message.dissoku");
    } else {
      reminderMessage = tGuild("events:bump-reminder.reminder_message");
    }

    // メンションがある場合は改行を追加、ない場合はメッセージのみ
    const content = mentionText
      ? `${mentionText}\n${reminderMessage}`
      : reminderMessage;

    // 通知メッセージを送信（元メッセージに返信）
    if ("send" in channel) {
      if (messageId) {
        await channel.send({
          content,
          reply: { messageReference: messageId },
        });
      } else {
        await channel.send(content);
      }
    }

    logger.info(
      tDefault("system:scheduler.bump_reminder_sent", {
        guildId,
        channelId,
      }),
    );
  } finally {
    // パネルメッセージを削除（成功時もエラー時も）
    if (panelMessageId) {
      try {
        // channels.fetch が失敗して channel が未定義の場合、再フェッチを試みる
        const ch =
          channel?.isTextBased() && "messages" in channel
            ? channel
            : await client.channels.fetch(channelId).catch(() => null);
        if (ch?.isTextBased() && "messages" in ch) {
          const panelMessage = await ch.messages.fetch(panelMessageId);
          await panelMessage.delete();
          logger.debug(
            tDefault("system:scheduler.bump_reminder_panel_deleted", {
              panelMessageId,
              guildId,
            }),
          );
        }
      } catch (error) {
        logger.debug(
          tDefault("system:scheduler.bump_reminder_panel_delete_failed", {
            panelMessageId,
          }),
          error,
        );
      }
    }
  }
}

/**
 * Bumpパネルを送信
 * @returns パネルメッセージID（送信に成功した場合）
 */
export async function sendBumpPanel(
  client: Client,
  guildId: string,
  channelId: string,
  messageId: string,
  delayMinutes: number,
): Promise<string | undefined> {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel?.isTextBased()) {
      return undefined;
    }

    // ギルドの翻訳関数を取得
    const tGuild = await getGuildTranslator(guildId);

    // 通知時刻を計算（UNIXタイムスタンプ秒）
    const scheduledAt = toScheduledAt(delayMinutes);
    const unixTimestamp = Math.floor(scheduledAt.getTime() / 1000);

    // Embedを作成（統一関数使用）
    const embed = createInfoEmbed(
      tGuild("events:bump-reminder.panel.scheduled_at", {
        timestamp: unixTimestamp,
      }),
      { title: tGuild("events:bump-reminder.panel.title") },
    );

    // ボタンを作成
    const row = createBumpPanelButtons(guildId, tGuild);

    // パネルを送信（元メッセージへのリプライ）
    if ("send" in channel) {
      const panelMessage = await channel.send({
        embeds: [embed],
        components: [row],
        reply: { messageReference: messageId },
      });

      return panelMessage.id;
    }
    return undefined;
  } catch (error) {
    logger.error(
      tDefault("system:scheduler.bump_reminder_panel_send_failed"),
      error,
    );
    return undefined;
  }
}

/**
 * Bumpパネルのボタンを作成
 */
function createBumpPanelButtons(
  guildId: string,
  tGuild: GuildTFunction,
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${BUMP_CONSTANTS.CUSTOM_ID_PREFIX.MENTION_ON}${guildId}`)
      .setLabel(tGuild("events:bump-reminder.panel.button_mention_on"))
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🔔"),
    new ButtonBuilder()
      .setCustomId(`${BUMP_CONSTANTS.CUSTOM_ID_PREFIX.MENTION_OFF}${guildId}`)
      .setLabel(tGuild("events:bump-reminder.panel.button_mention_off"))
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🔕"),
  );
}
