// src/bot/features/vc-recruit/handlers/ui/vcRecruitTeardownState.ts
// VC募集 teardown のセレクト確認ステップ用一時状態管理

/** 確認パネルに表示するセットアップ情報 */
export interface TeardownSetupEntry {
  /** パネルチャンネルID（teardown の対象キー） */
  panelChannelId: string;
  /** 表示用カテゴリーラベル */
  categoryLabel: string;
}

/** セレクトメニュー選択後・確認ボタン押下前の一時セッション */
export interface TeardownConfirmSession {
  /** ギルドID */
  guildId: string;
  /** 選択されたセットアップ一覧 */
  selectedSetups: TeardownSetupEntry[];
}

/** セッション有効期間（60秒） */
const SESSION_TTL_MS = 60 * 1_000;

/** セレクトインタラクションID → TeardownConfirmSession のインメモリストア */
const sessions = new Map<string, TeardownConfirmSession>();

/**
 * teardown 確認セッションを保存する
 */
export function setTeardownConfirmSession(
  selectInteractionId: string,
  session: TeardownConfirmSession,
): void {
  sessions.set(selectInteractionId, session);
  setTimeout(() => sessions.delete(selectInteractionId), SESSION_TTL_MS);
}

/**
 * teardown 確認セッションを取得する（存在しない場合は null）
 */
export function getTeardownConfirmSession(
  selectInteractionId: string,
): TeardownConfirmSession | null {
  return sessions.get(selectInteractionId) ?? null;
}

/**
 * teardown 確認セッションを削除する
 */
export function deleteTeardownConfirmSession(
  selectInteractionId: string,
): void {
  sessions.delete(selectInteractionId);
}
