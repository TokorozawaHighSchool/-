Playwright E2E テスト実行手順

1. 依存をインストール

```pwsh
npm install
npx playwright install
```

2. テストを実行

```pwsh
npx playwright test
```

注意:
- テストはローカルの `src/index.html` を file:// プロトコルで開きます。ブラウザのセキュリティにより一部機能が制限される場合があります。
- 音声・自動再生の制限により、効果音はテスト実行中に再生されない可能性があります。
