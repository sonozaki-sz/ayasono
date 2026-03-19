// tests/unit/bot/features/ping/commands/pingCommand.execute.test.ts
import { executePingCommand } from "@/bot/features/ping/commands/pingCommand.execute";
import { createSuccessEmbed } from "@/bot/utils/messageResponse";

vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: vi.fn(),
  tInteraction: vi.fn((_locale: string, key: string) => key),
}));

vi.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: vi.fn((description: string) => ({ description })),
}));

function createInteraction() {
  return {
    guildId: "guild-1",
    locale: "ja",
    createdTimestamp: 1_000,
    client: { ws: { ping: 42 } },
    reply: vi.fn().mockResolvedValue(undefined),
    fetchReply: vi.fn().mockResolvedValue({ createdTimestamp: 1_130 }),
    editReply: vi.fn().mockResolvedValue(undefined),
  };
}

describe("bot/features/ping/commands/pingCommand.execute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("計測中メッセージを返信し、レイテンシ embed で編集する", async () => {
    const interaction = createInteraction();

    await executePingCommand(interaction as never);

    // tInteraction returns the key as-is
    expect(interaction.reply).toHaveBeenCalledWith({ content: "commands:ping.embed.measuring" });
    expect(createSuccessEmbed).toHaveBeenCalledWith("commands:ping.embed.response");
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: "",
      embeds: [{ description: "commands:ping.embed.response" }],
    });
  });

  it("interaction の locale が使用されること", async () => {
    const interaction = createInteraction();
    interaction.locale = "en-US" as never;

    await executePingCommand(interaction as never);

    const { tInteraction } = await import("@/shared/locale/localeManager");
    expect(tInteraction).toHaveBeenCalledWith(
      "en-US",
      "commands:ping.embed.measuring",
    );
  });
});
