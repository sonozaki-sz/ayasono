// src/bot/features/vc-recruit/handlers/ui/vcRecruitPanelState.ts
// VC募集セレクトステップの一時状態管理

/**
 * 「VC募集を作成」ボタン押下からモーダル確定までの一時セッション情報
 */
export interface VcRecruitSession {
  /** 操作したパネルチャンネルID */
  panelChannelId: string;
  /** 選択されたメンションロールID（null = なし） */
  mentionRoleId: string | null;
  /** 選択されたVC ID（"__new__" = 新規作成 / 既存VC ID） */
  selectedVcId: string;
  /** セッション作成時刻（タイムアウト管理用） */
  createdAt: number;
}

/** 新規VC作成を表す特殊値 */
export const NEW_VC_VALUE = "__new__" as const;

/** 新規VC作成のデフォルト選択値（セレクトメニューのデフォルト初期値） */
export const NO_MENTION_VALUE = "__none__" as const;

const SESSION_TTL_MS = 15 * 60 * 1000; // 15分（Discord インタラクションの Collector デフォルト）

/** モーダル interactionId → VcRecruitSession のインメモリストア */
const sessions = new Map<string, VcRecruitSession>();

/**
 * セッションを保存する
 */
export function setVcRecruitSession(
  interactionId: string,
  session: VcRecruitSession,
): void {
  sessions.set(interactionId, session);
  // 古いセッションを自動クリーンアップ
  setTimeout(() => sessions.delete(interactionId), SESSION_TTL_MS);
}

/**
 * セッションを取得する（存在しない場合は null）
 */
export function getVcRecruitSession(
  interactionId: string,
): VcRecruitSession | null {
  return sessions.get(interactionId) ?? null;
}

/**
 * セッションを削除する
 */
export function deleteVcRecruitSession(interactionId: string): void {
  sessions.delete(interactionId);
}

/**
 * セッションを部分更新する
 */
export function updateVcRecruitSession(
  interactionId: string,
  updates: Partial<VcRecruitSession>,
): void {
  const existing = sessions.get(interactionId);
  if (existing) {
    sessions.set(interactionId, { ...existing, ...updates });
  }
}
