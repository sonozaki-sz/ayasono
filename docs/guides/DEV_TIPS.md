# 開発 Tips

> 開発中に遭遇しやすいトラブルと対処法

最終更新: 2026年3月21日

---

## トラブルシューティング

### bot プロセスがバックグラウンドに残っている

開発コンテナ内で起動した bot がターミナルを閉じても残り続ける場合がある。

```bash
# bot プロセスを探す
ps aux | grep "dist/bot/main.js" | grep -v grep

# 見つかったら PID を指定して停止
kill <PID>
```

TTY が `?` のプロセスはターミナルに紐づかないバックグラウンド実行なので、手動で停止する必要がある。

### VSCode で TypeScript エラーが消えない

`pnpm typecheck` は通るのに VSCode 上で赤線が残る場合、言語サーバーのキャッシュが原因。

1. `Ctrl+Shift+P` → **TypeScript: Restart TS Server** を実行
2. それでも解消しない場合は **Developer: Reload Window** を実行
