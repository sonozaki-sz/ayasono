// src/bot/features/vc-recruit/commands/usecases/vcRecruitConfigView.ts
// vc-recruit-config view のユースケース処理

import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { ValidationError } from "../../../../../shared/errors/customErrors";
import { tDefault, tGuild } from "../../../../../shared/locale/localeManager";
import { getBotVcRecruitRepository } from "../../../../services/botVcRecruitDependencyResolver";
import { createInfoEmbed } from "../../../../utils/messageResponse";

/**
 * vc-recruit-config view を実行する
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 */
export async function handleVcRecruitConfigView(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  const guild = interaction.guild;
  if (!guild) {
    throw new ValidationError(tDefault("errors:validation.guild_only"));
  }

  const config =
    await getBotVcRecruitRepository().getVcRecruitConfigOrDefault(guildId);

  // ── セットアップ一覧を整形 ──────────────────────────────────────
  let setupsValue: string;
  if (config.setups.length === 0) {
    setupsValue = await tGuild(
      guildId,
      "commands:vc-recruit-config.embed.no_setups",
    );
  } else {
    const lines = await Promise.all(
      config.setups.map(async (s) => {
        const categoryName = s.categoryId
          ? (guild.channels.cache.get(s.categoryId)?.name ?? s.categoryId)
          : await tGuild(guildId, "commands:vc-recruit-config.embed.top");
        return await tGuild(
          guildId,
          "commands:vc-recruit-config.embed.setup_item",
          {
            category: categoryName,
            panel: `<#${s.panelChannelId}>`,
            post: `<#${s.postChannelId}>`,
          },
        );
      }),
    );
    setupsValue = lines.join("\n");
  }

  // ── メンションロール一覧を整形 ──────────────────────────────────
  let rolesValue: string;
  if (config.mentionRoleIds.length === 0) {
    rolesValue = await tGuild(
      guildId,
      "commands:vc-recruit-config.embed.no_roles",
    );
  } else {
    rolesValue = config.mentionRoleIds.map((id) => `• <@&${id}>`).join("\n");
  }

  const fieldSetups = await tGuild(
    guildId,
    "commands:vc-recruit-config.embed.field_setups",
  );
  const fieldRoles = await tGuild(
    guildId,
    "commands:vc-recruit-config.embed.field_roles",
  );
  const viewTitle = await tGuild(
    guildId,
    "commands:vc-recruit-config.embed.view_title",
  );

  const embed = createInfoEmbed("", {
    title: viewTitle,
    fields: [
      { name: fieldSetups, value: setupsValue, inline: false },
      { name: fieldRoles, value: rolesValue, inline: false },
    ],
  });

  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}
