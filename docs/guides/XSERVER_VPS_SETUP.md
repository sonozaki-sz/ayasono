# XServer VPS セットアップガイド

> XServer VPS に Docker + Portainer CE を導入し、ayasono を稼働させるための初回セットアップ手順

最終更新: 2026年3月16日（Portainer API デプロイ方式に移行）

---

## 📋 概要

このドキュメントでは、XServer VPS の初期設定から Docker・Portainer のインストール、bot コンテナの初回起動確認までの手順を説明します。
**一度セットアップが完了すれば、以降のデプロイはすべて GitHub Actions が自動で行います。**

### 完成後の構成

```
XServer VPS (Ubuntu 24.04)
├── Docker Compose (Infra スタック: infra)       ← /opt/infra/ で管理
│   └── portainer コンテナ                       ← コンテナ管理 UI + デプロイ API
└── Portainer Stack (ayasono)                    ← Portainer が GitHub リポジトリから管理
    └── bot コンテナ  (ayasono-bot)              ← Discord Bot 本体
```

> Portainer 自体は `/opt/infra/docker-compose.infra.yml` で管理する **Infra スタック**として起動します。
> bot は Portainer Stack（Repository 方式）で管理し、**GitHub Actions が Portainer API 経由でデプロイ**します。

### 必要なもの

| 項目 | 内容 |
| -- | -- |
| XServer VPS | 2GB プラン推奨（Ubuntu 24.04 LTS） |
| GitHub リポジトリ | リポジトリへの管理者権限 |
| Discord Bot | トークン + アプリケーション ID |

---

## 🖥️ 1. VPS の初期設定

### 1-1. サーバーの申し込み

