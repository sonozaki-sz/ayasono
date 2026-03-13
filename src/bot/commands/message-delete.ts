// src/bot/commands/message-delete.ts
// /message-delete コマンド定義

import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getCommandLocalizations } from "../../shared/locale/commandLocalizations";
import { handleCommandError } from "../errors/interactionErrorHandler";
import { executeMessageDeleteCommand } from "../features/message-delete/commands/messageDeleteCommand.execute";
import { MSG_DEL_COMMAND } from "../features/message-delete/constants/messageDeleteConstants";
import type { Command } from "../types/discord";

/**
 * /message-delete コマンド
 * サーバー内のメッセージを一括削除する（MANAGE_MESSAGES 権限必須）
 */
export const messageDeleteCommand: Command = {
  data: (() => {
    const desc = getCommandLocalizations("message-delete.description");
    const countDesc = getCommandLocalizations(
      "message-delete.count.description",
    );
    const userDesc = getCommandLocalizations("message-delete.user.description");
    const keywordDesc = getCommandLocalizations(
      "message-delete.keyword.description",
    );
    const daysDesc = getCommandLocalizations("message-delete.days.description");
    const afterDesc = getCommandLocalizations(
      "message-delete.after.description",
    );
    const beforeDesc = getCommandLocalizations(
      "message-delete.before.description",
    );
    const channelDesc = getCommandLocalizations(
      "message-delete.channel.description",
    );

    return new SlashCommandBuilder()
      .setName(MSG_DEL_COMMAND.NAME)
      .setDescription(desc.ja)
      .setDescriptionLocalizations(desc.localizations)
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addIntegerOption((opt) =>
        opt
          .setName(MSG_DEL_COMMAND.OPTION.COUNT)
          .setDescription(countDesc.ja)
          .setDescriptionLocalizations(countDesc.localizations)
          .setRequired(false)
          .setMinValue(1)
          .setMaxValue(1000),
      )
      .addStringOption((opt) =>
        opt
          .setName(MSG_DEL_COMMAND.OPTION.USER)
          .setDescription(userDesc.ja)
          .setDescriptionLocalizations(userDesc.localizations)
          .setRequired(false),
      )
      .addStringOption((opt) =>
        opt
          .setName(MSG_DEL_COMMAND.OPTION.KEYWORD)
          .setDescription(keywordDesc.ja)
          .setDescriptionLocalizations(keywordDesc.localizations)
          .setRequired(false),
      )
      .addIntegerOption((opt) =>
        opt
          .setName(MSG_DEL_COMMAND.OPTION.DAYS)
          .setDescription(daysDesc.ja)
          .setDescriptionLocalizations(daysDesc.localizations)
          .setRequired(false)
          .setMinValue(1)
          .setMaxValue(366),
      )
      .addStringOption((opt) =>
        opt
          .setName(MSG_DEL_COMMAND.OPTION.AFTER)
          .setDescription(afterDesc.ja)
          .setDescriptionLocalizations(afterDesc.localizations)
          .setRequired(false),
      )
      .addStringOption((opt) =>
        opt
          .setName(MSG_DEL_COMMAND.OPTION.BEFORE)
          .setDescription(beforeDesc.ja)
          .setDescriptionLocalizations(beforeDesc.localizations)
          .setRequired(false),
      )
      .addChannelOption((opt) =>
        opt
          .setName(MSG_DEL_COMMAND.OPTION.CHANNEL)
          .setDescription(channelDesc.ja)
          .setDescriptionLocalizations(channelDesc.localizations)
          .setRequired(false),
      );
  })(),

  async execute(interaction) {
    try {
      await executeMessageDeleteCommand(interaction);
    } catch (error) {
      await handleCommandError(interaction, error);
    }
  },

  cooldown: 5,
};
