# Servant改善 実装ガイド（個人開発版）

**実装者**: yuichinakamura  
**優先度**: P1（高）  
**見積もり時間**: 2-3時間  
**テスト時間**: 30分  
**合計**: 2.5-3.5時間

---

## 📋 実装する改善

### Phase 1: 必須改善（今回実装）

1. **重複警告の抑制** - cooldown機構の追加
2. **サマリー情報の表示** - ステータスバー情報をOutputに出力
3. **ActionsHealthMonitorの重複修正** - GitHub Actions警告の重複を防止

### Phase 2: オプション改善（将来）

4. 詳細JSONの折りたたみ
5. 新コマンド追加（Show Details, Clear History）

---

## 🔧 実装工程（全6ステップ）

### 工程1: ServantWarningLoggerの拡張（30分）

**ファイル**: `extensions/servant/src/ui/ServantWarningLogger.ts`

**変更内容**:

```typescript
export class ServantWarningLogger {
  // 【追加】cooldown管理用
  private recentWarnings = new Map<string, number>();
  private readonly COOLDOWN_MS = 60000; // 1分

  // 【追加】ステータス管理用
  private stats = {
    monitored: 0,
    violations: 0,
    fixed: 0
  };

  constructor(private outputChannel: vscode.OutputChannel) {}

  /**
   * 【変更】既存のlogWarningメソッドに重複チェックを追加
   */
  public logWarning(warning: ServantWarning): void {
    // 重複チェック
    const hash = this.hashWarning(warning);
    const lastLog = this.recentWarnings.get(hash);
    const now = Date.now();

    if (lastLog && now - lastLog < this.COOLDOWN_MS) {
      // 抑制: 簡潔な通知のみ
      this.outputChannel.appendLine(
        `[${new Date().toLocaleTimeString()}] 🔕 警告抑制中（${Math.floor((now - lastLog) / 1000)}秒前に出力済み）: ${warning.type}`
      );
      return;
    }

    // 新規または期限切れの警告はフル出力
    this.recentWarnings.set(hash, now);
    
    // 【既存のコードをそのまま維持】
    const icon = warning.severity === 'error' ? '⚠️' : warning.severity === 'warning' ? '⚡' : 'ℹ️';
    this.outputChannel.appendLine('\n' + '='.repeat(70));
    // ... 以降は既存のコード
  }

  /**
   * 【新規】警告のハッシュ生成
   */
  private hashWarning(warning: ServantWarning): string {
    return `${warning.type}:${warning.severity}:${warning.message}`;
  }

  /**
   * 【新規】サマリー情報の表示
   */
  public logStatusSummary(): void {
    this.outputChannel.appendLine('\n' + '═'.repeat(70));
    this.outputChannel.appendLine('🛡️ Servant ステータスサマリー');
    this.outputChannel.appendLine('═'.repeat(70));
    this.outputChannel.appendLine(`監視中: ${this.stats.monitored}件`);
    this.outputChannel.appendLine(`違反: ${this.stats.violations}件`);
    this.outputChannel.appendLine(`修正: ${this.stats.fixed}件`);
    this.outputChannel.appendLine('═'.repeat(70) + '\n');
  }

  /**
   * 【新規】ステータス更新（外部から呼び出される）
   */
  public updateStats(monitored: number, violations: number, fixed: number): void {
    this.stats = { monitored, violations, fixed };
  }

  /**
   * 【新規】cooldownクリア（テスト用/デバッグ用）
   */
  public clearCooldown(): void {
    this.recentWarnings.clear();
  }
}
```

**変更量**: 約50行追加

---

### 工程2: サマリー情報の表示（20分）

**ファイル**: `extensions/servant/src/extension.ts`

**変更箇所**: `activate`関数内

