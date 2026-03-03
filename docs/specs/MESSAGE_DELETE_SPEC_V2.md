# メッセージ削除機能 - 仕様書 V2（設計中）

> Message Delete Function - メッセージ削除機能（新仕様）

最終更新: 2026年3月2日

> [!NOTE]
> **このドキュメントは新仕様（設計中）です。**
> 旧仕様は [MESSAGE_DELETE_SPEC.md](MESSAGE_DELETE_SPEC.md) を参照してください。
> 新仕様への移行が完了したら旧仕様ドキュメントを削除する予定です。
>
> **旧仕様からの主な変更点:**
>
> - 確認ダイアログは常に表示（「次回から確認しない」設定を廃止）
> - 確認ダイアログに削除前プレスキャン＋メッセージプレビューを追加
> - 確認ダイアログでメッセージを個別に削除対象から除外できるように
> - プレビューダイアログ（第1段）＋最終確認ダイアログ（第2段）の2段階確認に変更
> - 削除後の詳細表示（ページネイション付き）を廃止し、シンプルな完了メッセージに
> - `/message-delete-config confirm` スキップ設定を廃止

---

## 📋 概要

### 目的

モデレーター権限を持つユーザーが、サーバー内の全チャンネルまたは特定チャンネルにわたって、特定ユーザーのメッセージ・キーワード一致メッセージ・指定件数のメッセージを一括削除できる機能を提供し、スパムや不適切なメッセージの迅速な対応を可能にします。

### 主な用途

1. **スパム対策**: サーバー全体に渡るスパムメッセージを横断的に一括削除
2. **不適切なコンテンツの削除**: 特定ユーザーの違反メッセージをサーバー全体から一括削除
3. **キーワード削除**: 特定の言葉・フレーズを含むメッセージをサーバー全体から削除
4. **チャンネルクリーンアップ**: テストメッセージや古いメッセージの整理
5. **モデレーション効率化**: 手動削除の手間を大幅に削減

### 特徴

- **サーバー全チャンネル対応**: チャンネルを指定しない場合、サーバー内の全テキストチャンネルを横断して削除（`count` 指定が必須）
- **柔軟な削除条件**: 件数・ユーザー・Bot/Webhook・キーワード・期間（日数/日付範囲）・チャンネルを自由に組み合わせ
- **Bot/Webhook対応**: `user` オプションにID直接入力、または `bot:true` で全Bot/Webhookメッセージを一括削除可能
- **期間指定削除**: 過去N日以内（`days`）や特定の日付範囲（`after` / `before`）でメッセージを絞り込んで削除
- **14日以上前のメッセージにも対応**: 古いメッセージも個別削除で対応
- **安全性重視**: フィルタ条件（`count`・`user`・`bot`・`keyword`・`days`・`after`・`before`）のいずれも未指定時は実行を拒否。サーバー全体対象時は `count` 指定を必須化
- **スキャン進捗表示**: チャンネルスキャン中もリアルタイムで進捗を表示（何チャンネル目・何件スキャン済）
- **削除進捗表示**: 大量削除時にリアルタイムで削除進捗を表示
- **Cooldown機能**: 連続実行を防止し、誤操作を軽減
- **実行確認ダイアログ**: 削除実行前に確認ダイアログを表示。誤操作を防止（スキップ不可）

---

## 🎯 主要機能

### `/message-delete` コマンド

チャンネル内のメッセージを一括削除

---

## ⚙️ コマンド仕様

### オプション

**1. `count` (オプション)**

- 削除するメッセージ数
- 範囲: 1以上（上限なし）
- 未指定の場合: 対象メッセージをすべて削除
- 注: 大量削除は時間がかかる場合があります

**2. `user` (オプション)**

- 削除対象のユーザーをユーザーID またはメンション（`<@ID>`）で指定
- 指定した場合、そのユーザーのメッセージのみ削除
- Bot・Webhook の場合も ID を直接入力すれば指定可能
- 受け付け形式: 生のID（17〜20桁の数字）または `<@ID>` 形式のメンション
- 不正な形式を入力した場合はエラー
- 未指定の場合、すべてのユーザーのメッセージが対象

**3. `bot` (オプション)**

- `true` を指定した場合、Bot および Webhook が投稿したメッセージのみを削除対象とする
- Discord の `user` オプションでは Bot・Webhook を選択できないため、このオプションで代替する
- `user` オプションとは独立しており、同時指定可（Bot ユーザーを `user` で指定しても通常マッチしないため実質的に `bot:true` 単独で使用する）
- 未指定（または `false`）の場合、Bot フィルタリングは行わない

**4. `keyword` (オプション)**

- メッセージの本文に対して部分一致検索を行い、マッチしたメッセージのみを削除対象とする
- 大文字/小文字を区別しない（case-insensitive）
- `user` / `bot` オプションと併用可（条件の AND として機能）
- 未指定の場合、テキスト内容によるフィルタリングは行わない

**5. `days` (オプション)**

- 過去N日以内に投稿されたメッセージのみを削除対象とする
- 範囲: 1以上
- 例: `days:7` → 過去7日以内のメッセージのみ削除
- `after` / `before` との同時指定不可（排他）
- `count` と組み合わせ可（期間内でさらに件数を絞る）

**6. `after` (オプション)**

- この日時以降に投稿されたメッセージのみを削除対象とする
- 形式: `YYYY-MM-DD` または `YYYY-MM-DDTHH:MM:SS`（ISO 8601 相当、時刻省略時は `00:00:00` 扱い）
- 例: `after:2026-01-01` → 2026年1月1日以降のメッセージのみ削除
- `days` との同時指定不可（排他）
- `before` と組み合わせることで日付範囲を指定可能

**7. `before` (オプション)**

- この日時以前に投稿されたメッセージのみを削除対象とする
- 形式: `YYYY-MM-DD` または `YYYY-MM-DDTHH:MM:SS`（ISO 8601 相当、時刻省略時は `23:59:59` 扱い）
- 例: `before:2026-02-01` → 2026年2月1日以前のメッセージのみ削除
- `days` との同時指定不可（排他）
- `after` と組み合わせることで日付範囲を指定可能

**8. `channel` (オプション)**

- 削除対象を絞り込むチャンネルを指定
- **未指定の場合、サーバー内の全テキストチャンネルを対象** とする
- **チャンネル未指定の場合は `count` の指定が必須**（全チャンネル全件スキャンによるタイムアウト・過負荷を防止するため）
- テキストベースのチャンネル（TextChannel, NewsChannel 等）のみ対象
- Botがアクセス権を持たないチャンネルはスキップ

### バリデーション

- 以下の「フィルタ条件オプション」のいずれも未指定の場合は実行を拒否する：
  - `count`・`user`・`bot`・`keyword`・`days`・`after`・`before`
  - `channel` のみ指定でも拒否（フィルタ条件なしでチャンネル全削除になるため）
- **`channel` 未指定かつ `count` 未指定の場合は実行を拒否する**（サーバー全チャンネルを件数無制限でスキャンするとタイムアウトするため）
- `days` と `after` / `before` を同時指定した場合はエラー（排他）
- `after` > `before`（開始が終了より後）の場合はエラー
- `after` / `before` に無効な日付形式を指定した場合はエラー

