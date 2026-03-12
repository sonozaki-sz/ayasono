// src/bot/features/vc-recruit/handlers/ui/vcRecruitModal.ts
// VC募集モーダル送信処理（ステップ2 → VC作成・募集投稿）

import {
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  type GuildMember,
  type ModalSubmitInteraction,
  type TextChannel,
  type VoiceChannel,
} from "discord.js";
import { tGuild } from "../../../../../shared/locale/localeManager";
import type { ModalHandler } from "../../../../handlers/interactionCreate/ui/types";
import { getBotVcRecruitRepository } from "../../../../services/botVcRecruitDependencyResolver";
import { safeReply } from "../../../../utils/interaction";
import {
  createErrorEmbed,
  createWarningEmbed,
} from "../../../../utils/messageResponse";
import { sendVcControlPanel } from "../../../vc-panel/vcControlPanel";
import {
  VC_RECRUIT_CONFIG_COMMAND,
  VC_RECRUIT_PANEL_CUSTOM_ID,
} from "../../commands/vcRecruitConfigCommand.constants";
import {
  NEW_VC_VALUE,
  NO_MENTION_VALUE,
  deleteVcRecruitSession,
  getVcRecruitSession,
} from "./vcRecruitPanelState";

export const vcRecruitModalHandler: ModalHandler = {
  matches(customId) {
    return customId.startsWith(VC_RECRUIT_PANEL_CUSTOM_ID.MODAL_PREFIX);
  },

  async execute(interaction: ModalSubmitInteraction) {
    const guild = interaction.guild;
    if (!guild) return;

    const sessionId = interaction.customId.slice(
      VC_RECRUIT_PANEL_CUSTOM_ID.MODAL_PREFIX.length,
    );

    // セッションを取得
    const session = getVcRecruitSession(sessionId);
    if (!session) {
      await safeReply(interaction, {
        embeds: [
          createErrorEmbed(
            await tGuild(guild.id, "errors:interaction.timeout"),
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // モーダル入力値を取得
    const content = interaction.fields.getTextInputValue("vc-recruit:content");
    const vcName =
      session.selectedVcId === NEW_VC_VALUE
        ? interaction.fields.getTextInputValue("vc-recruit:vc-name")
        : "";

    const repo = getBotVcRecruitRepository();

    // セットアップ情報を取得
    const setup = await repo.findSetupByPanelChannelId(
      guild.id,
      session.panelChannelId,
    );
    if (!setup) {
      await safeReply(interaction, {
        embeds: [
          createErrorEmbed(
            await tGuild(guild.id, "errors:vcRecruit.not_setup"),
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const member = (await guild.members
      .fetch(interaction.user.id)
      .catch(() => null)) as GuildMember | null;

    let voiceChannel: VoiceChannel;

    if (session.selectedVcId === NEW_VC_VALUE) {
      // カテゴリー上限チェック
      if (setup.categoryId) {
        const cat = await guild.channels
          .fetch(setup.categoryId)
          .catch(() => null);
        if (
          cat?.type === ChannelType.GuildCategory &&
          cat.children.cache.size >=
            VC_RECRUIT_CONFIG_COMMAND.CATEGORY_CHANNEL_LIMIT
        ) {
          await interaction.editReply({
            embeds: [
              createErrorEmbed(
                await tGuild(guild.id, "errors:vcRecruit.category_full"),
              ),
            ],
          });
          deleteVcRecruitSession(sessionId);
          return;
        }
      }

      // 新規VC作成
      const channelName =
        vcName.trim() ||
        `${member?.displayName ?? interaction.user.displayName}'s Room`;

      voiceChannel = (await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        parent: setup.categoryId ?? undefined,
      })) as VoiceChannel;

      // DB に追加
      await repo.addCreatedVoiceChannelId(
        guild.id,
        setup.panelChannelId,
        voiceChannel.id,
      );

      // VC操作パネルを新規VCに送信
      await sendVcControlPanel(voiceChannel);
    } else {
      // 既存VC
      const existing = await guild.channels
        .fetch(session.selectedVcId)
        .catch(() => null);
      if (!existing || existing.type !== ChannelType.GuildVoice) {
        await interaction.editReply({
          embeds: [
            createErrorEmbed(
              await tGuild(guild.id, "errors:vcRecruit.vc_deleted"),
            ),
          ],
        });
        deleteVcRecruitSession(sessionId);
        return;
      }
      voiceChannel = existing as VoiceChannel;
    }

    // 投稿チャンネルに募集メッセージを送信
    const postChannel = (await guild.channels
      .fetch(setup.postChannelId)
      .catch(() => null)) as TextChannel | null;

    if (postChannel && postChannel.isSendable()) {
      const mentionText =
        session.mentionRoleId && session.mentionRoleId !== NO_MENTION_VALUE
          ? `<@&${session.mentionRoleId}>`
          : "";

      const embedTitle = await tGuild(
        guild.id,
        "commands:vcRecruit.embed.title",
      );
      const fieldContent = await tGuild(
        guild.id,
        "commands:vcRecruit.embed.field_content",
      );
      const fieldVc = await tGuild(
        guild.id,
        "commands:vcRecruit.embed.field_vc",
      );
      const fieldRecruiter = await tGuild(
        guild.id,
        "commands:vcRecruit.embed.field_recruiter",
      );

      const recruitEmbed = new EmbedBuilder()
        .setTitle(embedTitle)
        .addFields(
          { name: fieldContent, value: content },
          { name: fieldVc, value: `<#${voiceChannel.id}>` },
          {
            name: fieldRecruiter,
            value: `<@${interaction.user.id}>`,
          },
        )
        .setColor(0x5865f2)
        .setTimestamp();

      const message = await postChannel.send({
        content: mentionText || undefined,
        embeds: [recruitEmbed],
      });

      // スレッドを作成
      const threadName = await tGuild(
        guild.id,
        "commands:vcRecruit.thread_name",
        { recruiter: member?.displayName ?? interaction.user.displayName },
      );
      await message
        .startThread({
          name: threadName,
          autoArchiveDuration: setup.threadArchiveDuration,
          reason: "vc-recruit自動スレッド",
        })
        .catch(() => null);
    }

    // 投稿者をVCへ移動
    let vcMoveFailed = false;
    if (member && member.voice.channel) {
      await member.voice.setChannel(voiceChannel).catch(() => {
        vcMoveFailed = true;
      });
    } else {
      vcMoveFailed = true;
    }

    // セッションを削除
    deleteVcRecruitSession(sessionId);

    // エフェメラルメッセージで完了通知
    if (vcMoveFailed) {
      await interaction
        .editReply({
          embeds: [
            createWarningEmbed(
              await tGuild(
                guild.id,
                "commands:vcRecruit.embed.not_in_vc_skipped",
              ),
            ),
          ],
        })
        .catch(() => null);
    } else {
      await interaction.deleteReply().catch(() => null);
    }
  },
};
