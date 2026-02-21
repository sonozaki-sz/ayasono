import type { PrismaClient } from "@prisma/client";
import { BUMP_REMINDER_STATUS, type BumpReminderStatus } from "../../constants";

export async function updateReminderStatusUseCase(
  prisma: PrismaClient,
  id: string,
  status: BumpReminderStatus,
): Promise<void> {
  await prisma.bumpReminder.update({
    where: { id },
    data: { status },
  });
}

export async function cancelPendingByGuildUseCase(
  prisma: PrismaClient,
  guildId: string,
): Promise<void> {
  await prisma.bumpReminder.updateMany({
    where: {
      guildId,
      status: BUMP_REMINDER_STATUS.PENDING,
    },
    data: {
      status: BUMP_REMINDER_STATUS.CANCELLED,
    },
  });
}

export async function cancelPendingByGuildAndChannelUseCase(
  prisma: PrismaClient,
  guildId: string,
  channelId: string,
): Promise<void> {
  await prisma.bumpReminder.updateMany({
    where: {
      guildId,
      channelId,
      status: BUMP_REMINDER_STATUS.PENDING,
    },
    data: {
      status: BUMP_REMINDER_STATUS.CANCELLED,
    },
  });
}
