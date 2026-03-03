// tests/unit/shared/features/vc-recruit/vcRecruitConfigService.test.ts
// VcRecruitConfigService のビジネスロジック・分岐・シングルトン挙動を検証する

import type { VcRecruitConfig, VcRecruitSetup } from "@/shared/database/types";
import {
  DEFAULT_VC_RECRUIT_CONFIG,
  VcRecruitConfigService,
} from "@/shared/features/vc-recruit/vcRecruitConfigService";

describe("shared/features/vc-recruit/vcRecruitConfigService", () => {
  const createRepositoryMock = () => ({
    getVcRecruitConfig: vi.fn<() => Promise<VcRecruitConfig | null>>(),
    updateVcRecruitConfig:
      vi.fn<(guildId: string, config: VcRecruitConfig) => Promise<void>>(),
  });

  const makeSetup = (
    panelChannelId: string,
    postChannelId: string,
    overrides: Partial<VcRecruitSetup> = {},
  ): VcRecruitSetup => ({
    categoryId: null,
    panelChannelId,
    postChannelId,
    panelMessageId: "msg-1",
    threadArchiveDuration: 1440,
    createdVoiceChannelIds: [],
    ...overrides,
  });

  const makeConfig = (
    overrides: Partial<VcRecruitConfig> = {},
  ): VcRecruitConfig => ({
    enabled: true,
    mentionRoleIds: [],
    setups: [],
    ...overrides,
  });

  // ──────────────────────────────────────────────────────────
  // getVcRecruitConfigOrDefault
  // ──────────────────────────────────────────────────────────

  it("returns default config when repository has no config", async () => {
    const repository = createRepositoryMock();
    repository.getVcRecruitConfig.mockResolvedValue(null);
    const service = new VcRecruitConfigService(repository);

    const first = await service.getVcRecruitConfigOrDefault("g1");
    const second = await service.getVcRecruitConfigOrDefault("g1");

    expect(first).toEqual(DEFAULT_VC_RECRUIT_CONFIG);
    // 毎回新しいオブジェクト（参照コピー）が返ることを確認
    expect(first).not.toBe(second);
  });

  it("returns normalized copy when config exists", async () => {
    const repository = createRepositoryMock();
    const raw = makeConfig({
      mentionRoleIds: ["r1"],
      setups: [makeSetup("p1", "post1")],
    });
    repository.getVcRecruitConfig.mockResolvedValue(raw);
    const service = new VcRecruitConfigService(repository);

    const config = await service.getVcRecruitConfigOrDefault("g1");

    expect(config).toEqual(raw);
    // 配列は参照コピーであり、元オブジェクトとは別インスタンス
    expect(config.mentionRoleIds).not.toBe(raw.mentionRoleIds);
    expect(config.setups).not.toBe(raw.setups);
  });

  // ──────────────────────────────────────────────────────────
  // saveVcRecruitConfig
  // ──────────────────────────────────────────────────────────

  it("delegates normalized config to repository on save", async () => {
    const repository = createRepositoryMock();
    repository.getVcRecruitConfig.mockResolvedValue(null);
    repository.updateVcRecruitConfig.mockResolvedValue(undefined);
    const service = new VcRecruitConfigService(repository);

    const input = makeConfig({ mentionRoleIds: ["r1"] });
    await service.saveVcRecruitConfig("g1", input);

    expect(repository.updateVcRecruitConfig).toHaveBeenCalledWith(
      "g1",
      expect.objectContaining({ mentionRoleIds: ["r1"] }),
    );
    // 渡されたオブジェクトが元と別参照であること（正規化コピー）
    const saved = repository.updateVcRecruitConfig.mock
      .calls[0][1] as VcRecruitConfig;
    expect(saved).not.toBe(input);
  });

  // ──────────────────────────────────────────────────────────
  // addSetup / removeSetup
  // ──────────────────────────────────────────────────────────

  it("adds new setup and enables feature", async () => {
    const repository = createRepositoryMock();
    repository.getVcRecruitConfig.mockResolvedValue(
      makeConfig({ enabled: false }),
    );
    repository.updateVcRecruitConfig.mockResolvedValue(undefined);
    const service = new VcRecruitConfigService(repository);

    const result = await service.addSetup("g1", {
      categoryId: null,
      panelChannelId: "p1",
      postChannelId: "post1",
      panelMessageId: "msg-1",
      threadArchiveDuration: 1440,
    });

    expect(result.enabled).toBe(true);
    expect(result.setups).toHaveLength(1);
    expect(result.setups[0].panelChannelId).toBe("p1");
    expect(result.setups[0].createdVoiceChannelIds).toEqual([]);
  });

  it("removes setup by panelChannelId", async () => {
    const setup1 = makeSetup("p1", "post1");
    const setup2 = makeSetup("p2", "post2");
    const repository = createRepositoryMock();
    repository.getVcRecruitConfig.mockResolvedValue(
      makeConfig({ setups: [setup1, setup2] }),
    );
    repository.updateVcRecruitConfig.mockResolvedValue(undefined);
    const service = new VcRecruitConfigService(repository);

    const result = await service.removeSetup("g1", "p1");

    expect(result.setups).toHaveLength(1);
    expect(result.setups[0].panelChannelId).toBe("p2");
  });

  // ──────────────────────────────────────────────────────────
  // updatePanelMessageId
  // ──────────────────────────────────────────────────────────

  it("updates panelMessageId only for matching setup", async () => {
    const setup1 = makeSetup("p1", "post1", { panelMessageId: "old-msg" });
    const setup2 = makeSetup("p2", "post2", { panelMessageId: "other-msg" });
    const repository = createRepositoryMock();
    repository.getVcRecruitConfig.mockResolvedValue(
      makeConfig({ setups: [setup1, setup2] }),
    );
    repository.updateVcRecruitConfig.mockResolvedValue(undefined);
    const service = new VcRecruitConfigService(repository);

    const result = await service.updatePanelMessageId("g1", "p1", "new-msg");

    const updated = result.setups.find((s) => s.panelChannelId === "p1");
    const untouched = result.setups.find((s) => s.panelChannelId === "p2");
    expect(updated?.panelMessageId).toBe("new-msg");
    expect(untouched?.panelMessageId).toBe("other-msg");
  });

  // ──────────────────────────────────────────────────────────
  // findSetupBy*
  // ──────────────────────────────────────────────────────────

  it("findSetupByCategoryId: returns null when not found", async () => {
    const repository = createRepositoryMock();
    repository.getVcRecruitConfig.mockResolvedValue(
      makeConfig({ setups: [makeSetup("p1", "post1")] }),
    );
    const service = new VcRecruitConfigService(repository);

    await expect(
      service.findSetupByCategoryId("g1", "cat-x"),
    ).resolves.toBeNull();
  });

  it("findSetupByCategoryId: returns setup when found, including null categoryId", async () => {
    const setup = makeSetup("p1", "post1", { categoryId: null });
    const repository = createRepositoryMock();
    repository.getVcRecruitConfig.mockResolvedValue(
      makeConfig({ setups: [setup] }),
    );
    const service = new VcRecruitConfigService(repository);

    await expect(service.findSetupByCategoryId("g1", null)).resolves.toEqual(
      setup,
    );
  });

  it("findSetupByPanelChannelId: returns null when not found", async () => {
    const repository = createRepositoryMock();
    repository.getVcRecruitConfig.mockResolvedValue(
      makeConfig({ setups: [makeSetup("p1", "post1")] }),
    );
    const service = new VcRecruitConfigService(repository);

    await expect(
      service.findSetupByPanelChannelId("g1", "p-unknown"),
    ).resolves.toBeNull();
  });

  it("findSetupByPanelChannelId: returns setup when found", async () => {
    const setup = makeSetup("p1", "post1");
    const repository = createRepositoryMock();
    repository.getVcRecruitConfig.mockResolvedValue(
      makeConfig({ setups: [setup] }),
    );
    const service = new VcRecruitConfigService(repository);

    await expect(
      service.findSetupByPanelChannelId("g1", "p1"),
    ).resolves.toEqual(setup);
  });

  it("findSetupByPostChannelId: returns null when not found", async () => {
    const repository = createRepositoryMock();
    repository.getVcRecruitConfig.mockResolvedValue(
      makeConfig({ setups: [makeSetup("p1", "post1")] }),
    );
    const service = new VcRecruitConfigService(repository);

    await expect(
      service.findSetupByPostChannelId("g1", "post-unknown"),
    ).resolves.toBeNull();
  });

  it("findSetupByPostChannelId: returns setup when found", async () => {
    const setup = makeSetup("p1", "post1");
    const repository = createRepositoryMock();
    repository.getVcRecruitConfig.mockResolvedValue(
      makeConfig({ setups: [setup] }),
    );
    const service = new VcRecruitConfigService(repository);

    await expect(
      service.findSetupByPostChannelId("g1", "post1"),
    ).resolves.toEqual(setup);
  });

  // ──────────────────────────────────────────────────────────
  // createdVoiceChannelIds 操作
  // ──────────────────────────────────────────────────────────

  it("addCreatedVoiceChannelId: appends vcId to matching setup", async () => {
    const setup = makeSetup("p1", "post1");
    const repository = createRepositoryMock();
    repository.getVcRecruitConfig.mockResolvedValue(
      makeConfig({ setups: [setup] }),
    );
    repository.updateVcRecruitConfig.mockResolvedValue(undefined);
    const service = new VcRecruitConfigService(repository);

    const result = await service.addCreatedVoiceChannelId("g1", "p1", "vc-1");

    expect(result.setups[0].createdVoiceChannelIds).toEqual(["vc-1"]);
  });

  it("addCreatedVoiceChannelId: leaves non-matching setups unchanged", async () => {
    const setup1 = makeSetup("p1", "post1");
    const setup2 = makeSetup("p2", "post2");
    const repository = createRepositoryMock();
    repository.getVcRecruitConfig.mockResolvedValue(
      makeConfig({ setups: [setup1, setup2] }),
    );
    repository.updateVcRecruitConfig.mockResolvedValue(undefined);
    const service = new VcRecruitConfigService(repository);

    const result = await service.addCreatedVoiceChannelId("g1", "p1", "vc-1");

    // p1 には追加される
    expect(result.setups[0].createdVoiceChannelIds).toEqual(["vc-1"]);
    // p2 はそのまま
    expect(result.setups[1].createdVoiceChannelIds).toEqual([]);
  });

  it("removeCreatedVoiceChannelId: removes vcId from matching setup", async () => {
    const setup = makeSetup("p1", "post1", {
      createdVoiceChannelIds: ["vc-1", "vc-2"],
    });
    const repository = createRepositoryMock();
    repository.getVcRecruitConfig.mockResolvedValue(
      makeConfig({ setups: [setup] }),
    );
    repository.updateVcRecruitConfig.mockResolvedValue(undefined);
    const service = new VcRecruitConfigService(repository);

    const result = await service.removeCreatedVoiceChannelId("g1", "vc-1");

    expect(result.setups[0].createdVoiceChannelIds).toEqual(["vc-2"]);
  });

  it("findSetupByCreatedVcId: returns null when vcId not tracked", async () => {
    const setup = makeSetup("p1", "post1", {
      createdVoiceChannelIds: ["vc-1"],
    });
    const repository = createRepositoryMock();
    repository.getVcRecruitConfig.mockResolvedValue(
      makeConfig({ setups: [setup] }),
    );
    const service = new VcRecruitConfigService(repository);

    await expect(
      service.findSetupByCreatedVcId("g1", "vc-unknown"),
    ).resolves.toBeNull();
  });

  it("findSetupByCreatedVcId: returns setup containing the vcId", async () => {
    const setup = makeSetup("p1", "post1", {
      createdVoiceChannelIds: ["vc-1"],
    });
    const repository = createRepositoryMock();
    repository.getVcRecruitConfig.mockResolvedValue(
      makeConfig({ setups: [setup] }),
    );
    const service = new VcRecruitConfigService(repository);

    await expect(service.findSetupByCreatedVcId("g1", "vc-1")).resolves.toEqual(
      setup,
    );
  });

  it("isCreatedVcRecruitChannel: returns true when VC is tracked", async () => {
    const setup = makeSetup("p1", "post1", {
      createdVoiceChannelIds: ["vc-1"],
    });
    const repository = createRepositoryMock();
    repository.getVcRecruitConfig.mockResolvedValue(
      makeConfig({ setups: [setup] }),
    );
    const service = new VcRecruitConfigService(repository);

    await expect(service.isCreatedVcRecruitChannel("g1", "vc-1")).resolves.toBe(
      true,
    );
  });

  it("isCreatedVcRecruitChannel: returns false when VC is not tracked", async () => {
    const repository = createRepositoryMock();
    repository.getVcRecruitConfig.mockResolvedValue(makeConfig());
    const service = new VcRecruitConfigService(repository);

    await expect(service.isCreatedVcRecruitChannel("g1", "vc-x")).resolves.toBe(
      false,
    );
  });

  // ──────────────────────────────────────────────────────────
  // addMentionRoleId / removeMentionRoleId（3分岐 / 2分岐）
  // ──────────────────────────────────────────────────────────

  it("addMentionRoleId: returns added when new role", async () => {
    const repository = createRepositoryMock();
    repository.getVcRecruitConfig.mockResolvedValue(makeConfig());
    repository.updateVcRecruitConfig.mockResolvedValue(undefined);
    const service = new VcRecruitConfigService(repository);

    await expect(service.addMentionRoleId("g1", "role-1")).resolves.toBe(
      "added",
    );
  });

  it("addMentionRoleId: returns already_exists when role is duplicate", async () => {
    const repository = createRepositoryMock();
    repository.getVcRecruitConfig.mockResolvedValue(
      makeConfig({ mentionRoleIds: ["role-1"] }),
    );
    const service = new VcRecruitConfigService(repository);

    await expect(service.addMentionRoleId("g1", "role-1")).resolves.toBe(
      "already_exists",
    );
  });

  it("addMentionRoleId: returns limit_exceeded when 25 roles already registered", async () => {
    const roles = Array.from({ length: 25 }, (_, i) => `role-${i}`);
    const repository = createRepositoryMock();
    repository.getVcRecruitConfig.mockResolvedValue(
      makeConfig({ mentionRoleIds: roles }),
    );
    const service = new VcRecruitConfigService(repository);

    await expect(service.addMentionRoleId("g1", "role-new")).resolves.toBe(
      "limit_exceeded",
    );
  });

  it("removeMentionRoleId: returns removed when role exists", async () => {
    const repository = createRepositoryMock();
    repository.getVcRecruitConfig.mockResolvedValue(
      makeConfig({ mentionRoleIds: ["role-1"] }),
    );
    repository.updateVcRecruitConfig.mockResolvedValue(undefined);
    const service = new VcRecruitConfigService(repository);

    await expect(service.removeMentionRoleId("g1", "role-1")).resolves.toBe(
      "removed",
    );
  });

  it("removeMentionRoleId: returns not_found when role is missing", async () => {
    const repository = createRepositoryMock();
    repository.getVcRecruitConfig.mockResolvedValue(makeConfig());
    const service = new VcRecruitConfigService(repository);

    await expect(service.removeMentionRoleId("g1", "role-x")).resolves.toBe(
      "not_found",
    );
  });

  // ──────────────────────────────────────────────────────────
  // シングルトン（getVcRecruitConfigService）
  // ──────────────────────────────────────────────────────────

  // モジュールレベルのシングルトン変数が各テストに持ち越されないよう再ロードする
  const loadModule = async () => {
    vi.resetModules();
    const module =
      await import("@/shared/features/vc-recruit/vcRecruitConfigService");
    return module;
  };

  it("returns same singleton instance on subsequent calls", async () => {
    const { getVcRecruitConfigService } = await loadModule();
    const repositoryA = createRepositoryMock();
    const repositoryB = createRepositoryMock();

    const serviceA = getVcRecruitConfigService(repositoryA);
    const serviceAgain = getVcRecruitConfigService(repositoryA);
    // 一度キャッシュされたら別リポジトリを渡しても同じインスタンスを返す
    const serviceB = getVcRecruitConfigService(repositoryB);

    expect(serviceA).toBe(serviceAgain);
    expect(serviceA).toBe(serviceB);
  });
});
