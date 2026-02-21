// src/bot/services/botVacDependencyResolver.ts
// Bot層でVAC依存を解決するリゾルバ

import { getVacRepository, type IVacRepository } from "../features/vac";
import { getVacService, type VacService } from "../features/vac/services";

let cachedVacRepository: IVacRepository | undefined;
let cachedVacService: VacService | undefined;

/**
 * Bot層で利用するVACリポジトリを明示設定する
 */
export function setBotVacRepository(repository: IVacRepository): void {
  cachedVacRepository = repository;
}

/**
 * Bot層で利用するVACサービスを明示設定する
 */
export function setBotVacService(service: VacService): void {
  cachedVacService = service;
}

/**
 * Bot層で利用するVACリポジトリを取得する
 */
export function getBotVacRepository(): IVacRepository {
  return cachedVacRepository ?? getVacRepository();
}

/**
 * Bot層で利用するVACサービスを取得する
 */
export function getBotVacService(): VacService {
  if (cachedVacService) {
    return cachedVacService;
  }

  return getVacService(getBotVacRepository());
}
