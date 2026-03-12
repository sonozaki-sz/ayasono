// src/bot/features/vc-recruit/commands/usecases/vcRecruitConfigSetup.ts
// vc-recruit-config setup のユースケース処理

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  MessageFlags,
  OverwriteResolvable,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type TextChannel,
} from "discord.js";
import { ValidationError } from "../../../../../shared/errors/customErrors";
import { tDefault, tGuild } from "../../../../../shared/locale/localeManager";
import { getBotVcRecruitRepository } from "../../../../services/botVcRecruitDependencyResolver";
import {
  createInfoEmbed,
  createSuccessEmbed,
} from "../../../../utils/messageResponse";
import { resolveTargetCategory } from "../helpers/vcRecruitTargetResolver";
import {
  THREAD_ARCHIVE_DURATION_MAP,
  VC_RECRUIT_CONFIG_COMMAND,
  VC_RECRUIT_PANEL_CUSTOM_ID,
} from "../vcRecruitConfigCommand.constants";

/**
 * vc-recruit-config setup を実行する
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 */
export async function handleVcRecruitConfigSetup(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  const guild = interaction.guild;
  if (!guild) {
    throw new ValidationError(tDefault("errors:validation.guild_only"));
  }

  const categoryOption = interaction.options.getString(
    VC_RECRUIT_CONFIG_COMMAND.OPTION.CATEGORY,
  );
  const threadArchiveOption =
    interaction.options.getString(
      VC_RECRUIT_CONFIG_COMMAND.OPTION.THREAD_ARCHIVE,
    ) ?? "24h";

  const category = await resolveTargetCategory(
    guild,
    interaction.channelId,
    categoryOption,
  );
  const targetCategoryId = category?.id ?? null;
  const threadArchiveDuration =
    THREAD_ARCHIVE_DURATION_MAP[threadArchiveOption] ?? 1440;

  const repo = getBotVcRecruitRepository();

  // 同一カテゴリーへの重複セットアップを防止
  const existing = await repo.findSetupByCategoryId(guildId, targetCategoryId);
  if (existing) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vcRecruit.already_setup"),
    );
  }

  // カテゴリーのチャンネル数制限確認（カテゴリーあり の場合）
  if (
    category &&
    category.children.cache.size >=
      VC_RECRUIT_CONFIG_COMMAND.CATEGORY_CHANNEL_LIMIT
  ) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vcRecruit.category_full"),
    );
  }

  // ── 権限オーバーライドの決定 ──────────────────────────────────────
  // カテゴリーが @everyone に ViewChannel を許可しているか確認
  const everyoneViewAllowed =
    !category ||
    category
      .permissionsFor(guild.roles.everyone)
      ?.has(PermissionFlagsBits.ViewChannel) === true;

  const botMember = guild.members.me;
  if (!botMember) {
    throw new Error("Bot member not found in guild cache");
  }

  const panelPermissionOverwrites: OverwriteResolvable[] = [
    {
      id: botMember.id,
      allow: [
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
  ];
  if (everyoneViewAllowed) {
    panelPermissionOverwrites.push({
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.SendMessages],
    });
  }

  const postPermissionOverwrites: OverwriteResolvable[] = [
    {
      id: botMember.id,
      allow: [
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.CreatePublicThreads,
      ],
    },
  ];
  if (everyoneViewAllowed) {
    postPermissionOverwrites.push({
      id: guild.roles.everyone.id,
      deny: [
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.CreatePublicThreads,
      ],
      allow: [PermissionFlagsBits.SendMessagesInThreads],
    });
  }

  // ── チャンネル作成 ────────────────────────────────────────────────
  const panelName = await tGuild(
    guildId,
    "commands:vcRecruit.channelName.panel",
  );
  const postName = await tGuild(guildId, "commands:vcRecruit.channelName.post");

  const panelChannel = (await guild.channels.create({
    name: panelName,
    type: ChannelType.GuildText,
    parent: targetCategoryId ?? undefined,
    permissionOverwrites: panelPermissionOverwrites,
  })) as TextChannel;

  const postChannel = (await guild.channels.create({
    name: postName,
    type: ChannelType.GuildText,
    parent: targetCategoryId ?? undefined,
    permissionOverwrites: postPermissionOverwrites,
  })) as TextChannel;

  // ── パネルメッセージ送信 ──────────────────────────────────────────
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
        `${VC_RECRUIT_PANEL_CUSTOM_ID.CREATE_BUTTON_PREFIX}${panelChannel.id}`,
      )
      .setLabel(createButtonLabel)
      .setEmoji("📢")
      .setStyle(ButtonStyle.Success),
  );

  const panelMessage = await panelChannel.send({
    embeds: [panelEmbed],
    components: [createRow],
  });

  // ── DB 保存 ──────────────────────────────────────────────────────
  await repo.addSetup(guildId, {
    categoryId: targetCategoryId,
    panelChannelId: panelChannel.id,
    postChannelId: postChannel.id,
    panelMessageId: panelMessage.id,
    threadArchiveDuration,
  });

  // ── 成功レスポンス ────────────────────────────────────────────────
  const categoryName = category?.name ?? "TOP";
  const embed = createSuccessEmbed(
    await tGuild(guildId, "commands:vc-recruit-config.embed.setup_success"),
    {
      title: await tGuild(
        guildId,
        "commands:vc-recruit-config.embed.success_title",
      ),
      fields: [
        {
          name: categoryName,
          value: [
            await tGuild(
              guildId,
              "commands:vc-recruit-config.embed.setup_panel_channel",
              { channel: `<#${panelChannel.id}>` },
            ),
            await tGuild(
              guildId,
              "commands:vc-recruit-config.embed.setup_post_channel",
              { channel: `<#${postChannel.id}>` },
            ),
          ].join("\n"),
          inline: false,
        },
      ],
    },
  );

  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}
