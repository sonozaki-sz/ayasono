-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_guild_ticket_configs" (
    "guild_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "staff_role_ids" TEXT NOT NULL DEFAULT '[]',
    "panel_channel_id" TEXT NOT NULL,
    "panel_message_id" TEXT NOT NULL,
    "panel_title" TEXT NOT NULL DEFAULT 'サポート',
    "panel_description" TEXT NOT NULL DEFAULT 'サポートが必要な場合は下のボタンからチケットを作成してください。',
    "panel_color" TEXT NOT NULL DEFAULT '#00A8F3',
    "auto_delete_days" INTEGER NOT NULL DEFAULT 7,
    "max_tickets_per_user" INTEGER NOT NULL DEFAULT 1,
    "ticket_counter" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("guild_id", "category_id")
);
INSERT INTO "new_guild_ticket_configs" ("auto_delete_days", "category_id", "enabled", "guild_id", "max_tickets_per_user", "panel_channel_id", "panel_description", "panel_message_id", "panel_title", "staff_role_ids", "ticket_counter") SELECT "auto_delete_days", "category_id", "enabled", "guild_id", "max_tickets_per_user", "panel_channel_id", "panel_description", "panel_message_id", "panel_title", "staff_role_ids", "ticket_counter" FROM "guild_ticket_configs";
DROP TABLE "guild_ticket_configs";
ALTER TABLE "new_guild_ticket_configs" RENAME TO "guild_ticket_configs";
CREATE INDEX "guild_ticket_configs_guild_id_idx" ON "guild_ticket_configs"("guild_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