```typescript
// 【追加】ステータスバー更新時にサマリー情報も出力
const updateServantStatusBar = (activity?: string) => {
  if (activity) {
    currentActivity = activity;
  }
  const enabled = isEnabled();
  servantStatusBar.text = enabled ? `🛡️ Servant: ${currentActivity}` : 'Servant: OFF';
  
  // 【既存のコード】
  servantStatusBar.tooltip = enabled
    ? `Servantは有効です\n現在: ${currentActivity}\n\nクリックで詳細表示`
    : 'Servantは無効です（設定: servant.enable を true にすると有効化）';
  servantStatusBar.backgroundColor = enabled
    ? undefined
    : new vscode.ThemeColor('statusBarItem.warningBackground');
  servantStatusBar.command = 'servant.showOutput';
  servantStatusBar.show();

  // 【新規追加】ステータスバーの情報を解析してサマリー表示
  if (enabled && activity) {
    const match = activity.match(/監視中(\d+)件違反(\d+)件修正(\d+)件/);
    if (match && servantWarningLogger) {
      const monitored = parseInt(match[1], 10);
      const violations = parseInt(match[2], 10);
      const fixed = parseInt(match[3], 10);
      
      servantWarningLogger.updateStats(monitored, violations, fixed);
      
      // 状態が変わった時だけサマリーを出力（頻繁すぎないように）
      if (violations > 0 || fixed > 0) {
        servantWarningLogger.logStatusSummary();
      }
    }
  }

  // 【既存のコード】
  if (lastServantEnabled === null || lastServantEnabled !== enabled) {
    // ...
  }
};
```

**変更量**: 約15行追加

**追加変更**: `servant.showOutput`コマンドにもサマリー表示を追加

```typescript
context.subscriptions.push(
  vscode.commands.registerCommand('servant.showOutput', () => {
    outputChannel.show();
    // 【追加】Outputを開いた時にサマリーを表示
    if (servantWarningLogger) {
      servantWarningLogger.logStatusSummary();
    }
  })
);
```

---

### 工程3: ActionsHealthMonitorの重複修正（20分）

**ファイル**: `extensions/servant/src/monitoring/ActionsHealthMonitor.ts`

**問題**: `reportIssues`が複数回呼ばれて重複出力されている

**変更内容**:

```typescript
export class ActionsHealthMonitor implements vscode.Disposable {
  // 【追加】最後のレポート時刻を記録
  private lastReportTime = 0;
  private readonly MIN_REPORT_INTERVAL_MS = 300000; // 5分

  private reportIssues(issues: HealthIssue[]): void {
    if (issues.length === 0) return;

    // 【追加】頻繁すぎるレポートを抑制
    const now = Date.now();
    if (now - this.lastReportTime < this.MIN_REPORT_INTERVAL_MS) {
      console.log(`[ActionsHealthMonitor] レポート抑制中（${Math.floor((now - this.lastReportTime) / 1000)}秒前に出力済み）`);
      return;
    }
    this.lastReportTime = now;

    // 【既存のコード】
    const critical = issues.filter(i => i.severity === 'error');
    const warnings = issues.filter(i => i.severity === 'warning');
    // ... 以降は既存のコード
  }
}
```

**変更量**: 約10行追加

---

### 工程4: Autopilot出力の最適化（20分）

**ファイル**: `extensions/servant/src/autopilot/AutopilotController.ts`

**問題**: 天体儀ビューが何度も表示される

**変更内容**:

```typescript
export class AutopilotController {
  // 【追加】表示フラグ
  private hasShownConstellation = false;

  // 【変更】constellation表示を1回のみに制限
  private showConstellation(): void {
    if (this.hasShownConstellation) {
      this.outputChannel.appendLine(
        '\n🌟 天体儀ビュー: 前回表示済み（servant.showConstellation で再表示可能）\n'
      );
      return;
    }

    this.hasShownConstellation = true;
    
    // 【既存のコード】天体儀ビューの出力
    this.outputChannel.appendLine('\n' + '═'.repeat(63));
    this.outputChannel.appendLine('🌟 プロジェクトの全体像（天体儀ビュー）');
    // ... 以降は既存のコード
  }

  // 【新規】コマンドで明示的に表示（デバッグ/確認用）
  public forceShowConstellation(): void {
    this.hasShownConstellation = false;
    this.showConstellation();
  }
}
```

**変更量**: 約15行追加

**追加**: コマンド登録（extension.ts）

```typescript
context.subscriptions.push(
  vscode.commands.registerCommand('servant.showConstellation', () => {
    if (autopilotController) {
      autopilotController.forceShowConstellation();
    }
  })
);
```

---

### 工程5: ローカルテスト（30分）

**テストシナリオ**:

