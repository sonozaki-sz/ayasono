// tests/unit/shared/database/repositories/vacConfigRepository.test.ts

import type { Mock } from "vitest";

function createPrismaMock() {
  return {
    guildVacConfig: {
      findUnique: vi.fn() as Mock,
      upsert: vi.fn() as Mock,
    },
  };
}

describe("shared/database/repositories/vacConfigRepository", () => {
  async function loadModule() {
    return import("@/shared/database/repositories/vacConfigRepository");
  }

  describe("getVacConfig", () => {
    it("returns null when record not found", async () => {
      const prisma = createPrismaMock();
      prisma.guildVacConfig.findUnique.mockResolvedValue(null);

      const { VacConfigRepository } = await loadModule();
      const repo = new VacConfigRepository(prisma as never);
      const result = await repo.getVacConfig("guild-1");

      expect(result).toBeNull();
      expect(prisma.guildVacConfig.findUnique).toHaveBeenCalledWith({
        where: { guildId: "guild-1" },
      });
    });

    it("returns VacConfig with parsed arrays from record", async () => {
      const prisma = createPrismaMock();
      prisma.guildVacConfig.findUnique.mockResolvedValue({
        guildId: "guild-1",
        enabled: true,
        triggerChannelIds: '["ch-1","ch-2"]',
        createdChannels: '[{"voiceChannelId":"v1","ownerId":"owner-1","createdAt":0}]',
      });

      const { VacConfigRepository } = await loadModule();
      const repo = new VacConfigRepository(prisma as never);
      const result = await repo.getVacConfig("guild-1");

      expect(result).toEqual({
        enabled: true,
        triggerChannelIds: ["ch-1", "ch-2"],
        createdChannels: [{ voiceChannelId: "v1", ownerId: "owner-1", createdAt: 0 }],
      });
    });

    it("returns empty arrays for invalid JSON", async () => {
      const prisma = createPrismaMock();
      prisma.guildVacConfig.findUnique.mockResolvedValue({
        guildId: "guild-1",
        enabled: true,
        triggerChannelIds: "not-json",
        createdChannels: "also-not-json",
      });

      const { VacConfigRepository } = await loadModule();
      const repo = new VacConfigRepository(prisma as never);
      const result = await repo.getVacConfig("guild-1");

      expect(result).toEqual({
        enabled: true,
        triggerChannelIds: [],
        createdChannels: [],
      });
    });

    it("returns empty arrays for non-array JSON", async () => {
      const prisma = createPrismaMock();
      prisma.guildVacConfig.findUnique.mockResolvedValue({
        guildId: "guild-1",
        enabled: true,
        triggerChannelIds: '"a string"',
        createdChannels: '{"not":"array"}',
      });

      const { VacConfigRepository } = await loadModule();
      const repo = new VacConfigRepository(prisma as never);
      const result = await repo.getVacConfig("guild-1");

      expect(result).toEqual({
        enabled: true,
        triggerChannelIds: [],
        createdChannels: [],
      });
    });
  });

  describe("updateVacConfig", () => {
    it("upserts record with JSON-stringified arrays", async () => {
      const prisma = createPrismaMock();
      prisma.guildVacConfig.upsert.mockResolvedValue({});

      const { VacConfigRepository } = await loadModule();
      const repo = new VacConfigRepository(prisma as never);
      await repo.updateVacConfig("guild-1", {
        enabled: true,
        triggerChannelIds: ["ch-1"],
        createdChannels: [{ voiceChannelId: "v1", ownerId: "owner-1", createdAt: 0 }],
      });

      expect(prisma.guildVacConfig.upsert).toHaveBeenCalledWith({
        where: { guildId: "guild-1" },
        create: {
          guildId: "guild-1",
          enabled: true,
          triggerChannelIds: '["ch-1"]',
          createdChannels: '[{"voiceChannelId":"v1","ownerId":"owner-1","createdAt":0}]',
        },
        update: {
          enabled: true,
          triggerChannelIds: '["ch-1"]',
          createdChannels: '[{"voiceChannelId":"v1","ownerId":"owner-1","createdAt":0}]',
        },
      });
    });
  });
});
