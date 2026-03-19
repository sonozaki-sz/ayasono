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
  tInteraction: (...args: unknown[]) => args[1],
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
  "messageDelete",
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

  // events ディレクトリが存在しない場合に ENOENT を詳細メッセージ付きで再スローすることを確認
  it("存在しないパスを指定すると ENOENT 専用メッセージで投げる", async () => {
    await expect(
      loadEvents("/absolutely/nonexistent/xyz/events"),
    ).rejects.toThrow("[eventLoader]");
  });

  // ENOENT 以外のエラー（ファイルをパスに指定 → ENOTDIR）はそのまま再スローすることを確認
  it("ENOENT 以外のファイルシステムエラーはそのまま再スローする", async () => {
    const thisFilePath = new URL(import.meta.url).pathname;
    await expect(loadEvents(thisFilePath)).rejects.not.toThrow("[eventLoader]");
    await expect(loadEvents(thisFilePath)).rejects.toThrow();
  });
});
