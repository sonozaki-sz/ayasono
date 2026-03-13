// tests/integration/shared/database/repositories/guildConfigRepository.integration.test.ts
/**
 * GuildConfigRepository Integration Tests
 * Prisma Repositoryの統合テスト
 */

import { PrismaGuildConfigRepository } from "@/shared/database/repositories/guildConfigRepository";
import type { GuildConfig } from "@/shared/database/types";
import { DatabaseError } from "@/shared/errors/customErrors";

// Logger のモック
vi.mock("@/shared/utils/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// i18n のモック
vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: (key: string) => `mocked:${key}`,
}));

// Prismaクライアントのモック
const mockPrismaClient = {
  guildConfig: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  guildAfkConfig: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  guildBumpReminderConfig: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  },
  guildVacConfig: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  guildMemberLogConfig: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  guildVcRecruitConfig: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
};

describe("PrismaGuildConfigRepository", () => {
  // ギルド設定の取得・保存・CAS更新・機能別設定更新を統合検証
  let repository: PrismaGuildConfigRepository;
  const baseTime = new Date("2026-02-20T00:00:00.000Z");

  // 基準時刻からの差分で日時を作るヘルパー
  const atOffsetMs = (offsetMs: number): Date =>
    new Date(baseTime.getTime() + offsetMs);

  // 各テストでリポジトリインスタンスとモック呼び出し履歴を初期化
  beforeEach(() => {
    // @ts-expect-error - モックのため型エラーは無視
    repository = new PrismaGuildConfigRepository(mockPrismaClient);
    vi.clearAllMocks();
  });

  describe("getConfig()", () => {
    it("should return guild config when found", async () => {
      // DBレコード(JSON文字列)がドメイン型へ復元されること
      const mockRecord = {
        guildId: "123456789",
        locale: "ja",
        afkConfig: JSON.stringify({ enabled: true, channelId: "111" }),
        vacConfig: null,
        bumpReminderConfig: null,
        stickMessages: null,
        memberLogConfig: null,
        createdAt: atOffsetMs(0),
        updatedAt: atOffsetMs(0),
      };

      mockPrismaClient.guildConfig.findUnique.mockResolvedValue(mockRecord);

      const config = await repository.getConfig("123456789");

      expect(config).toBeDefined();
      expect(config?.guildId).toBe("123456789");
      expect(config?.locale).toBe("ja");
    });

    it("should return null when config not found", async () => {
      mockPrismaClient.guildConfig.findUnique.mockResolvedValue(null);

      const config = await repository.getConfig("nonexistent");

      expect(config).toBeNull();
    });

    it("should throw DatabaseError on failure", async () => {
      mockPrismaClient.guildConfig.findUnique.mockRejectedValue(
        new Error("DB connection failed"),
      );

      await expect(repository.getConfig("123456789")).rejects.toThrow(
        DatabaseError,
      );
    });
  });

  describe("saveConfig()", () => {
    it("should create new guild config", async () => {
      const newConfig: GuildConfig = {
        guildId: "123456789",
        locale: "ja",
        createdAt: atOffsetMs(0),
        updatedAt: atOffsetMs(0),
      };

      mockPrismaClient.guildConfig.create.mockResolvedValue({
        guildId: newConfig.guildId,
        locale: newConfig.locale,
        afkConfig: null,
        vacConfig: null,
        bumpReminderConfig: null,
        stickMessages: null,
        memberLogConfig: null,
        createdAt: newConfig.createdAt,
        updatedAt: newConfig.updatedAt,
      });

      await repository.saveConfig(newConfig);

      expect(mockPrismaClient.guildConfig.create).toHaveBeenCalled();
    });

    it("should throw DatabaseError on save failure", async () => {
      const newConfig: GuildConfig = {
        guildId: "123456789",
        locale: "ja",
        createdAt: atOffsetMs(0),
        updatedAt: atOffsetMs(0),
      };

      mockPrismaClient.guildConfig.create.mockRejectedValue(
        new Error("Unique constraint failed"),
      );

      await expect(repository.saveConfig(newConfig)).rejects.toThrow(
        DatabaseError,
      );
    });
  });

  describe("updateConfig()", () => {
    it("should update existing config", async () => {
      mockPrismaClient.guildConfig.upsert.mockResolvedValue({
        guildId: "123456789",
        locale: "en",
        afkConfig: null,
        vacConfig: null,
        bumpReminderConfig: null,
        stickMessages: null,
        memberLogConfig: null,
        createdAt: atOffsetMs(0),
        updatedAt: atOffsetMs(0),
      });

      await repository.updateConfig("123456789", { locale: "en" });

      expect(mockPrismaClient.guildConfig.upsert).toHaveBeenCalled();
    });

    it("should create config if not exists (upsert)", async () => {
      // upsert により未作成ギルドでも更新APIで作成できること
      mockPrismaClient.guildConfig.upsert.mockResolvedValue({
        guildId: "123456789",
        locale: "ja",
        afkConfig: null,
        vacConfig: null,
        bumpReminderConfig: null,
        stickMessages: null,
        memberLogConfig: null,
        createdAt: atOffsetMs(0),
        updatedAt: atOffsetMs(0),
      });

      await repository.updateConfig("123456789", { locale: "en" });

      expect(mockPrismaClient.guildConfig.upsert).toHaveBeenCalled();
    });
  });

  describe("deleteConfig()", () => {
    it("should delete guild config", async () => {
      mockPrismaClient.guildConfig.delete.mockResolvedValue({
        guildId: "123456789",
        locale: "ja",
        afkConfig: null,
        vacConfig: null,
        bumpReminderConfig: null,
        stickMessages: null,
        memberLogConfig: null,
        createdAt: atOffsetMs(0),
        updatedAt: atOffsetMs(0),
      });

      await repository.deleteConfig("123456789");

      expect(mockPrismaClient.guildConfig.delete).toHaveBeenCalled();
    });
  });

  describe("exists()", () => {
    it("should return true when config exists", async () => {
      mockPrismaClient.guildConfig.findUnique.mockResolvedValue({
        id: "some-id",
      });

      const exists = await repository.exists("123456789");

      expect(exists).toBe(true);
    });

    it("should return false when config does not exist", async () => {
      mockPrismaClient.guildConfig.findUnique.mockResolvedValue(null);

      const exists = await repository.exists("nonexistent");

      expect(exists).toBe(false);
    });
  });

  describe("getLocale()", () => {
    it("should return guild locale", async () => {
      mockPrismaClient.guildConfig.findUnique.mockResolvedValue({
        guildId: "123456789",
        locale: "en",
        afkConfig: null,
        vacConfig: null,
        bumpReminderConfig: null,
        stickMessages: null,
        memberLogConfig: null,
        createdAt: atOffsetMs(0),
        updatedAt: atOffsetMs(0),
      });

      const locale = await repository.getLocale("123456789");

      expect(locale).toBe("en");
    });

    it("should return default locale when config not found", async () => {
      // 未設定ギルドは既定ロケールを返す
      mockPrismaClient.guildConfig.findUnique.mockResolvedValue(null);

      const locale = await repository.getLocale("nonexistent");

      expect(locale).toBe("ja");
    });
  });

  describe("setAfkChannel()", () => {
    it("should upsert AFK config with new channel", async () => {
      mockPrismaClient.guildAfkConfig.upsert.mockResolvedValue({});

      await repository.setAfkChannel("123456789", "vc-1");

      expect(mockPrismaClient.guildAfkConfig.upsert).toHaveBeenCalledWith({
        where: { guildId: "123456789" },
        create: { guildId: "123456789", enabled: true, channelId: "vc-1" },
        update: { enabled: true, channelId: "vc-1" },
      });
    });
  });

  describe("updateAfkConfig()", () => {
    it("should upsert AFK config", async () => {
      mockPrismaClient.guildAfkConfig.upsert.mockResolvedValue({});

      await repository.updateAfkConfig("123456789", {
        enabled: false,
        channelId: "ch-x",
      });

      expect(mockPrismaClient.guildAfkConfig.upsert).toHaveBeenCalledWith({
        where: { guildId: "123456789" },
        create: {
          guildId: "123456789",
          enabled: false,
          channelId: "ch-x",
        },
        update: {
          enabled: false,
          channelId: "ch-x",
        },
      });
    });
  });

  describe("getBumpReminderConfig()", () => {
    it("should return null when not configured", async () => {
      mockPrismaClient.guildBumpReminderConfig.findUnique.mockResolvedValue(
        null,
      );

      const config = await repository.getBumpReminderConfig("123456789");

      expect(config).toBeNull();
    });

    it("should return stored config when configured", async () => {
      mockPrismaClient.guildBumpReminderConfig.findUnique.mockResolvedValue({
        enabled: false,
        channelId: "999999999",
        mentionRoleId: "888888888",
        mentionUserIds: '["111111111","222222222"]',
      });

      const config = await repository.getBumpReminderConfig("123456789");

      expect(config).toEqual({
        enabled: false,
        channelId: "999999999",
        mentionRoleId: "888888888",
        mentionUserIds: ["111111111", "222222222"],
      });
    });
  });

  describe("setBumpReminderEnabled()", () => {
    it("should upsert bump config with enabled flag", async () => {
      mockPrismaClient.guildBumpReminderConfig.upsert.mockResolvedValue({});

      await repository.setBumpReminderEnabled("123456789", true, "ch-1");

      expect(mockPrismaClient.guildBumpReminderConfig.upsert).toHaveBeenCalledWith({
        where: { guildId: "123456789" },
        create: {
          guildId: "123456789",
          enabled: true,
          channelId: "ch-1",
          mentionUserIds: "[]",
        },
        update: {
          enabled: true,
          channelId: "ch-1",
        },
      });
    });

    it("should upsert without channelId when not provided", async () => {
      mockPrismaClient.guildBumpReminderConfig.upsert.mockResolvedValue({});

      await repository.setBumpReminderEnabled("123456789", false);

      expect(mockPrismaClient.guildBumpReminderConfig.upsert).toHaveBeenCalledWith({
        where: { guildId: "123456789" },
        create: {
          guildId: "123456789",
          enabled: false,
          channelId: null,
          mentionUserIds: "[]",
        },
        update: { enabled: false },
      });
    });
  });

  describe("updateBumpReminderConfig()", () => {
    it("should upsert full bump config", async () => {
      const nextConfig = {
        enabled: true,
        channelId: "ch-1",
        mentionRoleId: "role-1",
        mentionUserIds: ["user-1"],
      };

      mockPrismaClient.guildBumpReminderConfig.upsert.mockResolvedValue({});

      await repository.updateBumpReminderConfig("123456789", nextConfig);

      expect(mockPrismaClient.guildBumpReminderConfig.upsert).toHaveBeenCalledWith({
        where: { guildId: "123456789" },
        create: {
          guildId: "123456789",
          enabled: true,
          channelId: "ch-1",
          mentionRoleId: "role-1",
          mentionUserIds: '["user-1"]',
        },
        update: {
          enabled: true,
          channelId: "ch-1",
          mentionRoleId: "role-1",
          mentionUserIds: '["user-1"]',
        },
      });
    });
  });

  describe("addBumpReminderMentionUser()", () => {
    it("should return not-configured when record does not exist", async () => {
      mockPrismaClient.guildBumpReminderConfig.findUnique.mockResolvedValue(
        null,
      );

      const result = await repository.addBumpReminderMentionUser(
        "123456789",
        "user-a",
      );

      expect(result).toBe("not-configured");
    });

    it("should add user when not in mention list", async () => {
      mockPrismaClient.guildBumpReminderConfig.findUnique.mockResolvedValue({
        mentionUserIds: '["user-a"]',
      });
      mockPrismaClient.guildBumpReminderConfig.update.mockResolvedValue({});

      const result = await repository.addBumpReminderMentionUser(
        "123456789",
        "user-b",
      );

      expect(result).toBe("added");
      expect(mockPrismaClient.guildBumpReminderConfig.update).toHaveBeenCalledWith({
        where: { guildId: "123456789" },
        data: { mentionUserIds: '["user-a","user-b"]' },
      });
    });

    it("should return already-exists when user is already in list", async () => {
      mockPrismaClient.guildBumpReminderConfig.findUnique.mockResolvedValue({
        mentionUserIds: '["user-a"]',
      });

      const result = await repository.addBumpReminderMentionUser(
        "123456789",
        "user-a",
      );

      expect(result).toBe("already-exists");
      expect(mockPrismaClient.guildBumpReminderConfig.update).not.toHaveBeenCalled();
    });
  });

  describe("setBumpReminderMentionRole()", () => {
    it("should return not-configured when record does not exist", async () => {
      mockPrismaClient.guildBumpReminderConfig.findUnique.mockResolvedValue(
        null,
      );

      const result = await repository.setBumpReminderMentionRole(
        "123456789",
        "new-role",
      );

      expect(result).toBe("not-configured");
    });

    it("should set mention role", async () => {
      mockPrismaClient.guildBumpReminderConfig.findUnique.mockResolvedValue({
        mentionRoleId: "old-role",
        mentionUserIds: '["user-a"]',
      });
      mockPrismaClient.guildBumpReminderConfig.update.mockResolvedValue({});

      const result = await repository.setBumpReminderMentionRole(
        "123456789",
        "new-role",
      );

      expect(result).toBe("updated");
      expect(mockPrismaClient.guildBumpReminderConfig.update).toHaveBeenCalledWith({
        where: { guildId: "123456789" },
        data: { mentionRoleId: "new-role" },
      });
    });
  });

  describe("removeBumpReminderMentionUser()", () => {
    it("should return not-configured when record does not exist", async () => {
      mockPrismaClient.guildBumpReminderConfig.findUnique.mockResolvedValue(
        null,
      );

      const result = await repository.removeBumpReminderMentionUser(
        "123456789",
        "user-b",
      );

      expect(result).toBe("not-configured");
    });

    it("should remove user when in mention list", async () => {
      mockPrismaClient.guildBumpReminderConfig.findUnique.mockResolvedValue({
        mentionUserIds: '["user-a","user-b"]',
      });
      mockPrismaClient.guildBumpReminderConfig.update.mockResolvedValue({});

      const result = await repository.removeBumpReminderMentionUser(
        "123456789",
        "user-b",
      );

      expect(result).toBe("removed");
      expect(mockPrismaClient.guildBumpReminderConfig.update).toHaveBeenCalledWith({
        where: { guildId: "123456789" },
        data: { mentionUserIds: '["user-a"]' },
      });
    });

    it("should return not-found when user is not in list", async () => {
      mockPrismaClient.guildBumpReminderConfig.findUnique.mockResolvedValue({
        mentionUserIds: '["user-a"]',
      });

      const result = await repository.removeBumpReminderMentionUser(
        "123456789",
        "user-z",
      );

      expect(result).toBe("not-found");
      expect(mockPrismaClient.guildBumpReminderConfig.update).not.toHaveBeenCalled();
    });
  });

  describe("clearBumpReminderMentionUsers()", () => {
    it("should return not-configured when record does not exist", async () => {
      mockPrismaClient.guildBumpReminderConfig.findUnique.mockResolvedValue(
        null,
      );

      const result = await repository.clearBumpReminderMentionUsers("123456789");

      expect(result).toBe("not-configured");
    });

    it("should clear all mention users", async () => {
      mockPrismaClient.guildBumpReminderConfig.findUnique.mockResolvedValue({
        mentionUserIds: '["user-a","user-b"]',
      });
      mockPrismaClient.guildBumpReminderConfig.update.mockResolvedValue({});

      const result = await repository.clearBumpReminderMentionUsers("123456789");

      expect(result).toBe("cleared");
      expect(mockPrismaClient.guildBumpReminderConfig.update).toHaveBeenCalledWith({
        where: { guildId: "123456789" },
        data: { mentionUserIds: "[]" },
      });
    });

    it("should return already-empty when list is already empty", async () => {
      mockPrismaClient.guildBumpReminderConfig.findUnique.mockResolvedValue({
        mentionUserIds: "[]",
      });

      const result = await repository.clearBumpReminderMentionUsers("123456789");

      expect(result).toBe("already-empty");
      expect(mockPrismaClient.guildBumpReminderConfig.update).not.toHaveBeenCalled();
    });
  });

  describe("clearBumpReminderMentions()", () => {
    it("should return not-configured when record does not exist", async () => {
      mockPrismaClient.guildBumpReminderConfig.findUnique.mockResolvedValue(
        null,
      );

      const result = await repository.clearBumpReminderMentions("123456789");

      expect(result).toBe("not-configured");
    });

    it("should clear role and users", async () => {
      mockPrismaClient.guildBumpReminderConfig.findUnique.mockResolvedValue({
        mentionRoleId: "role-a",
        mentionUserIds: '["user-a","user-b"]',
      });
      mockPrismaClient.guildBumpReminderConfig.update.mockResolvedValue({});

      const result = await repository.clearBumpReminderMentions("123456789");

      expect(result).toBe("cleared");
      expect(mockPrismaClient.guildBumpReminderConfig.update).toHaveBeenCalledWith({
        where: { guildId: "123456789" },
        data: { mentionRoleId: null, mentionUserIds: "[]" },
      });
    });

    it("should return already-cleared when nothing to clear", async () => {
      mockPrismaClient.guildBumpReminderConfig.findUnique.mockResolvedValue({
        mentionRoleId: null,
        mentionUserIds: "[]",
      });

      const result = await repository.clearBumpReminderMentions("123456789");

      expect(result).toBe("already-cleared");
      expect(mockPrismaClient.guildBumpReminderConfig.update).not.toHaveBeenCalled();
    });
  });
});
