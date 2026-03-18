// src/bot/features/member-log/handlers/guildMemberAddHandler.ts
// guildMemberAdd イベントのメンバーログ処理

import { ChannelType, EmbedBuilder, type GuildMember } from "discord.js";
import { getGuildTranslator } from "../../../../shared/locale/helpers";
import { tDefault } from "../../../../shared/locale/localeManager";
import { logger } from "../../../../shared/utils/logger";
import { getBotMemberLogConfigService } from "../../../services/botCompositionRoot";
import { calcDuration } from "./accountAge";
import { findUsedInvite } from "./inviteTracker";
import { formatAccountAge, formatCustomMessage } from "./memberLogUtils";

// 参加通知 Embed の色（ビリジアン）
const JOIN_EMBED_COLOR = 0x008969;

/**
 * guildMemberAdd 時にメンバーログ通知を送信する
 * 機能が無効またはチャンネル未設定の場合はスキップ
 * @param member 参加したギルドメンバー
 * @returns 実行完了を示す Promise
 */
export async function handleGuildMemberAdd(member: GuildMember): Promise<void> {
  const guildId = member.guild.id;

  try {
    // 設定を取得し、機能が有効かチェック
    const config =
      await getBotMemberLogConfigService().getMemberLogConfig(guildId);
    if (!config?.enabled || !config.channelId) {
      // 機能無効またはチャンネル未設定はスキップ
      return;
    }

    // 通知先チャンネルを取得（キャッシュ未登録の場合も API で取得）
    const channel = await member.guild.channels.fetch(config.channelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      // チャンネルが存在しない場合：設定をリセットしてシステムチャンネルへ通知
      await getBotMemberLogConfigService().disableAndClearChannel(guildId);
      logger.warn(
        tDefault("system:member-log.channel_deleted_config_cleared", {
          guildId,
          channelId: config.channelId,
        }),
      );
      const t = await getGuildTranslator(guildId);
      await member.guild.systemChannel
        ?.send({ content: t("events:member-log.channel_deleted_notice") })
        .catch(() => null);
      return;
    }

    // ギルドロケールで翻訳関数を取得
    const t = await getGuildTranslator(guildId);

    // メンバー情報を収集
    const userId = member.user.id;
    const username = member.user.displayName;
    const userMention = `<@${userId}>`;
    const avatarUrl = member.user.displayAvatarURL({ size: 256 });
    const createdTimestamp = Math.floor(member.user.createdTimestamp / 1000);
    const joinedTimestamp = member.joinedTimestamp
      ? Math.floor(member.joinedTimestamp / 1000)
      : null;
    const memberCount = member.guild.memberCount;
    const {
      years: ageYears,
      months: ageMonths,
      days: ageDays,
    } = calcDuration(member.user.createdTimestamp);

    // 使用された招待リンクを取得（権限不足時は null）
    const usedInvite = await findUsedInvite(member.guild);
    const inviteFieldValue = (() => {
      if (!usedInvite) return t("events:member-log.unknown");
      // Botは表示名で、ユーザーはメンション形式で表示する
      const inviterLabel = usedInvite.inviter
        ? usedInvite.inviter.bot
          ? usedInvite.inviter.displayName
          : `<@${usedInvite.inviter.id}>`
        : t("events:member-log.unknown");
      return `discord.gg/${usedInvite.code}（${inviterLabel}）`;
    })();

    // 参加通知 Embed を生成
    const embed = new EmbedBuilder()
      .setColor(JOIN_EMBED_COLOR)
      .setTitle(t("events:member-log.join.title"))
      .setThumbnail(avatarUrl)
      .addFields(
        {
          name: t("events:member-log.join.fields.username"),
          value: userMention,
          inline: true,
        },
        {
          name: t("events:member-log.join.fields.accountCreated"),
          value: `<t:${createdTimestamp}:f>(${formatAccountAge(ageYears, ageMonths, ageDays, t)})`,
          inline: true,
        },
        ...(joinedTimestamp !== null
          ? [
              {
                name: t("events:member-log.join.fields.serverJoined"),
                value: `<t:${joinedTimestamp}:f>`,
                inline: true,
              },
            ]
          : []),
        {
          name: t("events:member-log.join.fields.invitedBy"),
          value: inviteFieldValue,
          inline: true,
        },
        {
          name: t("events:member-log.join.fields.memberCount"),
          value: t("events:member-log.member_count", { count: memberCount }),
          inline: true,
        },
      )
      .setTimestamp();

    // カスタム参加メッセージが設定されている場合は content として追加
    const customMessage = config.joinMessage
      ? formatCustomMessage(
          config.joinMessage,
          userMention,
          username,
          memberCount,
          member.guild.name,
        )
      : undefined;

    // 通知チャンネルへ送信
    await channel.send({
      content: customMessage,
      embeds: [embed],
    });

    // 送信完了ログ
    logger.debug(
      tDefault("system:member-log.join_notification_sent", {
        guildId,
        userId,
      }),
    );
  } catch (err) {
    // エラーが発生しても Bot のクラッシュを防ぐ
    logger.error(
      tDefault("system:member-log.notification_failed", { guildId }),
      { err },
    );
  }
}
