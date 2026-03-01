// tests/unit/bot/events/index.test.ts
// eventLoader が events/ ディレクトリを自動スキャンして
// 有効な BotEvent オブジェクトのみを返すことを検証する

import { loadEvents } from "@/bot/utils/eventLoader";

// イベントファイルが依存する外部モジュールをスタブ化
vi.mock("@/shared/utils/prisma", () => ({
  getPrismaClient: vi.fn(),
}));
vi.mock("@/shared/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));
vi.mock("@/shared/locale/localeManager", () => ({
  tShared: vi.fn((key: string) => key),
  tDefault: vi.fn((key: string) => key),
}));
vi.mock("@/bot/services/botCompositionRoot", () => ({
  getBotCompositionRoot: vi.fn(() => ({
    afkService: {},
    memberLogService: {},
    bumpReminderService: {},
    messageDeleteService: {},
    stickyMessageService: {},
    vacService: {},
  })),
}));

// 現在 events/ に登録済みのイベント名（新規追加時はここへの手動追加不要）
const KNOWN_EVENT_NAMES = [
  "channelDelete",
  "clientReady",
  "guildMemberAdd",
  "guildMemberRemove",
  "interactionCreate",
  "messageCreate",
  "voiceStateUpdate",
];

describe("eventLoader", () => {
  it("events/ ディレクトリから BotEvent オブジェクトを自動ロードする", async () => {
    const events = await loadEvents();

    expect(events.length).toBeGreaterThan(0);
  });

  it("ロードされた各イベントは name と execute を持つ", async () => {
    const events = await loadEvents();

    for (const event of events) {
      expect(event.name).toBeDefined();
      expect(typeof event.execute).toBe("function");
    }
  });

  it("既知のイベントがすべて含まれている", async () => {
    const events = await loadEvents();
    const names = events.map((e) => e.name);

    for (const expectedName of KNOWN_EVENT_NAMES) {
      expect(names).toContain(expectedName);
    }
  });
});
