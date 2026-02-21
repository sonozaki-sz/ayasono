import { createBumpReminderRestorePlan } from "@/bot/features/bump-reminder/services/helpers/bumpReminderRestorePlanner";

describe("bot/features/bump-reminder/services/helpers/bumpReminderRestorePlanner", () => {
  it("keeps latest reminder per guild and collects stale ones", () => {
    const reminders = [
      {
        id: "old",
        guildId: "g1",
        scheduledAt: new Date("2026-02-21T00:00:00.000Z"),
      },
      {
        id: "new",
        guildId: "g1",
        scheduledAt: new Date("2026-02-21T01:00:00.000Z"),
      },
      {
        id: "other",
        guildId: "g2",
        scheduledAt: new Date("2026-02-21T00:30:00.000Z"),
      },
    ];

    const result = createBumpReminderRestorePlan(reminders as never);

    expect(result.latestByGuild.get("g1")?.id).toBe("new");
    expect(result.latestByGuild.get("g2")?.id).toBe("other");
    expect(result.staleReminders.map((item) => item.id)).toEqual(["old"]);
  });
});
