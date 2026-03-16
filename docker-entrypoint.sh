#!/bin/sh
# docker-entrypoint.sh
# コンテナ起動時に以下を順に実行する:
#   1. storage ディレクトリの所有権を node:node に修正
#   2. Prisma マイグレーションを適用
#   3. node ユーザーに切り替えてメインプロセスを起動
#
# 背景:
#   Docker の名前付きボリューム (sqlite_data) はホスト側で root が作成するため、
#   過去のデプロイやボリューム再利用時に db.sqlite / db.sqlite-wal / db.sqlite-shm が
#   root 所有になることがある。そのままだと node ユーザーで動く PrismaLibSql
#   (libsql アダプター) が書き込めず SQLITE_READONLY エラーが発生する。
#   この entrypoint では gosu を使って root → node への権限降格を安全に行う。

set -e

# storage ディレクトリ (名前付きボリューム) の所有権を node:node に修正
# /app/logs はバインドマウントのためホスト側へ影響させず対象外とする
chown -R node:node /app/storage

# node ユーザーでマイグレーションを実行（スキーマ変更がなければ即座に完了する）
gosu node pnpm prisma migrate deploy

# node ユーザーに切り替えて引数のコマンドを実行
exec gosu node "$@"