---

## ⚠️ 実行確認ダイアログ

### 概要

コマンド実行時（オプション検証・権限チェック通過後）に確認ダイアログを Ephemeral で表示する。スキップ設定はなく、常に表示される。ユーザーが承認するまで削除処理は開始しない。

### ダイアログ UI

確認ダイアログは**Embed 1枚**で構成する。条件サマリーを description に配置し、フィルターや除外操作でプレビューを調整できる。

- **1ページあたり5件**（`MSG_DEL_PAGE_SIZE = 5` と共通）
- フィルター（投稿者・days/after/before・キーワード）でプレビューを絞り込み可能
- 現在のページに表示中のメッセージを選択して**削除対象から除外**できる
- 除外したメッセージは Embed 内で ~~取り消し線~~ 表示になり、件数から差し引かれる

<table border="1" cellpadding="8" width="560">
<tr><th align="left">📋 削除対象メッセージ（1 / 3 ページ）</th></tr>
<tr><td>
対象チャンネル: サーバー全体<br>
ユーザー: @BadUser　キーワード: "スパム"　期間: 過去7日間
</td></tr>
<tr><td><b>[1] @BadUser | #general</b><br>2026/02/25 10:30<br>これはスパムメッセージです。今すぐクリック！</td></tr>
<tr><td><b>[2] @BadUser | #random</b><br>2026/02/25 11:00<br>お得なサイトはこちら→ http://...</td></tr>
<tr><td><s><b>[3] @BadUser | #general</b><br>2026/02/24 09:15<br>スパムその3</s> ← 除外済み</td></tr>
<tr><td><b>[4] @BadUser | #spam-channel</b><br>2026/02/23 22:05<br>広告メッセージです</td></tr>
<tr><td><b>[5] @BadUser | #general</b><br>2026/02/22 15:10<br>宣伝です</td></tr>
<tr><td>
行1: [投稿者でフィルター ▼]<br>
行2: <kbd>🔢 過去N日間</kbd> &nbsp; <kbd>📅 after</kbd> &nbsp; <kbd>📅 before</kbd> &nbsp; <kbd>🔍 キーワード</kbd> &nbsp; <kbd>✖️ リセット</kbd><br>
行3: <kbd>◀ 前へ</kbd> &nbsp; <kbd>▶ 次へ</kbd><br>
行4: [このページから除外するメッセージを選択 ▼]（複数選択可）<br>
行5: <kbd style="color:white;background:#da373c">🗑️ 削除する（12件）</kbd> &nbsp; <kbd>❌ キャンセル</kbd>
</td></tr>
</table>

> **実装メモ**: 確認ダイアログ表示前にメッセージを事前スキャンする必要がある。スキャン中は `🔍 対象メッセージを検索中...` を表示する。スキャン結果が0件の場合はダイアログを表示せず、`ℹ️ 削除可能なメッセージが見つかりませんでした。` を表示して終了する。

#### Embed 構成

| 要素        | 内容                                                                       |
| ----------- | -------------------------------------------------------------------------- |
| title       | `📋 削除対象メッセージ（N / T ページ）`                                    |
| description | 対象チャンネル・削除条件のサマリー                                         |
| fields      | メッセージ1件ずつ（5件/ページ）。除外済みはフィールド名を `~~...~~` で表示 |

#### コンポーネント仕様

| 行  | コンポーネント                         | customId                                   | 動作                                                                                                                |
| --- | -------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| 1   | StringSelectMenu（投稿者）             | `msgdel_filter_author`                     | 結果表示と共通（フィルター）                                                                                        |
| 2   | ボタン×5（日付・キーワード・リセット） | 結果表示と共通                             | 結果表示と共通（フィルター）                                                                                        |
| 3   | ボタン×2（前へ・次へ）                 | 結果表示と共通                             | ページ移動                                                                                                          |
| 4   | StringSelectMenu（除外選択）           | `msgdel_confirm_exclude`                   | 現在ページの5件を表示。選択したメッセージを除外セットに追加/削除（トグル）。`minValues: 0`、`maxValues: ページ件数` |
| 5   | ボタン×2（削除・キャンセル）           | `msgdel_confirm_yes` / `msgdel_confirm_no` | 削除実行（**Danger スタイル**）/ キャンセル。「削除する」を押すと最終確認ダイアログへ遷移                           |

#### 除外の仕様

- 除外セットはページをまたいで保持される
- 除外済みメッセージは Embed のフィールド名を ~~取り消し線~~ で表示
- 行4のセレクトメニューは現在ページを表示するたびに**除外済みの選択肢を選択済み状態**で表示
- 「削除する」ボタンのラベルは `🗑️ 削除する（N件）`（除外分を差し引いた件数）
- 全件除外した状態で「削除する」を押した場合は `ℹ️ 削除対象がありません` を表示して終了

### 最終確認ダイアログ

プレビューダイアログの「🗑️ 削除する（N件）」を押すと表示される。除外後の削除対象メッセージを一覧表示し、`⚠️ この操作は取り消せません` を description の冒頭に明示する。

<table border="1" cellpadding="8" width="560">
<tr><th align="left">🗑️ 本当に削除しますか？（1 / 3 ページ）</th></tr>
<tr><td>
⚠️ <b>この操作は取り消せません</b><br><br>
以下のメッセージを削除します（合計 11件）
</td></tr>
<tr><td><b>[1] @BadUser | #general</b><br>2026/02/25 10:30<br>これはスパムメッセージです。今すぐクリック！</td></tr>
<tr><td><b>[2] @BadUser | #random</b><br>2026/02/25 11:00<br>お得なサイトはこちら→ http://...</td></tr>
<tr><td><b>[3] @BadUser | #spam-channel</b><br>2026/02/23 22:05<br>広告メッセージです</td></tr>
<tr><td><b>[4] @BadUser | #general</b><br>2026/02/22 15:10<br>宣伝です</td></tr>
<tr><td><b>[5] @BadUser | #general</b><br>2026/02/21 08:45<br>またスパムです</td></tr>
<tr><td>
行1: <kbd>◀ 前へ</kbd> &nbsp; <kbd>▶ 次へ</kbd><br>
行2: <kbd style="color:white;background:#da373c">🗑️ 削除する（11件）</kbd> &nbsp; <kbd>◀ 設定し直す</kbd> &nbsp; <kbd>❌ キャンセル</kbd>
</td></tr>
</table>

#### Embed 構成

| 要素        | 内容                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------- |
| title       | `🗑️ 本当に削除しますか？（N / T ページ）`                                                       |
| description | `⚠️ **この操作は取り消せません**` + 合計件数（例: `以下のメッセージを削除します（合計 11件）`） |
| fields      | メッセージ1件ずつ（5件/ページ）。除外されなかったものだけ表示                                   |

#### コンポーネント仕様

| 行  | コンポーネント                           | customId                                                     | 動作                                                     |
| --- | ---------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| 1   | ボタン×2（前へ・次へ）                   | `msgdel_final_prev` / `msgdel_final_next`                    | ページ移動                                               |
| 2   | ボタン×3（削除・設定し直す・キャンセル） | `msgdel_final_yes` / `msgdel_final_back` / `msgdel_final_no` | 削除実行（**Danger スタイル**）/ プレビューへ戻る / 終了 |

