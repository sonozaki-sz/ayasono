# VC自動作成機能 (VAC) - 仕様書

> トリガーチャンネル参加時に専用ボイスチャンネルを自動作成・管理する機能

最終更新: 2026年2月19日

---

## 📋 概要

ユーザーがトリガーチャンネル（CreateVC）に参加すると、自動的にそのユーザー専用のボイスチャンネルを作成する機能です。作成されたVCは参加者が全員退出すると自動的に削除されます。

### 主な用途

- ユーザーが自由に使えるプライベートVC空間の提供
- VC作成の手間を省く自動化
- 使用されていないVCの自動クリーンアップ

### 特徴

- **自動作成**: トリガーチャンネル参加で即座にVC作成
- **操作パネル**: VCのチャットに設置されたパネルでVC参加中のユーザーが名前・人数制限を変更可能
- **管理権限付与**: 作成者にのみチャンネルスコープの `ManageChannels` 権限を付与（Discord標準UI経由での詳細設定用。なおサーバーレベルで `ManageChannels` / `Administrator` を持つユーザーは元来全チャンネルを操作可能）
- **自動削除**: VCが空になると自動削除

---

## 🎯 主要機能

### 1. 自動チャンネル作成

**トリガー**: `voiceStateUpdate` イベント - 指定されたトリガーチャンネルへの参加

**作成されるチャンネル:**

- **ボイスチャンネル**: `{ユーザー名}'s Room`
- **権限**: 作成者に `ManageChannels` 権限を付与
- **デフォルト設定**: 人数制限 99、トリガーチャンネルと同じカテゴリ

**処理フロー:**

```
1. ユーザーがトリガーチャンネル（CreateVC）に参加
   ↓
2. voiceStateUpdateイベントで検知
   ↓
3. 新しいVCを作成
   - 名前: {ユーザー名}'s Room
   - カテゴリ: トリガーチャンネルと同じ
   - 人数制限: 99（デフォルト）
   - 作成者にManageChannels権限を付与
   ↓
4. VCのチャットチャンネルに操作パネルを設置
   ↓
5. ユーザーを新しいVCに自動移動
   ↓
6. データベースに作成したVCのIDを保存
```

### 2. 操作パネル

**配置場所**: 作成されたボイスチャンネルのチャット

**パネルUI:**

```
┌──────────────────────────────────┐
│ 🎤 ボイスチャンネル操作パネル    │
├──────────────────────────────────┤
│ このパネルからVCの設定を変更で   │
│ きます。                         │
│                                  │
│ [✏️ VC名を変更]                  │
│ [👥 人数制限を変更]              │
│ [🔇 メンバーをAFKに移動]         │
│ [🔄 パネルを最下部に移動]        │
└──────────────────────────────────┘
```

**ボタン機能:**

| ボタン                  | 機能             | 実行権限               | 説明                                       |
| ----------------------- | ---------------- | ---------------------- | ------------------------------------------ |
| ✏️ VC名を変更           | Modal表示        | VC参加中のユーザーのみ | テキスト入力でVC名を変更                   |
| 👥 人数制限を変更       | Modal表示        | VC参加中のユーザーのみ | 0-99の数値入力で人数制限を変更（0=無制限） |
| 🔇 メンバーをAFKに移動  | User Select Menu | VC参加中のユーザーのみ | 複数メンバーを選択してAFKチャンネルに移動  |
| 🔄 パネルを最下部に移動 | パネル再送信     | VC参加中のユーザーのみ | チャットが流れた際にパネルを最下部に移動   |

> **権限設計の方針**: パネルボタン経由の操作はBotが代理実行するため、ユーザー側に `ManageChannels` 権限は不要です。ボタンハンドラーでは**VC参加チェック**を行い、そのVCに現在参加しているユーザーのみ実行できます。

**Discord標準設定:**

Discord標準UIからの操作権限は以下の通りです：

| ユーザー種別                                                                | Discord UI での操作範囲                                                                  |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **作成者**                                                                  | チャンネルスコープの `ManageChannels` 付与により、そのVCの編集・削除が可能               |
| **サーバーレベルで `ManageChannels` または `Administrator` を持つユーザー** | Discordの仕様上、全チャンネルの編集・削除が可能（VAC管理チャンネルも含む）               |
| **一般ユーザー**                                                            | Discord UIからは操作不可。パネル・コマンド経由（VC参加中のみ）で名前・人数制限のみ変更可 |

