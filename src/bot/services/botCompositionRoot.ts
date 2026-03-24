// src/bot/services/botCompositionRoot.ts
// Bot層の依存解決を集約する Composition Root

import type { PrismaClient } from "@prisma/client";
import type { IGuildConfigRepository } from "../../shared/database/types";
import { getGuildConfigRepository } from "../../shared/database/guildConfigRepositoryProvider";
import type { BumpReminderConfigService } from "../../shared/features/bump-reminder/bumpReminderConfigService";
import { createGuildConfigService } from "../../shared/features/guild-config/guildConfigService";
import type { GuildConfigService } from "../../shared/features/guild-config/guildConfigService";
import { createMemberLogConfigService } from "../../shared/features/member-log/memberLogConfigService";
import type { MemberLogConfigService } from "../../shared/features/member-log/memberLogConfigService";
import { createStickyMessageConfigService } from "../../shared/features/sticky-message/stickyMessageConfigService";
import type { StickyMessageConfigService } from "../../shared/features/sticky-message/stickyMessageConfigService";
import { getVacConfigService } from "../../shared/features/vac/vacConfigService";
import type { VacConfigService } from "../../shared/features/vac/vacConfigService";
import { createVcRecruitConfigService } from "../../shared/features/vc-recruit/vcRecruitConfigService";
import { localeManager } from "../../shared/locale/localeManager";
import { createBotServiceAccessor } from "../../shared/utils/serviceFactory";
import { getBumpReminderRepository } from "../features/bump-reminder/repositories/bumpReminderRepository";
import type { IBumpReminderRepository as BumpReminderRepositoryType } from "../features/bump-reminder/repositories/types";
import { getBumpReminderFeatureConfigService } from "../features/bump-reminder/services/bumpReminderConfigServiceResolver";
import { getBumpReminderManager } from "../features/bump-reminder/services/bumpReminderService";
import type { BumpReminderManager } from "../features/bump-reminder/services/bumpReminderService";
import { getStickyMessageRepository } from "../features/sticky-message/repositories/stickyMessageRepository";
import { getStickyMessageResendService } from "../features/sticky-message/services/stickyMessageResendService";
import type { StickyMessageResendService } from "../features/sticky-message/services/stickyMessageResendService";
import { getVacService } from "../features/vac/services/vacService";
import type { VacService } from "../features/vac/services/vacService";
import { registerVcPanelOwnershipChecker } from "../features/vc-panel/vcPanelOwnershipRegistry";
import { createVcRecruitRepository } from "../features/vc-recruit/repositories/vcRecruitRepository";
import type { IVcRecruitRepository } from "../features/vc-recruit/repositories/vcRecruitRepository";

// ---------------------------------------------------------------------------
// BotServices interface
// ---------------------------------------------------------------------------

export interface BotServices {
  guildConfigRepository: IGuildConfigRepository;
  guildConfigService: GuildConfigService;
  bumpReminderConfigService: BumpReminderConfigService;
  bumpReminderRepository: BumpReminderRepositoryType;
  bumpReminderManager: BumpReminderManager;
  vacConfigService: VacConfigService;
  vacService: VacService;
  stickyMessageConfigService: StickyMessageConfigService;
  stickyMessageResendService: StickyMessageResendService;
  memberLogConfigService: MemberLogConfigService;
  vcRecruitRepository: IVcRecruitRepository;
}

// ---------------------------------------------------------------------------
// Module-level singletons
// ---------------------------------------------------------------------------

const _guildConfigRepositoryAccessor =
  createBotServiceAccessor<IGuildConfigRepository>("GuildConfigRepository");
export const getBotGuildConfigRepository: () => IGuildConfigRepository =
  _guildConfigRepositoryAccessor[0];
export const setBotGuildConfigRepository: (
  value: IGuildConfigRepository,
) => void = _guildConfigRepositoryAccessor[1];

const _guildConfigServiceAccessor =
  createBotServiceAccessor<GuildConfigService>("GuildConfigService");
export const getBotGuildConfigService: () => GuildConfigService =
  _guildConfigServiceAccessor[0];
export const setBotGuildConfigService: (value: GuildConfigService) => void =
  _guildConfigServiceAccessor[1];

const _bumpReminderConfigServiceAccessor =
  createBotServiceAccessor<BumpReminderConfigService>(
    "BumpReminderConfigService",
  );
export const getBotBumpReminderConfigService: () => BumpReminderConfigService =
  _bumpReminderConfigServiceAccessor[0];
export const setBotBumpReminderConfigService: (
  value: BumpReminderConfigService,
) => void = _bumpReminderConfigServiceAccessor[1];

const _bumpReminderRepositoryAccessor =
  createBotServiceAccessor<BumpReminderRepositoryType>(
    "BumpReminderRepository",
  );
export const getBotBumpReminderRepository: () => BumpReminderRepositoryType =
  _bumpReminderRepositoryAccessor[0];
export const setBotBumpReminderRepository: (
  value: BumpReminderRepositoryType,
) => void = _bumpReminderRepositoryAccessor[1];

const _bumpReminderManagerAccessor =
  createBotServiceAccessor<BumpReminderManager>("BumpReminderManager");
export const getBotBumpReminderManager: () => BumpReminderManager =
  _bumpReminderManagerAccessor[0];
export const setBotBumpReminderManager: (value: BumpReminderManager) => void =
  _bumpReminderManagerAccessor[1];