- フィルター・除外操作はできない（読み取り専用の確認画面）
- 「◀ 設定し直す」を押すとプレビューダイアログに戻る（除外セット・フィルター状態は保持）
- 「❌ キャンセル」を押すと操作を終了する
- タイムアウトはプレビューダイアログと共通の 60 秒カウント

### タイムアウト

- タイムアウト: **60秒**
- タイムアウト後はボタンを無効化し、`⌛ タイムアウトしました。再度コマンドを実行してください。` と表示
- タイムアウトはキャンセル扱い（削除は実行しない）

---

## 💡 使用例

### ⚠️ 注意: フィルタ条件オプションの全未指定は禁止

```
/message-delete
```

- **エラー**: フィルタ条件（`count`・`user`・`keyword`・`days`・`after`・`before`）がすべて未指定の場合は警告を表示して中止

```
/message-delete channel:#general
```

- **エラー**: `channel` のみ指定も禁止（フィルタ条件なしでチャンネル全削除になるため）

```
/message-delete days:7 after:2026-01-01
```

- **エラー**: `days` と `after` / `before` の同時指定は不可

```
/message-delete after:2026-02-28 before:2026-01-01
```

- **エラー**: `after` が `before` より後の日時は不可

### 例1: 特定ユーザーのメッセージをサーバー全体から削除

```
/message-delete user:@BadUser
```

- サーバー内の**全チャンネル**から `@BadUser` のメッセージをすべて検索して削除
- チャンネルごとに順次処理し、進捗を表示

### 例2: キーワードを含むメッセージをサーバー全体から削除

```
/message-delete keyword:スパム
```

- サーバー内の**全チャンネル**から「スパム」を含むメッセージをすべて削除

### 例3: ユーザー + キーワードの組み合わせで削除

```
/message-delete user:@BadUser keyword:宣伝
```

- サーバー内の全チャンネルから `@BadUser` が投稿した「宣伝」を含むメッセージを削除

### 例4: 件数を指定してサーバー全体から削除

```
/message-delete count:100 user:@Spammer
```

- サーバー全体から `@Spammer` のメッセージを最大100件削除
- 件数は全チャンネルの合計（例: チャンネルAで60件、チャンネルBで40件）

### 例5: 特定チャンネルに絞って削除

```
/message-delete keyword:広告 channel:#general
```

- `#general` チャンネルのみで「広告」を含むメッセージを削除

### 例6: 古いプロフィールメッセージを削除

```
/message-delete count:5 user:@User channel:#profile
```

- `#profile` チャンネルの `@User` のメッセージを5件削除
- 3ヶ月前のメッセージでも削除可能（個別削除で対応）

### 例7: 大量削除（サーバー全体 + 件数上限あり）

```
/message-delete count:500 keyword:NGワード
```

- サーバー全体から「NGワード」を含むメッセージを最大500件削除
- 100件ずつ複数回に分けて削除処理を実行

### 例8: 過去7日以内のメッセージを削除（日数指定）

```
/message-delete days:7 user:@Spammer
```

- サーバー全体から `@Spammer` の過去7日以内のメッセージをすべて削除

### 例9: 特定日以降のメッセージを削除（after 指定）

```
/message-delete after:2026-02-01 keyword:宣伝
```

- 2026年2月1日以降に投稿された「宣伝」を含むメッセージをサーバー全体から削除

### 例10: 日付範囲を指定して削除（after + before）

```
/message-delete after:2026-01-01 before:2026-01-31 user:@BadUser
```

- 2026年1月1日〜1月31日の間に `@BadUser` が投稿したメッセージをサーバー全体から削除

### 例11: 期間 + チャンネル絞り込み

```
/message-delete days:3 channel:#general
```

- `#general` チャンネルの過去3日以内のメッセージをすべて削除

### 例12: 件数上限 + 日付範囲

```
/message-delete count:200 after:2026-02-20T00:00:00 before:2026-02-27T23:59:59
```

- 指定期間内のメッセージを最大200件削除（時刻まで指定する例）

---

## 🔒 権限チェック

### 実行者の必要権限

- `MANAGE_MESSAGES` (メッセージ管理)
- または、`ADMINISTRATOR` (管理者)

### Botの必要権限

- `MANAGE_MESSAGES` (メッセージ管理)
- `READ_MESSAGE_HISTORY` (メッセージ履歴の閲覧)
- `VIEW_CHANNEL` (チャンネルの閲覧 ※全チャンネル横断削除時)

**権限不足の場合:**

- エラーメッセージを表示
- ログに記録

### Cooldown（クールダウン）

- **待機時間**: 5秒
- **目的**: 同じユーザーによる連続実行を防止
- **注意**: 大量削除中は処理が完了するまで時間がかかるため、完了前に再実行しても cooldown で制限される

### 同時実行時の挙動

**同じユーザーが連続実行:**

- Cooldown (5秒) により制限される
- 前回のコマンド実行から5秒経過していないと実行できない

**異なるユーザーが同じチャンネルで実行:**

- 同時実行可能（制限なし）
- 両方の削除処理が並行して実行される
- 注意点:
  - 同じメッセージを削除しようとするとエラーが発生する可能性
  - エラーは無視して処理を継続（後述のエラーハンドリング参照）
  - レート制限に引っかかりやすくなる

**推奨事項:**

- 同じチャンネルで複数のモデレーターが同時に削除コマンドを実行しないようコミュニケーションを取る
- 大量削除中は他のモデレーターに通知する

---

## 🔄 処理フロー

```
1. コマンド実行
   ↓
2. オプション検証
   - count・user・keyword・days・after・before がすべて未指定の場合は警告を出して中止
   - channel のみ指定でも中止
   - days と after/before の同時指定はエラー
   - after > before の場合はエラー
   - after・before の日付形式が不正な場合はエラー
   ↓
3. 権限チェック
   - 実行者の権限確認
   - Botの権限確認
   ↓
3.5. 期間フィルターの計算
   - days 指定あり   → afterTs = Date.now() - days * 86400000, beforeTs = Date.now()
   - after/before 指定 → 各日付文字列を Unix ミリ秒に変換
   - いずれも未指定   → afterTs = 0, beforeTs = Infinity（期間制限なし）
   ↓
3.6. 対象チャンネルリスト取得
   - channel 指定あり → そのチャンネルのみ
   - channel 未指定   → サーバー内の全テキストチャンネル
                        （Botがアクセス不可のチャンネルはスキップ）
   ↓
3.7. 対象メッセージのプレスキャン
   - 「🔍 対象メッセージを検索中...」をEphemeralで表示
   - 全対象チャンネルを走査して条件に一致するメッセージを収集
   - 0件の場合 → 「ℹ️ 削除可能なメッセージが見つかりませんでした。」を表示して終了
   ↓
3.8. 実行確認ダイアログ
   - 条件サマリー + プレスキャン結果のプレビュー（ページネイション）を表示
   - 「🗑️ 削除する」→ 処理継続（プレスキャン結果をそのまま削除処理に渡す）
   - 「❌ キャンセル」→ キャンセルメッセージを表示して終了
   - 60秒タイムアウト → タイムアウトメッセージを表示して終了
   ↓
4. チャンネルごとにループ処理（プレスキャン結果を使用）
   ├── 4a. メッセージを14日以内/以降に分類
   │    - 14日以内: bulkDelete 対象
   │    - 14日以降: 個別削除対象
   └── 4b. メッセージ削除（ループ）
        - 14日以内: 100件ずつ bulkDelete で高速削除
        - 14日以降: 1件ずつ個別削除（レート制限考慮）
        - 削除進捗をチャンネルごとに更新
   ↓
5. 全チャンネル処理完了
   ↓
6. 結果通知（Ephemeral）
   - 合計削除件数（チャンネル別内訳も表示）
   ↓
7. ログ記録
   - 実行者
   - 合計削除件数・チャンネル別削除件数
   - 対象ユーザー（指定されている場合）
   - キーワード（指定されている場合）
   - 期間条件（days / after / before が指定されている場合）
```

