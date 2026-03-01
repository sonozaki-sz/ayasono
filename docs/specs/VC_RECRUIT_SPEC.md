# VC募集機能 (VC Recruit) - 仕様書

> コマンドで専用チャンネルを自動作成し、VC参加者を募るメッセージをモーダルで投稿する機能

最終更新: 2026年2月27日（新規VC作成・設定パネル・チャンネル名変更・投稿スレッド自動作成）

---

## 📋 概要

サーバー管理者がコマンドでカテゴリーを指定すると、そのカテゴリー内に **パネルチャンネル**（募集ボタン設置）と **投稿チャンネル**（募集メッセージ表示）の2チャンネルを自動作成します。どちらのチャンネルも一般ユーザーの直接メッセージ送信は不可です。メンバーがパネルのボタンを押すとモーダルが表示され、メンション・募集文・対象VCを設定して投稿すると、投稿チャンネルに募集メッセージが送信されます。同時に Bot がそのメッセージのスレッドを自動作成し、参加者はスレッド内で返信できます。投稿者は指定したVCへ自動移動します。

### 主な用途

- ゲームや雑談など、VCへの参加者を広く呼びかける
- 毎回メンション先やVC名を入力する手間を省く定型フォーマットの提供
- 運営側がメンション対象ロールを制限することで、不要な全体メンションを防止
- 両チャンネルとも直接書き込み不可のため、募集以外の雑談投稿を防止

### 特徴

- **チャンネル自動作成**: コマンド1つでパネルチャンネルと投稿チャンネルをセットで作成
- **両チャンネル直接書き込み不可**: 両チャンネルとも一般ユーザーの直接メッセージ送信不可。投稿チャンネルへの返信は Bot 自動作成スレッド内のみ可能
- **モーダル入力**: メンション・募集文・VC選択を1つのフローでまとめて設定
- **新規VC作成**: 既存VCから選ぶほか「新規VC作成」も選択可能。作成したVCは全員退出で自動削除
- **ロール制限**: メンションに使えるロールはサーバー管理者があらかじめ設定
- **自動移動**: 投稿後に投稿者を選択したVC（または新規作成したVC）へ自動移動
- **カテゴリ絞り込み**: VC一覧はセットアップしたカテゴリーのVCに絞ることで誤選択を防止

---

## 🎯 主要機能

### 1. チャンネルセットアップ

**トリガー**: `/vc-recruit-config setup` コマンド実行

**作成されるチャンネル:**

チャンネル名はギルドの設定言語（`tGuild()`）から自動解決されます。

| 役割     | 翻訳キー                               | `ja`       | `en`               |
| -------- | -------------------------------------- | ---------- | ------------------ |
| 募集作成 | `commands:vcRecruit.channelName.panel` | `vc募集`   | `vc-recruit`       |
| 募集投稿 | `commands:vcRecruit.channelName.post`  | `vc募集板` | `vc-recruit-board` |

**チャンネル権限設定:**

**パネルチャンネル（vc-recruit）:**

| 対象         | 権限                                           | 設定値  |
| ------------ | ---------------------------------------------- | ------- |
| `@everyone`  | `SendMessages`                                 | ❌ 拒否 |
| `@everyone`  | `ViewChannel` / `ReadMessageHistory`           | ✅ 許可 |
| Bot のロール | `SendMessages`, `ManageMessages`, `EmbedLinks` | ✅ 許可 |

> `@everyone` の `SendMessages` を拒否しても、ボタン・セレクトメニューなどのインタラクションは実行可能です。

**投稿チャンネル（vc-recruit-board）:**

| 対象         | 権限                                                                  | 設定値  |
| ------------ | --------------------------------------------------------------------- | ------- |
| `@everyone`  | `SendMessages`                                                        | ❌ 拒否 |
| `@everyone`  | `SendMessagesInThreads`                                               | ✅ 許可 |
| `@everyone`  | `CreatePublicThreads`                                                 | ❌ 拒否 |
| Bot のロール | `SendMessages`, `ManageMessages`, `EmbedLinks`, `CreatePublicThreads` | ✅ 許可 |

> 投稿チャンネルには直接書き込み不可。Bot が募集メッセージごとにスレッドを自動作成し、一般ユーザーはそのスレッド内でのみ返信可能です。スレッドは設定の自動アーカイブ時間後に非表示になり、チャンネルが自然に整理されます。

**固有ロールで権限管理しているサーバーへの対応（パネルチャンネルのみ）:**

サーバーによっては `@everyone` に `ViewChannel` を拒否し、固有ロールに個別付与する権限管理をしている場合があります。この場合、`@everyone` の `SendMessages` だけを拒否しても `ViewChannel` が元々ない状態のため機能しません。

