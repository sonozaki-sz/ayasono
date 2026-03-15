// src/bot/features/vc-recruit/commands/usecases/vcRecruitConfigAddRole.ts
// vc-recruit-config add-role のユースケース処理

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  RoleSelectMenuBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { ValidationError } from "../../../../../shared/errors/customErrors";
import { tDefault, tGuild } from "../../../../../shared/locale/localeManager";
import { COMMON_I18N_KEYS } from "../../../../shared/i18nKeys";
import { disableComponentsAfterTimeout } from "../../../../shared/disableComponentsAfterTimeout";
import {
  DISCORD_SELECT_MAX_OPTIONS,
  VC_RECRUIT_ROLE_CUSTOM_ID,
  VC_RECRUIT_TIMEOUT,
} from "../vcRecruitConfigCommand.constants";

/**
 * vc-recruit-config add-role を実行する
 * RoleSelectMenu（複数選択可）をエフェメラルで表示する
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 */
export async function handleVcRecruitConfigAddRole(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  if (!interaction.guild) {
    throw new ValidationError(tDefault(COMMON_I18N_KEYS.GUILD_ONLY));
  }

  const sessionId = interaction.id;

  const roleSelect = new RoleSelectMenuBuilder()
    .setCustomId(
      `${VC_RECRUIT_ROLE_CUSTOM_ID.ADD_ROLE_SELECT_PREFIX}${sessionId}`,
    )
    .setPlaceholder(
      await tGuild(
        guildId,
        "commands:vc-recruit-config.add-role.select.placeholder",
      ),
    )
    .setMinValues(1)
    .setMaxValues(DISCORD_SELECT_MAX_OPTIONS);

  const confirmButton = new ButtonBuilder()
    .setCustomId(
      `${VC_RECRUIT_ROLE_CUSTOM_ID.ADD_ROLE_CONFIRM_PREFIX}${sessionId}`,
    )
    .setLabel(
      await tGuild(
        guildId,
        "commands:vc-recruit-config.add-role.button.confirm",
      ),
    )
    .setStyle(ButtonStyle.Success)
    .setEmoji("✅");

  const cancelButton = new ButtonBuilder()
    .setCustomId(
      `${VC_RECRUIT_ROLE_CUSTOM_ID.ADD_ROLE_CANCEL_PREFIX}${sessionId}`,
    )
    .setLabel(
      await tGuild(
        guildId,
        "commands:vc-recruit-config.add-role.button.cancel",
      ),
    )
    .setStyle(ButtonStyle.Secondary)
    .setEmoji("❌");

  const selectRow = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
    roleSelect,
  );
  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    confirmButton,
    cancelButton,
  );

  await interaction.reply({
    content: await tGuild(
      guildId,
      "commands:vc-recruit-config.add-role.select.title",
    ),
    components: [selectRow, buttonRow],
    flags: MessageFlags.Ephemeral,
  });

  disableComponentsAfterTimeout(
    interaction,
    [selectRow, buttonRow],
    VC_RECRUIT_TIMEOUT.ROLE_SELECT_TIMEOUT_MS,
  );
}
