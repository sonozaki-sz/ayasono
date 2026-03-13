// tests/unit/shared/database/repositories/bumpReminderConfigRepository.test.ts

import type { Mock } from "vitest";
import {
  BUMP_REMINDER_MENTION_ROLE_RESULT,
  BUMP_REMINDER_MENTION_USER_ADD_RESULT,
  BUMP_REMINDER_MENTION_USER_REMOVE_RESULT,
  BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT,
  BUMP_REMINDER_MENTION_CLEAR_RESULT,
} from "@/shared/database/types";

function createPrismaMock() {
  return {
    guildBumpReminderConfig: {
      findUnique: vi.fn() as Mock,
      upsert: vi.fn() as Mock,
      update: vi.fn() as Mock,
    },
  };
}

describe("shared/database/repositories/bumpReminderConfigRepository", () => {
  async function loadModule() {
    return import(
      "@/shared/database/repositories/bumpReminderConfigRepository"
    );
  }

  describe("getBumpReminderConfig", () => {
    it("returns null when record not found", async () => {
      const prisma = createPrismaMock();
      prisma.guildBumpReminderConfig.findUnique.mockResolvedValue(null);

      const { BumpReminderConfigRepository } = await loadModule();
      const repo = new BumpReminderConfigRepository(prisma as never);
      const result = await repo.getBumpReminderConfig("guild-1");

      expect(result).toBeNull();
    });

    it("returns config with all fields when record found", async () => {
      const prisma = createPrismaMock();
      prisma.guildBumpReminderConfig.findUnique.mockResolvedValue({
        guildId: "guild-1",
        enabled: true,
        channelId: "ch-1",
        mentionRoleId: "role-1",
        mentionUserIds: '["user-1","user-2"]',
      });

      const { BumpReminderConfigRepository } = await loadModule();
      const repo = new BumpReminderConfigRepository(prisma as never);
      const result = await repo.getBumpReminderConfig("guild-1");

      expect(result).toEqual({
        enabled: true,
        channelId: "ch-1",
        mentionRoleId: "role-1",
        mentionUserIds: ["user-1", "user-2"],
      });
    });

    it("returns undefined for null optional fields", async () => {
      const prisma = createPrismaMock();
      prisma.guildBumpReminderConfig.findUnique.mockResolvedValue({
        guildId: "guild-1",
        enabled: false,
        channelId: null,
        mentionRoleId: null,
        mentionUserIds: "[]",
      });

      const { BumpReminderConfigRepository } = await loadModule();
      const repo = new BumpReminderConfigRepository(prisma as never);
      const result = await repo.getBumpReminderConfig("guild-1");

      expect(result).toEqual({
        enabled: false,
        channelId: undefined,
        mentionRoleId: undefined,
        mentionUserIds: [],
      });
    });

    it("returns empty array for invalid mentionUserIds JSON", async () => {
      const prisma = createPrismaMock();
      prisma.guildBumpReminderConfig.findUnique.mockResolvedValue({
        guildId: "guild-1",
        enabled: true,
        channelId: null,
        mentionRoleId: null,
        mentionUserIds: "invalid-json",
      });

      const { BumpReminderConfigRepository } = await loadModule();
      const repo = new BumpReminderConfigRepository(prisma as never);
      const result = await repo.getBumpReminderConfig("guild-1");

      expect(result?.mentionUserIds).toEqual([]);
    });
  });

  describe("setBumpReminderEnabled", () => {
    it("upserts with enabled=true and channelId when provided", async () => {
      const prisma = createPrismaMock();
      prisma.guildBumpReminderConfig.upsert.mockResolvedValue({});

      const { BumpReminderConfigRepository } = await loadModule();
      const repo = new BumpReminderConfigRepository(prisma as never);
      await repo.setBumpReminderEnabled("guild-1", true, "ch-1");

      expect(prisma.guildBumpReminderConfig.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { guildId: "guild-1" },
          create: expect.objectContaining({
            guildId: "guild-1",
            enabled: true,
            channelId: "ch-1",
          }),
          update: expect.objectContaining({
            enabled: true,
            channelId: "ch-1",
          }),
        }),
      );
    });

    it("upserts without channelId in update when not provided", async () => {
      const prisma = createPrismaMock();
      prisma.guildBumpReminderConfig.upsert.mockResolvedValue({});

      const { BumpReminderConfigRepository } = await loadModule();
      const repo = new BumpReminderConfigRepository(prisma as never);
      await repo.setBumpReminderEnabled("guild-1", false);

      const call = prisma.guildBumpReminderConfig.upsert.mock.calls[0][0];
      expect(call.update).not.toHaveProperty("channelId");
    });
  });

  describe("updateBumpReminderConfig", () => {
    it("upserts record with JSON-stringified mentionUserIds", async () => {
      const prisma = createPrismaMock();
      prisma.guildBumpReminderConfig.upsert.mockResolvedValue({});

      const { BumpReminderConfigRepository } = await loadModule();
      const repo = new BumpReminderConfigRepository(prisma as never);
      await repo.updateBumpReminderConfig("guild-1", {
        enabled: true,
        channelId: "ch-1",
        mentionRoleId: "role-1",
        mentionUserIds: ["user-1"],
      });

      expect(prisma.guildBumpReminderConfig.upsert).toHaveBeenCalledWith({
        where: { guildId: "guild-1" },
        create: {
          guildId: "guild-1",
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

  describe("setBumpReminderMentionRole", () => {
    it("returns NOT_CONFIGURED when record not found", async () => {
      const prisma = createPrismaMock();
      prisma.guildBumpReminderConfig.findUnique.mockResolvedValue(null);

      const { BumpReminderConfigRepository } = await loadModule();
      const repo = new BumpReminderConfigRepository(prisma as never);
      const result = await repo.setBumpReminderMentionRole("guild-1", "role-1");

      expect(result).toBe(BUMP_REMINDER_MENTION_ROLE_RESULT.NOT_CONFIGURED);
    });

    it("updates mentionRoleId and returns UPDATED when record found", async () => {
      const prisma = createPrismaMock();
      prisma.guildBumpReminderConfig.findUnique.mockResolvedValue({
        guildId: "guild-1",
      });
      prisma.guildBumpReminderConfig.update.mockResolvedValue({});

      const { BumpReminderConfigRepository } = await loadModule();
      const repo = new BumpReminderConfigRepository(prisma as never);
      const result = await repo.setBumpReminderMentionRole("guild-1", "role-1");

      expect(result).toBe(BUMP_REMINDER_MENTION_ROLE_RESULT.UPDATED);
      expect(prisma.guildBumpReminderConfig.update).toHaveBeenCalledWith({
        where: { guildId: "guild-1" },
        data: { mentionRoleId: "role-1" },
      });
    });

    it("sets mentionRoleId to null when undefined is passed", async () => {
      const prisma = createPrismaMock();
      prisma.guildBumpReminderConfig.findUnique.mockResolvedValue({
        guildId: "guild-1",
      });
      prisma.guildBumpReminderConfig.update.mockResolvedValue({});

      const { BumpReminderConfigRepository } = await loadModule();
      const repo = new BumpReminderConfigRepository(prisma as never);
      await repo.setBumpReminderMentionRole("guild-1", undefined);

      expect(prisma.guildBumpReminderConfig.update).toHaveBeenCalledWith({
        where: { guildId: "guild-1" },
        data: { mentionRoleId: null },
      });
    });
  });

  describe("addBumpReminderMentionUser", () => {
    it("returns NOT_CONFIGURED when record not found", async () => {
      const prisma = createPrismaMock();
      prisma.guildBumpReminderConfig.findUnique.mockResolvedValue(null);

      const { BumpReminderConfigRepository } = await loadModule();
      const repo = new BumpReminderConfigRepository(prisma as never);
      const result = await repo.addBumpReminderMentionUser("guild-1", "user-1");

      expect(result).toBe(BUMP_REMINDER_MENTION_USER_ADD_RESULT.NOT_CONFIGURED);
    });

    it("returns ALREADY_EXISTS when user is already in list", async () => {
      const prisma = createPrismaMock();
      prisma.guildBumpReminderConfig.findUnique.mockResolvedValue({
        guildId: "guild-1",
        mentionUserIds: '["user-1"]',
      });

      const { BumpReminderConfigRepository } = await loadModule();
      const repo = new BumpReminderConfigRepository(prisma as never);
      const result = await repo.addBumpReminderMentionUser("guild-1", "user-1");

      expect(result).toBe(BUMP_REMINDER_MENTION_USER_ADD_RESULT.ALREADY_EXISTS);
    });

    it("adds user and returns ADDED", async () => {
      const prisma = createPrismaMock();
      prisma.guildBumpReminderConfig.findUnique.mockResolvedValue({
        guildId: "guild-1",
        mentionUserIds: "[]",
      });
      prisma.guildBumpReminderConfig.update.mockResolvedValue({});

      const { BumpReminderConfigRepository } = await loadModule();
      const repo = new BumpReminderConfigRepository(prisma as never);
      const result = await repo.addBumpReminderMentionUser("guild-1", "user-1");

      expect(result).toBe(BUMP_REMINDER_MENTION_USER_ADD_RESULT.ADDED);
      expect(prisma.guildBumpReminderConfig.update).toHaveBeenCalledWith({
        where: { guildId: "guild-1" },
        data: { mentionUserIds: '["user-1"]' },
      });
    });
  });

  describe("removeBumpReminderMentionUser", () => {
    it("returns NOT_CONFIGURED when record not found", async () => {
      const prisma = createPrismaMock();
      prisma.guildBumpReminderConfig.findUnique.mockResolvedValue(null);

      const { BumpReminderConfigRepository } = await loadModule();
      const repo = new BumpReminderConfigRepository(prisma as never);
      const result = await repo.removeBumpReminderMentionUser(
        "guild-1",
        "user-1",
      );

      expect(result).toBe(
        BUMP_REMINDER_MENTION_USER_REMOVE_RESULT.NOT_CONFIGURED,
      );
    });

    it("returns NOT_FOUND when user not in list", async () => {
      const prisma = createPrismaMock();
      prisma.guildBumpReminderConfig.findUnique.mockResolvedValue({
        guildId: "guild-1",
        mentionUserIds: '["user-2"]',
      });

      const { BumpReminderConfigRepository } = await loadModule();
      const repo = new BumpReminderConfigRepository(prisma as never);
      const result = await repo.removeBumpReminderMentionUser(
        "guild-1",
        "user-1",
      );

      expect(result).toBe(BUMP_REMINDER_MENTION_USER_REMOVE_RESULT.NOT_FOUND);
    });

    it("removes user and returns REMOVED", async () => {
      const prisma = createPrismaMock();
      prisma.guildBumpReminderConfig.findUnique.mockResolvedValue({
        guildId: "guild-1",
        mentionUserIds: '["user-1","user-2"]',
      });
      prisma.guildBumpReminderConfig.update.mockResolvedValue({});

      const { BumpReminderConfigRepository } = await loadModule();
      const repo = new BumpReminderConfigRepository(prisma as never);
      const result = await repo.removeBumpReminderMentionUser(
        "guild-1",
        "user-1",
      );

      expect(result).toBe(BUMP_REMINDER_MENTION_USER_REMOVE_RESULT.REMOVED);
      expect(prisma.guildBumpReminderConfig.update).toHaveBeenCalledWith({
        where: { guildId: "guild-1" },
        data: { mentionUserIds: '["user-2"]' },
      });
    });
  });

  describe("clearBumpReminderMentionUsers", () => {
    it("returns NOT_CONFIGURED when record not found", async () => {
      const prisma = createPrismaMock();
      prisma.guildBumpReminderConfig.findUnique.mockResolvedValue(null);

      const { BumpReminderConfigRepository } = await loadModule();
      const repo = new BumpReminderConfigRepository(prisma as never);
      const result = await repo.clearBumpReminderMentionUsers("guild-1");

      expect(result).toBe(
        BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT.NOT_CONFIGURED,
      );
    });

    it("returns ALREADY_EMPTY when list is empty", async () => {
      const prisma = createPrismaMock();
      prisma.guildBumpReminderConfig.findUnique.mockResolvedValue({
        guildId: "guild-1",
        mentionUserIds: "[]",
      });

      const { BumpReminderConfigRepository } = await loadModule();
      const repo = new BumpReminderConfigRepository(prisma as never);
      const result = await repo.clearBumpReminderMentionUsers("guild-1");

      expect(result).toBe(
        BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT.ALREADY_EMPTY,
      );
    });

    it("clears list and returns CLEARED", async () => {
      const prisma = createPrismaMock();
      prisma.guildBumpReminderConfig.findUnique.mockResolvedValue({
        guildId: "guild-1",
        mentionUserIds: '["user-1"]',
      });
      prisma.guildBumpReminderConfig.update.mockResolvedValue({});

      const { BumpReminderConfigRepository } = await loadModule();
      const repo = new BumpReminderConfigRepository(prisma as never);
      const result = await repo.clearBumpReminderMentionUsers("guild-1");

      expect(result).toBe(BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT.CLEARED);
      expect(prisma.guildBumpReminderConfig.update).toHaveBeenCalledWith({
        where: { guildId: "guild-1" },
        data: { mentionUserIds: "[]" },
      });
    });
  });

  describe("clearBumpReminderMentions", () => {
    it("returns NOT_CONFIGURED when record not found", async () => {
      const prisma = createPrismaMock();
      prisma.guildBumpReminderConfig.findUnique.mockResolvedValue(null);

      const { BumpReminderConfigRepository } = await loadModule();
      const repo = new BumpReminderConfigRepository(prisma as never);
      const result = await repo.clearBumpReminderMentions("guild-1");

      expect(result).toBe(BUMP_REMINDER_MENTION_CLEAR_RESULT.NOT_CONFIGURED);
    });

    it("returns ALREADY_CLEARED when no role and empty users", async () => {
      const prisma = createPrismaMock();
      prisma.guildBumpReminderConfig.findUnique.mockResolvedValue({
        guildId: "guild-1",
        mentionRoleId: null,
        mentionUserIds: "[]",
      });

      const { BumpReminderConfigRepository } = await loadModule();
      const repo = new BumpReminderConfigRepository(prisma as never);
      const result = await repo.clearBumpReminderMentions("guild-1");

      expect(result).toBe(BUMP_REMINDER_MENTION_CLEAR_RESULT.ALREADY_CLEARED);
    });

    it("clears mentions and returns CLEARED when role is set", async () => {
      const prisma = createPrismaMock();
      prisma.guildBumpReminderConfig.findUnique.mockResolvedValue({
        guildId: "guild-1",
        mentionRoleId: "role-1",
        mentionUserIds: "[]",
      });
      prisma.guildBumpReminderConfig.update.mockResolvedValue({});

      const { BumpReminderConfigRepository } = await loadModule();
      const repo = new BumpReminderConfigRepository(prisma as never);
      const result = await repo.clearBumpReminderMentions("guild-1");

      expect(result).toBe(BUMP_REMINDER_MENTION_CLEAR_RESULT.CLEARED);
      expect(prisma.guildBumpReminderConfig.update).toHaveBeenCalledWith({
        where: { guildId: "guild-1" },
        data: { mentionRoleId: null, mentionUserIds: "[]" },
      });
    });

    it("clears mentions and returns CLEARED when users are set", async () => {
      const prisma = createPrismaMock();
      prisma.guildBumpReminderConfig.findUnique.mockResolvedValue({
        guildId: "guild-1",
        mentionRoleId: null,
        mentionUserIds: '["user-1"]',
      });
      prisma.guildBumpReminderConfig.update.mockResolvedValue({});

      const { BumpReminderConfigRepository } = await loadModule();
      const repo = new BumpReminderConfigRepository(prisma as never);
      const result = await repo.clearBumpReminderMentions("guild-1");

      expect(result).toBe(BUMP_REMINDER_MENTION_CLEAR_RESULT.CLEARED);
    });
  });
});
