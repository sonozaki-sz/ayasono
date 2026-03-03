// tests/unit/bot/commands/vc-recruit-config.test.ts
import type { Mock } from "vitest";

const executeVcRecruitConfigCommandMock: Mock = vi.fn();
const autocompleteVcRecruitConfigCommandMock: Mock = vi.fn();

vi.mock(
  "@/bot/features/vc-recruit/commands/vcRecruitConfigCommand.execute",
  () => ({
    executeVcRecruitConfigCommand: executeVcRecruitConfigCommandMock,
  }),
);

vi.mock(
  "@/bot/features/vc-recruit/commands/vcRecruitConfigCommand.autocomplete",
  () => ({
    autocompleteVcRecruitConfigCommand: autocompleteVcRecruitConfigCommandMock,
  }),
);

describe("bot/commands/vc-recruit-config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports vcRecruitConfigCommand with expected structure", async () => {
    const { vcRecruitConfigCommand } =
      await import("@/bot/commands/vc-recruit-config");

    expect(vcRecruitConfigCommand).toBeDefined();
    expect(vcRecruitConfigCommand.data).toBeDefined();
    expect(typeof vcRecruitConfigCommand.execute).toBe("function");
    expect(typeof vcRecruitConfigCommand.autocomplete).toBe("function");
    expect(vcRecruitConfigCommand.cooldown).toBe(3);
  });

  it("has correct command name", async () => {
    const { vcRecruitConfigCommand } =
      await import("@/bot/commands/vc-recruit-config");

    expect(vcRecruitConfigCommand.data.name).toBe("vc-recruit-config");
  });

  // execute は executeVcRecruitConfigCommand へ委譲する
  it("execute delegates to executeVcRecruitConfigCommand", async () => {
    const { vcRecruitConfigCommand } =
      await import("@/bot/commands/vc-recruit-config");
    const interaction = { id: "int-1" } as never;
    executeVcRecruitConfigCommandMock.mockResolvedValue(undefined);

    await vcRecruitConfigCommand.execute(interaction);

    expect(executeVcRecruitConfigCommandMock).toHaveBeenCalledWith(interaction);
  });

  // autocomplete は autocompleteVcRecruitConfigCommand へ委譲する
  it("autocomplete delegates to autocompleteVcRecruitConfigCommand", async () => {
    const { vcRecruitConfigCommand } =
      await import("@/bot/commands/vc-recruit-config");
    const interaction = { id: "int-autocomplete" } as never;
    autocompleteVcRecruitConfigCommandMock.mockResolvedValue(undefined);

    await vcRecruitConfigCommand.autocomplete!(interaction);

    expect(autocompleteVcRecruitConfigCommandMock).toHaveBeenCalledWith(
      interaction,
    );
  });

  it("default export equals named export", async () => {
    const mod = await import("@/bot/commands/vc-recruit-config");
    expect(mod.default).toBe(mod.vcRecruitConfigCommand);
  });
});
