// src/shared/utils/serviceFactory.ts
// module-level singleton のキャッシュパターンを抽象化するユーティリティ

/**
 * Bot 層の初期化済みサービスを保持する getter/setter ペアを生成する
 * @param name エラーメッセージに使用するサービス名
 * @returns [getter, setter] のタプル
 */
export function createBotServiceAccessor<T>(
  name: string,
): [() => T, (value: T) => void] {
  let cached: T | undefined;
  return [
    (): T => {
      if (!cached) {
        throw new Error(
          `${name} is not initialized. Initialize in composition root first.`,
        );
      }
      return cached;
    },
    (value: T): void => {
      cached = value;
    },
  ];
}

/**
 * サービスの module-level singleton キャッシュパターンを抽象化する
 * @param createFn サービスインスタンスを生成するファクトリ関数
 * @param getDefaultRepository デフォルトのリポジトリを返す関数
 * @returns キャッシュ付きサービス取得関数
 */
export function createServiceGetter<TService, TRepository>(
  createFn: (repository: TRepository) => TService,
  getDefaultRepository: () => TRepository,
): (repository?: TRepository) => TService {
  let cachedService: TService | undefined;
  let cachedRepository: TRepository | undefined;

  return (repository?: TRepository): TService => {
    const resolved = repository ?? getDefaultRepository();
    if (!cachedService || cachedRepository !== resolved) {
      cachedService = createFn(resolved);
      cachedRepository = resolved;
    }
    return cachedService;
  };
}
