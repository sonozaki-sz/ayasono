// src/bot/services/botVcRecruitDependencyResolver.ts
// Bot層でVC募集依存を解決するリゾルバ

import type { IVcRecruitRepository } from "../features/vc-recruit/repositories/vcRecruitRepository";

let cachedVcRecruitRepository: IVcRecruitRepository | undefined;

/**
 * Bot層で利用するVC募集リポジトリを明示設定する
 */
export function setBotVcRecruitRepository(
  repository: IVcRecruitRepository,
): void {
  cachedVcRecruitRepository = repository;
}

/**
 * Bot層で利用するVC募集リポジトリを取得する
 */
export function getBotVcRecruitRepository(): IVcRecruitRepository {
  if (!cachedVcRecruitRepository) {
    throw new Error(
      "VcRecruitRepository is not initialized. Initialize in composition root first.",
    );
  }
  return cachedVcRecruitRepository;
}
