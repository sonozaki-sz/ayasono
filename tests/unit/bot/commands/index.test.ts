// tests/unit/bot/commands/index.test.ts
// commandLoader が commands/ ディレクトリを自動スキャンして
// 有効な Command オブジェクトのみを返すことを検証する

import { loadCommands } from "@/bot/utils/commandLoader";

// コマンドファイルが依存する外部モジュールをスタブ化（実行時コストを削減）
vi.mock("@/shared/locale/commandLocalizations", () => ({
  getCommandLocalizations: vi.fn(() => ({
    ja: "test-description",
    localizations: {},
  })),
}));
vi.mock("@/shared/locale/localeManager", () => ({
  tShared: vi.fn((key: string) => key),
  tDefault: vi.fn((key: string) => key),
}));
vi.mock("@/shared/utils/prisma", () => ({
  getPrismaClient: vi.fn(),
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

// 現在 commands/ に登録済みのコマンド名（新規追加時はここへの手動追加不要）
const KNOWN_COMMAND_NAMES = [
  "afk",
  "afk-config",
  "bump-reminder-config",
  "member-log-config",
  "message-delete",
  "message-delete-config",
  "sticky-message",
  "vac",
  "vac-config",
  "ping",
];

describe("commandLoader", () => {
  it("commands/ ディレクトリから Command オブジェクトを自動ロードする", async () => {
    const commands = await loadCommands();

    expect(commands.length).toBeGreaterThan(0);
  });

  it("ロードされた各コマンドは data と execute を持つ", async () => {
    const commands = await loadCommands();

    for (const cmd of commands) {
      expect(cmd.data).toBeDefined();
      expect(typeof cmd.execute).toBe("function");
      expect(typeof cmd.data.name).toBe("string");
    }
  });

  it("コマンド名が重複していない（export default との二重収集がない）", async () => {
    const commands = await loadCommands();
    const names = commands.map((c) => c.data.name);
    const uniqueNames = new Set(names);

    // export default と named export の両方を持つファイルで同一コマンドが二重登録されないことを保証
    expect(names.length).toBe(uniqueNames.size);
  });

  it("既知のコマンドがすべて含まれている", async () => {
    const commands = await loadCommands();
    const names = commands.map((c) => c.data.name);

    for (const expectedName of KNOWN_COMMAND_NAMES) {
      expect(names).toContain(expectedName);
    }
  });
});
