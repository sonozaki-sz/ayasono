// src/bot/features/vac/commands/presenters/vacConfigViewPresenter.ts
// vac-config view 用の表示整形

import { ChannelType, type Guild } from "discord.js";
import type { VacConfig } from "../../../../../shared/database/types";
import { tInteraction } from "../../../../../shared/locale/localeManager";

export interface VacConfigViewPresentation {
  title: string;
  fieldTrigger: string;
  triggerChannels: string;
  fieldCreatedDetails: string;
  createdVcDetails: string;
}

/**
 * vac-config view の表示内容を整形する
 */
export async function presentVacConfigView(
  guild: Guild,
  locale: string,
  config: VacConfig,
): Promise<VacConfigViewPresentation> {
  const topLabel = tInteraction(locale, "commands:vac-config.embed.top");

  const triggerChannels =
    config.triggerChannelIds.length > 0
      ? (
          await Promise.all(
            config.triggerChannelIds.map(async (id) => {
              const channel = await guild.channels.fetch(id).catch(() => null);
              const categoryLabel =
                channel?.parent?.type === ChannelType.GuildCategory
                  ? channel.parent.name
                  : topLabel;
              return `<#${id}> (${categoryLabel})`;
            }),
          )
        ).join("\n")
      : tInteraction(locale, "commands:vac-config.embed.not_configured");

  const createdVcDetails =
    config.createdChannels.length > 0
      ? config.createdChannels
          .map((item) => `<#${item.voiceChannelId}>(<@${item.ownerId}>)`)
          .join("\n")
      : tInteraction(locale, "commands:vac-config.embed.no_created_vcs");

  const title = tInteraction(locale, "commands:vac-config.embed.title");
  const fieldTrigger = tInteraction(
    locale,
    "commands:vac-config.embed.field.trigger_channels",
  );
  const fieldCreatedDetails = tInteraction(
    locale,
    "commands:vac-config.embed.field.created_vc_details",
  );

  return {
    title,
    fieldTrigger,
    triggerChannels,
    fieldCreatedDetails,
    createdVcDetails,
  };
}
