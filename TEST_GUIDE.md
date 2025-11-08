# テストガイド

## 修正内容
- QuizViewが完全に実装されました
- CSVLoaderがBundleとResourcesフォルダの両方から読み込み可能
- 環境オブジェクトが適切に注入されています

## テスト手順

### 1. アプリの起動
1. Xcodeでプロジェクトを開く
2. シミュレータまたは実機を選択
3. Command+R でビルド＆実行

### 2. CSV読み込みのテスト
1. ホーム画面で「出題設定」をタップ
2. CSVを選択（例：中学英単語.csv）
3. 分野や難易度を設定
4. 戻るボタンで戻る
5. ホーム画面で「クイズをはじめる」をタップ
6. CSVが正しく読み込まれ、問題が表示されることを確認

### 3. CPU/メモリ使用率の確認
1. Xcodeの Debug Navigator（Command+7）を開く
2. CPU使用率とメモリ使用率を確認
3. 画面遷移時に異常な増加がないことを確認
4. クイズ画面で問題を何問か解いて、使用率が安定していることを確認

### 4. 期待される結果
✅ CSVファイルが正常に読み込まれる
✅ 問題が表示される
✅ 選択肢が表示される
✅ 回答できる
✅ 次の問題に進める
✅ CPU使用率が10%以下（アイドル時）
✅ メモリ使用率が徐々に増加しない

### 5. エラーが発生した場合
コンソールログを確認してください：
- `📚 CSVLoader: Bundleから読み込み` → 正常
- `📚 CSVLoader: Resourcesフォルダから読み込みを試行` → Bundleになかった場合のフォールバック
- `❌ CSVLoader: ファイルが見つかりません` → エラー

## トラブルシューティング

### 「CSVの読み込みに失敗しました」と表示される場合
1. CSVファイルがプロジェクトに追加されているか確認
2. ビルドターゲットにCSVファイルが含まれているか確認
3. コンソールログでエラー詳細を確認

### CPU/メモリ使用率が高い場合
1. 無限ループが発生していないか確認
2. Instruments（Product > Profile > Leaks）でメモリリークを調査
3. Instruments（Product > Profile > Time Profiler）でCPU使用を分析

## 実装の詳細

### CSVLoaderのパス解決
1. まず `Bundle.main.url(forResource:withExtension:)` で探す
2. 見つからなければ `#file` ベースでResourcesフォルダから探す
3. どちらも失敗したら `CSVLoaderError.notFound` をthrow

### QuizViewの状態管理
- `@State` で画面のローカル状態を管理
- `@EnvironmentObject` で共有データにアクセス
- `.onAppear` でCSV読み込みを1回だけ実行

### 環境オブジェクトの注入
SimpleWordApp → ContentView → QuizView の順で環境オブジェクトが伝播されます。
