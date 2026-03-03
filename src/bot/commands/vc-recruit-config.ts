// src/bot/commands/vc-recruit-config.ts
// VC募集機能の設定コマンド定義

import {
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { getCommandLocalizations } from "../../shared/locale/commandLocalizations";
import { autocompleteVcRecruitConfigCommand } from "../features/vc-recruit/commands/vcRecruitConfigCommand.autocomplete";
import { VC_RECRUIT_CONFIG_COMMAND } from "../features/vc-recruit/commands/vcRecruitConfigCommand.constants";
import { executeVcRecruitConfigCommand } from "../features/vc-recruit/commands/vcRecruitConfigCommand.execute";
import type { Command } from "../types/discord";

/**
 * VC募集設定コマンド（サーバー管理権限専用）
 * チャンネルセットアップ・ロール管理・設定確認を提供する
 */
export const vcRecruitConfigCommand: Command = {
  data: (() => {
    const cmdDesc = getCommandLocalizations("vc-recruit-config.description");
    const setupDesc = getCommandLocalizations(
      "vc-recruit-config.setup.description",
    );
    const setupCategoryDesc = getCommandLocalizations(
      "vc-recruit-config.setup.category.description",
    );
    const setupThreadArchiveDesc = getCommandLocalizations(
      "vc-recruit-config.setup.thread-archive.description",
    );
    const teardownDesc = getCommandLocalizations(
      "vc-recruit-config.teardown.description",
    );
    const addRoleDesc = getCommandLocalizations(
      "vc-recruit-config.add-role.description",
    );
    const addRoleRoleDesc = getCommandLocalizations(
      "vc-recruit-config.add-role.role.description",
    );
    const removeRoleDesc = getCommandLocalizations(
      "vc-recruit-config.remove-role.description",
    );
    const removeRoleRoleDesc = getCommandLocalizations(
      "vc-recruit-config.remove-role.role.description",
    );
    const viewDesc = getCommandLocalizations(
      "vc-recruit-config.view.description",
    );

    return new SlashCommandBuilder()
      .setName(VC_RECRUIT_CONFIG_COMMAND.NAME)
      .setDescription(cmdDesc.ja)
      .setDescriptionLocalizations(cmdDesc.localizations)
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addSubcommand((subcommand) =>
        subcommand
          .setName(VC_RECRUIT_CONFIG_COMMAND.SUBCOMMAND.SETUP)
          .setDescription(setupDesc.ja)
          .setDescriptionLocalizations(setupDesc.localizations)
          .addStringOption((option) =>
            option
              .setName(VC_RECRUIT_CONFIG_COMMAND.OPTION.CATEGORY)
              .setDescription(setupCategoryDesc.ja)
              .setDescriptionLocalizations(setupCategoryDesc.localizations)
              .setRequired(false)
              .setAutocomplete(true),
          )
          .addStringOption((option) =>
            option
              .setName(VC_RECRUIT_CONFIG_COMMAND.OPTION.THREAD_ARCHIVE)
              .setDescription(setupThreadArchiveDesc.ja)
              .setDescriptionLocalizations(setupThreadArchiveDesc.localizations)
              .setRequired(false)
              .addChoices(...VC_RECRUIT_CONFIG_COMMAND.THREAD_ARCHIVE_CHOICES),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(VC_RECRUIT_CONFIG_COMMAND.SUBCOMMAND.TEARDOWN)
          .setDescription(teardownDesc.ja)
          .setDescriptionLocalizations(teardownDesc.localizations),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(VC_RECRUIT_CONFIG_COMMAND.SUBCOMMAND.ADD_ROLE)
          .setDescription(addRoleDesc.ja)
          .setDescriptionLocalizations(addRoleDesc.localizations)
          .addRoleOption((option) =>
            option
              .setName(VC_RECRUIT_CONFIG_COMMAND.OPTION.ROLE)
              .setDescription(addRoleRoleDesc.ja)
              .setDescriptionLocalizations(addRoleRoleDesc.localizations)
              .setRequired(true),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(VC_RECRUIT_CONFIG_COMMAND.SUBCOMMAND.REMOVE_ROLE)
          .setDescription(removeRoleDesc.ja)
          .setDescriptionLocalizations(removeRoleDesc.localizations)
          .addRoleOption((option) =>
            option
              .setName(VC_RECRUIT_CONFIG_COMMAND.OPTION.ROLE)
              .setDescription(removeRoleRoleDesc.ja)
              .setDescriptionLocalizations(removeRoleRoleDesc.localizations)
              .setRequired(true),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(VC_RECRUIT_CONFIG_COMMAND.SUBCOMMAND.VIEW)
          .setDescription(viewDesc.ja)
          .setDescriptionLocalizations(viewDesc.localizations),
      );
  })(),

  /**
   * vc-recruit-config コマンド実行を features 側へ委譲する
   * @param interaction コマンド実行インタラクション
   */
  async execute(interaction: ChatInputCommandInteraction) {
    await executeVcRecruitConfigCommand(interaction);
  },

  /**
   * vc-recruit-config autocomplete を features 側へ委譲する
   * @param interaction オートコンプリートインタラクション
   */
  async autocomplete(interaction: AutocompleteInteraction) {
    await autocompleteVcRecruitConfigCommand(interaction);
  },

  cooldown: 3,
};

export default vcRecruitConfigCommand;
