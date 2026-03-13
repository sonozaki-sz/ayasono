-- Phase 2b: GuildConfig の旧JSONカラムを削除
-- 各機能設定は専用テーブルへ移行済み（20260312161625_add_feature_config_tables）
-- データ移行確認後に適用すること

-- AlterTable
ALTER TABLE "guild_configs" DROP COLUMN "afkConfig";
ALTER TABLE "guild_configs" DROP COLUMN "bumpReminderConfig";
ALTER TABLE "guild_configs" DROP COLUMN "memberLogConfig";
ALTER TABLE "guild_configs" DROP COLUMN "stickMessages";
ALTER TABLE "guild_configs" DROP COLUMN "vacConfig";
ALTER TABLE "guild_configs" DROP COLUMN "vcRecruitConfig";