const _vacConfigServiceAccessor =
  createBotServiceAccessor<VacConfigService>("VacConfigService");
export const getBotVacConfigService: () => VacConfigService =
  _vacConfigServiceAccessor[0];
export const setBotVacConfigService: (value: VacConfigService) => void =
  _vacConfigServiceAccessor[1];

const _vacServiceAccessor = createBotServiceAccessor<VacService>("VacService");
export const getBotVacService: () => VacService = _vacServiceAccessor[0];
export const setBotVacService: (value: VacService) => void =
  _vacServiceAccessor[1];

const _stickyMessageConfigServiceAccessor =
  createBotServiceAccessor<StickyMessageConfigService>(
    "StickyMessageConfigService",
  );
export const getBotStickyMessageConfigService: () => StickyMessageConfigService =
  _stickyMessageConfigServiceAccessor[0];
export const setBotStickyMessageConfigService: (
  value: StickyMessageConfigService,
) => void = _stickyMessageConfigServiceAccessor[1];

const _stickyMessageResendServiceAccessor =
  createBotServiceAccessor<StickyMessageResendService>(
    "StickyMessageResendService",
  );
export const getBotStickyMessageResendService: () => StickyMessageResendService =
  _stickyMessageResendServiceAccessor[0];
export const setBotStickyMessageResendService: (
  value: StickyMessageResendService,
) => void = _stickyMessageResendServiceAccessor[1];

const _memberLogConfigServiceAccessor =
  createBotServiceAccessor<MemberLogConfigService>("MemberLogConfigService");
export const getBotMemberLogConfigService: () => MemberLogConfigService =
  _memberLogConfigServiceAccessor[0];
export const setBotMemberLogConfigService: (
  value: MemberLogConfigService,
) => void = _memberLogConfigServiceAccessor[1];

const _vcRecruitRepositoryAccessor =
  createBotServiceAccessor<IVcRecruitRepository>("VcRecruitRepository");
export const getBotVcRecruitRepository: () => IVcRecruitRepository =
  _vcRecruitRepositoryAccessor[0];
export const setBotVcRecruitRepository: (value: IVcRecruitRepository) => void =
  _vcRecruitRepositoryAccessor[1];

/** getBotVcRecruitRepository のエイリアス（config 操作用途で意図を明示する） */
export const getBotVcRecruitConfigService: () => IVcRecruitRepository =
  _vcRecruitRepositoryAccessor[0];

// ---------------------------------------------------------------------------
// Composition Root initializer
// ---------------------------------------------------------------------------

/**
 * Botで利用する主要依存を起動時に初期化する
 */
export function initializeBotCompositionRoot(
  prisma: PrismaClient,
): BotServices {
  const guildConfigRepository = getGuildConfigRepository(prisma);
  setBotGuildConfigRepository(guildConfigRepository);
  localeManager.setRepository(guildConfigRepository);

  // GuildConfig
  const guildConfigService = createGuildConfigService(guildConfigRepository);
  setBotGuildConfigService(guildConfigService);

  // BumpReminder
  const bumpReminderConfigService = getBumpReminderFeatureConfigService(
    guildConfigRepository,
  );
  const bumpReminderRepository = getBumpReminderRepository(prisma);
  const bumpReminderManager = getBumpReminderManager(bumpReminderRepository);
  setBotBumpReminderConfigService(bumpReminderConfigService);
  setBotBumpReminderRepository(bumpReminderRepository);
  setBotBumpReminderManager(bumpReminderManager);

  // VAC
  const vacConfigService = getVacConfigService(guildConfigRepository);
  const vacService = getVacService(vacConfigService);
  setBotVacConfigService(vacConfigService);
  setBotVacService(vacService);

  // StickyMessage
  const stickyMessageRepository = getStickyMessageRepository(prisma);
  const stickyMessageConfigService = createStickyMessageConfigService(
    stickyMessageRepository,
  );
  const stickyMessageResendService = getStickyMessageResendService(
    stickyMessageRepository,
  );
  setBotStickyMessageConfigService(stickyMessageConfigService);
  setBotStickyMessageResendService(stickyMessageResendService);

  // MemberLog
  const memberLogConfigService = createMemberLogConfigService(
    guildConfigRepository,
  );
  setBotMemberLogConfigService(memberLogConfigService);

  // VcRecruit
  const vcRecruitConfigService = createVcRecruitConfigService(
    guildConfigRepository,
  );
  const vcRecruitRepository = createVcRecruitRepository(vcRecruitConfigService);
  setBotVcRecruitRepository(vcRecruitRepository);

  // VC操作パネルの所有権チェッカーを登録（VAC・VC募集）
  registerVcPanelOwnershipChecker({
    isManagedVcPanelChannel: (guildId, channelId) =>
      getBotVacConfigService().isManagedVacChannel(guildId, channelId),
  });
  registerVcPanelOwnershipChecker({
    isManagedVcPanelChannel: (guildId, channelId) =>
      getBotVcRecruitRepository().isCreatedVcRecruitChannel(guildId, channelId),
  });

  return {
    guildConfigRepository,
    guildConfigService,
    bumpReminderConfigService,
    bumpReminderRepository,
    bumpReminderManager,
    vacConfigService,
    vacService,
    stickyMessageConfigService,
    stickyMessageResendService,
    memberLogConfigService,
    vcRecruitRepository,
  };
}
