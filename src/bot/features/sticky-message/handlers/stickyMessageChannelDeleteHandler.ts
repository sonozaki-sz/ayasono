// src/bot/features/sticky-message/handlers/stickyMessageChannelDeleteHandler.ts
// スティッキーメッセージ channelDelete ハンドラー

import { ChannelType, type Channel } from "discord.js";
import { logPrefixed } from "../../../../shared/locale/localeManager";
import { logger } from "../../../../shared/utils/logger";
import {
  getBotStickyMessageConfigService,
  getBotStickyMessageResendService,
} from "../../../services/botCompositionRoot";

/**
 * channelDelete 時にスティッキーメッセージの DB レコードとタイマーを破棄する
 * テキストチャンネル以外は対象外
 * @param channel 削除されたチャンネル
 */
export async function handleStickyMessageChannelDelete(
  channel: Channel,
): Promise<void> {
  // テキストチャンネル以外はスティッキーメッセージの対象外
  if (channel.type !== ChannelType.GuildText) return;

  const channelId = channel.id;

  // 再送信タイマーが残っていればキャンセルする
  getBotStickyMessageResendService().cancelTimer(channelId);

  // DB にレコードがあれば削除する
  try {
    const deleted =
      await getBotStickyMessageConfigService().deleteByChannel(channelId);
    if (deleted > 0) {
      logger.debug(
        logPrefixed(
          "system:log_prefix.sticky_message",
          "system:sticky-message.channel_delete_cleanup",
          { channelId },
        ),
      );
    }
  } catch (err) {
    logger.error(
      logPrefixed(
        "system:log_prefix.sticky_message",
        "system:sticky-message.channel_delete_cleanup_failed",
        {
          channelId,
        },
      ),
      { channelId, err },
    );
  }
}