> **セキュリティ上の注意**: `@everyone` への `ManageChannels` 付与は行いません。この権限にはチャンネル削除・権限上書きも含まれるためです。名前変更・人数制限変更はパネルボタン経由（Bot代理実行）でVC参加中のユーザーが行えます。

### 3. 自動削除機能

**削除条件**: VCが完全に空になったとき

**処理フロー:**

```
1. voiceStateUpdateイベントで退出を検知
   ↓
2. VCが空かチェック
   ↓
3. 空の場合
   - VCを削除
   - データベースから削除
```

### 4. VC操作コマンド

**コマンド**: `/vac`

**実行権限**: そのVCに参加中のユーザーのみ（Bot側でVC参加チェックを実施）

#### サブコマンド: `vc-rename`

参加中のVCの名前を変更します。

**引数:**

| 引数名 | 型     | 必須 | 説明       |
| ------ | ------ | ---- | ---------- |
| name   | String | ✅   | 新しいVC名 |

**動作:**

1. コマンド実行者が自動作成VCに参加中か確認
2. 参加中のVCが自動作成VCか確認（VAC管理下か）
3. VCの名前を変更
4. 成功メッセージを返す

**実行例:**

```
/vac vc-rename name:みんなのたまり場
```

**成功時の応答:**

```
✅ VC名を みんなのたまり場 に変更しました
```

**エラー時の応答:**

- VCに参加していない場合：`❌ このコマンドはVC参加中にのみ使用できます`
- 参加中のVCがVAC管理外の場合：`❌ このVCは自動作成チャンネルではありません`

#### サブコマンド: `vc-limit`

参加中のVCの人数制限を変更します。

**引数:**

| 引数名 | 型      | 必須 | 説明                         |
| ------ | ------- | ---- | ---------------------------- |
| limit  | Integer | ✅   | 人数制限（0=無制限、最大99） |

**動作:**

1. コマンド実行者が自動作成VCに参加中か確認
2. 参加中のVCが自動作成VCか確認（VAC管理下か）
3. `limit` の値が 0〜99 の範囲か検証
4. VCの人数制限を変更（0 は無制限）
5. 成功メッセージを返す

**実行例:**

```
/vac vc-limit limit:5
/vac vc-limit limit:0
```

**成功時の応答:**

```
✅ 人数制限を 5人 に設定しました
✅ 人数制限を 無制限 に設定しました
```

**エラー時の応答:**

- VCに参加していない場合：`❌ このコマンドはVC参加中にのみ使用できます`
- 参加中のVCがVAC管理外の場合：`❌ このVCは自動作成チャンネルではありません`
- 範囲外の値の場合：`❌ 人数制限は0〜99の範囲で指定してください`

---

### 5. 設定コマンド

**コマンド**: `/vac-config`

**実行権限**: 管理者のみ

#### サブコマンド: `create-trigger`

トリガーチャンネルを自動作成します。

**引数:** なし

**動作:**

1. コマンド実行チャンネルと同じカテゴリーに「CreateVC」を作成
2. 作成したチャンネルを自動的にトリガーチャンネルとして登録
3. データベースに保存

**実行例:**

```
/vac-config create-trigger
```

**成功時の応答:**

```
✅ トリガーチャンネル #CreateVC を作成しました
```

#### サブコマンド: `remove-trigger`

トリガーチャンネルを削除します。

**引数:**

| 引数名  | 型           | 必須 | 説明                       |
| ------- | ------------ | ---- | -------------------------- |
| channel | VoiceChannel | ✅   | 削除するトリガーチャンネル |

**動作:**

1. 指定されたチャンネルがトリガーチャンネルか確認
2. チャンネルを削除
3. データベースから登録解除

**実行例:**

```
/vac-config remove-trigger channel:#CreateVC
```

**成功時の応答:**

```
✅ トリガーチャンネル #CreateVC を削除しました
```

#### サブコマンド: `show`

現在のVC自動作成機能の設定を表示します。

**引数:** なし

**動作:**

1. 現在のVC自動作成機能の設定を取得
2. トリガーチャンネル一覧と作成されたVC一覧を表示

**実行例:**

```
/vac-config show
```

**応答例:**

```
【VC自動作成機能】
トリガーチャンネル: #CreateVC
作成されたVC: 3個
```

---

## 💾 データベース設計

### GuildConfig.vacConfig

VC自動作成機能の設定は`GuildConfig`テーブルの`vacConfig`フィールドにJSON形式で保存されます。

**型定義:**