[XServer VPS](https://vps.xserver.ne.jp/) のサービスページからサーバーを申し込む。

| 項目 | 推奨設定 |
| -- | -- |
| プラン | 2GB（月額 990円） |
| OS | Ubuntu 24.04 LTS |
| アプリイメージ | **Docker**（Docker + Compose が初期インストール済み） |

> アプリイメージで「Docker」を選択すると Docker / Docker Compose が最初から使える状態で起動する。

### 1-2. SSH 接続

コントロールパネルで確認した IP アドレスにログインする。

```bash
ssh root@<サーバーのIPアドレス>
```

### 1-3. 一般ユーザーの作成

`root` での常時運用はセキュリティリスクがあるため、専用ユーザーを作成する。

```bash
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy   # sudo なしで docker コマンドを使えるようにする
```

**ローカル PC** で SSH キーを生成してサーバーに登録する。

```bash
# ローカル PC で実行
ssh-keygen -t ed25519 -C "ayasono-deploy"
ssh-copy-id deploy@<サーバーのIPアドレス>

# キーで接続できることを確認
ssh deploy@<サーバーのIPアドレス>
```

以降の作業はすべて `deploy` ユーザーで行う。

### 1-4. ファイアウォール設定

```bash
sudo ufw allow OpenSSH
sudo ufw allow 9000/tcp   # Portainer UI + API
sudo ufw allow 9443/tcp   # Portainer HTTPS
sudo ufw enable
sudo ufw status
```

> Bot はアウトバウンド接続のみ使用するため、追加のポート開放は不要。

### 1-5. タイムゾーン設定

```bash
sudo timedatectl set-timezone Asia/Tokyo
timedatectl
```

---

## 🐳 2. Docker のインストール確認

アプリイメージ「Docker」を選択した場合は既にインストール済みのため、確認だけ行う。

```bash
docker --version
docker compose version
```

手動インストールが必要な場合（Ubuntu 24.04）:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker deploy
```

---

## 🌐 3. Portainer CE の起動（Infra スタック）

Portainer は bot スタックとは独立した **Infra スタック** として管理する。
リポジトリに含まれる `docker-compose.infra.yml` を `/opt/infra/` に配置して起動する。

### 3-1. ディレクトリとファイルの配置

```bash
sudo mkdir -p /opt/infra
sudo chown deploy:deploy /opt/infra
```

ローカルマシンまたはリポジトリから `docker-compose.infra.yml` をサーバーにコピーする:

```bash
# ローカル PC から scp でコピー
scp docker-compose.infra.yml deploy@<サーバーのIPアドレス>:/opt/infra/
```

`docker-compose.infra.yml` の内容（リポジトリルートに同梱）:

```yaml
services:
  portainer:
    image: portainer/portainer-ce:latest
    container_name: portainer
    restart: unless-stopped
    ports:
      - "9000:9000"
      - "9443:9443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
    logging:
      driver: json-file
      options:
        max-size: "5m"
        max-file: "3"

volumes:
  portainer_data:
```

### 3-2. Portainer の起動

```bash
docker compose -f /opt/infra/docker-compose.infra.yml -p infra up -d
```

起動確認:

```bash
docker ps | grep portainer
docker compose -f /opt/infra/docker-compose.infra.yml -p infra ps
```

---

## ⚙️ 4. Portainer の初期設定

ブラウザで `http://<サーバーのIPアドレス>:9000` にアクセスする。

> ⚠️ 初回アクセスは起動後 **5分以内** に完了させること。タイムアウトするとコンテナを再起動する必要がある。

### 4-1. 管理者アカウントの作成

| 項目 | 設定 |
| -- | -- |
| Username | `admin`（任意） |
| Password | 12文字以上の強力なパスワード |

### 4-2. 環境の追加

「Get Started」→ **local** を選択する。これで同一サーバー上の Docker を管理できる。

### 4-3. 環境 ID の確認

左メニュー → **Environments** → `local` をクリックし、ブラウザの URL から ID を確認する。

```
http://220.158.17.101:9000/#!/3/docker/dashboard
                                  ^
                              Endpoint ID = 3
```

この値を後で GitHub Secrets `PORTAINER_ENDPOINT_ID` に登録する。

---

## 📦 5. ayasono のファイル配置（初回のみ）

### 5-1. ディレクトリとファイルの配置

```bash
sudo mkdir -p /opt/ayasono/logs
sudo chown deploy:deploy /opt/ayasono
```

Portainer Stack で `docker-compose.portainer.yml` を自動取得するため、手動コピーは不要。
Portainer の Stack 設定でリポジトリ URL とファイルパスを指定すれば、デプロイ時に自動で最新の compose 定義が反映される。

### 5-2. 環境変数の設定

環境変数は **Portainer UI** で管理する。サーバー上の `.env` ファイルは使用しない。

1. Portainer → **Stacks** → **ayasono** → **Editor**
2. **Environment variables** セクションで以下を設定:

| 変数名 | 内容 |
| -- | -- |
| `DISCORD_TOKEN` | Discord Developer Portal で取得 |
| `DISCORD_APP_ID` | Discord Developer Portal で取得 |
| `DISCORD_GUILD_ID` | （任意）特定サーバー限定時に指定 |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `file:/storage/db.sqlite` |
| `LOCALE` | `ja` |
| `LOG_LEVEL` | `info` |
| `DISCORD_ERROR_WEBHOOK_URL` | Discord Webhook URL |

> GitHub Actions による再デプロイ時も環境変数は自動で保持される（ワークフローが既存の環境変数を取得して引き継ぐ）。

### 5-3. 起動確認（初回 GitHub Actions デプロイ後）

> ⚠️ イメージは初回 GitHub Actions 実行（セクション 7）で GHCR にプッシュされる。
> **セクション 6 の Secrets 登録 → セクション 7 の動作確認を先に完了させてから以下を実行すること。**

GitHub Actions によるデプロイが完了したら、コンテナの状態をログで確認する。

```bash
docker logs ayasono-bot --tail 50
```

---

## 🔑 6. GitHub Secrets の登録

GitHub リポジトリ → **Settings → Secrets and variables → Actions → New repository secret** から以下を登録する。

### デプロイ用（必須）

| Secret 名 | 内容 | 取得方法 |
| -- | -- | -- |
| `PORTAINER_URL` | Portainer の URL（末尾 `/` なし） | `http://<IP>:9000` |
| `PORTAINER_API_KEY` | Portainer API トークン | Portainer → My account → Access tokens |
| `PORTAINER_STACK_ID` | Stack の ID | Portainer の Stack URL の `?id=` から確認 |
| `PORTAINER_ENDPOINT_ID` | エンドポイント ID | セクション 4-3 参照 |

### 通知用

| Secret 名 | 内容 | 取得方法 |
| -- | -- | -- |
| `PORTAINER_HOST` | VPS の IP アドレス | コントロールパネルで確認 |
| `DISCORD_WEBHOOK_URL` | Discord の Webhook URL | Discord チャンネル設定から取得 |

> `PORTAINER_HOST` はデプロイには使用しない。Discord 通知の Portainer 管理リンク生成のみに使用する。

---

## ✅ 7. 動作確認

すべての Secrets を登録したら、`main` ブランチに適当な修正を push して GitHub Actions が正常に動作するかを確認する。

```
GitHub Actions の確認手順:
1. GitHub リポジトリ → Actions タブ
2. 「CI / Deploy」ワークフローを選択
3. Test → Deploy to VPS → Discord通知（成功）の順でグリーンになることを確認
```

デプロイ後、登録した Discord チャンネルに成功通知が届き、Portainer でコンテナが `running` 状態になっていることを確認する。

---

## 🔄 8. 手動再起動・デバッグ

通常は GitHub Actions でデプロイされるが、緊急時は以下で対応する。

```bash
# コンテナの再起動
docker restart ayasono-bot

# ログ確認（リアルタイム）
docker logs ayasono-bot -f

# コンテナ内でコマンド実行
docker exec -it ayasono-bot sh
```

Portainer の **Containers → ayasono-bot** からも同じ操作が UI で行える。

---

## 📖 関連ドキュメント

- [DEPLOYMENT.md](DEPLOYMENT.md) — GitHub Actions によるデプロイフローの詳細
- [ARCHITECTURE.md](ARCHITECTURE.md) — システム構成・アーキテクチャ解説
- [docker-compose.portainer.yml](../../docker-compose.portainer.yml) — Portainer Stack 用 Compose 定義
- [docker-compose.infra.yml](../../docker-compose.infra.yml) — Infra スタック定義（Portainer 用）
- [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml) — CI/CD ワークフロー定義
