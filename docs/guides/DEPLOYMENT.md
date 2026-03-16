# デプロイガイド

> GitHub Actions + Portainer API による ayasono の自動デプロイフロー

最終更新: 2026年3月16日（SSH/SCP 方式から Portainer API 方式に移行）

---

## 概要

GitHub Actions が main ブランチへの push を検知すると、Docker イメージのビルド・GHCR への push・Portainer Stack の再デプロイまでを自動で行う。

初回セットアップ（VPS の初期設定・Portainer のインストール）は **[XSERVER_VPS_SETUP.md](XSERVER_VPS_SETUP.md)** を参照。

### デプロイフロー全体図

```
main へ push / PR マージ
  └── [Test] 型チェック・vitest によるテスト
        └── [Deploy to VPS] テスト成功時のみ
              ├── Docker イメージをビルドして GHCR にプッシュ
              ├── Portainer API で Stack を再デプロイ（compose pull + コンテナ再起動）
              ├── [Discord通知（成功）] デプロイ成功時
              └── [Discord通知（失敗）] test または deploy 失敗時
```

---

## 1. GitHub Actions ワークフロー

ワークフロー定義は [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml)。

### トリガー条件

| イベント                                  | 実行されるジョブ             |
| ----------------------------------------- | ---------------------------- |
| `main` / `develop` への PR オープン・更新 | Test のみ                    |
| `main` への push（PR マージ含む）         | Test + Deploy + Discord 通知 |

### ジョブ構成

| ジョブ           | 条件                         | 内容                                         |
| ---------------- | ---------------------------- | -------------------------------------------- |
| `test`           | push/PR すべて（close 除く） | pnpm typecheck + pnpm test                   |
| `deploy`         | main への push のみ          | GHCR イメージビルド + Portainer API デプロイ |
| `notify-success` | deploy 成功時                | Discord に成功 Embed を送信                  |
| `notify-failure` | test または deploy 失敗時    | Discord に失敗 Embed を送信                  |

---

## 2. 必要な GitHub Secrets

### デプロイ用（必須）

| Secret                  | 説明                                   | 例                           |
| ----------------------- | -------------------------------------- | ---------------------------- |
| `PORTAINER_URL`         | Portainer の URL（末尾 `/` なし）      | `http://220.158.17.101:9000` |
| `PORTAINER_API_KEY`     | Portainer API トークン                 | My account > Access tokens   |
| `PORTAINER_STACK_ID`    | Stack の ID（URL の `?id=` から確認）  | `15`                         |
| `PORTAINER_ENDPOINT_ID` | エンドポイント ID（URL の `#!/` 直後） | `3`                          |

### 通知用

| Secret                | 説明                                |
| --------------------- | ----------------------------------- |
| `PORTAINER_HOST`      | Portainer の IP（Discord リンク用） |
| `DISCORD_WEBHOOK_URL` | Discord Webhook URL                 |

> `PORTAINER_URL` の末尾に `/` をつけると API パスが `//api/...` になり 404 エラーになるため注意。

---

## 3. デプロイステップ詳細

### 3-1. Docker イメージのビルドと GHCR プッシュ

`docker/build-push-action` を使って `Dockerfile` の `runner` ステージをビルドし、以下のタグで GHCR にプッシュする。

| タグ                                 | 用途             |
| ------------------------------------ | ---------------- |
| `ghcr.io/sonozaki-sz/ayasono:latest` | Portainer が参照 |
| `ghcr.io/sonozaki-sz/ayasono:<SHA>`  | ロールバック用   |

GitHub Actions のキャッシュ（`cache-from/cache-to: type=gha`）によりビルド時間を短縮している。

### 3-2. Portainer API による Stack 再デプロイ

GHCR への push 後、Portainer の REST API を呼び出して Stack を再デプロイする。
再デプロイ時に `env` パラメータを渡さないと Portainer UI で設定した環境変数がリセットされるため、事前に現在の環境変数を取得して引き継ぐ。

```bash
# 現在の Stack から環境変数を取得
ENV_VARS=$(curl -fsSL \
  "$PORTAINER_URL/api/stacks/$STACK_ID" \
  -H "X-API-Key: $API_KEY" \
  | jq '.Env // []')

# 環境変数を含めて再デプロイ
curl -fsSL -X PUT \
  "$PORTAINER_URL/api/stacks/$STACK_ID/git/redeploy?endpointId=$ENDPOINT_ID" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --argjson env "$ENV_VARS" '{
    pullImage: true,
    repositoryReferenceName: "refs/heads/main",
    env: $env
  }')"
```

Portainer が行う処理:

1. GitHub リポジトリから `docker-compose.portainer.yml` を pull
2. 新しいイメージ（`:latest`）を GHCR から pull
3. 既存の環境変数を保持したままコンテナを再作成して起動

### 3-3. 環境変数の管理

