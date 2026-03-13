// src/bot/features/vc-recruit/commands/usecases/vcRecruitConfigRemoveRole.ts
// vc-recruit-config remove-role のユースケース処理

import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { ValidationError } from "../../../../../shared/errors/customErrors";
import { tDefault, tGuild } from "../../../../../shared/locale/localeManager";
import { COMMON_I18N_KEYS } from "../../../../shared/i18nKeys";
import { getBotVcRecruitRepository } from "../../../../services/botCompositionRoot";
import { createSuccessEmbed } from "../../../../utils/messageResponse";
import { VC_RECRUIT_CONFIG_COMMAND } from "../vcRecruitConfigCommand.constants";
import { VC_RECRUIT_MENTION_ROLE_REMOVE_RESULT } from "../../../../../shared/database/types";

/**
 * vc-recruit-config remove-role を実行する
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 */
export async function handleVcRecruitConfigRemoveRole(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  if (!interaction.guild) {
    throw new ValidationError(tDefault(COMMON_I18N_KEYS.GUILD_ONLY));
  }

  const role = interaction.options.getRole(
    VC_RECRUIT_CONFIG_COMMAND.OPTION.ROLE,
    true,
  );

  const result = await getBotVcRecruitRepository().removeMentionRoleId(
    guildId,
    role.id,
  );

  if (result === VC_RECRUIT_MENTION_ROLE_REMOVE_RESULT.NOT_FOUND) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vcRecruit.role_not_found", {
        role: `<@&${role.id}>`,
      }),
    );
  }

  const embed = createSuccessEmbed(
    await tGuild(
      guildId,
      "commands:vc-recruit-config.embed.remove_role_success",
      { role: `<@&${role.id}>` },
    ),
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
