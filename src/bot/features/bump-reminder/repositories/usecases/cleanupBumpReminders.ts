import type { PrismaClient } from "@prisma/client";
import { BUMP_REMINDER_STATUS } from "../../constants";

export async function cleanupOldBumpRemindersUseCase(
  prisma: PrismaClient,
  daysOld: number,
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.bumpReminder.deleteMany({
    where: {
      status: {
        in: [BUMP_REMINDER_STATUS.SENT, BUMP_REMINDER_STATUS.CANCELLED],
      },
      updatedAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}