環境変数は **Portainer UI** で管理する。サーバー上の `.env` ファイルは使用しない。

**変更手順:**

1. Portainer → **Stacks** → **ayasono** → **Editor**
2. **Environment variables** セクションで値を変更
3. **Pull and redeploy** をクリック

### 3-4. Compose ファイルの構成

| ファイル                       | 用途                                     |
| ------------------------------ | ---------------------------------------- |
| `docker-compose.portainer.yml` | Portainer Stack 用（本番デプロイで使用） |

Portainer Stack は Repository 方式で `docker-compose.portainer.yml` を参照している。compose ファイルの変更はリポジトリに push すれば次回デプロイ時に自動で反映される。

### 3-5. Discord 通知

成功/失敗の Embed に Portainer Stack ページへのリンクが含まれる。

```
http://<PORTAINER_HOST>:9000/#!/<ENDPOINT_ID>/docker/stacks/ayasono?id=<STACK_ID>&type=2
```

---

## 4. ロールバック手順

### 4-1. Portainer UI でのロールバック

1. Portainer → **Stacks** → **ayasono** → **Editor**
2. compose ファイル内のイメージタグを `ghcr.io/sonozaki-sz/ayasono:<旧SHA>` に変更
3. **Update the stack** をクリック
4. 復旧後、タグを `:latest` に戻して再度更新

### 4-2. Git revert でのロールバック

```bash
git revert <問題のコミットSHA>
git push origin main
# → GitHub Actions が自動でデプロイ
```

---

## 5. トラブルシューティング

### deploy ジョブが 404 エラーで失敗する

- `PORTAINER_URL` の末尾に `/` がついていないか確認（`http://xxx:9000` が正しい）
- `PORTAINER_STACK_ID` / `PORTAINER_ENDPOINT_ID` が正しいか確認（Portainer の Stack URL から取得）

### deploy ジョブが 401/403 エラーで失敗する

- `PORTAINER_API_KEY` が有効か確認（Portainer → My account → Access tokens）
- トークンが期限切れの場合は再発行して GitHub Secrets を更新

### GHCR へのプッシュ・プルに失敗する

- リポジトリの **Settings → Actions → General** で「Allow GitHub Actions to create and approve pull requests」が有効か確認
- `GITHUB_TOKEN` の `packages: write` 権限が有効か確認（deploy ジョブの `permissions:` で設定済み）

### bot コンテナの起動後すぐクラッシュする

```bash
# Portainer UI → Containers → ayasono-bot → Logs で確認
# または SSH で:
docker logs ayasono-bot --tail 50
```

- Portainer の環境変数が正しく設定されているか確認
- `sqlite_data` ボリュームの権限エラーがないか確認

### SQLITE_READONLY エラーが発生する

`docker-entrypoint.sh` がコンテナ起動時に `chown -R node:node /app/storage` を自動実行するため、通常は発生しない。発生した場合:

```bash
docker exec -u root ayasono-bot chown -R node:node /app/storage
```

### Discord 通知の Portainer リンクが機能しない

- `PORTAINER_HOST` / `PORTAINER_ENDPOINT_ID` / `PORTAINER_STACK_ID` が正しく設定されているか確認

---

## 6. Docker・デプロイ関連ファイルの変更ルール

> Dockerfile / docker-compose ファイル / GitHub Actions ワークフローを変更する場合は、必ずローカルでテストを通過させてからコミットすること。
> CI/CD を使ったデプロイは失敗するたびに本番停止時間が発生するため、ローカル確認を必須とする。

### 対象ファイル

| ファイル                       | ローカルテスト方法                                                                  |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `Dockerfile`                   | `docker build --target runner .` が成功すること                                     |
| `docker-compose.portainer.yml` | `docker compose -f docker-compose.portainer.yml config` でバリデーションが通ること  |
| `.github/workflows/deploy.yml` | [act](https://github.com/nektos/act) または PR を作成してテストジョブを確認すること |

### Dockerfile 変更時の必須手順

```bash
# 1. runner ステージのビルドが最後まで通ることを確認
docker build --target runner .

# 2. エラーが出た場合は --progress=plain でログを確認
docker build --target runner --progress=plain . 2>&1 | tail -50
```

### チェックリスト

- [ ] `docker build --target runner .` がエラーなく完了する
- [ ] `docker compose -f docker-compose.portainer.yml config` がバリデーションを通る
- [ ] ローカルビルド確認後にコミットしている

---

## 関連ドキュメント

- [XSERVER_VPS_SETUP.md](XSERVER_VPS_SETUP.md) — VPS・Portainer の初回セットアップ手順
- [ARCHITECTURE.md](ARCHITECTURE.md) — システム構成・アーキテクチャ解説
- [docker-compose.portainer.yml](../../docker-compose.portainer.yml) — Portainer Stack 用 Compose 定義
- [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml) — CI/CD ワークフロー定義
