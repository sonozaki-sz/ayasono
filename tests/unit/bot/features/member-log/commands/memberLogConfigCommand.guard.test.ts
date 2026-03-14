// tests/unit/bot/features/member-log/commands/memberLogConfigCommand.guard.test.ts
import { ensureMemberLogManageGuildPermission } from "@/bot/features/member-log/commands/memberLogConfigCommand.guard";
import { ValidationError } from "@/shared/errors/customErrors";

// ---- モック定義 ----
const tGuildMock = vi.fn(async (_guildId: string, key: string) => key);

vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: (guildId: string, key: string) => tGuildMock(guildId, key),
}));

// ---- ヘルパー ----

/** テスト用 interaction モックを生成する */
function makeInteraction(hasPermission: boolean | null) {
  return {
    memberPermissions:
      hasPermission === null ? null : { has: vi.fn(() => hasPermission) },
  };
}

// ensureMemberLogManageGuildPermission の権限チェック動作を検証
describe("bot/features/member-log/commands/memberLogConfigCommand.guard", () => {
  // 各テストでモック呼び出し記録をリセットし、テスト間の副作用を排除する
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ManageGuild 権限がある場合は正常終了することを確認", async () => {
    const interaction = makeInteraction(true);

    await expect(
      ensureMemberLogManageGuildPermission(interaction as never, "guild-1"),
    ).resolves.toBeUndefined();
  });

  it("ManageGuild 権限がない場合に ValidationError を投げることを確認", async () => {
    const interaction = makeInteraction(false);

    await expect(
      ensureMemberLogManageGuildPermission(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("memberPermissions が null の場合に ValidationError を投げることを確認", async () => {
    const interaction = makeInteraction(null);

    await expect(
      ensureMemberLogManageGuildPermission(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

});
