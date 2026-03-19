# コマンドリファレンス

> ayasono で使用可能なスラッシュコマンドの一覧

---

## コマンド一覧

| コマンド                | 説明                               | 権限           | 仕様書                                                 |
| ----------------------- | ---------------------------------- | -------------- | ------------------------------------------------------ |
| `/ping`                 | Bot 疎通確認                       | なし           | [BASIC_COMMANDS_SPEC](../specs/BASIC_COMMANDS_SPEC.md) |
| `/afk`                  | ユーザーを AFK チャンネルに移動    | なし           | [AFK_SPEC](../specs/AFK_SPEC.md)                       |
| `/afk-config`           | AFK 機能の設定管理                 | サーバー管理   | [AFK_SPEC](../specs/AFK_SPEC.md)                       |
| `/bump-reminder-config` | Bump リマインダー機能の設定管理    | サーバー管理   | [BUMP_REMINDER_SPEC](../specs/BUMP_REMINDER_SPEC.md)   |
| `/vac-config`           | VC 自動作成機能の設定管理          | サーバー管理   | [VAC_SPEC](../specs/VAC_SPEC.md)                       |
| `/vc`                   | 作成済み VC の名前・人数制限を変更 | なし           | [VC_COMMAND_SPEC](../specs/VC_COMMAND_SPEC.md)         |
| `/sticky-message`       | メッセージ固定機能の管理           | チャンネル管理 | [STICKY_MESSAGE_SPEC](../specs/STICKY_MESSAGE_SPEC.md) |
| `/member-log-config`    | メンバーログ設定                   | サーバー管理   | [MEMBER_LOG_SPEC](../specs/MEMBER_LOG_SPEC.md)         |
| `/message-delete`       | メッセージ一括削除                 | メッセージ管理 | [MESSAGE_DELETE_SPEC](../specs/MESSAGE_DELETE_SPEC.md) |
| `/vc-recruit-config`    | VC 募集機能の設定管理              | サーバー管理   | [VC_RECRUIT_SPEC](../specs/VC_RECRUIT_SPEC.md)         |

## 権限レベル

| 権限           | 必要な Discord 権限 |
| -------------- | ------------------- |
| なし           | —                   |
| チャンネル管理 | `MANAGE_CHANNELS`   |
| メッセージ管理 | `MANAGE_MESSAGES`   |
| サーバー管理   | `MANAGE_GUILD`      |

## 関連ドキュメント

- [USER_MANUAL.md](USER_MANUAL.md) — エンドユーザー向け取扱説明書
- [I18N_GUIDE.md](I18N_GUIDE.md) — 多言語対応ガイド
