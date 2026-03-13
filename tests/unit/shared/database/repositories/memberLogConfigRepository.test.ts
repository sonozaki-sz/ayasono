// tests/unit/shared/database/repositories/memberLogConfigRepository.test.ts

import type { Mock } from "vitest";

function createPrismaMock() {
  return {
    guildMemberLogConfig: {
      findUnique: vi.fn() as Mock,
      upsert: vi.fn() as Mock,
    },
  };
}

describe("shared/database/repositories/memberLogConfigRepository", () => {
  async function loadModule() {
    return import("@/shared/database/repositories/memberLogConfigRepository");
  }

  describe("getMemberLogConfig", () => {
    it("returns null when record not found", async () => {
      const prisma = createPrismaMock();
      prisma.guildMemberLogConfig.findUnique.mockResolvedValue(null);

      const { MemberLogConfigRepository } = await loadModule();
      const repo = new MemberLogConfigRepository(prisma as never);
      const result = await repo.getMemberLogConfig("guild-1");

      expect(result).toBeNull();
      expect(prisma.guildMemberLogConfig.findUnique).toHaveBeenCalledWith({
        where: { guildId: "guild-1" },
      });
    });

    it("returns MemberLogConfig with all fields from record", async () => {
      const prisma = createPrismaMock();
      prisma.guildMemberLogConfig.findUnique.mockResolvedValue({
        guildId: "guild-1",
        enabled: true,
        channelId: "ch-1",
        joinMessage: "Welcome {user}!",
        leaveMessage: "Goodbye {user}!",
      });

      const { MemberLogConfigRepository } = await loadModule();
      const repo = new MemberLogConfigRepository(prisma as never);
      const result = await repo.getMemberLogConfig("guild-1");

      expect(result).toEqual({
        enabled: true,
        channelId: "ch-1",
        joinMessage: "Welcome {user}!",
        leaveMessage: "Goodbye {user}!",
      });
    });

    it("returns undefined for null optional fields", async () => {
      const prisma = createPrismaMock();
      prisma.guildMemberLogConfig.findUnique.mockResolvedValue({
        guildId: "guild-1",
        enabled: false,
        channelId: null,
        joinMessage: null,
        leaveMessage: null,
      });

      const { MemberLogConfigRepository } = await loadModule();
      const repo = new MemberLogConfigRepository(prisma as never);
      const result = await repo.getMemberLogConfig("guild-1");

      expect(result).toEqual({
        enabled: false,
        channelId: undefined,
        joinMessage: undefined,
        leaveMessage: undefined,
      });
    });
  });

  describe("updateMemberLogConfig", () => {
    it("upserts record with all provided values", async () => {
      const prisma = createPrismaMock();
      prisma.guildMemberLogConfig.upsert.mockResolvedValue({});

      const { MemberLogConfigRepository } = await loadModule();
      const repo = new MemberLogConfigRepository(prisma as never);
      await repo.updateMemberLogConfig("guild-1", {
        enabled: true,
        channelId: "ch-1",
        joinMessage: "Welcome!",
        leaveMessage: "Goodbye!",
      });

      expect(prisma.guildMemberLogConfig.upsert).toHaveBeenCalledWith({
        where: { guildId: "guild-1" },
        create: {
          guildId: "guild-1",
          enabled: true,
          channelId: "ch-1",
          joinMessage: "Welcome!",
          leaveMessage: "Goodbye!",
        },
        update: {
          enabled: true,
          channelId: "ch-1",
          joinMessage: "Welcome!",
          leaveMessage: "Goodbye!",
        },
      });
    });

    it("uses null for undefined optional fields", async () => {
      const prisma = createPrismaMock();
      prisma.guildMemberLogConfig.upsert.mockResolvedValue({});

      const { MemberLogConfigRepository } = await loadModule();
      const repo = new MemberLogConfigRepository(prisma as never);
      await repo.updateMemberLogConfig("guild-1", { enabled: false });

      expect(prisma.guildMemberLogConfig.upsert).toHaveBeenCalledWith({
        where: { guildId: "guild-1" },
        create: {
          guildId: "guild-1",
          enabled: false,
          channelId: null,
          joinMessage: null,
          leaveMessage: null,
        },
        update: {
          enabled: false,
          channelId: null,
          joinMessage: null,
          leaveMessage: null,
        },
      });
    });
  });
});