Bot がチャンネルを新規作成する際、Discord はカテゴリーの権限を継承します。**カテゴリーに設定されている権限をそのまま引き継いだうえで**、Bot 自身の `SendMessages` 許可だけを上書き追加します。`@everyone` への明示的な拒否設定は付与しません。

| 状況                                                      | 動作                                                                                           |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| カテゴリーが `@everyone` に `ViewChannel` を許可している  | `@everyone` の `SendMessages` を拒否 ＋ Bot の `SendMessages` を許可                           |
| カテゴリーが固有ロールのみに `ViewChannel` を許可している | カテゴリーの権限をそのまま継承し、Bot の `SendMessages` を許可。`@everyone` への操作は行わない |
| カテゴリーが設定されていない（TOP レベル）                | `@everyone` の `SendMessages` を拒否 ＋ Bot の `SendMessages` を許可                           |

> 要するに「Bot が書けるようにする」だけを追加し、カテゴリーが既に誰を見せるか制御している場合はそれを尊重します。

> 投稿チャンネルもパネルチャンネルと同様、カテゴリー権限を継承して Bot `SendMessages` / `CreatePublicThreads` 許可、`@everyone` `SendMessages` ・`CreatePublicThreads` 拒否、`@everyone` `SendMessagesInThreads` 許可を設定します。固有ロール管理サーバーでは同様に `@everyone` への操作は行わず、`ViewChannel` があるロールはスレッド内で返信できます。
> ↓ 2. 指定カテゴリー（または TOP レベル）に2チャンネルを作成

- パネルチャンネル: カテゴリー権限を継承 ＋ Bot SendMessages 許可 ＋ @everyone SendMessages 拒否（固有ロール管理サーバーでは拒否なし）
- 投稿チャンネル: カテゴリー権限を継承 ＋ Bot SendMessages/CreatePublicThreads 許可 ＋ @everyone SendMessages/CreatePublicThreads 拒否 ＋ @everyone SendMessagesInThreads 許可（固有ロール管理サーバーでは @everyone への操作なし）
  ↓

3. vc-recruit にパネルメッセージ（Embed + ボタン）を送信
   ↓
4. DB に {guildId, categoryId, panelChannelId, postChannelId, panelMessageId} を保存

**パネルUI（vc-recruit チャンネルに送信）:**

<table border="1" cellpadding="8" width="380">
<tr><th align="left">🎤 VC募集</th></tr>
<tr><td>VC参加者を募集しましょう！<br>ボタンを押して募集を作成してください。</td></tr>
<tr><td><kbd>📢 VC募集を作成</kbd></td></tr>
</table>

> 同一カテゴリーに既にセットアップが存在する場合は再作成不可。別カテゴリーへのセットアップは複数可。

---

### 2. 募集モーダルの表示・入力

**トリガー**: 「VC募集を作成」ボタンの押下

**モーダルUI:**

<table border="1" cellpadding="8" width="420">
<tr><th align="left">VC募集を作成</th></tr>
<tr><td>
<b>メンション</b><br>
<i>セレクトメニュー: 設定済みロール一覧<br>
・なし（メンションしない）<br>
・@ゲーマー募集<br>
・@雑談VC</i>
</td></tr>
<tr><td>
<b>募集内容</b> <i>必須</i><br>
<i>テキスト入力 / 最大200文字</i>
</td></tr>
<tr><td>
<b>新規VC名（任意）</b><br>
<i>テキスト入力 / 最大100文字<br>
「新規VC作成」選択時のみVC名に使用</i>
</td></tr>
<tr><td>
<b>VC</b> <i>必須</i><br>
<i>セレクトメニュー<br>
・🆕 新規VC作成<br>
・🔊 雑談VC<br>
・🔊 ゲームVC</i>
</td></tr>
<tr><td><kbd>送信する</kbd></td></tr>
</table>

