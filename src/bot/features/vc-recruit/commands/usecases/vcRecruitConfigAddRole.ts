// src/bot/features/vc-recruit/commands/usecases/vcRecruitConfigAddRole.ts
// vc-recruit-config add-role のユースケース処理

import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { ValidationError } from "../../../../../shared/errors/customErrors";
import { tDefault, tGuild } from "../../../../../shared/locale/localeManager";
import { getBotVcRecruitRepository } from "../../../../services/botVcRecruitDependencyResolver";
import { createSuccessEmbed } from "../../../../utils/messageResponse";
import { VC_RECRUIT_CONFIG_COMMAND } from "../vcRecruitConfigCommand.constants";

/**
 * vc-recruit-config add-role を実行する
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 */
export async function handleVcRecruitConfigAddRole(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  if (!interaction.guild) {
    throw new ValidationError(tDefault("errors:validation.guild_only"));
  }

  const role = interaction.options.getRole(
    VC_RECRUIT_CONFIG_COMMAND.OPTION.ROLE,
    true,
  );

  const result = await getBotVcRecruitRepository().addMentionRoleId(
    guildId,
    role.id,
  );

  if (result === "already_exists") {
    throw new ValidationError(
      await tGuild(guildId, "errors:vcRecruit.role_already_added", {
        role: `<@&${role.id}>`,
      }),
    );
  }

  if (result === "limit_exceeded") {
    throw new ValidationError(
      await tGuild(guildId, "errors:vcRecruit.role_limit_exceeded"),
    );
  }

  const embed = createSuccessEmbed(
    await tGuild(guildId, "commands:vc-recruit-config.embed.add_role_success", {
      role: `<@&${role.id}>`,
    }),
    {
      title: await tGuild(
        guildId,
        "commands:vc-recruit-config.embed.success_title",
      ),
    },
  );

  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}
