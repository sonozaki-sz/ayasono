// tests/unit/bot/events/voiceStateUpdate.test.ts
import { voiceStateUpdateEvent } from "@/bot/events/voiceStateUpdate";
import { Events } from "discord.js";

const handleVacVoiceStateUpdateMock = vi.fn();

vi.mock("@/bot/features/vac/handlers/vacVoiceStateUpdate", () => ({
  handleVacVoiceStateUpdate: (...args: unknown[]) =>
    handleVacVoiceStateUpdateMock(...args),
}));

describe("bot/events/voiceStateUpdate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("イベントメタデータが正しいことを確認", () => {
    expect(voiceStateUpdateEvent.name).toBe(Events.VoiceStateUpdate);
    expect(voiceStateUpdateEvent.once).toBe(false);
  });

  it("旧・新ボイス状態が handleVacVoiceStateUpdate へ委譲されることを確認", async () => {
    const oldState = { channelId: "old" };
    const newState = { channelId: "new" };

    await voiceStateUpdateEvent.execute(oldState as never, newState as never);

    expect(handleVacVoiceStateUpdateMock).toHaveBeenCalledWith(
      oldState,
      newState,
    );
  });
});