```typescript
interface VacConfig {
  enabled: boolean; // 機能の有効/無効
  triggerChannelIds: string[]; // トリガーチャンネルIDリスト
  createdChannels: VacChannelPair[]; // 作成されたチャンネル一覧
}

interface VacChannelPair {
  voiceChannelId: string; // ボイスチャンネルID
  ownerId: string; // 作成者（所有者）のユーザーID
  createdAt: number; // 作成日時（Unix timestamp）
}
```

**保存例:**

```json
{
  "enabled": true,
  "triggerChannelIds": ["123456789012345678"],
  "createdChannels": [
    {
      "voiceChannelId": "987654321098765432",
      "ownerId": "111222333444555666",
      "createdAt": 1708329600000
    }
  ]
}
```

**初期値:**

```json
{
  "enabled": false,
  "triggerChannelIds": [],
  "createdChannels": []
}
```

---

## 🏗️ 実装詳細

### イベントハンドラー

#### voiceStateUpdate - VC作成・削除

**ファイル**: `src/bot/events/voiceStateUpdate.ts`

**VC作成処理フロー:**

```typescript
async function handleVacCreate(member: GuildMember, newChannel: VoiceChannel) {
  // 1. トリガーチャンネルか確認
  const config = await repository.getVacConfig(member.guild.id);
  if (!config.enabled || !config.triggerChannelIds.includes(newChannel.id)) {
    return;
  }

  // 2. VCを作成
  const voiceChannel = await member.guild.channels.create({
    name: `${member.displayName}'s Room`,
    type: ChannelType.GuildVoice,
    parent: newChannel.parent,
    userLimit: 99,
    permissionOverwrites: [
      {
        id: member.id,
        allow: [PermissionFlagsBits.ManageChannels],
      },
    ],
  });

  // 3. 操作パネルを設置
  await sendControlPanel(voiceChannel);

  // 4. ユーザーを移動
  await member.voice.setChannel(voiceChannel);

  // 5. データベースに保存
  await repository.addCreatedChannel(member.guild.id, {
    voiceChannelId: voiceChannel.id,
    ownerId: member.id,
    createdAt: Date.now(),
  });
}
```

**VC削除処理フロー:**

```typescript
async function handleVacDelete(oldChannel: VoiceChannel) {
  // 1. 作成されたVCか確認
  const config = await repository.getVacConfig(oldChannel.guild.id);
  const channelInfo = config.createdChannels.find(
    (ch) => ch.voiceChannelId === oldChannel.id,
  );

  if (!channelInfo) return;

  // 2. VCが空か確認
  if (oldChannel.members.size === 0) {
    // 3. VCを削除
    await oldChannel.delete();

    // 4. データベースから削除
    await repository.removeCreatedChannel(oldChannel.guild.id, oldChannel.id);
  }
}
```

#### channelDelete - トリガーチャンネル削除検知

**ファイル**: `src/bot/events/channelDelete.ts`

```typescript
async function handleChannelDelete(channel: GuildChannel) {
  if (channel.type !== ChannelType.GuildVoice) return;

  const config = await repository.getVacConfig(channel.guildId);

  // トリガーチャンネルが削除された場合
  if (config.triggerChannelIds.includes(channel.id)) {
    config.triggerChannelIds = config.triggerChannelIds.filter(
      (id) => id !== channel.id,
    );
    await repository.updateVacConfig(channel.guildId, config);
    logger.info(`[VAC] Trigger channel deleted: ${channel.name}`);
  }
}
```

### コマンド実装

#### `/vac-config` コマンド

**ファイル**: `src/bot/commands/vac-config.ts`

**権限チェック:**

- `PermissionFlagsBits.Administrator` を要求

**サブコマンド処理:**

各サブコマンド（create-trigger, remove-trigger, show）の実装詳細は主要機能セクションを参照。

### `/vac` コマンド

**ファイル**: `src/bot/commands/vac.ts`

**権限チェック（共通）:**

```typescript
async function checkVacMembership(
  interaction: ChatInputCommandInteraction,
): Promise<VoiceChannel | null> {
  const member = interaction.member as GuildMember;

  // 1. VCに参加しているか確認
  const voiceChannel = member.voice.channel;
  if (!voiceChannel) {
    await interaction.reply({
      content: await tGuild(guildId, "errors:vac.not_in_any_vc"),
      ephemeral: true,
    });
    return null;
  }

  // 2. 自動作成VCか確認
  const config = await repository.getVacConfig(interaction.guildId!);
  const isVacChannel = config.createdChannels.some(
    (ch) => ch.voiceChannelId === voiceChannel.id,
  );
  if (!isVacChannel) {
    await interaction.reply({
      content: await tGuild(guildId, "errors:vac.not_vac_channel"),
      ephemeral: true,
    });
    return null;
  }

  return voiceChannel as VoiceChannel;
}
```

### 操作パネル

**ファイル**: `src/bot/services/VacControlPanel.ts`

**パネル送信:**

```typescript
async function sendControlPanel(voiceChannel: VoiceChannel) {
  const embed = new EmbedBuilder()
    .setTitle("🎤 ボイスチャンネル操作パネル")
    .setDescription("このパネルからVCの設定を変更できます。")
    .setColor(0x5865f2);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("vac_rename")
      .setLabel("VC名を変更")
      .setEmoji("✏️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("vac_limit")
      .setLabel("人数制限を変更")
      .setEmoji("👥")
      .setStyle(ButtonStyle.Primary),
    // ... 他のボタン
  );

  await voiceChannel.send({ embeds: [embed], components: [row] });
}
```

**ボタンインタラクション:**

各ボタンの処理詳細（Modal表示、User Select Menuなど）は主要機能セクションを参照。

**権限チェック:**

パネルの全ボタンハンドラーでは、インタラクションを発行したユーザーが**そのVCに現在参加しているか**を確認します。参加していない場合はエラーを返します。Botが `voiceChannel.edit()` を直接呼び出すため、ユーザー側の `ManageChannels` 権限は不要です。

```typescript
// VC名変更ボタンのハンドラー例（VC参加チェックあり）
async function handleVacRename(interaction: ButtonInteraction) {
  const voiceChannel = interaction.channel as VoiceBasedChannel;

  // VC参加チェック: インタラクションを発行したユーザーがVCにいるか確認
  const member = interaction.member as GuildMember;
  if (member.voice.channelId !== voiceChannel.id) {
    await interaction.reply({
      content: await tGuild(guildId, "errors:vac.not_in_vc"),
      ephemeral: true,
    });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId("vac_rename_modal")
    .setTitle("VC名を変更");
  // ...
  await interaction.showModal(modal);
}
```

---

## 🌐 多言語対応（i18next）

### 翻訳キー

#### コマンド説明

```json
{
  "vac-config": {
    "description": "VC自動作成機能の設定",
    "create-trigger": {
      "description": "トリガーチャンネルを作成"
    },
    "remove-trigger": {
      "description": "トリガーチャンネルを削除",
      "channel": {
        "description": "削除するトリガーチャンネル"
      }
    },
    "show": {
      "description": "現在のVC自動作成機能の設定を表示"
    }
  }
}
```

#### コマンド説明（`/vac`）

```json
{
  "vac": {
    "description": "自動作成VCの設定を変更",
    "rename": {
      "description": "参加中のVC名を変更",
      "name": {
        "description": "新しいVC名"
      }
    },
    "limit": {
      "description": "参加中のVCの人数制限を変更",
      "limit": {
        "description": "人数制限（0=無制限、最大99）"
      }
    }
  }
}
```

#### コマンド応答

```json
{
  "commands": {
    "vac": {
      "trigger_created": "トリガーチャンネル {{channel}} を作成しました",
      "trigger_removed": "トリガーチャンネル {{channel}} を削除しました",
      "vc_created": "{{user}} のVCを作成しました: {{channel}}",
      "vc_deleted": "VCが削除されました",
      "renamed": "VC名を {{name}} に変更しました",
      "limit_changed": "人数制限を {{limit}} に設定しました",
      "members_moved": "{{count}}人を AFK に移動しました",
      "settings_title": "【VC自動作成機能設定】",
      "trigger_channels": "トリガーチャンネル",
      "created_vcs": "作成されたVC"
    }
  }
}
```

#### パネルUI

```json
{
  "vac": {
    "panel": {
      "title": "ボイスチャンネル操作パネル",
      "description": "このパネルからVCの設定を変更できます。",
      "rename_button": "VC名を変更",
      "limit_button": "人数制限を変更",
      "afk_button": "メンバーをAFKに移動",
      "refresh_button": "パネルを最下部に移動"
    }
  }
}
```

#### エラーメッセージ

```json
{
  "errors": {
    "vac": {
      "not_configured": "VC自動作成機能が設定されていません",
      "trigger_not_found": "トリガーチャンネルが見つかりません",
      "already_exists": "トリガーチャンネルが既に存在します",
      "category_full": "カテゴリがチャンネル数の上限に達しています",
      "no_permission": "チャンネルを作成する権限がありません",
      "not_in_vc": "このVCに参加しているユーザーのみ操作できます",
      "not_in_any_vc": "このコマンドはVC参加中にのみ使用できます",
      "not_vac_channel": "このVCは自動作成チャンネルではありません",
      "limit_out_of_range": "人数制限は0〜99の範囲で指定してください"
    }
  }
}
```

---

## 🚨 エラーハンドリング

### 想定されるエラー

**1. 権限不足**

```typescript
// チャンネル作成権限がない
catch (error) {
  if (error.code === 50013) { // Missing Permissions
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.no_permission")
    );
  }
}
```

**2. カテゴリが満杯**

```typescript
// カテゴリ内のチャンネル数が上限（50）
if (category.children.cache.size >= 50) {
  throw new ValidationError(await tGuild(guildId, "errors:vac.category_full"));
}
```

**3. 名前の重複**

```typescript
// 同じ名前のチャンネルが既に存在
let channelName = `${member.displayName}'s Room`;
let counter = 2;
while (guild.channels.cache.find((ch) => ch.name === channelName)) {
  channelName = `${member.displayName}'s Room (${counter})`;
  counter++;
}
```

**4. Bot再起動時のクリーンアップ**

```typescript
// Bot起動時に空のVCを削除
async function cleanupEmptyVCs(guild: Guild) {
  const config = await repository.getVacConfig(guild.id);

  for (const channelInfo of config.createdChannels) {
    const channel = guild.channels.cache.get(channelInfo.voiceChannelId);

    if (!channel || channel.members.size === 0) {
      // 空のVC、または削除済みのVCをクリーンアップ
      if (channel) await channel.delete();
      await repository.removeCreatedChannel(
        guild.id,
        channelInfo.voiceChannelId,
      );
    }
  }
}
```

**5. トリガーチャンネル削除検知**

`channelDelete` イベントで自動的にデータベースから削除（実装詳細セクション参照）。

---

## ✅ テストケース

### `/vac-config create-trigger` コマンド

#### 正常系

- [ ] **トリガーチャンネル作成**: コマンド実行チャンネルと同じカテゴリに「CreateVC」が作成される
- [ ] **自動登録**: 作成されたチャンネルが自動的にトリガーチャンネルとして登録される
- [ ] **成功メッセージ**: 作成成功時に適切なメッセージが表示される

#### 異常系

- [ ] **管理者権限なし**: 管理者以外が実行した場合、エラーメッセージが表示される
- [ ] **重複作成**: 既にトリガーチャンネルが存在する場合、エラーメッセージが表示される
- [ ] **カテゴリ満杯**: カテゴリのチャンネル数が上限の場合、エラーメッセージが表示される

### `/vac-config remove-trigger` コマンド

#### 正常系

- [ ] **チャンネル削除**: 指定されたトリガーチャンネルが削除される
- [ ] **登録解除**: データベースからトリガーチャンネル登録が解除される
- [ ] **成功メッセージ**: 削除成功時に適切なメッセージが表示される

#### 異常系

- [ ] **管理者権限なし**: 管理者以外が実行した場合、エラーメッセージが表示される
- [ ] **チャンネル不在**: 指定されたチャンネルが存在しない場合、適切に処理される

### `/vac-config show` コマンド

#### 正常系

- [ ] **設定表示**: 現在のトリガーチャンネルと作成されたVC一覧が表示される
- [ ] **未設定表示**: VAC設定がない場合、未設定メッセージが表示される

#### 異常系

- [ ] **管理者権限なし**: 管理者以外が実行した場合、エラーメッセージが表示される

### VC自動作成

#### 正常系

- [ ] **トリガー検知**: トリガーチャンネルへの参加を正しく検知
- [ ] **VC作成**: ユーザー名を含む適切な名前でVCが作成される
- [ ] **権限付与**: 作成者にManageChannels権限が付与される
- [ ] **操作パネル設置**: VCのチャットに操作パネルが送信される
- [ ] **自動移動**: ユーザーが作成されたVCに自動移動される
- [ ] **DB保存**: 作成されたVCの情報がデータベースに保存される

#### 異常系

- [ ] **権限不足**: Botにチャンネル作成権限がない場合、適切なエラーが表示される
- [ ] **名前重複**: 同名のチャンネルが存在する場合、数字サフィックスが追加される
- [ ] **カテゴリ満杯**: カテゴリが満杯の場合、エラーメッセージが表示される

### VC自動削除

#### 正常系

- [ ] **空室検知**: VCが完全に空になったことを正しく検知
- [ ] **VC削除**: 空になったVCが自動的に削除される
- [ ] **DB削除**: データベースから該当VCの情報が削除される

#### 異常系

- [ ] **削除失敗**: VCの削除に失敗した場合、適切にログ記録される

### `/vac rename` コマンド

#### 正常系

- [ ] **名前変更**: 参加中の自動作成VCの名前が変更される
- [ ] **成功通知**: 変更成功時に確認メッセージが表示される（ephemeral）

#### 異常系

- [ ] **VC未参加**: VCに参加していない状態でコマンドを実行するとエラーメッセージが表示される（ephemeral）
- [ ] **VAC管理外VC**: 自動作成VC以外のVCに参加中にコマンドを実行するとエラーメッセージが表示される（ephemeral）

### `/vac limit` コマンド

#### 正常系

- [ ] **制限変更**: 参加中の自動作成VCの人数制限が変更される
- [ ] **無制限設定**: 0を指定すると無制限に設定される
- [ ] **成功通知**: 変更成功時に確認メッセージが表示される（ephemeral）

#### 異常系

- [ ] **VC未参加**: VCに参加していない状態でコマンドを実行するとエラーメッセージが表示される（ephemeral）
- [ ] **VAC管理外VC**: 自動作成VC以外のVCに参加中にコマンドを実行するとエラーメッセージが表示される（ephemeral）
- [ ] **バリデーション**: 0-99の範囲外の値を指定するとエラーメッセージが表示される（ephemeral）

### 操作パネル

#### VC名変更

- [ ] **Modal表示**: ボタンクリックでModalが表示される
- [ ] **名前変更**: 入力された名前でVCの名前が変更される
- [ ] **成功通知**: 変更成功時に確認メッセージが表示される
- [ ] **VC参加者のみ**: そのVCに参加中のユーザーのみボタンから名前変更できる
- [ ] **非参加者拒否**: VCに参加していないユーザーが操作するとエラーメッセージが表示される（ephemeral）
- [ ] **既存チャンネル非対象**: VAC管理外の通常チャンネルでは動作しない

#### 人数制限変更

- [ ] **Modal表示**: ボタンクリックでModalが表示される
- [ ] **バリデーション**: 0-99の範囲外の値が入力された場合、エラーが表示される
- [ ] **制限変更**: 入力された数値でVCの人数制限が変更される
- [ ] **無制限設定**: 0を入力すると無制限に設定される
- [ ] **VC参加者のみ**: そのVCに参加中のユーザーのみボタンから人数制限を変更できる
- [ ] **非参加者拒否**: VCに参加していないユーザーが操作するとエラーメッセージが表示される（ephemeral）
- [ ] **既存チャンネル非対象**: VAC管理外の通常チャンネルでは動作しない

#### AFK移動

- [ ] **User Select表示**: ボタンクリックでUser Select Menuが表示される
- [ ] **メンバー移動**: 選択されたメンバーがAFKチャンネルに移動される
- [ ] **複数選択**: 複数メンバーを選択して一括移動できる

#### パネル再送信

- [ ] **既存削除**: 既存のパネルメッセージが削除される
- [ ] **新規送信**: 新しいパネルが最下部に送信される

### channelDeleteイベント

#### 正常系

- [ ] **トリガー削除検知**: トリガーチャンネルの削除を正しく検知
- [ ] **自動登録解除**: データベースから削除されたトリガーチャンネルのIDが除去される
- [ ] **ログ記録**: 削除イベントが適切にログ記録される

### Bot再起動時のクリーンアップ

- [ ] **空VC検知**: Bot再起動時に空のVCを検出
- [ ] **クリーンアップ**: 空のVCが削除される
- [ ] **DB同期**: データベースと実際のチャンネル状態が同期される

---

## 関連ドキュメント

- [TODO.md](../TODO.md) - 開発タスクと進捗
- [AFK_SPEC.md](AFK_SPEC.md) - AFK機能仕様（AFK移動機能で使用）
- [I18N_GUIDE.md](I18N_GUIDE.md) - 多言語対応ガイド
- [TESTING_GUIDELINES.md](TESTING_GUIDELINES.md) - テスト方針とガイドライン
