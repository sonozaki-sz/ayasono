// src/bot/features/vc-recruit/commands/usecases/vcRecruitConfigTeardown.ts
// vc-recruit-config teardown のユースケース処理（ステップ1: セレクトメニュー表示）

import {
  ActionRowBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  type ChatInputCommandInteraction,
  type Guild,
} from "discord.js";
import type { VcRecruitSetup } from "../../../../../shared/database/types";
import { ValidationError } from "../../../../../shared/errors/customErrors";
import { tDefault, tGuild } from "../../../../../shared/locale/localeManager";
import { COMMON_I18N_KEYS } from "../../../../shared/i18nKeys";
import { getBotVcRecruitRepository } from "../../../../services/botCompositionRoot";
import { VC_RECRUIT_TEARDOWN_CUSTOM_ID } from "../vcRecruitConfigCommand.constants";

/**
 * teardown セレクトメニューのオプション一覧を構築する（コマンド初回表示・やり直し共用）
 */
export async function buildTeardownSelectOptions(
  guild: Guild,
  guildId: string,
  setups: VcRecruitSetup[],
): Promise<StringSelectMenuOptionBuilder[]> {
  return Promise.all(
    setups.map(async (setup) => {
      let label: string;
      if (setup.categoryId === null) {
        label = await tGuild(
          guildId,
          "commands:vc-recruit-config.teardown.select.top",
        );
      } else {
        const cat = guild.channels.cache.get(setup.categoryId);
        if (cat) {
          label = cat.name;
        } else {
          label = await tGuild(
            guildId,
            "commands:vc-recruit-config.teardown.select.unknown_category",
            { id: setup.categoryId },
          );
        }
      }
      return new StringSelectMenuOptionBuilder()
        .setValue(setup.panelChannelId)
        .setLabel(label);
    }),
  );
}

/**
 * vc-recruit-config teardown を実行する（ステップ1: セレクトメニュー表示）
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 */
export async function handleVcRecruitConfigTeardown(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  const guild = interaction.guild;
  if (!guild) {
    throw new ValidationError(tDefault(COMMON_I18N_KEYS.GUILD_ONLY));
  }

  const repo = getBotVcRecruitRepository();
  const config = await repo.getVcRecruitConfigOrDefault(guildId);

  if (config.setups.length === 0) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vcRecruit.not_setup"),
    );
  }

  // セットアップごとのセレクトオプションを構築
  const options = await buildTeardownSelectOptions(
    guild,
    guildId,
    config.setups,
  );

  const placeholder = await tGuild(
    guildId,
    "commands:vc-recruit-config.teardown.select.placeholder",
  );

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(
      `${VC_RECRUIT_TEARDOWN_CUSTOM_ID.SELECT_PREFIX}${interaction.id}`,
    )
    .setPlaceholder(placeholder)
    .setMinValues(1)
    .setMaxValues(Math.min(config.setups.length, 25))
    .addOptions(options);

  await interaction.reply({
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu),
    ],
    flags: MessageFlags.Ephemeral,
  });

  // 60秒後にセレクトメニューを無効化
  setTimeout(async () => {
    const disabledMenu = StringSelectMenuBuilder.from(
      selectMenu.toJSON(),
    ).setDisabled(true);
    await interaction
      .editReply({
        components: [
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            disabledMenu,
          ),
        ],
      })
      .catch(() => null);
  }, 60_000);
}
