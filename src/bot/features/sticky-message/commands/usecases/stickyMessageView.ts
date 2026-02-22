// src/bot/features/sticky-message/commands/usecases/stickyMessageView.ts
// sticky-message view ユースケース

import {
  ActionRowBuilder,
  type ChatInputCommandInteraction,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { tDefault } from "../../../../../shared/locale/localeManager";
import { getBotStickyMessageRepository } from "../../../../services/botStickyMessageDependencyResolver";
import { createInfoEmbed } from "../../../../utils/messageResponse";
import { STICKY_MESSAGE_COMMAND } from "../stickyMessageCommand.constants";

/** StringSelectMenu に表示できる選択肢の最大件数 */
const MAX_OPTIONS = 25;

/**
 * sticky-message view を実行する
 * ギルドで設定済みの全チャンネルを StringSelectMenu で提示し、
 * ユーザーが選択したチャンネルの詳細を表示する
 */
export async function handleStickyMessageView(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  const repository = getBotStickyMessageRepository();
  const stickies = await repository.findAllByGuild(guildId);

  if (stickies.length === 0) {
    await interaction.reply({
      embeds: [createInfoEmbed(tDefault("commands:sticky-message.view.empty"))],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // 上限 25 件まで選択肢として追加
  const options = stickies.slice(0, MAX_OPTIONS).map((sticky) => {
    const label = `#${sticky.channelId}`;
    const preview =
      sticky.content.length > 50
        ? `${sticky.content.substring(0, 50)}...`
        : sticky.content;

    return new StringSelectMenuOptionBuilder()
      .setLabel(label)
      .setValue(sticky.channelId)
      .setDescription(preview);
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId(STICKY_MESSAGE_COMMAND.VIEW_SELECT_CUSTOM_ID)
    .setPlaceholder(tDefault("commands:sticky-message.view.select.placeholder"))
    .addOptions(options);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    select,
  );

  await interaction.reply({
    components: [row],
    flags: MessageFlags.Ephemeral,
  });
}
