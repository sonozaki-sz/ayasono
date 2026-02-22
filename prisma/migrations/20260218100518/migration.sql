-- CreateTable
CREATE TABLE "bump_reminders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "messageId" TEXT,
    "scheduledAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "bump_reminders_guildId_idx" ON "bump_reminders"("guildId");

-- CreateIndex
CREATE INDEX "bump_reminders_status_scheduledAt_idx" ON "bump_reminders"("status", "scheduledAt");
