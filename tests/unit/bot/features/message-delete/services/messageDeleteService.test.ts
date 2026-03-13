// tests/unit/bot/features/message-delete/services/messageDeleteService.test.ts
// messageDeleteService の単体テスト（parseDateStr・scanMessages・deleteScannedMessages）

import { Collection } from "discord.js";
import type { Mock } from "vitest";

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
  ),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

/** Build a Discord.js-like Collection from an array of messages */
function makeCollection<T extends { id: string }>(msgs: T[]) {
  const col = new Collection<string, T>();
  for (const m of msgs) col.set(m.id, m);
  return col;
}

describe("bot/features/message-delete/services/messageDeleteService", () => {
  async function loadModule() {
    return import(
      "@/bot/features/message-delete/services/messageDeleteService"
    );
  }

  // ─────────────────────────────────────────────────────────────
  // parseDateStr
  // ─────────────────────────────────────────────────────────────

  describe("parseDateStr", () => {
    it("parses YYYY-MM-DD format with endOfDay=false", async () => {
      const { parseDateStr } = await loadModule();
      const result = parseDateStr("2024-01-15", false, "+00:00");
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe("2024-01-15T00:00:00.000Z");
    });

    it("parses YYYY-MM-DD format with endOfDay=true", async () => {
      const { parseDateStr } = await loadModule();
      const result = parseDateStr("2024-01-15", true, "+00:00");
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe("2024-01-15T23:59:59.000Z");
    });

    it("applies timezone offset to YYYY-MM-DD format", async () => {
      const { parseDateStr } = await loadModule();
      const result = parseDateStr("2024-01-15", false, "+09:00");
      expect(result).toBeInstanceOf(Date);
      // 2024-01-15T00:00:00+09:00 = 2024-01-14T15:00:00Z
      expect(result?.toISOString()).toBe("2024-01-14T15:00:00.000Z");
    });

    it("parses YYYY-MM-DDTHH:MM:SS format without offset", async () => {
      const { parseDateStr } = await loadModule();
      const result = parseDateStr("2024-01-15T12:30:45", false, "+00:00");
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe("2024-01-15T12:30:45.000Z");
    });

    it("parses YYYY-MM-DDTHH:MM:SS+offset format", async () => {
      const { parseDateStr } = await loadModule();
      const result = parseDateStr("2024-01-15T12:30:45+09:00", false, "+00:00");
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe("2024-01-15T03:30:45.000Z");
    });

    it("parses YYYY-MM-DDTHH:MM:SSZ format", async () => {
      const { parseDateStr } = await loadModule();
      const result = parseDateStr("2024-01-15T12:30:45Z", false, "+00:00");
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe("2024-01-15T12:30:45.000Z");
    });

    it("returns null for invalid format", async () => {
      const { parseDateStr } = await loadModule();
      expect(parseDateStr("not-a-date", false, "+00:00")).toBeNull();
      expect(parseDateStr("2024/01/15", false, "+00:00")).toBeNull();
      expect(parseDateStr("15-01-2024", false, "+00:00")).toBeNull();
    });

    it("returns null when date is NaN", async () => {
      const { parseDateStr } = await loadModule();
      // A format that passes regex but produces NaN date
      // e.g. month 99
      expect(parseDateStr("2024-99-01", false, "+00:00")).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // scanMessages
  // ─────────────────────────────────────────────────────────────

  describe("scanMessages", () => {
    function makeMessage(
      id: string,
      authorId: string,
      content: string,
      createdTimestamp: number,
      opts: { attachments?: number; embeds?: { title?: string }[] } = {},
    ) {
      return {
        id,
        author: { id: authorId, displayName: authorId },
        webhookId: null,
        content,
        createdTimestamp,
        createdAt: new Date(createdTimestamp),
        member: null,
        attachments: {
          size: opts.attachments ?? 0,
        },
        embeds: opts.embeds ?? [],
      };
    }

    function makeChannel(
      id: string,
      opts: { hasPermission?: boolean; meNull?: boolean } = {},
    ) {
      const hasPermission = opts.hasPermission ?? true;
      return {
        id,
        name: `channel-${id}`,
        guildId: "guild-1",
        guild: {
          members: {
            me: opts.meNull
              ? null
              : {
                  displayName: "Bot",
                },
          },
        },
        permissionsFor: vi.fn(() =>
          opts.meNull ? null : { has: vi.fn(() => hasPermission) },
        ),
        messages: {
          fetch: vi.fn().mockResolvedValue(makeCollection([])) as Mock,
        },
      };
    }

    it("returns empty array when channels have no permissions", async () => {
      const { scanMessages } = await loadModule();
      const channel = makeChannel("ch-1", { hasPermission: false });
      const result = await scanMessages([channel as never], {
        count: 10,
        afterTs: 0,
        beforeTs: Infinity,
      });
      expect(result).toEqual([]);
    });

    it("scans messages from a channel", async () => {
      const { scanMessages } = await loadModule();

      const now = Date.now();
      const msg1 = makeMessage("msg-1", "user-1", "hello", now - 1000);
      const msg2 = makeMessage("msg-2", "user-2", "world", now - 2000);

      const channel = makeChannel("ch-1");
      (channel.messages.fetch as Mock)
        .mockResolvedValueOnce(makeCollection([msg1, msg2]))
        .mockResolvedValue(makeCollection([]));

      const result = await scanMessages([channel as never], {
        count: 10,
        afterTs: 0,
        beforeTs: Infinity,
      });

      expect(result).toHaveLength(2);
    });

    it("filters by targetUserId", async () => {
      const { scanMessages } = await loadModule();

      const now = Date.now();
      const msg1 = makeMessage("msg-1", "user-1", "hello", now - 1000);
      const msg2 = makeMessage("msg-2", "user-2", "world", now - 2000);

      const channel = makeChannel("ch-1");
      (channel.messages.fetch as Mock)
        .mockResolvedValueOnce(makeCollection([msg1, msg2]))
        .mockResolvedValue(makeCollection([]));

      const result = await scanMessages([channel as never], {
        count: 10,
        targetUserId: "user-1",
        afterTs: 0,
        beforeTs: Infinity,
      });

      expect(result).toHaveLength(1);
      expect(result[0].authorId).toBe("user-1");
    });

    it("filters by keyword", async () => {
      const { scanMessages } = await loadModule();

      const now = Date.now();
      const msg1 = makeMessage("msg-1", "user-1", "hello world", now - 1000);
      const msg2 = makeMessage("msg-2", "user-2", "foo bar", now - 2000);

      const channel = makeChannel("ch-1");
      (channel.messages.fetch as Mock)
        .mockResolvedValueOnce(makeCollection([msg1, msg2]))
        .mockResolvedValue(makeCollection([]));

      const result = await scanMessages([channel as never], {
        count: 10,
        keyword: "hello",
        afterTs: 0,
        beforeTs: Infinity,
      });

      expect(result).toHaveLength(1);
    });

    it("stops scanning when count limit is reached", async () => {
      const { scanMessages } = await loadModule();

      const now = Date.now();
      const msgs = Array.from({ length: 5 }, (_, i) =>
        makeMessage(`msg-${i}`, "user-1", `msg ${i}`, now - i * 1000),
      );

      const channel = makeChannel("ch-1");
      (channel.messages.fetch as Mock)
        .mockResolvedValueOnce(makeCollection(msgs))
        .mockResolvedValue(makeCollection([]));

      const result = await scanMessages([channel as never], {
        count: 3,
        afterTs: 0,
        beforeTs: Infinity,
      });

      expect(result).toHaveLength(3);
    });

    it("respects abort signal when already aborted", async () => {
      const { scanMessages } = await loadModule();

      const controller = new AbortController();
      const channel = makeChannel("ch-1");
      (channel.messages.fetch as Mock).mockResolvedValue(makeCollection([]));

      controller.abort();

      const result = await scanMessages([channel as never], {
        count: 10,
        afterTs: 0,
        beforeTs: Infinity,
        signal: controller.signal,
      });

      expect(result).toEqual([]);
    });

    it("builds display content with attachments", async () => {
      const { scanMessages } = await loadModule();

      const now = Date.now();
      const msg = makeMessage("msg-1", "user-1", "", now - 1000, {
        attachments: 2,
      });

      const channel = makeChannel("ch-1");
      (channel.messages.fetch as Mock)
        .mockResolvedValueOnce(makeCollection([msg]))
        .mockResolvedValue(makeCollection([]));

      const result = await scanMessages([channel as never], {
        count: 10,
        afterTs: 0,
        beforeTs: Infinity,
      });

      expect(result).toHaveLength(1);
    });

    it("builds display content with embeds (with title and without)", async () => {
      const { scanMessages } = await loadModule();

      const now = Date.now();
      const msg = makeMessage("msg-1", "user-1", "", now - 1000, {
        embeds: [{ title: "My Title" }, {}],
      });

      const channel = makeChannel("ch-1");
      (channel.messages.fetch as Mock)
        .mockResolvedValueOnce(makeCollection([msg]))
        .mockResolvedValue(makeCollection([]));

      const result = await scanMessages([channel as never], {
        count: 10,
        afterTs: 0,
        beforeTs: Infinity,
      });

      expect(result).toHaveLength(1);
    });

    it("calls onProgress callback", async () => {
      const { scanMessages } = await loadModule();

      const onProgress = vi.fn().mockResolvedValue(undefined);
      const channel = makeChannel("ch-1");
      (channel.messages.fetch as Mock).mockResolvedValue(makeCollection([]));

      await scanMessages([channel as never], {
        count: 10,
        afterTs: 0,
        beforeTs: Infinity,
        onProgress,
      });

      expect(onProgress).toHaveBeenCalled();
    });

    it("handles channels without me member (no permission check)", async () => {
      const { scanMessages } = await loadModule();

      const now = Date.now();
      const msg = makeMessage("msg-1", "user-1", "hello", now - 1000);

      const channel = makeChannel("ch-1", { meNull: true });
      (channel.messages.fetch as Mock)
        .mockResolvedValueOnce(makeCollection([msg]))
        .mockResolvedValue(makeCollection([]));

      const result = await scanMessages([channel as never], {
        count: 10,
        afterTs: 0,
        beforeTs: Infinity,
      });

      expect(result).toHaveLength(1);
    });

    it("truncates long content to max length", async () => {
      const { scanMessages } = await loadModule();

      const now = Date.now();
      const longContent = "a".repeat(300);
      const msg = makeMessage("msg-1", "user-1", longContent, now - 1000);

      const channel = makeChannel("ch-1");
      (channel.messages.fetch as Mock)
        .mockResolvedValueOnce(makeCollection([msg]))
        .mockResolvedValue(makeCollection([]));

      const result = await scanMessages([channel as never], {
        count: 10,
        afterTs: 0,
        beforeTs: Infinity,
      });

      expect(result[0].content.length).toBeLessThanOrEqual(201); // 200 chars + "…"
      expect(result[0].content.endsWith("…")).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // deleteScannedMessages
  // ─────────────────────────────────────────────────────────────

  describe("deleteScannedMessages", () => {
    function makeScannedMessage(
      id: string,
      channelId: string,
      ageMs: number,
      channelWithBulkDelete = true,
    ) {
      const channel: Record<string, unknown> = {
        id: channelId,
        messages: {
          delete: vi.fn().mockResolvedValue(undefined) as Mock,
        },
      };
      if (channelWithBulkDelete) {
        channel.bulkDelete = vi
          .fn()
          .mockResolvedValue(makeCollection([{ id }])) as Mock;
      }
      return {
        messageId: id,
        guildId: "guild-1",
        authorId: "user-1",
        authorDisplayName: "User",
        channelId,
        channelName: `channel-${channelId}`,
        createdAt: new Date(Date.now() - ageMs),
        content: "hello",
        _channel: channel,
      };
    }

    it("bulk deletes recent messages (< 14 days)", async () => {
      const { deleteScannedMessages } = await loadModule();

      const msg = makeScannedMessage("msg-1", "ch-1", 1000);
      const result = await deleteScannedMessages([msg as never]);

      expect(result.totalDeleted).toBe(1);
      expect(result.channelBreakdown["ch-1"]).toEqual({
        name: "channel-ch-1",
        count: 1,
      });
      expect(msg._channel.bulkDelete).toHaveBeenCalled();
    });

    it("individually deletes old messages (> 14 days)", async () => {
      const { deleteScannedMessages } = await loadModule();

      const twoWeeksMs = 14 * 24 * 60 * 60 * 1000 + 1000;
      const msg = makeScannedMessage("msg-1", "ch-1", twoWeeksMs);
      const result = await deleteScannedMessages([msg as never]);

      expect(result.totalDeleted).toBe(1);
      expect(
        (msg._channel.messages as { delete: Mock }).delete,
      ).toHaveBeenCalledWith("msg-1");
    });

    it("uses individual delete for channels without bulkDelete", async () => {
      const { deleteScannedMessages } = await loadModule();

      const msg = makeScannedMessage("msg-1", "ch-1", 1000, false);
      const result = await deleteScannedMessages([msg as never]);

      expect(result.totalDeleted).toBe(1);
      expect(
        (msg._channel.messages as { delete: Mock }).delete,
      ).toHaveBeenCalledWith("msg-1");
    });

    it("handles delete errors gracefully", async () => {
      const { deleteScannedMessages } = await loadModule();

      const twoWeeksMs = 14 * 24 * 60 * 60 * 1000 + 1000;
      const msg = makeScannedMessage("msg-1", "ch-1", twoWeeksMs);
      (msg._channel.messages as { delete: Mock }).delete = vi
        .fn()
        .mockRejectedValue(new Error("Not found")) as Mock;

      const result = await deleteScannedMessages([msg as never]);
      // Error is caught, totalDeleted stays 0
      expect(result.totalDeleted).toBe(0);
    });

    it("respects abort signal", async () => {
      const { deleteScannedMessages } = await loadModule();

      const controller = new AbortController();
      controller.abort();

      const msg = makeScannedMessage("msg-1", "ch-1", 1000);
      const result = await deleteScannedMessages(
        [msg as never],
        undefined,
        controller.signal,
      );

      expect(result.totalDeleted).toBe(0);
    });

    it("returns empty breakdown for empty messages array", async () => {
      const { deleteScannedMessages } = await loadModule();
      const result = await deleteScannedMessages([]);
      expect(result.totalDeleted).toBe(0);
      expect(result.channelBreakdown).toEqual({});
    });

    it("calls onProgress callback", async () => {
      const { deleteScannedMessages } = await loadModule();

      const onProgress = vi.fn().mockResolvedValue(undefined);
      const msg = makeScannedMessage("msg-1", "ch-1", 1000);
      await deleteScannedMessages([msg as never], onProgress);

      expect(onProgress).toHaveBeenCalled();
    });

    it("handles multiple messages in same channel", async () => {
      const { deleteScannedMessages } = await loadModule();

      const channel: Record<string, unknown> = {
        id: "ch-1",
        messages: { delete: vi.fn().mockResolvedValue(undefined) as Mock },
        bulkDelete: vi
          .fn()
          .mockResolvedValue(makeCollection([{ id: "msg-1" }, { id: "msg-2" }])) as Mock,
      };

      const makeMsg = (id: string) => ({
        messageId: id,
        guildId: "guild-1",
        authorId: "user-1",
        authorDisplayName: "User",
        channelId: "ch-1",
        channelName: "channel-ch-1",
        createdAt: new Date(Date.now() - 1000),
        content: "hello",
        _channel: channel,
      });

      const result = await deleteScannedMessages(
        [makeMsg("msg-1") as never, makeMsg("msg-2") as never],
      );

      expect(result.totalDeleted).toBe(2);
      expect(result.channelBreakdown["ch-1"].count).toBe(2);
    });
  });
});
