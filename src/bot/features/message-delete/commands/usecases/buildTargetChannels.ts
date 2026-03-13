// src/bot/features/message-delete/commands/usecases/buildTargetChannels.ts
// 削除対象チャンネルリストの構築

import {
  ChannelType,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type GuildTextBasedChannel,
} from "discord.js";
import { tDefault } from "../../../../../shared/locale/localeManager";
import { logger } from "../../../../../shared/utils/logger";
import {
  createErrorEmbed,
  createWarningEmbed,
} from "../../../../utils/messageResponse";
import { MSG_DEL_COMMAND } from "../../constants/messageDeleteConstants";

/**
 * 削除対象のチャンネルリストを構築する
 * channel オプション指定時は単一チャンネル、未指定時は Bot がアクセス可能な全チャンネルを返す
 * @param interaction コマンド実行の ChatInputCommandInteraction
 * @returns 対象チャンネル配列（エラー時は null）
 */
export async function buildTargetChannels(
  interaction: ChatInputCommandInteraction,
): Promise<GuildTextBasedChannel[] | null> {
  const guild = interaction.guild;
  if (!guild) return null;
  const channelOption = interaction.options.getChannel(
    MSG_DEL_COMMAND.OPTION.CHANNEL,
    false,
  );

  if (channelOption) {
    const isTextBased =
      channelOption.type === ChannelType.GuildText ||
      channelOption.type === ChannelType.GuildAnnouncement ||
      channelOption.type === ChannelType.AnnouncementThread ||
      channelOption.type === ChannelType.PublicThread ||
      channelOption.type === ChannelType.PrivateThread ||
      channelOption.type === ChannelType.GuildVoice;

    if (!isTextBased) {
      await interaction.editReply({
        embeds: [
          createWarningEmbed(
            tDefault("commands:message-delete.errors.text_channel_only"),
          ),
        ],
      });
      return null;
    }

    // 指定チャンネルへの Bot アクセス権チェック
    const me = guild.members.me;
    const hasAccess =
      !me ||
      (channelOption as GuildTextBasedChannel)
        .permissionsFor(me)
        ?.has([
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages,
        ]) === true;

    if (!hasAccess) {
      await interaction.editReply({
        embeds: [
          createErrorEmbed(
            tDefault("commands:message-delete.errors.channel_no_access"),
          ),
        ],
      });
      return null;
    }

    return [channelOption as GuildTextBasedChannel];
  }

  logger.debug(tDefault("system:message-delete.cmd_all_channels_start"));
  const allChannels = await guild.channels.fetch();
  logger.debug(
    tDefault("system:message-delete.cmd_channel_count", {
      count: allChannels.size,
    }),
  );

  const me = guild.members.me;
  if (!me) {
    return [...allChannels.values()].filter(
      (ch) => ch !== null && ch.isTextBased(),
    ) as GuildTextBasedChannel[];
  }
  return [...allChannels.values()].filter(
    (ch) =>
      ch !== null &&
      ch.isTextBased() &&
      (ch
        .permissionsFor(me)
        ?.has([
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages,
        ]) ??
        false),
  ) as GuildTextBasedChannel[];
}
