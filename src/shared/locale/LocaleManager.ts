// src/shared/locale/LocaleManager.ts
// Guild別言語対応（i18next版）

import i18next, { type TFunction, type TOptionsBase } from "i18next";
import { NODE_ENV, env } from "../config/env";
import type { IGuildConfigRepository } from "../database/repositories/GuildConfigRepository";
import { logger } from "../utils/logger";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type AllParseKeys,
  type SupportedLocale,
} from "./i18n";
import { resources } from "./locales";

/**
 * i18next.t を any なしで呼び出すための型エイリアス
 * i18next v25 は各キーの補間変数を厳密に推論するが、
 * 全キーの共通ラッパーには柔軟なシグネチャが必要なためここで定義する
 */
type FlexibleT = (
  key: AllParseKeys,
  options: TOptionsBase & Record<string, unknown>,
) => string;

/**
 * ロケールマネージャー
 * Guild別に動的に言語を切り替える
 */
export class LocaleManager {
  private defaultLocale: SupportedLocale;
  private repository?: IGuildConfigRepository;
  private initialized = false;
  /** 初期化中の Promise（並行呼び出しによる二重初期化防止） */
  private _initPromise: Promise<void> | null = null;

  /** Guild locale を一時キャッシュ（DB クエリ削減用） */
  private readonly localeCache = new Map<
    string,
    { locale: SupportedLocale; expiresAt: number }
  >();

  /** キャッシュ TTL: 5分 */
  private readonly LOCALE_CACHE_TTL_MS = 5 * 60 * 1000;

  constructor(defaultLocale: SupportedLocale = DEFAULT_LOCALE) {
    this.defaultLocale = defaultLocale;
  }

  /**
   * i18nextを初期化
   * 複数の並行呼び出しがあっても init() は一度だけ実行される
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    if (!this._initPromise) {
      this._initPromise = this._doInitialize();
    }
    try {
      await this._initPromise;
    } catch (error) {
      // 初期化失敗時は _initPromise をリセットして再試行を可能にする
      this._initPromise = null;
      throw error;
    }
  }

  private async _doInitialize(): Promise<void> {
    await i18next.init({
      lng: this.defaultLocale,
      fallbackLng: this.defaultLocale,
      debug: env.NODE_ENV === NODE_ENV.DEVELOPMENT,

      resources: {
        ja: resources.ja,
        en: resources.en,
      },

      interpolation: {
        escapeValue: false,
      },

      keySeparator: false,

      ns: ["common", "commands", "errors", "events", "system"],
      defaultNS: "common",
    });

    this.initialized = true;
    logger.info(tDefault("system:locale.manager_initialized"));
  }

  /**
   * Repositoryを設定（DIパターン）
   */
  setRepository(repository: IGuildConfigRepository): void {
    this.repository = repository;
  }

  /**
   * Guild ロケールキャッシュを無効化
   * ロケール設定変更後に呼び出す
   */
  invalidateLocaleCache(guildId: string): void {
    this.localeCache.delete(guildId);
  }

  /**
   * キャッシュ付きで Guild ロケールを取得する内部ヘルパー
   */
  private async getCachedLocale(guildId: string): Promise<SupportedLocale> {
    const now = Date.now();
    const cached = this.localeCache.get(guildId);
    if (cached && cached.expiresAt > now) {
      return cached.locale;
    }

    let locale: SupportedLocale = this.defaultLocale;
    if (this.repository) {
      const guildLocale = await this.repository.getLocale(guildId);
      if (guildLocale && this.isSupported(guildLocale)) {
        locale = guildLocale as SupportedLocale;
      }
    }

    this.localeCache.set(guildId, {
      locale,
      expiresAt: now + this.LOCALE_CACHE_TTL_MS,
    });

    return locale;
  }

  /**
   * Guild別の翻訳文字列を取得
   */
  async translate(
    guildId: string | undefined,
    key: AllParseKeys,
    params?: Record<string, unknown>,
  ): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Guild IDが指定されている場合、キャッシュ経由で言語を取得（DB クエリ削減）
      const locale = guildId
        ? await this.getCachedLocale(guildId)
        : this.defaultLocale;

      // i18nextで翻訳（モジュールレベルFlexibleTでキャストしanyを回避する）
      const options: TOptionsBase & Record<string, unknown> = params
        ? { lng: locale, ...params }
        : { lng: locale };
      return (i18next.t as unknown as FlexibleT)(key, options);
    } catch (error) {
      logger.error(`Translation failed for key: ${key}`, error);
      return key;
    }
  }

  /**
   * 翻訳関数を取得（特定の言語用）
   */
  getFixedT(locale: SupportedLocale): TFunction {
    return i18next.getFixedT(locale);
  }

  /**
   * Guild別の翻訳関数を取得
   */
  async getGuildT(guildId: string | undefined): Promise<TFunction> {
    // キャッシュ経由でロケールを取得（DB クエリ削減）
    const locale = guildId
      ? await this.getCachedLocale(guildId)
      : this.defaultLocale;

    return this.getFixedT(locale);
  }

  /**
   * デフォルト言語を取得
   */
  getDefaultLocale(): SupportedLocale {
    return this.defaultLocale;
  }

  /**
   * 対応言語一覧を取得
   */
  getSupportedLocales(): readonly SupportedLocale[] {
    return SUPPORTED_LOCALES;
  }

  /**
   * 言語が対応しているか確認
   */
  isSupported(locale: string): boolean {
    return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
  }
}

// シングルトンインスタンス
export const localeManager = new LocaleManager();

/**
 * ヘルパー関数：Guild別翻訳
 */
export const tGuild = async (
  guildId: string | undefined,
  key: AllParseKeys,
  params?: Record<string, unknown>,
): Promise<string> => {
  return localeManager.translate(guildId, key, params);
};

/**
 * ヘルパー関数：デフォルト言語で翻訳
 */
export const tDefault = (
  key: AllParseKeys,
  params?: Record<string, unknown>,
): string => {
  const options: TOptionsBase & Record<string, unknown> = params
    ? { lng: localeManager.getDefaultLocale(), ...params }
    : { lng: localeManager.getDefaultLocale() };
  return (i18next.t as unknown as FlexibleT)(key, options);
};