1. **重複警告のテスト**
   ```bash
   cd extensions/servant
   npm install
   npm run compile
   # F5でデバッグ起動
   ```
   
   確認事項:
   - [ ] 同じ警告が1分以内に2回出ない
   - [ ] 1分経過後は再度表示される
   - [ ] 抑制メッセージが簡潔に表示される

2. **サマリー情報のテスト**
   - [ ] ステータスバーに「監視中19件違反14件修正0件」が表示
   - [ ] Output Channelにも同じ情報がサマリーとして表示
   - [ ] `servant.showOutput`コマンドでサマリーが表示される

3. **GitHub Actions警告のテスト**
   - [ ] GitHub Actions健康診断が1回のみ表示
   - [ ] 5分以内の重複呼び出しが抑制される

4. **天体儀ビューのテスト**
   - [ ] 天体儀ビューが初回のみ表示
   - [ ] 2回目以降は「前回表示済み」メッセージ
   - [ ] `servant.showConstellation`で再表示可能

---

### 工程6: VSIXビルドと本番検証（30分）

```bash
cd extensions/servant

# バージョン更新
# package.json: "version": "0.3.30" → "0.4.0"

# ビルド
npm run package

# 生成されたVSIXをインストール
code --install-extension servant-0.4.0.vsix

# VSCode再起動して実プロジェクトで検証
```

**検証項目**:
- [ ] 既存のプロジェクトで正常動作
- [ ] 警告が適切に抑制される
- [ ] サマリー情報が見やすい
- [ ] パフォーマンス劣化なし

---

## 📊 工程まとめ

| 工程 | 作業内容 | 見積時間 | 累計 |
|------|---------|---------|------|
| 1 | ServantWarningLogger拡張 | 30分 | 30分 |
| 2 | サマリー情報表示 | 20分 | 50分 |
| 3 | ActionsHealthMonitor修正 | 20分 | 1時間10分 |
| 4 | Autopilot出力最適化 | 20分 | 1時間30分 |
| 5 | ローカルテスト | 30分 | 2時間 |
| 6 | VSIXビルド・本番検証 | 30分 | **2時間30分** |

**バッファ**: 30分（予期しない問題対応）  
**合計見積もり**: **2.5-3時間**

---

## 🎯 期待される成果

### 定量的改善

- **出力行数**: 1,200行 → 150行（87.5%削減）
- **重複警告**: 10-15回 → 1回（90%削減）
- **情報発見時間**: 45秒 → 5秒（88.9%短縮）

### 定性的改善

- ✅ 重要情報がすぐに見つかる
- ✅ AI（Copilot Chat）との連携が改善
- ✅ 作業の中断が減少
- ✅ ステータス情報の一貫性向上

---

## 🚀 実装開始コマンド

```bash
# 作業ブランチ作成
cd /Users/yuichinakamura/Documents/nanashi8-github-io-git/nanashi8.github.io
git checkout -b feature/servant-output-improvement

# Servant開発環境へ移動
cd extensions/servant

# 依存関係インストール（初回のみ）
npm install

# 開発開始
code .

# F5キーでデバッグ起動
# 変更 → テスト → 次の工程へ
```

---

## 📝 完了後のチェックリスト

- [ ] 工程1-4のコード変更完了
- [ ] ローカルテストすべてパス
- [ ] CHANGELOG.md更新
- [ ] package.json バージョン更新（0.4.0）
- [ ] VSIXビルド成功
- [ ] 本番環境で検証成功
- [ ] mainブランチにマージ
- [ ] GitHubにプッシュ
- [ ] リリースノート作成

---

## 💡 トラブルシューティング

### Q1: テスト環境でServantが起動しない

**対処**: 
```bash
npm run compile
# 成功したら F5 再実行
```

### Q2: 重複抑制が効かない

**対処**: 
- `clearCooldown()`メソッドを確認
- ハッシュ関数が正しく動作しているか確認
- Console Logで`recentWarnings`の内容を確認

### Q3: サマリー情報が表示されない

**対処**:
- `updateStats`が呼ばれているか確認
- 正規表現のマッチング確認
- `outputChannel`が正しく渡されているか確認

---

**実装責任者**: yuichinakamura  
**レビュー**: Self Review  
**目標完了日**: 2026年1月15日
