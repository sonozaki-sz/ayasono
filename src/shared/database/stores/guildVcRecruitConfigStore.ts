// src/shared/database/stores/guildVcRecruitConfigStore.ts
// VC募集設定の永続化ストア

import type { PrismaClient } from "@prisma/client";
import type { VcRecruitConfig } from "../types";

/**
 * Guild単位のVC募集設定を永続化するストア
 */
export class GuildVcRecruitConfigStore {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly defaultLocale: string,
    private readonly safeJsonParse: <T>(json: string | null) => T | undefined,
  ) {}

  /**
   * VC募集設定を取得する
   */
  async getVcRecruitConfig(guildId: string): Promise<VcRecruitConfig | null> {
    // VC募集設定カラムのみを select して最小限のクエリにする
    const record = await this.prisma.guildConfig.findUnique({
      where: { guildId },
      select: { vcRecruitConfig: true },
    });
    // 未設定/不正JSON時は null として扱う
    return (
      this.safeJsonParse<VcRecruitConfig>(record?.vcRecruitConfig ?? null) ??
      null
    );
  }

  /**
   * VC募集設定を保存する（未作成時はレコード作成）
   */
  async updateVcRecruitConfig(
    guildId: string,
    vcRecruitConfig: VcRecruitConfig,
  ): Promise<void> {
    // JSON カラムへ保存するため文字列化
    const vcRecruitConfigJson = JSON.stringify(vcRecruitConfig);

    // guild レコード未作成でも保存できるよう upsert で統一
    await this.prisma.guildConfig.upsert({
      where: { guildId },
      // 既存 guild は vcRecruitConfig のみ上書き
      update: {
        vcRecruitConfig: vcRecruitConfigJson,
      },
      // 未作成 guild は最小必須フィールドで新規作成
      create: {
        guildId,
        locale: this.defaultLocale,
        vcRecruitConfig: vcRecruitConfigJson,
      },
    });
  }
}