---

## 削除完了メッセージ

削除処理が完了したら、コマンド実行者（Ephemeral）に対して完了メッセージを表示する。

### 完了メッセージ

**1件以上削除した場合:**

<table><tr><td>✅ 削除完了<br>合計削除件数: 45件<br><br>チャンネル別内訳:<br>　#general　　　: 20件<br>　#random　　　: 15件<br>　#spam-channel: 10件</td></tr></table>

**0件の場合:**

<table><tr><td>ℹ️ 削除可能なメッセージが見つかりませんでした。</td></tr></table>

## 📊 実装例

### TypeScript実装

> [!NOTE]
> 以下の実装例は旧仕様に基づいており、新仕様に合わせて書き直す必要があります。
> `sendPaginatedResult`・`showConfirmDialog` 前後のフローが特に変更対象です。
> 実装時は本仕様書のフロー・UI 仕様セクションを参照してください。

```typescript
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Collection,
  EmbedBuilder,
  GuildTextBasedChannel,
  Message,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  TextChannel,
} from "discord.js";

/** 削除済みメッセージの記録 */
interface DeletedMessageRecord {
  authorId: string;
  authorTag: string;
  channelId: string;
  channelName: string;
  createdAt: Date;
  content: string;
}

const PAGE_SIZE = 5;

export const msgDelCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("message-delete")
    .setDescription(
      "メッセージを一括削除します（デフォルト: サーバー全チャンネル）",
    )
    .addIntegerOption((option) =>
      option
        .setName("count")
        .setDescription("削除するメッセージ数（未指定で全件削除）")
        .setRequired(false)
        .setMinValue(1),
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("特定ユーザーのメッセージのみ削除")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("keyword")
        .setDescription(
          "本文に指定キーワードを含むメッセージのみ削除（部分一致）",
        )
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("days")
        .setDescription(
          "過去N日以内のメッセージのみ削除（after/beforeとの同時指定不可）",
        )
        .setRequired(false)
        .setMinValue(1),
    )
    .addStringOption((option) =>
      option
        .setName("after")
        .setDescription(
          "この日時以降のメッセージのみ削除 (YYYY-MM-DD または YYYY-MM-DDTHH:MM:SS)",
        )
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("before")
        .setDescription(
          "この日時以前のメッセージのみ削除 (YYYY-MM-DD または YYYY-MM-DDTHH:MM:SS)",
        )
        .setRequired(false),
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("削除対象を絞り込むチャンネル（未指定でサーバー全体）")
        .setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const countOption = interaction.options.getInteger("count");
    const targetUser = interaction.options.getUser("user", false);
    const keyword = interaction.options.getString("keyword", false);
    const daysOption = interaction.options.getInteger("days", false);
    const afterStr = interaction.options.getString("after", false);
    const beforeStr = interaction.options.getString("before", false);
    const channelOption = interaction.options.getChannel("channel", false);

    // フィルタ条件が何もない場合は拒否
    if (
      !countOption &&
      !targetUser &&
      !keyword &&
      !daysOption &&
      !afterStr &&
      !beforeStr
    ) {
      await interaction.editReply(
        "⚠️ 警告: フィルタ条件が指定されていないため実行できません。\n" +
          "`count`・`user`・`keyword`・`days`・`after`・`before` のいずれか1つを指定してください。",
      );
      return;
    }

    // days と after/before の排他チェック
    if (daysOption && (afterStr || beforeStr)) {
      await interaction.editReply(
        "⚠️ `days` と `after`/`before` は同時に指定できません。どちらか一方を使用してください。",
      );
      return;
    }

    // after・before の日付パースとバリデーション
    const parseDate = (str: string, endOfDay = false): Date | null => {
      // YYYY-MM-DD の場合は時刻を補完
      const normalized = /^\d{4}-\d{2}-\d{2}$/.test(str)
        ? `${str}T${endOfDay ? "23:59:59" : "00:00:00"}`
        : str;
      const d = new Date(normalized);
      return isNaN(d.getTime()) ? null : d;
    };

    let afterTs = 0;
    let beforeTs = Infinity;

    if (daysOption) {
      afterTs = Date.now() - daysOption * 24 * 60 * 60 * 1000;
      beforeTs = Date.now();
    } else {
      if (afterStr) {
        const d = parseDate(afterStr, false);
        if (!d) {
          await interaction.editReply(
            "⚠️ `after` の日付形式が不正です。`YYYY-MM-DD` または `YYYY-MM-DDTHH:MM:SS` 形式で指定してください。",
          );
          return;
        }
        afterTs = d.getTime();
      }
      if (beforeStr) {
        const d = parseDate(beforeStr, true);
        if (!d) {
          await interaction.editReply(
            "⚠️ `before` の日付形式が不正です。`YYYY-MM-DD` または `YYYY-MM-DDTHH:MM:SS` 形式で指定してください。",
          );
          return;
        }
        beforeTs = d.getTime();
      }
      if (afterTs !== 0 && beforeTs !== Infinity && afterTs > beforeTs) {
        await interaction.editReply(
          "⚠️ `after` は `before` より前の日時を指定してください。",
        );
        return;
      }
    }

    const count = countOption ?? Infinity;
    const guild = interaction.guild!;

    // 対象チャンネルリストの構築
    let targetChannels: GuildTextBasedChannel[];
    if (channelOption) {
      if (!channelOption.isTextBased()) {
        await interaction.editReply("テキストチャンネルを指定してください。");
        return;
      }
      targetChannels = [channelOption as GuildTextBasedChannel];
    } else {
      // サーバー内の全テキストチャンネル（Botがアクセス可能なもの）
      const allChannels = await guild.channels.fetch();
      targetChannels = allChannels
        .filter(
          (ch): ch is TextChannel =>
            ch !== null &&
            ch.isTextBased() &&
            ch
              .permissionsFor(guild.members.me!)
              ?.has([
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageMessages,
              ]) === true,
        )
        .values()
        .toArray();
    }

    try {
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const deletedRecords: DeletedMessageRecord[] = [];
      const channelBreakdown: Record<string, number> = {};
      let totalDeleted = 0;

      for (const channel of targetChannels) {
        const collected: Message[] = [];
        let lastId: string | undefined;

        // メッセージ収集（count の残り件数まで）
        while (totalDeleted + collected.length < count) {
          const batch: Collection<string, Message> =
            await channel.messages.fetch({
              limit: 100,
              before: lastId,
            });

          if (batch.size === 0) break;

          let batchOldestTs = Infinity;

          for (const msg of batch.values()) {
            batchOldestTs = Math.min(batchOldestTs, msg.createdTimestamp);
            // 期間フィルター
            if (msg.createdTimestamp < afterTs) continue;
            if (msg.createdTimestamp > beforeTs) continue;
            // ユーザーフィルター
            if (targetUser && msg.author.id !== targetUser.id) continue;
            // キーワード部分一致フィルター（case-insensitive）
            if (
              keyword &&
              !msg.content.toLowerCase().includes(keyword.toLowerCase())
            )
              continue;
            collected.push(msg);
            if (totalDeleted + collected.length >= count) break;
          }

          lastId = batch.last()?.id;
          // バッチ最古メッセージが afterTs より前なら、それ以降を取得しても範囲外なので打ち切り
          if (batchOldestTs < afterTs) break;
          if (batch.size < 100) break;
        }

        if (collected.length === 0) continue;

        // 14日以内/以降に分類
        const newMsgs = collected.filter(
          (m) => m.createdTimestamp > twoWeeksAgo,
        );
        const oldMsgs = collected.filter(
          (m) => m.createdTimestamp <= twoWeeksAgo,
        );

        // 進捗表示
        await interaction.editReply(
          `削除中... (${channel.name}) 収集: ${collected.length}件`,
        );

        // bulkDelete（14日以内）
        for (let i = 0; i < newMsgs.length; i += 100) {
          const chunk = newMsgs.slice(i, i + 100);
          await channel.bulkDelete(chunk, true);
          totalDeleted += chunk.length;
          if (i + 100 < newMsgs.length) {
            await new Promise((r) => setTimeout(r, 1000));
          }
        }

        // 個別削除（14日以降）
        for (const msg of oldMsgs) {
          try {
            await msg.delete();
            totalDeleted++;
          } catch (err) {
            logger.warn(`[MsgDel] Failed to delete message ${msg.id}:`, err);
          }
          await new Promise((r) => setTimeout(r, 500));
        }

        // 削除済みメッセージを記録
        for (const msg of collected) {
          deletedRecords.push({
            authorId: msg.author.id,
            authorTag: msg.author.tag,
            channelId: channel.id,
            channelName: channel.name,
            createdAt: msg.createdAt,
            content:
              msg.content.slice(0, 200) + (msg.content.length > 200 ? "…" : ""),
          });
        }

        channelBreakdown[channel.name] = collected.length;
      }

      if (totalDeleted === 0) {
        await interaction.editReply(
          "ℹ️ 削除可能なメッセージが見つかりませんでした。",
        );
        return;
      }

      // --- サマリー Embed ---
      const breakdownText = Object.entries(channelBreakdown)
        .map(([ch, n]) => `#${ch}: ${n}件`)
        .join("\n");

      const summaryEmbed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("✅ 削除完了")
        .addFields(
          { name: "合計削除件数", value: `${totalDeleted}件`, inline: true },
          { name: "チャンネル別内訳", value: breakdownText || "—" },
        );

      // 1件のみの場合はボタンなしで詳細も表示
      if (deletedRecords.length === 1) {
        const r = deletedRecords[0];
        summaryEmbed.addFields({
          name: `[1] @${r.authorTag} | #${r.channelName}`,
          value: `${r.createdAt.toLocaleString("ja-JP")}\n${r.content || "*(本文なし)*"}`,
        });
        await interaction.editReply({ embeds: [summaryEmbed] });
        return;
      }

      // --- ページネイション付き詳細 Embed ---
      await sendPaginatedResult(interaction, summaryEmbed, deletedRecords);

      const periodLabel = daysOption
        ? `days=${daysOption}`
        : [afterStr && `after=${afterStr}`, beforeStr && `before=${beforeStr}`]
            .filter(Boolean)
            .join(" ") || "";

      logger.info(
        `[MsgDel] ${interaction.user.tag} deleted ${totalDeleted} messages` +
          `${targetUser ? ` from ${targetUser.tag}` : ""}` +
          `${keyword ? ` keyword="${keyword}"` : ""}` +
          `${periodLabel ? ` ${periodLabel}` : ""}` +
          ` channels=[${Object.keys(channelBreakdown).join(", ")}]`,
      );
    } catch (error) {
      logger.error("[MsgDel] Error:", error);
      await interaction.editReply("メッセージの削除中にエラーが発生しました。");
    }
  },

  cooldown: 5,
};

