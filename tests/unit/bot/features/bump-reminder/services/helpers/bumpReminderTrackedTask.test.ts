// tests/unit/bot/features/bump-reminder/services/helpers/bumpReminderTrackedTask.test.ts
import { BUMP_REMINDER_STATUS } from "@/bot/features/bump-reminder/constants/bumpReminderConstants";
import { createTrackedReminderTask } from "@/bot/features/bump-reminder/services/helpers/bumpReminderTrackedTask";

const loggerErrorMock = vi.fn();

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: (key: string) => key,
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    error: (...args: unknown[]) => loggerErrorMock(...args),
  },
}));

describe("bot/features/bump-reminder/services/helpers/bumpReminderTrackedTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("タスク成功時にリマインダーを sent としてマークする", async () => {
    const repository = { updateStatus: vi.fn().mockResolvedValue(undefined) };
    const task = vi.fn().mockResolvedValue(undefined);

    await createTrackedReminderTask(repository as never, "g1", "r1", task)();

    expect(repository.updateStatus).toHaveBeenCalledWith(
      "r1",
      BUMP_REMINDER_STATUS.SENT,
    );
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it("タスク失敗時にリマインダーを cancelled としてマークする", async () => {
    const repository = { updateStatus: vi.fn().mockResolvedValue(undefined) };
    const task = vi.fn().mockRejectedValue(new Error("task failed"));

    await createTrackedReminderTask(repository as never, "g1", "r1", task)();

    expect(repository.updateStatus).toHaveBeenCalledWith(
      "r1",
      BUMP_REMINDER_STATUS.CANCELLED,
    );
    expect(loggerErrorMock).toHaveBeenCalled();
  });
});