> Discord のモーダルはテキスト入力コンポーネントのみ対応しているため、セレクトメニューはモーダル内には配置できません。
> 実装上は「送信」ボタン後に **エフェメラルなセレクトメニューメッセージ** を返し、VC・メンションを選択してから確定する 2ステップ方式を採用します（詳細は「[実装詳細](#️-実装詳細)」参照）。

**フィールド仕様:**

| フィールド | 種別                 | 必須 | 制約                                                                   |
| ---------- | -------------------- | ---- | ---------------------------------------------------------------------- |
| メンション | セレクトメニュー     | ❌   | 設定済みロール一覧 ＋「なし」。 未設定時はメンションなし               |
| 募集内容   | テキスト入力（段落） | ✅   | 最大200文字                                                            |
| 新規VC名   | テキスト入力（短）   | ❌   | 最大100文字。「新規VC作成」選択時のVC名。 未入力時は `{表示名}'s Room` |
| VC         | セレクトメニュー     | ✅   | 「🆕 新規VC作成」＋セットアップしたカテゴリーの既存VC一覧              |

---

### 3. 募集メッセージの投稿

**トリガー**: モーダルの確定（選択完了）

**投稿先**: セットアップで作成した `vc-recruit-board` チャンネル

**投稿メッセージUI:**

@ゲーマー募集（メンション設定がある場合）

<table border="1" cellpadding="8" width="420">
<tr><th align="left">📢 VC募集</th></tr>
<tr><td>
<b>募集内容</b><br>
一緒にApexやりましょう！<br>
ランクマ希望
</td></tr>
<tr><td>
<b>VC</b><br>
#channelId
</td></tr>
<tr><td>
<b>募集者</b>: @Username
</td></tr>
</table>

> 既存VC選択時・新規VC作成時ともに表示形式は同一です。VC欄の `<#channelId>` は選択または作成したVCのメンションになります。

**処理フロー（既存VC選択時）:**

```

1. モーダル送信後にエフェメラルでセレクトメニューを表示
   （メンション選択・VC選択）
   ↓
2. ユーザーが既存VCを選択して確定
   ↓
3. 設定されたメンション（ある場合）を付与して vc-recruit-board に募集メッセージを送信
   ↓
4. 募集メッセージにスレッドを自動作成（アーカイブ時間: 設定値）
   ↓
5. 送信者を選択したVCへ自動移動
   （送信者がVCに未参加の場合は移動をスキップしエフェメラルで通知）
   ↓
6. エフェメラルメッセージを削除

```

**処理フロー（新規VC作成選択時）:**

```

1. モーダル送信後にエフェメラルでセレクトメニューを表示
   （メンション選択・VC選択）
   ↓
2. ユーザーが「🆕 新規VC作成」を選択して確定
   ↓
3. セットアップカテゴリーに新規VCを作成
   - VC名: 入力のある場合は入力内容、ない場合は `{表示名}'s Room`
   - カテゴリー: セットアップカテゴリー
   - 人数制限: なし
     ↓
4. 作成したVCのテキストチャット（チャット）に設定パネルを送信
   ↓
5. 設定されたメンション（ある場合）を付与して vc-recruit-board に募集メッセージを送信
   （VCリンクは作成した新規VCのリンク）
   ↓
   5a. 募集メッセージにスレッドを自動作成（アーカイブ時間: 設定値）
   ↓
6. 作成したVCのIDを DB に保存（createdVoiceChannelIds に追加）
   ↓
7. 送信者を新規作成VCへ自動移動
   ↓
8. エフェメラルメッセージを削除

```

---

### 4. 新規作成VCの設定パネル

**配置場所**: 新規作成されたボイスチャンネルのテキストチャット

**パネルUI:**

<table border="1" cellpadding="8" width="380">
<tr><th align="left">🎤 ボイスチャンネル操作パネル</th></tr>
<tr><td>このパネルからVCの設定を変更できます。</td></tr>
<tr><td>
<kbd>✏️ VC名を変更</kbd><br>
<kbd>👥 人数制限を変更</kbd><br>
<kbd>🔇 メンバーをAFKに移動</kbd><br>
<kbd>🔄 パネルを最下部に移動</kbd>
</td></tr>
</table>

**ボタン機能:**

| ボタン                  | 機能             | 実行権限                | 説明                                        |
| ----------------------- | ---------------- | ----------------------- | ------------------------------------------- |
| ✏️ VC名を変更           | Modal表示        | VC参加中の ユーザーのみ | テキスト入力でVC名を変更                    |
| 👥 人数制限を変更       | Modal表示        | VC参加中の ユーザーのみ | 0-99の数値入力で人数制限を変更 （0=無制限） |
| 🔇 メンバーをAFKに移動  | User Select Menu | VC参加中の ユーザーのみ | 複数メンバーを選択して AFKチャンネルに移動  |
| 🔄 パネルを最下部に移動 | パネル再送信     | VC参加中の ユーザーのみ | チャットが流れた際に パネルを最下部に移動   |

> ボタンハンドラーは VAC の操作パネルと共通です。パネルUI・ボタンのカスタムID・VC参加チェックのロジックをそのまま流用します。

---

### 5. 新規作成VCの自動削除

**トリガー**: `voiceStateUpdate` イベント（VC退出検知）

VC選択で「🆕 新規VC作成」を選んだ場合に作成されるVCは、VCが空になると自動削除します。VAC機能と同じライフサイクルです。

**処理フロー:**

```

1. voiceStateUpdate イベントでVC退出を検知
   ↓
2. 退出したVCが vc-recruit で作成したVCか確認
   （DB の createdVoiceChannelIds に含まれるか）
   ↓
3. VCが空の場合
   - VCを削除
   - DB の createdVoiceChannelIds から削除
4. VCが空でない場合: 何もしない

```

> **VAC との共存**: VAC の `createdChannels` と vc-recruit の `createdVoiceChannelIds` は別管理です。同一カテゴリーに両機能が存在する場合でも、それぞれのリストで管理するVCのみを削除対象とします。

---

### 6. VC選択範囲の設計方針

**VC セレクトメニューの構成**

VC選択肢は「🆕 新規VC作成」を先頭に、続いてセットアップカテゴリー内の既存VCを表示します。

```

[セレクトメニュー]
🆕 新規VC作成（先頭固定）
🔊 雑談VC
🔊 ゲームVC
...

```

| 状況                                              | 挙動                                            |
| ------------------------------------------------- | ----------------------------------------------- |
| セットアップカテゴリーにVCが存在する              | 「🆕 新規VC作成」＋同一カテゴリーのVC一覧を表示 |
| セットアップが TOP レベル（カテゴリーなし）の場合 | 「🆕 新規VC作成」＋TOPレベルのVC一覧を表示      |
| 同一カテゴリーにVCが存在しない                    | 「🆕 新規VC作成」のみを表示                     |

---

## 🎛️ コマンド仕様

### コマンド体系

| コマンド                         | 役割                                         | 必要権限       |
| -------------------------------- | -------------------------------------------- | -------------- |
| `/vc-recruit-config setup`       | 指定カテゴリーにパネル・投稿チャンネルを作成 | `MANAGE_GUILD` |
| `/vc-recruit-config teardown`    | 指定カテゴリーの募集チャンネルセットを削除   | `MANAGE_GUILD` |
| `/vc-recruit-config add-role`    | メンション候補に使えるロールを追加           | `MANAGE_GUILD` |
| `/vc-recruit-config remove-role` | メンション候補からロールを削除               | `MANAGE_GUILD` |
| `/vc-recruit-config view`        | 現在の設定を確認                             | `MANAGE_GUILD` |

---

### `/vc-recruit-config setup`

**説明**: 指定カテゴリー（または TOP レベル）にパネルチャンネル・投稿チャンネルを作成します。

**オプション:**

| オプション名     | 型     | 必須 | 説明                                                                                                         |
| ---------------- | ------ | ---- | ------------------------------------------------------------------------------------------------------------ |
| `category`       | String | ❌   | 作成先カテゴリー（`TOP` またはカテゴリー名）。 未指定時はコマンド実行チャンネルのカテゴリー （なければ TOP） |
| `thread-archive` | String | ❌   | 募集スレッドの自動アーカイブ時間。 `1h` / `24h` / `3d` / `1w`。未指定時は `24h`                              |

> **セットアップ制約**: カテゴリーごとに1セットまで。同一カテゴリーに2セット目は作成不可。別カテゴリーへのセットアップは複数可。

**動作:**

1. `category` が指定されていれば、その対象に2チャンネルを作成
2. `category` が未指定なら、コマンド実行チャンネルのカテゴリーを作成先にする（カテゴリーなしなら TOP）
3. 同一カテゴリーに既にセットアップが存在する場合はエラー
4. `tGuild(guildId, "commands:vcRecruit.channelName.panel/post")` でチャンネル名を解決してチャンネルを作成
   - パネルチャンネル: @everyone SendMessages 拒否（固有ロール管理サーバーでは拒否なし）、Bot SendMessages 許可
   - 投稿チャンネル: @everyone SendMessages/CreatePublicThreads 拒否、@everyone SendMessagesInThreads 許可、Bot SendMessages/CreatePublicThreads 許可
5. パネルメッセージを送信
6. DB に保存

**実行例:**

```

/vc-recruit-config setup category:TOP
/vc-recruit-config setup category:ゲームカテゴリー
/vc-recruit-config setup

```

**成功時の応答:**

```

✅ VC募集チャンネルを作成しました
募集作成: #vc募集
募集投稿: #vc募集板

```

**エラー時の応答:**

- 既にセットアップ済みの場合：`❌ このカテゴリーには既にVC募集チャンネルが設置されています`

---

### `/vc-recruit-config teardown`

**説明**: 指定カテゴリーのVC募集チャンネルセットを削除します。

**オプション:**

| オプション名 | 型     | 必須 | 説明                                                                                          |
| ------------ | ------ | ---- | --------------------------------------------------------------------------------------------- |
| `category`   | String | ❌   | 削除対象カテゴリー（`TOP` またはカテゴリー名）。 未指定時はコマンド実行チャンネルのカテゴリー |

**動作:**

1. `category` が指定されていれば、その対象のセットを特定
2. `category` が未指定なら、コマンド実行チャンネルのカテゴリーを対象にする
3. 対象カテゴリーのセットアップが存在しない場合はエラー
4. パネルチャンネル・投稿チャンネルを削除（既に削除済みの場合はスキップ）
5. DB から削除

**実行例:**

```

/vc-recruit-config teardown category:TOP
/vc-recruit-config teardown category:ゲームカテゴリー
/vc-recruit-config teardown

```

**成功時の応答:**

```

✅ VC募集チャンネルを削除しました（ゲームカテゴリー）

```

**エラー時の応答:**

- セットアップが存在しない場合：`❌ このカテゴリーにはVC募集チャンネルが設置されていません`

---

### `/vc-recruit-config add-role`

**説明**: モーダルのメンション一覧に使用できるロールを追加します。

**オプション:**

| オプション名 | 型   | 必須 | 説明           |
| ------------ | ---- | ---- | -------------- |
| `role`       | Role | ✅   | 追加するロール |

**動作:**

1. 既に登録済みのロールの場合はエラー
2. DBの `mentionRoleIds` に追加

**実行例:**

```

/vc-recruit-config add-role role:@ゲーマー募集

```

**成功時の応答:**

```

✅ @ゲーマー募集 をメンション候補に追加しました

```

**エラー時の応答:**

- 既に登録済みの場合：`❌ @ゲーマー募集 は既に追加されています`
- ロール数上限（25件）到達時：`❌ メンション候補ロールは最大25件までです`

---

### `/vc-recruit-config remove-role`

**説明**: モーダルのメンション一覧からロールを削除します。

**オプション:**

| オプション名 | 型   | 必須 | 説明           |
| ------------ | ---- | ---- | -------------- |
| `role`       | Role | ✅   | 削除するロール |

**動作:**

1. 未登録のロールの場合はエラー
2. DBの `mentionRoleIds` から削除

**実行例:**

```

/vc-recruit-config remove-role role:@雑談VC

```

**成功時の応答:**

```

✅ @雑談VC をメンション候補から削除しました

```

**エラー時の応答:**

- 未登録ロールの場合：`❌ @雑談VC はメンション候補に登録されていません`

---

### `/vc-recruit-config view`

**説明**: 現在のVC募集設定を表示します。

**オプション:** なし

**表示内容例:**

<table border="1" cellpadding="8" width="420">
<tr><th align="left">🎤 VC募集設定</th></tr>
<tr><td>
<b>セットアップ済みカテゴリー</b><br>
• ゲームカテゴリー
<table border="0" cellpadding="0" cellspacing="2"><tr><td>募集作成</td><td>: #vc-recruit</td></tr><tr><td>募集投稿</td><td>: #vc-recruit-board</td></tr></table>
• TOP レベル
<table border="0" cellpadding="0" cellspacing="2"><tr><td>募集作成</td><td>: #vc-recruit</td></tr><tr><td>募集投稿</td><td>: #vc-recruit-board</td></tr></table>
</td></tr>
<tr><td>
<b>メンション候補ロール</b><br>
• @ゲーマー募集<br>
• @雑談VC
</td></tr>
</table>

---

## 🗃️ データモデル

設定情報は `GuildConfig.vcRecruitConfig` に JSON 文字列として保存します。

### `VcRecruitConfig` 型定義

```typescript
type VcRecruitConfig = {
  /** 機能の有効/無効 */
  enabled: boolean;

  /** モーダルのメンション選択肢に表示するロールIDの一覧 */
  mentionRoleIds: string[];

  /** セットアップ済みの募集チャンネルセット一覧 */
  setups: VcRecruitSetup[];
};

type VcRecruitSetup = {
  /**
   * セットアップしたカテゴリーのID。
   * TOP レベル（カテゴリーなし）の場合は null。
   */
  categoryId: string | null;

  /** 募集作成チャンネル（vc-recruit）のID */
  panelChannelId: string;

  /** 募集投稿チャンネル（vc-recruit-board）のID */
  postChannelId: string;

  /** パネルメッセージのID */
  panelMessageId: string;

  /**
   * 募集スレッドの自動アーカイブまでの時間（分）。
   * Discord の許容値: 60（1時間）/ 1440（24時間）/ 4320（3日）/ 10080（1週間）
   */
  threadArchiveDuration: 60 | 1440 | 4320 | 10080;

  /**
   * 「新規VC作成」で作成したVCのID一覧。
   * 全員退出時に自動削除される。
   */
  createdVoiceChannelIds: string[];
};
```

### デフォルト値

```json
{
  "enabled": true,
  "mentionRoleIds": [],
  "setups": []
}
```

> `VcRecruitSetup.threadArchiveDuration` の初期値は `1440`（24時間）。`createdVoiceChannelIds` は初期値 `[]`。

### `GuildConfig` への追加フィールド

```prisma
model GuildConfig {
  // ... 既存フィールド ...
  vcRecruitConfig String? // JSON: VcRecruitConfig
}
```

---

## 🔦 インタラクションフロー詳細

Discord のモーダルはテキスト入力コンポーネント（`TextInputComponent`）のみ対応しているため、セレクトメニューをモーダルに含めることができません。そのため以下の 2ステップ方式を採用します。

### ステップ 1: テキスト入力モーダル

ボタン押下 → モーダル表示（テキスト入力のみ）。

```
モーダル: VC募集を作成（ステップ 1/2）
──────────────────────────────────
募集内容 *
[テキスト入力 / 最大200文字]

新規VC名（任意 / 「新規VC作成」選択時のみVC名に使用）
[テキスト入力 / 最大100文字]
```

### ステップ 2: セレクトメニュー（エフェメラル）

モーダル送信 → エフェメラルメッセージでセレクトメニューを表示。

```
📋 ステップ 2/2 — VC・メンションを選択してください

メンション
[セレクトメニュー: なし / @ゲーマー募集 / @雑談VC ...]

VC
[セレクトメニュー: 🆕 新規VC作成 / 🔊 雑談VC / 🔊 ゲームVC ...]

[✅ 確定]
```

**フロー全体:**

```
[📢 VC募集を作成] ボタン押下（vc-recruit チャンネル）
   ↓
[STEP 1/2] モーダル表示
  - 募集内容を入力
  - 新規VC名を入力（任意）
  - 送信
   ↓
[STEP 2/2] エフェメラルでセレクトメニューを表示
  「📋 ステップ 2/2 — VC・メンションを選択してください」
  - メンション選択（未選択デフォルト = なし）
  - VC選択（🆕 新規VC作成 または 既存VC）
  - [✅ 確定] ボタン押下
   ↓
「🆕 新規VC作成」を選んだ場合: セットアップカテゴリーに新規VCを作成 → 設定パネルをVCのテキストチャットに送信
   ↓
募集メッセージを vc-recruit-board へ送信
   ↓
投稿者を対象VCへ自動移動
   ↓
エフェメラルメッセージを削除
```

---

## ⚠️ エラーハンドリング

| 状況                                             | 応答内容                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| チャンネルが削除されてもDBにレコードが残っている | ボタンインタラクション受信時にチャンネル存在確認。 なければDBを削除しエラーを通知 |
| VC選択後、対象VCが削除済み                       | `❌ 選択したVCは既に削除されています` をエフェメラルで表示                        |
| メンションロールが削除済でDBに残っている         | ロール取得失敗時はその項目をスキップし、 非同期でDBからも削除                     |
| 投稿者がVCに未参加（自動移動の際）               | 移動をスキップし `⚠️ VCに参加していないため自動移動できませんでした` を通知       |
| 新規VC作成時にカテゴリーのチャンネル数が上限超過 | `❌ カテゴリーのチャンネル数が上限（50）に達しているため作成できません` を通知    |

---

## 🏗️ 実装詳細

### ファイル構成

```
src/bot/features/vc-recruit/
├── commands/
│   └── vc-recruit-config.ts      # /vc-recruit-config コマンド定義
├── handlers/
│   ├── buttonHandler.ts          # 「VC募集を作成」ボタン → モーダル表示
│   ├── modalHandler.ts           # モーダル送信 → ステップ2セレクト表示
│   ├── selectMenuHandler.ts      # 確定ボタン → VC作成・パネル送信・投稿・移動
│   └── voiceStateHandler.ts      # voiceStateUpdate → 作成VCの空検知・自動削除
├── repositories/
│   └── vcRecruitRepository.ts    # GuildConfig の vcRecruitConfig 読み書き
└── services/
    ├── setupService.ts           # チャンネル作成・削除・権限設定
    ├── panelService.ts           # パネルメッセージの生成・送信
    ├── recruitVcService.ts       # 新規VC作成・設定パネル送信・自動削除管理
    └── recruitService.ts         # 募集メッセージの生成・送信・VC移動
```

> 設定パネルの Embed ・ボタン・ボタンハンドラー（VC名変更・人数制限・ AFK 移動・パネル再送信）は VAC の `vacPanelService` / ボタンハンドラーと共通要素を流用します。

### 翻訳キー定義

チャンネル名は `commands` ネームスペースに追加します。

**`src/shared/locale/locales/ja/commands.ts`**

```typescript
vcRecruit: {
  channelName: {
    panel: "vc募集",
    post:  "vc募集板",
  },
  // ...その他メッセージ
}
```

**`src/shared/locale/locales/en/commands.ts`**

```typescript
vcRecruit: {
  channelName: {
    panel: "vc-recruit",
    post:  "vc-recruit-board",
  },
  // ...その他メッセージ
}
```

### カスタムID 設計

| コンポーネント             | カスタムID パターン                         | 説明                         |
| -------------------------- | ------------------------------------------- | ---------------------------- |
| 「VC募集を作成」ボタン     | `vc-recruit:create:<panelChannelId>`        | パネルチャンネルIDを埋め込む |
| メンションセレクトメニュー | `vc-recruit:select-mention:<interactionId>` | インタラクションIDで紐付け   |
| VCセレクトメニュー         | `vc-recruit:select-vc:<interactionId>`      | インタラクションIDで紐付け   |
| 確定ボタン                 | `vc-recruit:confirm:<interactionId>`        | インタラクションIDで紐付け   |

### チャンネル作成・権限設定

```typescript
async function createRecruitChannels(
  guild: Guild,
  guildId: string,
  categoryId: string | null,
): Promise<{ panelChannel: TextChannel; postChannel: TextChannel }> {
  // ギルドのロケールに応じてチャンネル名を解決
  const panelName = await tGuild(
    guildId,
    "commands:vcRecruit.channelName.panel",
  );
  const postName = await tGuild(guildId, "commands:vcRecruit.channelName.post");

  // パネルチャンネル: カテゴリーの @everyone 権限を確認し、ViewChannel が許可されている場合のみ
  // @everyone の SendMessages を明示的に拒否する。
  // 固有ロール管理のサーバーでは @everyone に ViewChannel がないため操作しない。
  const category = categoryId
    ? guild.channels.cache.get(categoryId)
    : undefined;
  const everyoneViewAllowed =
    !category || // TOP レベルはデフォルト全員閲覧可能とみなす
    category
      .permissionsFor(guild.roles.everyone)
      ?.has(PermissionFlagsBits.ViewChannel) === true;

  const panelPermissionOverwrites: OverwriteResolvable[] = [
    // Bot は必ず書き込み許可
    {
      id: guild.members.me!,
      allow: [
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
  ];

  // @everyone が見えるサーバーのみ SendMessages を拒否（パネルチャンネルのみ）
  if (everyoneViewAllowed) {
    panelPermissionOverwrites.push({
      id: guild.roles.everyone,
      deny: [PermissionFlagsBits.SendMessages],
    });
  }

  // 投稿チャンネル: 直接書き込み不可。Bot のみスレッド作成可。一般ユーザーはスレッド内返信のみ可能。
  const postPermissionOverwrites: OverwriteResolvable[] = [
    {
      id: guild.members.me!,
      allow: [
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.CreatePublicThreads,
      ],
    },
  ];

  if (everyoneViewAllowed) {
    postPermissionOverwrites.push({
      id: guild.roles.everyone,
      deny: [
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.CreatePublicThreads,
      ],
      allow: [PermissionFlagsBits.SendMessagesInThreads],
    });
  } else {
    // 固有ロール管理サーバー: カテゴリー権限をそのまま継承、Bot の権限のみ追加
  }

  const panelChannel = await guild.channels.create({
    name: panelName,
    type: ChannelType.GuildText,
    parent: categoryId ?? undefined,
    permissionOverwrites: panelPermissionOverwrites,
  });

  const postChannel = await guild.channels.create({
    name: postName,
    type: ChannelType.GuildText,
    parent: categoryId ?? undefined,
    permissionOverwrites: postPermissionOverwrites,
  });

  return { panelChannel, postChannel };
}
```

### VC一覧の取得

`🆕 新規VC作成` を先頭の固定値として追加し、続いてカテゴリー内の既存VCを並べます。

```typescript
const NEW_VC_VALUE = "__new__" as const;

function buildVcSelectOptions(
  setup: VcRecruitSetup,
  guild: Guild,
): StringSelectMenuOptionBuilder[] {
  const existingVcs = guild.channels.cache
    .filter(
      (ch): ch is VoiceChannel =>
        ch.type === ChannelType.GuildVoice &&
        (ch.parentId ?? null) === (setup.categoryId ?? null),
    )
    .sort((a, b) => a.position - b.position)
    .toJSON();

  const options: StringSelectMenuOptionBuilder[] = [
    new StringSelectMenuOptionBuilder()
      .setValue(NEW_VC_VALUE)
      .setLabel("🆕 新規VC作成"),
    ...existingVcs.slice(0, 24).map(
      (
        vc, // 先頭の新規VC作成を含め25件以内に収める
      ) =>
        new StringSelectMenuOptionBuilder()
          .setValue(vc.id)
          .setLabel(`🔊 ${vc.name}`),
    ),
  ];

  return options;
}
```

### 新規VCの作成・追跡

```typescript
async function createRecruitVoiceChannel(
  guild: Guild,
  guildId: string,
  setup: VcRecruitSetup,
  recruiter: GuildMember,
  vcName?: string,
): Promise<VoiceChannel> {
  const channelName = vcName?.trim() || `${recruiter.displayName}'s Room`;
  const voiceChannel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildVoice,
    parent: setup.categoryId ?? undefined,
  });

  // DB の createdVoiceChannelIds に追加
  await addCreatedVoiceChannelId(
    guildId,
    setup.panelChannelId,
    voiceChannel.id,
  );

  return voiceChannel;
}

// voiceStateUpdate での自動削除チェック
async function handleRecruitVcDelete(oldState: VoiceState): Promise<void> {
  const channel = oldState.channel;
  if (!channel || channel.type !== ChannelType.GuildVoice) return;

  const setup = await findSetupByCreatedVcId(channel.guild.id, channel.id);
  if (!setup) return;

  if (channel.members.size > 0) return; // まだ残っている

  await channel.delete().catch(() => null);
  await removeCreatedVoiceChannelId(
    channel.guild.id,
    setup.panelChannelId,
    channel.id,
  );
}
```

### スレッドの自動作成

募集メッセージを送信した直後に、そのメッセージのスレッドを Bot が作成します。

```typescript
async function createRecruitThread(
  message: Message,
  recruiter: GuildMember,
  setup: VcRecruitSetup,
): Promise<void> {
  await message.startThread({
    name: `${recruiter.displayName}の募集`,
    autoArchiveDuration: setup.threadArchiveDuration,
    reason: "vc-recruit 自動スレッド",
  });
}
```

> スレッド名は `{募集者表示名}の募集`と固定。アーカイブ時間が経過すると Discord がスレッドをアーカイブし、チャンネルから非表示になります。

### 募集メッセージの生成

```typescript
function buildRecruitEmbed(options: {
  mentionRole: Role | null;
  content: string;
  voiceChannel: VoiceChannel;
  recruiter: GuildMember;
}): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("📢 VC募集")
    .addFields(
      { name: "募集内容", value: options.content },
      {
        name: "VC",
        value: `<#${options.voiceChannel.id}>`,
      },
      { name: "募集者", value: `${options.recruiter}` },
    )
    .setColor(0x5865f2)
    .setTimestamp();
}
```

---

## 📐 制約・制限事項

| 項目                    | 制限値・ルール                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| セットアップ数          | カテゴリーごとに1セット（サーバー内は複数カテゴリー可）                                                  |
| メンション候補ロール数  | 最大25件（セレクトメニューの上限）                                                                       |
| 募集内容の文字数        | 最大200文字                                                                                              |
| VC選択肢の上限          | 「🆕 新規VC作成」1件 ＋ 既存VC最大24件 （計25件、超過分は表示しない）                                    |
| ステップ2のタイムアウト | Discord の `InteractionCollector` デフォルト（15分）                                                     |
| 新規VC名                | ユーザー入力値（最大100文字）。 未入力時は `{表示名}'s Room`                                             |
| 新規VCの自動削除条件    | 全員退出で即削除                                                                                         |
| スレッド自動アーカイブ  | `1h`(60) / `24h`(1440, デフォルト) / `3d`(4320) / `1w`(10080)。 setup コマンドの `thread-archive` で設定 |

---

## 🔄 関連機能

- **VAC (VC自動作成)**: VAC と vc-recruit はどちらも `voiceStateUpdate` で空VCを監視しますが、それぞれが自身の管理リスト（`createdChannels` / `createdVoiceChannelIds`）に含まれるVCのみを削除対象とするため干渉しません。また vc-recruit で作成したVCの設定パネルは VAC の操作パネルと共通コンポーネントを使用します
- **StickyMessage**: 両チャンネルとも一般ユーザーの直接投稿が発生しないため、StickyMessage と競合しません
