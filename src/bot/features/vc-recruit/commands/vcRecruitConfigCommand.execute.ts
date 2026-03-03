// src/bot/features/vc-recruit/commands/vcRecruitConfigCommand.execute.ts
// VC募集設定コマンド実行処理

import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { ValidationError } from "../../../../shared/errors/customErrors";
import { tDefault } from "../../../../shared/locale/localeManager";
import { handleCommandError } from "../../../errors/interactionErrorHandler";
import { handleVcRecruitConfigAddRole } from "./usecases/vcRecruitConfigAddRole";
import { handleVcRecruitConfigRemoveRole } from "./usecases/vcRecruitConfigRemoveRole";
import { handleVcRecruitConfigSetup } from "./usecases/vcRecruitConfigSetup";
import { handleVcRecruitConfigTeardown } from "./usecases/vcRecruitConfigTeardown";
import { handleVcRecruitConfigView } from "./usecases/vcRecruitConfigView";
import { VC_RECRUIT_CONFIG_COMMAND } from "./vcRecruitConfigCommand.constants";

/**
 * vc-recruit-config コマンド実行入口
 * @param interaction コマンド実行インタラクション
 */
export async function executeVcRecruitConfigCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  try {
    const guildId = interaction.guildId;
    if (!guildId) {
      throw new ValidationError(tDefault("errors:validation.guild_only"));
    }

    ensureManageGuildPermission(interaction);

    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case VC_RECRUIT_CONFIG_COMMAND.SUBCOMMAND.SETUP:
        await handleVcRecruitConfigSetup(interaction, guildId);
        break;
      case VC_RECRUIT_CONFIG_COMMAND.SUBCOMMAND.TEARDOWN:
        await handleVcRecruitConfigTeardown(interaction, guildId);
        break;
      case VC_RECRUIT_CONFIG_COMMAND.SUBCOMMAND.ADD_ROLE:
        await handleVcRecruitConfigAddRole(interaction, guildId);
        break;
      case VC_RECRUIT_CONFIG_COMMAND.SUBCOMMAND.REMOVE_ROLE:
        await handleVcRecruitConfigRemoveRole(interaction, guildId);
        break;
      case VC_RECRUIT_CONFIG_COMMAND.SUBCOMMAND.VIEW:
        await handleVcRecruitConfigView(interaction, guildId);
        break;
      default:
        throw new ValidationError(
          tDefault("errors:validation.invalid_subcommand"),
        );
    }
  } catch (error) {
    await handleCommandError(interaction, error);
  }
}

/**
 * 実行ユーザーがサーバー管理権限を持つか検証する
 */
function ensureManageGuildPermission(
  interaction: ChatInputCommandInteraction,
): void {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    throw new ValidationError(
      tDefault("errors:permission.manage_guild_required"),
    );
  }
}
