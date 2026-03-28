// src/shared/database/repositories/reactionRolePanelRepository.ts
// リアクションロールパネルリポジトリ（Prisma実装）

import type { PrismaClient } from "@prisma/client";
import { tDefault } from "../../locale/localeManager";
import { executeWithDatabaseError } from "../../utils/errorHandling";
import type {
  GuildReactionRolePanel,
  IReactionRolePanelRepository,
} from "../types";

/**
 * リアクションロールパネルのDB永続化を担当するリポジトリ
 */
export class ReactionRolePanelRepository
  implements IReactionRolePanelRepository
{
  private prisma: PrismaClient;
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findById(id: string): Promise<GuildReactionRolePanel | null> {
    return executeWithDatabaseError(
      () =>
        this.prisma.guildReactionRolePanel.findUnique({
          where: { id },
        }),
      tDefault("reactionRole:log.database_panel_find_failed", {
        guildId: "",
        panelId: id,
      }),
    );
  }

  async findAllByGuild(guildId: string): Promise<GuildReactionRolePanel[]> {
    return executeWithDatabaseError(
      () =>
        this.prisma.guildReactionRolePanel.findMany({
          where: { guildId },
        }),
      tDefault("reactionRole:log.database_panel_find_failed", {
        guildId,
        panelId: "",
      }),
    );
  }

  async create(
    data: Omit<GuildReactionRolePanel, "id" | "createdAt" | "updatedAt">,
  ): Promise<GuildReactionRolePanel> {
    return executeWithDatabaseError(
      () =>
        this.prisma.guildReactionRolePanel.create({
          data,
        }),
      tDefault("reactionRole:log.database_panel_save_failed", {
        guildId: data.guildId,
        panelId: "",
      }),
    );
  }

  async update(
    id: string,
    data: Partial<GuildReactionRolePanel>,
  ): Promise<GuildReactionRolePanel> {
    return executeWithDatabaseError(
      () =>
        this.prisma.guildReactionRolePanel.update({
          where: { id },
          data,
        }),
      tDefault("reactionRole:log.database_panel_save_failed", {
        guildId: "",
        panelId: id,
      }),
    );
  }

  async delete(id: string): Promise<void> {
    await executeWithDatabaseError(
      () =>
        this.prisma.guildReactionRolePanel.delete({
          where: { id },
        }),
      tDefault("reactionRole:log.database_panel_delete_failed", {
        guildId: "",
        panelId: id,
      }),
    );
  }

  async deleteAllByGuild(guildId: string): Promise<number> {
    const result = await executeWithDatabaseError(
      () =>
        this.prisma.guildReactionRolePanel.deleteMany({
          where: { guildId },
        }),
      tDefault("reactionRole:log.database_panel_delete_failed", {
        guildId,
        panelId: "",
      }),
    );
    return result.count;
  }
}

let repository: IReactionRolePanelRepository | undefined;

/**
 * リアクションロールパネルリポジトリのシングルトンを取得する
 * @param prisma 初回呼び出し時に必要なPrismaClientインスタンス
 * @returns リポジトリのシングルトンインスタンス
 */
export function getReactionRolePanelRepository(
  prisma?: PrismaClient,
): IReactionRolePanelRepository {
  if (!repository) {
    if (!prisma) {
      throw new Error(
        "ReactionRolePanelRepository is not initialized. Provide PrismaClient on first call.",
      );
    }
    repository = new ReactionRolePanelRepository(prisma);
  }
  return repository;
}
