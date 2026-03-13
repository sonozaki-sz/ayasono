// src/bot/features/vc-recruit/handlers/vcRecruitMessageDeleteHandler.ts
// VC募集パネルメッセージ削除の自己修復ハンドラー

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Message,
  type PartialMessage,
} from "discord.js";
import { tGuild } from "../../../../shared/locale/localeManager";
import { logger } from "../../../../shared/utils/logger";
import { getBotVcRecruitRepository } from "../../../services/botCompositionRoot";
import { createInfoEmbed } from "../../../utils/messageResponse";
import { VC_RECRUIT_PANEL_CUSTOM_ID } from "../commands/vcRecruitConfigCommand.constants";

/**
 * messageDelete 時にVC募集パネルメッセージが削除されていた場合、再送信して DB を更新する
 * @param message 削除されたメッセージ（Partial の場合あり）
 */
export async function handleVcRecruitMessageDelete(
  message: Message | PartialMessage,
): Promise<void> {
  if (!message.guildId || !message.channelId) return;

  const guildId = message.guildId;
  const repo = getBotVcRecruitRepository();

  // 削除されたメッセージのチャンネルがパネルチャンネルとして登録されているか確認
  const setup = await repo.findSetupByPanelChannelId(
    guildId,
    message.channelId,
  );
  if (!setup) return;

  // 削除されたのがパネルメッセージ本体かを確認
  if (setup.panelMessageId !== message.id) return;

  logger.info(
    `[vc-recruit] パネルメッセージ削除を検知、パネルを再送信します: guildId=${guildId}, panelChannelId=${message.channelId}, messageId=${message.id}`,
  );

  // パネルチャンネルを取得
  const guild = (message as Message).guild;
  if (!guild) return;

  const panelChannel = await guild.channels
    .fetch(setup.panelChannelId)
    .catch(() => null);
  if (!panelChannel || !panelChannel.isSendable()) return;

  // パネルメッセージを再送信
  const panelTitle = await tGuild(guildId, "commands:vcRecruit.panel.title");
  const panelDescription = await tGuild(
    guildId,
    "commands:vcRecruit.panel.description",
  );
  const createButtonLabel = await tGuild(
    guildId,
    "commands:vcRecruit.panel.create_button",
  );

  const panelEmbed = createInfoEmbed(panelDescription, { title: panelTitle });
  const createRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(
        `${VC_RECRUIT_PANEL_CUSTOM_ID.CREATE_BUTTON_PREFIX}${setup.panelChannelId}`,
      )
      .setLabel(createButtonLabel)
      .setEmoji("📢")
      .setStyle(ButtonStyle.Success),
  );

  const newMessage = await panelChannel
    .send({ embeds: [panelEmbed], components: [createRow] })
    .catch(() => null);
  if (!newMessage) return;

  // DB の panelMessageId を更新
  await repo.updatePanelMessageId(guildId, setup.panelChannelId, newMessage.id);

  logger.info(
    `[vc-recruit] パネルメッセージを再送信しました: guildId=${guildId}, panelChannelId=${setup.panelChannelId}, newMessageId=${newMessage.id}`,
  );
}