/**
 * 削除済みメッセージ一覧をページネイション + フィルター付き Embed で送信する。
 */
/**
 * @deprecated 旧仕様: 削除後の詳細表示として実装されたが、新仕様では廃止。
 * 代わりに、この仕組みを削除前のプレビューダイアログ（確認ダイアログ）に流用する。
 * 新仕様の確認ダイアログは除外セット管理・2段階確認フローを含む別実装が必要。
 */
async function sendPaginatedResult(
  interaction: ChatInputCommandInteraction,
  summaryEmbed: EmbedBuilder,
  records: DeletedMessageRecord[],
  filterAuthorId?: string,
  filterKeyword?: string,
  filterDays?: number,   // 過去N日間フィルター（after/before と排他）
  filterAfter?: Date,    // after（開始日時）フィルター
  filterBefore?: Date,   // before（終了日時）フィルター
): Promise<void> {
  // フィルター適用
  let filtered = records;
  if (filterAuthorId) {
    filtered = filtered.filter((r) => r.authorId === filterAuthorId);
  }
  if (filterKeyword) {
    const kw = filterKeyword.toLowerCase();
    filtered = filtered.filter((r) => r.content.toLowerCase().includes(kw));
  }
  // 過去N日間フィルター（after/before が未指定の場合のみ適用）
  if (filterDays && !filterAfter && !filterBefore) {
    const threshold = Date.now() - filterDays * 24 * 60 * 60 * 1000;
    filtered = filtered.filter((r) => r.createdAt.getTime() >= threshold);
  }
  // after/before による日付範囲フィルター（days より優先）
  if (filterAfter) {
    filtered = filtered.filter((r) => r.createdAt >= filterAfter!);
  }
  if (filterBefore) {
    filtered = filtered.filter((r) => r.createdAt <= filterBefore!);
  }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  let currentPage = 0;

  const buildDetailEmbed = (page: number): EmbedBuilder => {
    const start = page * PAGE_SIZE;
    const slice = filtered.slice(start, start + PAGE_SIZE);
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(
        `📋 削除したメッセージ一覧  (${page + 1} / ${totalPages} ページ)` +
          (filterAuthorId || filterKeyword || filterDays || filterAfter || filterBefore
            ? " （フィルター適用中）"
            : ""),
      ).setFooter(
        filterAfter || filterBefore
          ? {
              text:
                [filterAfter && `after: ${filterAfter.toLocaleDateString("ja-JP")}`, filterBefore && `before: ${filterBefore.toLocaleDateString("ja-JP")}`]
                  .filter(Boolean)
                  .join(" ～ "),
            }
          : null,
      ),
      );
    for (let i = 0; i < slice.length; i++) {
      const r = slice[i];
      embed.addFields({
        name: `[${start + i + 1}] @${r.authorTag} | #${r.channelName}`,
        value: `${r.createdAt.toLocaleString("ja-JP")}\n${r.content || "*(本文なし)*"}`,
      });
    }
    return embed;
  };

  const buildComponents = (page: number) => {
    const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("msgdel_prev")
        .setLabel("◀ 前へ")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId("msgdel_next")
        .setLabel("▶ 次へ")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages - 1),
    );

    // フィルター行（複数件の場合のみ）
    const uniqueAuthors = [...new Set(records.map((r) => r.authorTag))];
    const authorSelect = new StringSelectMenuBuilder()
      .setCustomId("msgdel_filter_author")
      .setPlaceholder("投稿者でフィルター")
      .setMinValues(0)
      .setMaxValues(Math.min(uniqueAuthors.length, 25))
      .addOptions(
        uniqueAuthors.slice(0, 25).map((tag) => ({ label: tag, value: tag })),
      );
    const dateRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("msgdel_filter_days")
        .setLabel(
          filterDays
            ? `過去${filterDays}日間 ✏️`
            : "過去N日間を入力 🔢",
        )
        // days 指定中は緑、after/before 指定中は無効化
        .setStyle(filterDays ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(!!(filterAfter || filterBefore)),
      new ButtonBuilder()
        .setCustomId("msgdel_filter_after")
        .setLabel(
          filterAfter
            ? `after: ${filterAfter.toLocaleDateString("ja-JP")} ✏️`
            : "after（開始日時）を入力 📅",
        )
        // after 指定中は緑、days 指定中は無効化
        .setStyle(filterAfter ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(!!filterDays),
      new ButtonBuilder()
        .setCustomId("msgdel_filter_before")
        .setLabel(
          filterBefore
            ? `before: ${filterBefore.toLocaleDateString("ja-JP")} ✏️`
            : "before（終了日時）を入力 📅",
        )
        // before 指定中は緑、days 指定中は無効化
        .setStyle(filterBefore ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(!!filterDays),
      new ButtonBuilder()
        .setCustomId("msgdel_filter_keyword")
        .setLabel("内容で検索 🔍")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("msgdel_filter_reset")
        .setLabel("リセット ✕")
        .setStyle(ButtonStyle.Danger),
    );

    return [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        authorSelect,
      ),
      dateRow,
      navRow,
    ];
  };

  const response = await interaction.editReply({
    embeds: [summaryEmbed, buildDetailEmbed(currentPage)],
    components: buildComponents(currentPage),
  });

  // 15分間インタラクションを待機
  const collector = response.createMessageComponentCollector({
    time: 15 * 60 * 1000,
  });

  collector.on("collect", async (i) => {
    if (i.user.id !== interaction.user.id) {
      await i.reply({
        content: "操作権限がありません。",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (i.customId === "msgdel_prev")
      currentPage = Math.max(0, currentPage - 1);
    if (i.customId === "msgdel_next")
      currentPage = Math.min(totalPages - 1, currentPage + 1);
    // フィルター処理は実装側で i.customId に応じて分岐
    await i.update({
      embeds: [summaryEmbed, buildDetailEmbed(currentPage)],
      components: buildComponents(currentPage),
    });
  });

  collector.on("end", async () => {
    await interaction.editReply({ components: [] }).catch(() => {});
  });
}
```

**Cooldownの実装詳細:**

- 各ユーザーごとに最後のコマンド実行時刻を記録
- 同じユーザーが5秒以内に再実行しようとするとエラーメッセージを表示
- 異なるユーザーは個別にcooldownが管理される

---

> [!NOTE]
> **要実装**: 以下の `showConfirmDialog` は新仕様の2段階確認（プレビューダイアログ＋最終確認ダイアログ）に合わせて全面書き直しが必要です。
> `saveUserSetting` / `getUserSetting` / `skipConfirm` は新仕様で廃止されています。

**実行確認ダイアログの実装:**

```typescript
/**
 * @deprecated 旧仕様: skipConfirm トグル付きの1段階確認ダイアログ。
 * 新仕様ではプレビューダイアログ（除外機能付き）＋最終確認ダイアログの2段階構成に変更。
 * 「次回から確認しない」設定は廃止。
 * @returns `"confirmed"` | `"cancelled"` | `"timeout"`
 */
async function showConfirmDialog(
  interaction: ChatInputCommandInteraction,
  summary: string,
): Promise<"confirmed" | "cancelled" | "timeout"> {
  let skipNext = false; // 「次回から確認しない」トグル状態

  const buildButtons = () =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("msgdel_confirm_yes")
        .setLabel("✅ 削除する")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("msgdel_confirm_no")
        .setLabel("❌ キャンセル")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("msgdel_confirm_skip_toggle")
        .setLabel(
          skipNext ? "[✓] 次回から確認しない" : "[ ] 次回から確認しない",
        )
        .setStyle(skipNext ? ButtonStyle.Success : ButtonStyle.Secondary),
    );

  const response = await interaction.editReply({
    content: `⚠️ **この操作は取り消せません**\n\n${summary}\n\n実行しますか？`,
    components: [buildButtons()],
  });

  return new Promise((resolve) => {
    const collector = response.createMessageComponentCollector({
      time: 60_000,
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== interaction.user.id) {
        await i.reply({
          content: "操作権限がありません。",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (i.customId === "msgdel_confirm_skip_toggle") {
        skipNext = !skipNext;
        await i.update({ components: [buildButtons()] });
        return;
      }

      collector.stop(i.customId);
    });

    collector.on("end", async (_, reason) => {
      if (reason === "msgdel_confirm_yes") {
        if (skipNext) {
          await saveUserSetting(interaction.user.id, interaction.guildId!, {
            skipConfirm: true,
          });
        }
        resolve("confirmed");
      } else if (reason === "msgdel_confirm_no") {
        await interaction.editReply({
          content: "❌ 削除をキャンセルしました。",
          components: [],
        });
        resolve("cancelled");
      } else {
        // time out
        await interaction.editReply({
          content: "⌛ タイムアウトしました。再度コマンドを実行してください。",
          components: [],
        });
        resolve("timeout");
      }
    });
  });
}

/**
 * ユーザー設定を DB に保存するユーティリティ（実装省略）。
 */
async function saveUserSetting(
  userId: string,
  guildId: string,
  patch: { skipConfirm?: boolean },
): Promise<void> {
  // DB の user_settings テーブルに upsert する
}

/**
 * ユーザー設定を DB から取得するユーティリティ（実装省略）。
 */
async function getUserSetting(
  userId: string,
  guildId: string,
): Promise<{ skipConfirm: boolean }> {
  // DB から取得。未登録の場合はデフォルト { skipConfirm: false } を返す
  return { skipConfirm: false };
}
```

> [!NOTE]
> **要実装**: 以下のコードは旧フローです。新仕様では `getUserSetting` / `skipConfirm` は廃止。確認ダイアログ（プレビュー＋最終確認）は常に表示されます。

**`execute` 内での使用例:**

```typescript
// 権限チェック後、削除処理開始前に挿入
const { skipConfirm } = await getUserSetting(interaction.user.id, guild.id);
if (!skipConfirm) {
  const conditionSummary = buildConditionSummary({
    targetUser,
    keyword,
    daysOption,
    afterStr,
    beforeStr,
    channelOption,
  });
  const result = await showConfirmDialog(interaction, conditionSummary);
  if (result !== "confirmed") return;
}
```

---

## ⚠️ Discord API制限

### 14日制限（bulkDelete）

Discordの`bulkDelete`メソッドは、**14日以上前のメッセージを削除できません**。

**対応:**

- **14日以内**: `bulkDelete()`で高速一括削除（100件ずつ）
- **14日以降**: `message.delete()`で個別削除（1件ずつ、時間がかかる）
- 削除対象のメッセージを自動的に分類して適切な方法で削除

**パフォーマンス:**

- 一括削除: 100件を数秒で削除
- 個別削除: 1件あたり約0.5秒（レート制限考慮）
  - 例: 100件の個別削除 → 約50秒
  - 例: 500件の個別削除 → 約250秒（約4分）

### レート制限

- 一度に削除できるメッセージ数: 最大100件（bulkDelete制限）
- メッセージフェッチ: 100件ずつ
- レート制限: 適切な間隔を空ける必要あり

**対応:**

- 100件ずつに分割してフェッチ・削除
- 削除バッチ間に1秒の待機時間を挿入
- 大量削除時は進捗を表示

---

## 🛡️ エラーハンドリング

### 想定されるエラー

1. **`count`・`user`・`keyword` の全未指定**

   ```
   ⚠️ 警告: `count`・`user`・`keyword` のいずれも未指定のため実行できません。
   少なくとも `count`・`user`・`keyword` のいずれか1つを指定してください。
   ```

2. **権限不足**

   ```
   ❌ この操作を実行する権限がありません。
   必要な権限: メッセージ管理
   ```

3. **Bot権限不足**

   ```
   ❌ Botにメッセージ削除権限がありません。
   ```

4. **古いメッセージの個別削除（時間がかかる）**

   ```
   ⚠️ 14日以上前のメッセージは個別削除します。時間がかかる場合があります。
   削除中... (general) 50/200件
   ```

5. **メッセージが見つからない**

   ```
   ℹ️ 削除可能なメッセージが見つかりませんでした。
   ```

6. **メッセージが既に削除されている（同時実行時）**
   - 他のユーザーが同時に削除コマンドを実行した場合
   - メッセージが既に削除されているエラーは無視して処理を継続
   - ログに警告を記録（削除失敗件数は含めない）

7. **`days` と `after`/`before` の同時指定**

   ```
   ⚠️ `days` と `after`/`before` は同時に指定できません。どちらか一方を使用してください。
   ```

8. **`after` / `before` の日付形式が不正**

   ```
   ⚠️ `after` の日付形式が不正です。`YYYY-MM-DD` または `YYYY-MM-DDTHH:MM:SS` 形式で指定してください。
   ```

9. **`after` が `before` より後**

   ```
   ⚠️ `after` は `before` より前の日時を指定してください。
   ```

10. **実行確認のキャンセル**

    ```
    ❌ 削除をキャンセルしました。
    ```

11. **実行確認ダイアログのタイムアウト（60秒）**

    ```
    ⌛ タイムアウトしました。再度コマンドを実行してください。
    ```

12. **ページネイションセッションのタイムアウト**
    - 15分間操作がなかった場合
    - ボタン・セレクトメニューを無効化し、「セッションが期限切れです」と表示

---

## 📝 ログ記録

### ログフォーマット

```
[MsgDel] <実行者> deleted <合計削除件数> messages [from <対象ユーザー>] [keyword="<キーワード>"] [days=<N> | after=<日時> before=<日時>] channels=[<チャンネル名, ...>]
```

### 例

```
[MsgDel] Admin#1234 deleted 50 messages from Spammer#5678 channels=[general, random]
[MsgDel] Moderator#4321 deleted 100 messages keyword="広告" channels=[general, spam-channel, announcements]
[MsgDel] Admin#1234 deleted 30 messages from BadUser#9999 keyword="spam" channels=[general]
[MsgDel] Moderator#4321 deleted 80 messages from Spammer#5678 days=7 channels=[general, random]
[MsgDel] Admin#1234 deleted 45 messages after=2026-02-01 before=2026-02-27 channels=[general]
```

---

## 🧪 テストケース

最新の件数とカバレッジは [TEST_PROGRESS.md](../progress/TEST_PROGRESS.md) を参照。

### ユニットテスト

- [ ] 権限チェック
- [ ] `count`・`user`・`keyword` 全未指定時のバリデーション拒否
- [ ] `channel` のみ指定時のバリデーション拒否
- [ ] キーワード部分一致フィルター（大文字小文字を区別しない）
- [ ] ユーザー + キーワード複合フィルター
- [ ] メッセージフィルタリング（ユーザー指定）
- [ ] 14日制限フィルター
- [ ] 件数制限（全チャンネル合計で上限に達した場合）
- [ ] count 未指定時の全件削除ロジック
- [ ] サーバー全チャンネル取得（Bot アクセス不可チャンネルのスキップ）
- [ ] `days` 指定による期間フィルター（afterTs/beforeTs の計算）
- [ ] `after` / `before` の日付パースと boundary 計算（時刻省略補完）
- [ ] `days` + `after`/`before` 同時指定の排他バリデーション
- [ ] 無効な日付形式のエラー
- [ ] `after` > `before` のエラー
- [ ] フェッチ打ち切り最適化（バッチ最古メッセージが afterTs より前の場合）
- [ ] `showConfirmDialog` — 「✅ 削除する」押下で `"confirmed"` を返す
- [ ] `showConfirmDialog` — 「❌ キャンセル」押下で `"cancelled"` を返す
- [ ] `showConfirmDialog` — 60秒タイムアウトで `"timeout"` を返す
- [ ] `showConfirmDialog` — 「次回から確認しない」トグルで `skipNext` が変化する
- [ ] `showConfirmDialog` — 「次回から確認しない」ON + 「✅ 削除する」押下で `saveUserSetting` が呼ばれる
- [ ] `showConfirmDialog` — `skipNext = false` で「✅ 削除する」押下の場合、`saveUserSetting` が呼ばれない
- [ ] `getUserSetting` — DB 未登録時に `{ skipConfirm: false }` を返す
- [ ] `getUserSetting` / `saveUserSetting` のユーザー×ギルドごとの独立性

### インテグレーションテスト

- [ ] 通常削除（14日以内のメッセージ）
- [ ] 14日以上前のメッセージの個別削除
- [ ] 混在メッセージ（14日以内 + 14日以降）の削除
- [ ] キーワード指定削除（サーバー全体）
- [ ] ユーザー指定削除（サーバー全体）
- [ ] ユーザー + キーワード + channel 指定削除
- [ ] days 指定削除（全チャンネル横断）
- [ ] after + before の範囲指定削除
- [ ] after のみ指定削除
- [ ] before のみ指定削除
- [ ] count + days の組み合わせ（期間内で件数上限）
- [ ] channel 未指定でサーバー全チャンネルを横断して削除
- [ ] count 合計が全チャンネルをまたいで正しく機能すること
- [ ] すべてのフィルターオプション未指定時のエラー処理
- [ ] days と after の同時指定エラー
- [ ] after > before エラー
- [ ] 無効な日付形式エラー（after/before）
- [ ] afterTs 最適化によるフェッチ打ち切りの動作確認
- [ ] 権限不足エラー
- [ ] Cooldown 機能
- [ ] 同時実行時のエラーハンドリング（メッセージ削除競合）
- [ ] 大量削除時の進捗表示
- [ ] `skipConfirm = false` のユーザーが `/message-delete` を実行したとき確認ダイアログが表示される
- [ ] 確認ダイアログで「✅ 削除する」押下後に削除が実行される
- [ ] 確認ダイアログで「❌ キャンセル」押下後に削除が実行されない
- [ ] 確認ダイアログで「次回から確認しない」ON +「✅ 削除する」後、次回実行でダイアログが出ない
- [ ] `skipConfirm = true` のユーザーが `/message-delete` を実行したとき確認ダイアログをスキップする
- [ ] `/message-delete-config confirm:false` 実行後、次回の `/message-delete` でダイアログが出ない
- [ ] `/message-delete-config confirm:true` 実行後、次回の `/message-delete` でダイアログが復活する
- [ ] `/message-delete-config` の設定はユーザー×ギルドごとに独立している

### ページネイション・フィルターテスト

- [ ] 5件ごとにページが区切られること
- [ ] 1件のみの場合はページネイションボタンが表示されないこと
- [ ] ページネイション「前へ」「次へ」ボタンの動作
- [ ] 1ページ目で「前へ」が無効化されること
- [ ] 最終ページで「次へ」が無効化されること
- [ ] 投稿者フィルターで正しく絞り込まれること
- [ ] キーワードフィルターで正しく絞り込まれること
- [ ] 過去N日間フィルター（任意の数値を入力し、N日以内のメッセージのみ表示）
- [ ] 過去N日間に 1 未満または整数以外を入力した時のエラー表示
- [ ] 過去N日間入力時、after/before ボタンの無効化
- [ ] after/before 入力時、過去N日間ボタンの無効化
- [ ] after フィルター（指定日時以降のメッセージのみ表示）
- [ ] before フィルター（指定日時以前のメッセージのみ表示）
- [ ] after + before 両方指定の AND フィルター
- [ ] after/before 指定時、過去N日間ボタンが無効化されること
- [ ] after/before 指定時、Embed footer に after/before 日付が表示されること
- [ ] after/before に無効な日付入力時のエラー表示（フィルターは適用されない）
- [ ] after > before 入力時のエラー表示（フィルターは適用されない）
- [ ] after/before リセット後、過去N日間ボタンが再有効化されること
- [ ] 複数フィルターの AND 条件が正しく動作すること
- [ ] フィルターリセットで全件表示に戻ること
- [ ] 15分後にセッションがタイムアウトし、ボタンが無効化されること
- [ ] コマンド実行者以外がボタンを押した場合に弾かれること

---

## 🌐 多言語対応（i18next）

### ローカライゼーションキー

```typescript
// commands.json
export default {
  msgDel: {
    errors: {
      filterOptionsEmpty: {
        title: "警告",
        description:
          "フィルタ条件が指定されていないため実行できません。\n" +
          "`count`・`user`・`keyword`・`days`・`after`・`before` のいずれか1つを指定してください。",
      },
      invalidChannel: "テキストチャンネルを指定してください。",
      noMessages: "削除可能なメッセージが見つかりませんでした。",
      permissionDenied: "この操作を実行する権限がありません。",
      botPermissionDenied: "Botにメッセージ削除権限がありません。",
      failed: "メッセージの削除中にエラーが発生しました。",
      sessionExpired:
        "セッションが期限切れです。コマンドを再実行してください。",
      daysAndDateConflict:
        "`days` と `after`/`before` は同時に指定できません。どちらか一方を使用してください。",
      invalidAfterDate:
        "`after` の日付形式が不正です。`YYYY-MM-DD` または `YYYY-MM-DDTHH:MM:SS` 形式で指定してください。",
      invalidBeforeDate:
        "`before` の日付形式が不正です。`YYYY-MM-DD` または `YYYY-MM-DDTHH:MM:SS` 形式で指定してください。",
      afterAfterBefore: "`after` は `before` より前の日時を指定してください。",
    },
    confirm: {
      title: "⚠️ **この操作は取り消せません**",
      body: "以下の条件に一致するメッセージを削除します。実行しますか？",
      yes: "✅ 削除する",
      no: "❌ キャンセル",
      skipToggleOff: "[ ] 次回から確認しない",
      skipToggleOn: "[✓] 次回から確認しない",
      cancelled: "❌ 削除をキャンセルしました。",
      timeout: "⌛ タイムアウトしました。再度コマンドを実行してください。",
    },
    progress: {
      collecting: "削除中... ({{channel}}) 収集: {{count}}件",
      deleting: "削除中... {{current}}/{{total}}件",
      bulk: "削除中... {{current}}/{{total}}件 (一括削除)",
      individual:
        "削除中... {{current}}/{{total}}件 (14日以上前のメッセージを個別削除中...)",
    },
    success: {
      title: "✅ 削除完了",
      totalCount: "合計削除件数",
      channelBreakdown: "チャンネル別内訳",
      listTitle: "📋 削除したメッセージ一覧  ({{page}} / {{total}} ページ)",
      listTitleFiltered:
        "📋 削除したメッセージ一覧  ({{page}} / {{total}} ページ) （フィルター適用中）",
    },
    pagination: {
      prev: "◀ 前へ",
      next: "▶ 次へ",
      filterByAuthor: "投稿者でフィルター",
      filterByKeyword: "内容で検索 🔍",
      filterByDays: "過去N日間を入力 🔢",
      filterByDaysActive: "過去{{days}}日間 ✏️",
      filterByAfter: "after（開始日時）を入力 📅",
      filterByBefore: "before（終了日時）を入力 📅",
      filterByAfterActive: "after: {{date}} ✏️",
      filterByBeforeActive: "before: {{date}} ✏️",
      resetFilter: "リセット ✕",
      invalidDaysInput: "日数は1以上の整数で入力してください。",
    },
  },
  msgDelConfig: {
    success:
      "✅ 設定を更新しました。次回の `/message-delete` から反映されます。",
    confirmEnabled: "実行確認ダイアログ: 有効",
    confirmDisabled: "実行確認ダイアログ: 無効",
  },
};
```

---

## 関連ドキュメント

- [Discord.js - TextChannel.bulkDelete](https://discord.js.org/#/docs/discord.js/main/class/TextChannel?scrollTo=bulkDelete)
- [Discord.js - Message.fetch](https://discord.js.org/#/docs/discord.js/main/class/MessageManager?scrollTo=fetch)
- [Discord API - Bulk Delete Messages](https://discord.com/developers/docs/resources/channel#bulk-delete-messages)
