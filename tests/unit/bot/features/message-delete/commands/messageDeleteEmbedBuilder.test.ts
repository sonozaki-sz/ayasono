// tests/unit/bot/features/message-delete/commands/messageDeleteEmbedBuilder.test.ts
// messageDeleteEmbedBuilder の単体テスト

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
  ),
}));

import type { ScannedMessage, MessageDeleteFilter } from "@/bot/features/message-delete/constants/messageDeleteConstants";

function makeMsg(
  id: string,
  authorId = "user-1",
  channelId = "ch-1",
  createdAt = new Date("2024-01-01T00:00:00Z"),
): ScannedMessage {
  return {
    messageId: id,
    guildId: "guild-1",
    authorId,
    authorDisplayName: `User ${authorId}`,
    channelId,
    channelName: "general",
    createdAt,
    content: `content of ${id}`,
  };
}

describe("bot/features/message-delete/commands/messageDeleteEmbedBuilder", () => {
  async function loadModule() {
    return import(
      "@/bot/features/message-delete/commands/messageDeleteEmbedBuilder"
    );
  }

  // ─────────────────────────────────────────────────────────────
  // buildFilteredMessages
  // ─────────────────────────────────────────────────────────────

  describe("buildFilteredMessages", () => {
    it("returns all messages when filter is empty", async () => {
      const { buildFilteredMessages } = await loadModule();
      const msgs = [makeMsg("msg-1"), makeMsg("msg-2")];
      const result = buildFilteredMessages(msgs, {});
      expect(result).toHaveLength(2);
    });

    it("filters by authorId", async () => {
      const { buildFilteredMessages } = await loadModule();
      const msgs = [
        makeMsg("msg-1", "user-1"),
        makeMsg("msg-2", "user-2"),
      ];
      const result = buildFilteredMessages(msgs, { authorId: "user-1" });
      expect(result).toHaveLength(1);
      expect(result[0].authorId).toBe("user-1");
    });

    it("filters by keyword (case-insensitive)", async () => {
      const { buildFilteredMessages } = await loadModule();
      const msgs = [makeMsg("msg-1"), makeMsg("msg-2")];
      msgs[0].content = "Hello World";
      msgs[1].content = "foo bar";
      const result = buildFilteredMessages(msgs, { keyword: "hello" });
      expect(result).toHaveLength(1);
    });

    it("filters by days (recent messages only)", async () => {
      const { buildFilteredMessages } = await loadModule();
      const now = Date.now();
      const recent = makeMsg(
        "msg-1",
        "user-1",
        "ch-1",
        new Date(now - 1000),
      );
      const old = makeMsg(
        "msg-2",
        "user-1",
        "ch-1",
        new Date(now - 10 * 24 * 60 * 60 * 1000),
      );
      const result = buildFilteredMessages([recent, old], { days: 3 });
      expect(result).toHaveLength(1);
      expect(result[0].messageId).toBe("msg-1");
    });

    it("filters by after date", async () => {
      const { buildFilteredMessages } = await loadModule();
      const after = new Date("2024-01-10T00:00:00Z");
      const msgs = [
        makeMsg("msg-1", "user-1", "ch-1", new Date("2024-01-15T00:00:00Z")),
        makeMsg("msg-2", "user-1", "ch-1", new Date("2024-01-05T00:00:00Z")),
      ];
      const result = buildFilteredMessages(msgs, { after });
      expect(result).toHaveLength(1);
      expect(result[0].messageId).toBe("msg-1");
    });

    it("filters by before date", async () => {
      const { buildFilteredMessages } = await loadModule();
      const before = new Date("2024-01-10T00:00:00Z");
      const msgs = [
        makeMsg("msg-1", "user-1", "ch-1", new Date("2024-01-15T00:00:00Z")),
        makeMsg("msg-2", "user-1", "ch-1", new Date("2024-01-05T00:00:00Z")),
      ];
      const result = buildFilteredMessages(msgs, { before });
      expect(result).toHaveLength(1);
      expect(result[0].messageId).toBe("msg-2");
    });

    it("combines multiple filters", async () => {
      const { buildFilteredMessages } = await loadModule();
      const msgs = [
        makeMsg("msg-1", "user-1", "ch-1", new Date("2024-01-15T00:00:00Z")),
        makeMsg("msg-2", "user-2", "ch-1", new Date("2024-01-15T00:00:00Z")),
      ];
      msgs[0].content = "hello";
      msgs[1].content = "world";
      const result = buildFilteredMessages(msgs, {
        authorId: "user-1",
        keyword: "hello",
      });
      expect(result).toHaveLength(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // buildPreviewEmbed
  // ─────────────────────────────────────────────────────────────

  describe("buildPreviewEmbed", () => {
    it("builds embed with messages for given page", async () => {
      const { buildPreviewEmbed } = await loadModule();
      const msgs = [makeMsg("msg-1"), makeMsg("msg-2")];
      const embed = buildPreviewEmbed(msgs, 0, 1, new Set());
      expect(embed).toBeDefined();
      // Embed should have fields
      expect(embed.data.fields?.length).toBeGreaterThan(0);
    });

    it("builds embed with excluded messages (strikethrough)", async () => {
      const { buildPreviewEmbed } = await loadModule();
      const msgs = [makeMsg("msg-1"), makeMsg("msg-2")];
      const embed = buildPreviewEmbed(msgs, 0, 1, new Set(["msg-1"]));
      expect(embed).toBeDefined();
      // First field should have strikethrough
      const firstField = embed.data.fields?.[0];
      expect(firstField?.name).toContain("~~");
    });

    it("shows zero targets description when no messages on page", async () => {
      const { buildPreviewEmbed } = await loadModule();
      const embed = buildPreviewEmbed([], 0, 0, new Set());
      expect(embed.data.description).toBeTruthy();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // buildFinalConfirmEmbed
  // ─────────────────────────────────────────────────────────────

  describe("buildFinalConfirmEmbed", () => {
    it("builds final confirm embed with messages", async () => {
      const { buildFinalConfirmEmbed } = await loadModule();
      const msgs = [makeMsg("msg-1"), makeMsg("msg-2")];
      const embed = buildFinalConfirmEmbed(msgs, 0, 1, 2);
      expect(embed).toBeDefined();
      expect(embed.data.fields?.length).toBeGreaterThan(0);
    });

    it("builds empty final confirm embed", async () => {
      const { buildFinalConfirmEmbed } = await loadModule();
      const embed = buildFinalConfirmEmbed([], 0, 0, 0);
      expect(embed).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // buildCompletionEmbed
  // ─────────────────────────────────────────────────────────────

  describe("buildCompletionEmbed", () => {
    it("builds completion embed with channel breakdown", async () => {
      const { buildCompletionEmbed } = await loadModule();
      const embed = buildCompletionEmbed(5, {
        "ch-1": { name: "general", count: 3 },
        "ch-2": { name: "random", count: 2 },
      });
      expect(embed).toBeDefined();
      expect(embed.data.fields?.length).toBeGreaterThan(0);
    });

    it("shows empty breakdown text when no channels deleted", async () => {
      const { buildCompletionEmbed } = await loadModule();
      const embed = buildCompletionEmbed(0, {});
      expect(embed).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // buildCommandConditionsEmbed
  // ─────────────────────────────────────────────────────────────

  describe("buildCommandConditionsEmbed", () => {
    it("builds embed with days option", async () => {
      const { buildCommandConditionsEmbed } = await loadModule();
      const embed = buildCommandConditionsEmbed({
        count: 100,
        targetUserId: "user-1",
        keyword: "hello",
        daysOption: 7,
        channelId: "ch-1",
      });
      expect(embed).toBeDefined();
      expect(embed.data.fields).toBeDefined();
    });

    it("builds embed with after/before options", async () => {
      const { buildCommandConditionsEmbed } = await loadModule();
      const embed = buildCommandConditionsEmbed({
        count: 1000,
        afterStr: "2024-01-01",
        beforeStr: "2024-01-31",
      });
      expect(embed).toBeDefined();
    });

    it("builds embed with no period options (shows none)", async () => {
      const { buildCommandConditionsEmbed } = await loadModule();
      const embed = buildCommandConditionsEmbed({
        count: 1000,
      });
      expect(embed).toBeDefined();
    });

    it("builds embed with only after option", async () => {
      const { buildCommandConditionsEmbed } = await loadModule();
      const embed = buildCommandConditionsEmbed({
        count: 1000,
        afterStr: "2024-01-01",
      });
      expect(embed).toBeDefined();
    });

    it("builds embed with only before option", async () => {
      const { buildCommandConditionsEmbed } = await loadModule();
      const embed = buildCommandConditionsEmbed({
        count: 1000,
        beforeStr: "2024-01-31",
      });
      expect(embed).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // buildPreviewComponents
  // ─────────────────────────────────────────────────────────────

  describe("buildPreviewComponents", () => {
    it("builds 5 action rows", async () => {
      const { buildPreviewComponents } = await loadModule();
      const msgs = [makeMsg("msg-1"), makeMsg("msg-2")];
      const filter: MessageDeleteFilter = {};
      const rows = buildPreviewComponents(msgs, msgs, 0, 1, filter, 2);
      expect(rows).toHaveLength(5);
    });

    it("builds components with days filter set", async () => {
      const { buildPreviewComponents } = await loadModule();
      const msgs = [makeMsg("msg-1")];
      const filter: MessageDeleteFilter = { days: 7 };
      const rows = buildPreviewComponents(msgs, msgs, 0, 1, filter, 1);
      expect(rows).toHaveLength(5);
    });

    it("builds components with after/before filter", async () => {
      const { buildPreviewComponents } = await loadModule();
      const msgs = [makeMsg("msg-1")];
      const filter: MessageDeleteFilter = {
        after: new Date("2024-01-01"),
        afterRaw: "2024-01-01",
        before: new Date("2024-01-31"),
        beforeRaw: "2024-01-31",
      };
      const rows = buildPreviewComponents(msgs, msgs, 0, 1, filter, 1);
      expect(rows).toHaveLength(5);
    });

    it("builds components with keyword filter", async () => {
      const { buildPreviewComponents } = await loadModule();
      const msgs = [makeMsg("msg-1")];
      const filter: MessageDeleteFilter = { keyword: "test" };
      const rows = buildPreviewComponents(msgs, msgs, 0, 1, filter, 1);
      expect(rows).toHaveLength(5);
    });

    it("builds components when page is empty", async () => {
      const { buildPreviewComponents } = await loadModule();
      const filter: MessageDeleteFilter = {};
      const rows = buildPreviewComponents([], [], 0, 0, filter, 0);
      expect(rows).toHaveLength(5);
    });

    it("builds components with excluded IDs set", async () => {
      const { buildPreviewComponents } = await loadModule();
      const msgs = [makeMsg("msg-1"), makeMsg("msg-2")];
      const filter: MessageDeleteFilter = {};
      const rows = buildPreviewComponents(
        msgs,
        msgs,
        0,
        1,
        filter,
        1,
        new Set(["msg-1"]),
      );
      expect(rows).toHaveLength(5);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // buildFinalConfirmComponents
  // ─────────────────────────────────────────────────────────────

  describe("buildFinalConfirmComponents", () => {
    it("builds 2 action rows", async () => {
      const { buildFinalConfirmComponents } = await loadModule();
      const rows = buildFinalConfirmComponents(0, 3, 5);
      expect(rows).toHaveLength(2);
    });
  });
});
