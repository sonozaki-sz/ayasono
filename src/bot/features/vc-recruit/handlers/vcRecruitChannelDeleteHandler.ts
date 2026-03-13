// src/bot/features/vc-recruit/handlers/vcRecruitChannelDeleteHandler.ts
// VC募集 channelDelete ハンドラー

import type { Channel } from "discord.js";
import { logger } from "../../../../shared/utils/logger";
import { getBotVcRecruitRepository } from "../../../services/botCompositionRoot";

/**
 * channelDelete 時にVC募集セットアップのチャンネルが削除された場合、
 * ペアのチャンネルも削除し DB のセットアップレコードを除去する
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
}
