// src/bot/events/clientReady.ts
// Bot起動完了イベント

import { ActivityType, Events, PresenceUpdateStatus } from "discord.js";
import { getGuildConfigRepository } from "../../shared/database";
import type {
  BumpReminderTaskFactory,
  BumpServiceName,
} from "../../shared/features/bump-reminder";
import {
  getBumpReminderManager,
  sendBumpReminder,
} from "../../shared/features/bump-reminder";
import { tDefault } from "../../shared/locale";
import type { BotEvent } from "../../shared/types/discord";
import { logger } from "../../shared/utils/logger";

export const clientReadyEvent: BotEvent<typeof Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    logger.info(tDefault("system:ready.bot_ready", { tag: client.user?.tag }));
    logger.info(
      tDefault("system:ready.servers", { count: client.guilds.cache.size }),
    );
    logger.info(
      tDefault("system:ready.users", { count: client.users.cache.size }),
    );
    logger.info(
      tDefault("system:ready.commands", { count: client.commands.size }),
    );

    // ステータス設定
    const serverCount = client.guilds.cache.size;
    client.user?.setPresence({
      activities: [
        {
          name: tDefault("system:bot.presence_activity", {
            count: serverCount,
          }),
          type: ActivityType.Playing,
        },
      ],
      status: PresenceUpdateStatus.Online,
    });

    // Bumpリマインダーを復元（DB永続化データから再スケジュール）
    try {
      const guildConfigRepository = getGuildConfigRepository();
      const bumpReminderManager = getBumpReminderManager();

      const taskFactory: BumpReminderTaskFactory = (
        guildId: string,
        channelId: string,
        messageId?: string,
        panelMessageId?: string,
        serviceName?: BumpServiceName,
      ) => {
        return () =>
          sendBumpReminder(
            client,
            guildId,
            channelId,
            messageId,
            serviceName,
            guildConfigRepository,
            panelMessageId,
          );
      };

      await bumpReminderManager.restorePendingReminders(taskFactory);
    } catch (error) {
      logger.error(
        tDefault("system:scheduler.bump_reminder_restore_failed"),
        error,
      );
    }
  },
};
