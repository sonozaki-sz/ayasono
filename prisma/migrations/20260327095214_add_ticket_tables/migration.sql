-- CreateTable
CREATE TABLE "guild_ticket_configs" (
    "guild_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "staff_role_ids" TEXT NOT NULL DEFAULT '[]',
    "panel_channel_id" TEXT NOT NULL,
    "panel_message_id" TEXT NOT NULL,
    "panel_title" TEXT NOT NULL DEFAULT 'サポート',
    "panel_description" TEXT NOT NULL DEFAULT 'サポートが必要な場合は下のボタンからチケットを作成してください。',
    "auto_delete_days" INTEGER NOT NULL DEFAULT 7,
    "max_tickets_per_user" INTEGER NOT NULL DEFAULT 1,
    "ticket_counter" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("guild_id", "category_id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guild_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ticket_number" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "elapsed_delete_ms" INTEGER NOT NULL DEFAULT 0,
    "closed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "guild_ticket_configs_guild_id_idx" ON "guild_ticket_configs"("guild_id");

-- CreateIndex
CREATE INDEX "tickets_guild_id_idx" ON "tickets"("guild_id");

-- CreateIndex
CREATE INDEX "tickets_category_id_idx" ON "tickets"("category_id");

-- CreateIndex
CREATE INDEX "tickets_channel_id_idx" ON "tickets"("channel_id");

-- CreateIndex
CREATE INDEX "tickets_guild_id_category_id_user_id_status_idx" ON "tickets"("guild_id", "category_id", "user_id", "status");
