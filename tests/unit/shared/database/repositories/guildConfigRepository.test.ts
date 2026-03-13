// tests/unit/shared/database/repositories/guildConfigRepository.test.ts
// PrismaGuildConfigRepository が core usecases・各機能リポジトリへ正しく委譲し、エラー変換も行うことを検証
describe("shared/database/repositories/guildConfigRepository", () => {
  // vi.resetModules() + vi.doMock() を使って各テストに新鮮なモジュールを提供し、
  // ESM キャッシュによるモック汚染を防ぐ
  const loadModule = async () => {
    vi.resetModules();

    const coreUsecases = {
      getGuildConfigUsecase: vi.fn(),
      saveGuildConfigUsecase: vi.fn(),
      updateGuildConfigUsecase: vi.fn(),
      deleteGuildConfigUsecase: vi.fn(),
      existsGuildConfigUsecase: vi.fn(),
      getGuildLocaleUsecase: vi.fn(),
      updateGuildLocaleUsecase: vi.fn(),
    };

    const afkRepo = {
      getAfkConfig: vi.fn(),
      setAfkChannel: vi.fn(),
      updateAfkConfig: vi.fn(),
    };
    const bumpRepo = {
      getBumpReminderConfig: vi.fn(),
      setBumpReminderEnabled: vi.fn(),
      updateBumpReminderConfig: vi.fn(),
      setBumpReminderMentionRole: vi.fn(),
      addBumpReminderMentionUser: vi.fn(),
      removeBumpReminderMentionUser: vi.fn(),
      clearBumpReminderMentionUsers: vi.fn(),
      clearBumpReminderMentions: vi.fn(),
    };
    const vacRepo = {
      getVacConfig: vi.fn(),
      updateVacConfig: vi.fn(),
    };
    const memberRepo = {
      getMemberLogConfig: vi.fn(),
      updateMemberLogConfig: vi.fn(),
    };
    const vcRecruitRepo = {
      getVcRecruitConfig: vi.fn(),
      updateVcRecruitConfig: vi.fn(),
    };

    const AfkConfigRepository = vi.fn(function (this: unknown) {
      return afkRepo;
    });
    const BumpReminderConfigRepository = vi.fn(function (this: unknown) {
      return bumpRepo;
    });
    const VacConfigRepository = vi.fn(function (this: unknown) {
      return vacRepo;
    });
    const MemberLogConfigRepository = vi.fn(function (this: unknown) {
      return memberRepo;
    });
    const VcRecruitConfigRepository = vi.fn(function (this: unknown) {
      return vcRecruitRepo;
    });

    vi.doMock(
      "@/shared/database/repositories/usecases/guildConfigCoreUsecases",
      () => coreUsecases,
    );
    vi.doMock("@/shared/database/repositories/afkConfigRepository", () => ({
      AfkConfigRepository,
    }));
    vi.doMock(
      "@/shared/database/repositories/bumpReminderConfigRepository",
      () => ({ BumpReminderConfigRepository }),
    );
    vi.doMock("@/shared/database/repositories/vacConfigRepository", () => ({
      VacConfigRepository,
    }));
    vi.doMock(
      "@/shared/database/repositories/memberLogConfigRepository",
      () => ({ MemberLogConfigRepository }),
    );
    vi.doMock(
      "@/shared/database/repositories/vcRecruitConfigRepository",
      () => ({ VcRecruitConfigRepository }),
    );

    const module = await import(
      "@/shared/database/repositories/guildConfigRepository"
    );
    return {
      module,
      coreUsecases,
      afkRepo,
      bumpRepo,
      vacRepo,
      memberRepo,
      vcRecruitRepo,
      constructors: {
        AfkConfigRepository,
        BumpReminderConfigRepository,
        VacConfigRepository,
        MemberLogConfigRepository,
        VcRecruitConfigRepository,
      },
    };
  };

  it("delegates core operations to core usecases with deps", async () => {
    const { module, coreUsecases } = await loadModule();
    const prisma = { guildConfig: {} };
    const repository = new module.PrismaGuildConfigRepository(prisma as never);

    coreUsecases.getGuildConfigUsecase.mockResolvedValue({ guildId: "g1" });
    coreUsecases.existsGuildConfigUsecase.mockResolvedValue(true);
    coreUsecases.getGuildLocaleUsecase.mockResolvedValue("ja");

    await expect(repository.getConfig("g1")).resolves.toEqual({
      guildId: "g1",
    });
    await repository.saveConfig({ guildId: "g1" } as never);
    await repository.updateConfig("g1", { locale: "en" } as never);
    await repository.deleteConfig("g1");
    await expect(repository.exists("g1")).resolves.toBe(true);
    await expect(repository.getLocale("g1")).resolves.toBe("ja");
    await repository.updateLocale("g1", "en");

    expect(coreUsecases.getGuildConfigUsecase).toHaveBeenCalledWith(
      expect.objectContaining({
        prisma,
        defaultLocale: "ja",
        toDatabaseError: expect.any(Function),
      }),
      "g1",
    );
    expect(coreUsecases.saveGuildConfigUsecase).toHaveBeenCalled();
    expect(coreUsecases.updateGuildConfigUsecase).toHaveBeenCalled();
    expect(coreUsecases.deleteGuildConfigUsecase).toHaveBeenCalled();
    expect(coreUsecases.existsGuildConfigUsecase).toHaveBeenCalled();
    expect(coreUsecases.getGuildLocaleUsecase).toHaveBeenCalled();
    expect(coreUsecases.updateGuildLocaleUsecase).toHaveBeenCalled();
  });

  it("converts unknown errors to DatabaseError via toDatabaseError helper", async () => {
    const { module, coreUsecases } = await loadModule();
    const prisma = { guildConfig: {} };
    const repository = new module.PrismaGuildConfigRepository(prisma as never);

    coreUsecases.getGuildConfigUsecase.mockImplementation(
      (deps: {
        toDatabaseError: (prefix: string, error: unknown) => Error;
      }) => {
        throw deps.toDatabaseError("read failed", "non-error");
      },
    );

    await expect(repository.getConfig("g1")).rejects.toMatchObject({
      name: "DatabaseError",
      message: "read failed: unknown error",
    });
  });

  it("delegates feature-specific operations to each repository", async () => {
    const {
      module,
      afkRepo,
      bumpRepo,
      vacRepo,
      memberRepo,
      vcRecruitRepo,
      constructors,
    } = await loadModule();
    const prisma = { guildConfig: {} };
    const repository = new module.PrismaGuildConfigRepository(prisma as never);

    afkRepo.getAfkConfig.mockResolvedValue({ enabled: true });
    bumpRepo.getBumpReminderConfig.mockResolvedValue({ enabled: false });
    bumpRepo.setBumpReminderMentionRole.mockResolvedValue("updated");
    bumpRepo.addBumpReminderMentionUser.mockResolvedValue("added");
    bumpRepo.removeBumpReminderMentionUser.mockResolvedValue("removed");
    bumpRepo.clearBumpReminderMentionUsers.mockResolvedValue("cleared");
    bumpRepo.clearBumpReminderMentions.mockResolvedValue("cleared");
    vacRepo.getVacConfig.mockResolvedValue({ enabled: true });
    memberRepo.getMemberLogConfig.mockResolvedValue({ channelId: "x" });
    vcRecruitRepo.getVcRecruitConfig.mockResolvedValue({ enabled: true });

    await repository.getAfkConfig("g1");
    await repository.setAfkChannel("g1", "ch1");
    await repository.updateAfkConfig("g1", { enabled: true } as never);

    await repository.getBumpReminderConfig("g1");
    await repository.setBumpReminderEnabled("g1", true, "ch2");
    await repository.updateBumpReminderConfig("g1", { enabled: true } as never);
    await repository.setBumpReminderMentionRole("g1", "r1");
    await repository.addBumpReminderMentionUser("g1", "u1");
    await repository.removeBumpReminderMentionUser("g1", "u1");
    await repository.clearBumpReminderMentionUsers("g1");
    await repository.clearBumpReminderMentions("g1");

    await repository.getVacConfig("g1");
    await repository.updateVacConfig("g1", { enabled: true } as never);
    await repository.getMemberLogConfig("g1");
    await repository.updateMemberLogConfig("g1", {
      enabled: true,
      channelId: "x",
    });
    await repository.getVcRecruitConfig("g1");
    await repository.updateVcRecruitConfig("g1", { enabled: true } as never);

    expect(constructors.AfkConfigRepository).toHaveBeenCalledTimes(1);
    expect(constructors.BumpReminderConfigRepository).toHaveBeenCalledTimes(1);
    expect(constructors.VacConfigRepository).toHaveBeenCalledTimes(1);
    expect(constructors.MemberLogConfigRepository).toHaveBeenCalledTimes(1);
    expect(constructors.VcRecruitConfigRepository).toHaveBeenCalledTimes(1);

    expect(afkRepo.getAfkConfig).toHaveBeenCalledWith("g1");
    expect(afkRepo.setAfkChannel).toHaveBeenCalledWith("g1", "ch1");
    expect(afkRepo.updateAfkConfig).toHaveBeenCalledWith("g1", {
      enabled: true,
    });
    expect(bumpRepo.getBumpReminderConfig).toHaveBeenCalledWith("g1");
    expect(vacRepo.getVacConfig).toHaveBeenCalledWith("g1");
    expect(memberRepo.getMemberLogConfig).toHaveBeenCalledWith("g1");
    expect(vcRecruitRepo.getVcRecruitConfig).toHaveBeenCalledWith("g1");
  });

  it("createGuildConfigRepository returns repository instance", async () => {
    const { module } = await loadModule();
    const prisma = { guildConfig: {} };

    const repository = module.createGuildConfigRepository(prisma as never);
    expect(repository).toBeInstanceOf(module.PrismaGuildConfigRepository);
  });
});
