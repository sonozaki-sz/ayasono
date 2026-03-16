// src/bot/features/vc-recruit/handlers/vcRecruitChannelDeleteHandler.ts
// VC募集 channelDelete ハンドラー

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type Channel,
  type TextChannel,
} from "discord.js";
import { tGuild } from "../../../../shared/locale/localeManager";
import { logger } from "../../../../shared/utils/logger";
import { getBotVcRecruitRepository } from "../../../services/botCompositionRoot";
import { VC_RECRUIT_POST_CUSTOM_ID } from "../commands/vcRecruitConfigCommand.constants";

/**
 * channelDelete 時にVC募集セットアップのチャンネルが削除された場合、
 * ペアのチャンネルも削除し DB のセットアップレコードを除去する。
 * また、createdVoiceChannelIds に含まれるVCが削除された場合、
 * 募集メッセージのボタンを「VC終了済み」状態に更新する。
 * @param channel 削除されたチャンネル
 */
export async function handleVcRecruitChannelDelete(
  channel: Channel,
): Promise<void> {
  if (channel.isDMBased()) return;

  const guildId = channel.guildId;
  const repo = getBotVcRecruitRepository();

  // ── パネルチャンネルとして登録されているか確認 ──────────────────────
  const setupByPanel = await repo.findSetupByPanelChannelId(
    guildId,
    channel.id,
  );
  if (setupByPanel) {
    logger.info(
      `[vc-recruit] パネルチャンネル削除を検知、投稿チャンネルとセットアップを削除します: guildId=${guildId}, panelChannelId=${channel.id}`,
    );
    // 投稿チャンネルを削除
    const postChannel = await channel.guild.channels
      .fetch(setupByPanel.postChannelId)
      .catch(() => null);
    if (postChannel)
      await postChannel.delete().catch((err: unknown) => {
        logger.error(
          `[vc-recruit] 投稿チャンネル削除失敗: guildId=${guildId}, postChannelId=${setupByPanel.postChannelId}`,
          { error: err },
        );
      });
    // DB からセットアップを削除
    await repo.removeSetup(guildId, setupByPanel.panelChannelId);
    return;
  }

  // ── 投稿チャンネルとして登録されているか確認 ──────────────────────
  const setupByPost = await repo.findSetupByPostChannelId(guildId, channel.id);
  if (setupByPost) {
    logger.info(
      `[vc-recruit] 投稿チャンネル削除を検知、パネルチャンネルとセットアップを削除します: guildId=${guildId}, postChannelId=${channel.id}`,
    );
    // パネルチャンネルを削除
    const panelChannel = await channel.guild.channels
      .fetch(setupByPost.panelChannelId)
      .catch(() => null);
    if (panelChannel)
      await panelChannel.delete().catch((err: unknown) => {
        logger.error(
          `[vc-recruit] パネルチャンネル削除失敗: guildId=${guildId}, panelChannelId=${setupByPost.panelChannelId}`,
          { error: err },
        );
      });
    // DB からセットアップを削除
    await repo.removeSetup(guildId, setupByPost.panelChannelId);
    return;
  }

  // ── createdVoiceChannelIds に含まれるVCが削除されたか確認 ──────────
  const setupByCreatedVc = await repo.findSetupByCreatedVcId(
    guildId,
    channel.id,
  );
  if (setupByCreatedVc) {
    logger.info(
      `[vc-recruit] 作成VC手動削除を検知、DBを更新し投稿ボタンをVC終了済みに変更します: guildId=${guildId}, vcId=${channel.id}`,
    );

    // DB から該当VCのIDを削除
    await repo.removeCreatedVoiceChannelId(guildId, channel.id);

    // 募集一覧チャンネルをスキャンし、該当VCのIDを含むボタンを持つメッセージを探す
    await updatePostButtonsForDeletedVc(
      channel.guild,
      setupByCreatedVc.postChannelId,
      channel.id,
      guildId,
    );
  }
}

/**
 * 削除されたVCに紐づく募集メッセージのボタンを「VC終了済み」状態に更新する
 * @param guild ギルドオブジェクト
 * @param postChannelId 募集一覧チャンネルID
 * @param voiceChannelId 削除されたVCのチャンネルID
 * @param guildId ギルドID
 */
async function updatePostButtonsForDeletedVc(
  guild: { channels: { fetch: (id: string) => Promise<Channel | null> } },
  postChannelId: string,
  voiceChannelId: string,
  guildId: string,
): Promise<void> {
  const postChannel = (await guild.channels
    .fetch(postChannelId)
    .catch(() => null)) as TextChannel | null;
  if (!postChannel) return;

  // 直近のメッセージを取得して該当するカスタムIDを探す
  const messages = await postChannel.messages
    .fetch({ limit: 100 })
    .catch(() => null);
  if (!messages) return;

  for (const msg of messages.values()) {
    // ボタンのカスタムIDに該当VCのIDが含まれるか確認
    let hasTargetVc = false;
    let resolvedDeleteId: string | undefined;

    for (const row of msg.components) {
      if (!("components" in row)) continue;
      for (const c of row.components) {
        if ("customId" in c && c.customId?.endsWith(`:${voiceChannelId}`)) {
          hasTargetVc = true;
        }
        if (
          "customId" in c &&
          c.customId?.startsWith(VC_RECRUIT_POST_CUSTOM_ID.DELETE_POST_PREFIX)
        ) {
          resolvedDeleteId = c.customId;
        }
      }
    }

    if (!hasTargetVc) continue;

    // ボタンを「募集終了済み」状態に更新
    const endedLabel = await tGuild(
      guildId,
      "commands:vcRecruit.button.vc_ended",
    );
    const deleteLabel = await tGuild(
      guildId,
      "commands:vcRecruit.button.delete_post",
    );
    const endedTitle = await tGuild(
      guildId,
      "commands:vcRecruit.embed.title_ended",
    );

    // embedのタイトルを「募集終了」に更新
    const updatedEmbeds = msg.embeds.map((embed: unknown) =>
      EmbedBuilder.from(
        embed as Parameters<typeof EmbedBuilder.from>[0],
      ).setTitle(endedTitle),
    );

    const endedButton = new ButtonBuilder()
      .setCustomId("vc-recruit:ended-placeholder")
      .setLabel(endedLabel)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true);

    const deleteButton = new ButtonBuilder()
      .setCustomId(resolvedDeleteId ?? "vc-recruit:delete-fallback")
      .setLabel(deleteLabel)
      .setStyle(ButtonStyle.Danger);

    await msg
      .edit({
        embeds: updatedEmbeds,
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            endedButton,
            deleteButton,
          ),
        ],
      })
      .catch(() => null);
  }
}
