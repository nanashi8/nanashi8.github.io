# Servant UX改善計画 - 万人に分かりやすい表示への全面刷新

## 📋 プロジェクト概要

**目的**: Servant拡張機能の全出力を、VSCode初心者でも直感的に理解できるよう、Windows風の親切な表示に全面刷新する

**対象範囲**: Servantから人間向けに出力される全ての情報
- 起動時メッセージ
- ステータスバー表示
- 警告・エラーメッセージ
- ログ出力
- 天体儀ビュー
- Autopilotガイダンス
- コマンドパレット項目

**基本方針**: 
- 専門用語を排除し、日常的な言葉で説明
- アイコンと色で視覚的に理解しやすく
- 次に何をすべきか明確に提示
- 段階的な情報開示（概要→詳細）

---

## 🔍 現状分析 - 何が問題か

### 1. 専門用語・略語が多すぎる

**現在の問題例**:
```
⚡ [Servant 警告] GitHub Actions 健康診断: 要対応（1件）
[Activation] Building project index...
[Autopilot] ⚠️ 審議（承認）ダイアログは省略しました
推定タスク: test (信頼度: 80%)
⚠️ [Servant 警告] Specチェックが未記録/期限切れです
```

**何が分かりにくいか**:
- 「GitHub Actions 健康診断」→ 何を診断？
- 「project index」→ 何のインデックス？
- 「審議（承認）ダイアログ」→ 何を審議？
- 「Specチェック」→ Specって何？
- 「信頼度 80%」→ だから何をすれば？

### 2. 記号と絵文字の乱用

**問題**:
```
═══════════════════════════════════════════════════════════
🌟 プロジェクトの全体像（天体儀ビュー）
═══════════════════════════════════════════════════════════
```

- 装飾が多すぎて本質が見えない
- 「天体儀ビュー」→ 意味不明な比喩表現

### 3. 情報の過多と構造化不足

**問題**:
- 一度に大量の情報が表示される
- 何が重要で何が二次的か不明
- 「次のアクション」が埋もれている

### 4. ユーザーの行動につながらない

**問題**:
```
詳細: コマンドパレット → "Servant: Show Warning Log"
```

- 具体的な操作手順が不明
- エラーを見ても「で、どうすれば？」となる

### 5. 技術的な内部情報の露出

**問題**:
```
アクション: unknown (action-1768524908540-rdo6syn3p)
作業量: 変更対象 36 ファイル（大作業）
```

- ユーザーに無関係なID表示
- 「36ファイル変更」だけでは影響範囲が分からない

---

## 🎯 改善の目標

### ターゲットユーザー像

**ペルソナ1: 初心者の田中さん**
- VSCodeを使い始めて3ヶ月
- 英語学習アプリを作ってみたい
- Git、CI/CDなどの用語は知らない
- エラーが出ると何をすべきか分からず困る

**ペルソナ2: 中級者の佐藤さん**
- プログラミング経験1年
- 基本的な開発はできるが、ベストプラクティスは自信なし
- エディタの警告は読むが、専門的すぎると理解できない
- 効率的な開発フローを学びたい

### 改善後の理想の姿

#### ✅ 起動時メッセージ（改善後）
```
🛡️ Servant アシスタントが起動しました
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 プロジェクト状態を確認中...

✅ プロジェクトは正常に動作しています
   ファイル: 134個
   最近の変更: なし

💡 次のステップ:
   作業を開始すると、Servantが自動的にサポートします
   
📌 ヒント: ステータスバー左下の「🛡️ Servant」をクリックすると
          いつでも詳細を確認できます

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### ✅ 警告メッセージ（改善後）
```
⚠️ 注意が必要な問題が見つかりました

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
問題: GitHubでのビルドが失敗する可能性があります
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 詳細:
   自動ビルドの設定ファイルに1件の問題があります
   
📍 影響範囲:
   この問題を放置すると、コードをGitHubにアップロードした際に
   自動ビルドが失敗する可能性があります
   
🔧 解決方法:
   1. ステータスバーの「🛡️ Servant: 1件の問題」をクリック
   2. 問題の詳細を確認
   3. 「修正を提案」ボタンをクリック
   
   または、Copilot Chatで「Servantの警告を修正して」と入力

⏱️  対応目安: 5分
🎯 重要度: 中
   
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### ✅ ステータスバー（改善後）
```
現在: 🛡️ Servant: すべて順調
クリック: 🛡️ Servant: 1件の問題 | クリックして確認
```

---

## 📐 設計方針

### 1. 情報階層の明確化

```
レベル1（最重要）: ステータスバー
├─ 現在の状態を一言で
└─ 問題がある場合は件数表示

レベル2（概要）: Output Channel - サマリー
├─ 何が起きているか（平易な日本語）
├─ 影響範囲は？
└─ 次に何をすべきか

レベル3（詳細）: Output Channel - 詳細
├─ 技術的な詳細情報
├─ ログ・エラーメッセージ
└─ デバッグ情報

レベル4（専門家向け）: コマンド実行
└─ JSON出力、デバッグモード、etc
```

### 2. 言語ガイドライン

#### ❌ 使用禁止ワード
- GitHub Actions健康診断 → ビルド状態確認
- project index → プロジェクト分析
- Specチェック → 必須設定の確認
- 審議 → 確認
- 天体儀ビュー → プロジェクト概要
- 優先度 → 重要度
- Neural → AI
- Activation → 起動
- Autopilot → 自動サポート
- 違反 → 問題
- Git違反 → コーディングルール違反

#### ✅ 推奨表現
- 「問題が見つかりました」
- 「確認が必要です」
- 「次のステップ」
- 「このファイルを確認してください」
- 「クリックして詳細を見る」
- 「5分で解決できます」
- 「今すぐ対応が必要」「後で確認できます」

### 3. 視覚デザイン

#### アイコンの統一
```typescript
const ICON = {
  SUCCESS: '✅',     // 成功・完了
  WARNING: '⚠️',     // 警告
  ERROR: '❌',       // エラー
  INFO: 'ℹ️',       // 情報
  ACTION: '🔧',     // アクション必要
  QUESTION: '❓',   // 質問・不明
  PROGRESS: '⏳',   // 進行中
  HINT: '💡',       // ヒント
  LOCATION: '📍',   // 場所・ファイル
  TIME: '⏱️',       // 時間・期限
  PROTECT: '🛡️',    // Servant本体
  TARGET: '🎯',     // 目標・重要度
  DOCS: '📋',       // ドキュメント
};
```

#### 色の使い分け
- **緑**: 正常、成功、完了
- **黄**: 警告、確認推奨
- **赤**: エラー、即対応必要
- **青**: 情報、ヒント
- **灰**: 二次的な情報

#### 枠線の統一
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  メインセクション区切り
────────────────────────────────  サブセクション区切り
```

### 4. メッセージテンプレート

#### パターン1: 状態通知
```
[アイコン] [状態の要約]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[簡潔な説明]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 詳細:
   [詳しい説明]

[必要に応じて次のステップ]
```

#### パターン2: 問題報告
```
⚠️ 問題が見つかりました

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
問題: [問題の要約（30文字以内）]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 詳細:
   [何が起きているか]
   
📍 影響範囲:
   [この問題が放置されるとどうなるか]
   
🔧 解決方法:
   1. [ステップ1]
   2. [ステップ2]
   3. [ステップ3]
   
⏱️  対応目安: [所要時間]
🎯 重要度: [高/中/低]
```

#### パターン3: アクション提案
```
💡 作業のヒント

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[提案内容の要約]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 推奨理由:
   [なぜこの作業が必要か]
   
🔧 実行方法:
   1. [具体的な手順]
   2. [...]
   
⏱️  所要時間: [目安]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 実行する | ⏭️ スキップ | ❌ 今後表示しない
```

---

## 🛠️ 実装計画

### フェーズ1: 基盤整備（Week 1）

#### 1.1 メッセージフォーマッターの作成

**ファイル**: `src/ui/MessageFormatter.ts`

```typescript
export interface FormattedMessage {
  // サマリー（ステータスバー用）
  summary: string;
  
  // 簡易表示（Output Channel - サマリーモード）
  brief: string;
  
  // 詳細表示（Output Channel - 詳細モード）
  detailed: string;
  
  // 重要度
  severity: 'critical' | 'important' | 'normal' | 'info';
  
  // カテゴリ
  category: 'error' | 'warning' | 'info' | 'success';
}

export class MessageFormatter {
  /**
   * 起動メッセージ
   */
  static formatActivation(stats: ProjectStats): FormattedMessage {
    return {
      summary: 'すべて順調',
      brief: '✅ Servantアシスタントが起動しました',
      detailed: this.buildActivationDetails(stats),
      severity: 'info',
      category: 'success',
    };
  }

  /**
   * 問題検出メッセージ
   */
  static formatProblem(problem: Problem): FormattedMessage {
    const urgency = this.calculateUrgency(problem);
    return {
      summary: `${problem.count}件の問題`,
      brief: `⚠️ ${this.translateProblemType(problem.type)}: ${problem.count}件`,
      detailed: this.buildProblemDetails(problem),
      severity: urgency,
      category: 'warning',
    };
  }

  /**
   * 技術用語を平易な日本語に変換
   */
  private static translateTerm(technicalTerm: string): string {
    const dictionary: Record<string, string> = {
      'GitHub Actions': '自動ビルド',
      'project index': 'プロジェクト分析',
      'Spec check': '必須設定の確認',
      'Git violations': 'コーディングルール違反',
      'Neural dependency': 'ファイル間の関連',
      'Autopilot': '自動サポート',
      'Activation': '起動',
      'Constellation view': 'プロジェクト概要',
    };
    
    return dictionary[technicalTerm] || technicalTerm;
  }

  /**
   * 専門用語を含む文章を平易化
   */
  static simplifyMessage(technicalMessage: string): string {
    let simplified = technicalMessage;
    
    // 専門用語を置換
    Object.entries(this.TERM_DICTIONARY).forEach(([tech, plain]) => {
      simplified = simplified.replace(new RegExp(tech, 'gi'), plain);
    });
    
    return simplified;
  }
}
```

#### 1.2 ユーザビリティ設定の追加

**ファイル**: `package.json`

```json
{
  "contributes": {
    "configuration": {
      "properties": {
        "servant.ui.languageLevel": {
          "type": "string",
          "enum": ["beginner", "intermediate", "expert"],
          "default": "beginner",
          "description": "表示メッセージの詳細度（初心者/中級者/上級者）"
        },
        "servant.ui.showTechnicalTerms": {
          "type": "boolean",
          "default": false,
          "description": "専門用語を表示する（上級者向け）"
        },
        "servant.ui.autoExpand": {
          "type": "boolean",
          "default": false,
          "description": "詳細情報を自動的に展開する"
        },
        "servant.ui.estimateTime": {
          "type": "boolean",
          "default": true,
          "description": "対応にかかる時間の目安を表示"
        }
      }
    }
  }
}
```

### フェーズ2: コアコンポーネント改修（Week 2-3）

#### 2.1 ServantWarningLoggerの全面刷新

**ファイル**: `src/ui/ServantWarningLogger.ts`

```typescript
export class ServantWarningLogger {
  private formatter: MessageFormatter;
  
  /**
   * 警告を記録（改善版）
   */
  public logWarning(warning: ServantWarning): void {
    // 設定に応じた表示レベル
    const userLevel = this.getUserLevel();
    const formatted = this.formatter.formatWarning(warning, userLevel);
    
    // 重複チェック（既存）
    if (this.isDuplicate(formatted)) {
      return;
    }
    
    // 表示モードに応じて出力
    if (userLevel === 'beginner') {
      this.outputBriefMessage(formatted);
    } else if (userLevel === 'intermediate') {
      this.outputStandardMessage(formatted);
    } else {
      this.outputDetailedMessage(formatted);
    }
    
    // ステータスバー更新
    this.updateStatusBar(formatted);
  }

  /**
   * 初心者向け簡易メッセージ
   */
  private outputBriefMessage(msg: FormattedMessage): void {
    this.outputChannel.appendLine('');
    this.outputChannel.appendLine('━'.repeat(60));
    this.outputChannel.appendLine(`${msg.icon} ${msg.title}`);
    this.outputChannel.appendLine('━'.repeat(60));
    this.outputChannel.appendLine('');
    this.outputChannel.appendLine('📋 何が起きているか:');
    this.outputChannel.appendLine(`   ${msg.description}`);
    
    if (msg.impact) {
      this.outputChannel.appendLine('');
      this.outputChannel.appendLine('📍 影響:');
      this.outputChannel.appendLine(`   ${msg.impact}`);
    }
    
    if (msg.actions && msg.actions.length > 0) {
      this.outputChannel.appendLine('');
      this.outputChannel.appendLine('🔧 解決方法:');
      msg.actions.forEach((action, idx) => {
        this.outputChannel.appendLine(`   ${idx + 1}. ${action.description}`);
        if (action.command) {
          this.outputChannel.appendLine(`      → ${action.commandDescription}`);
        }
      });
    }
    
    if (msg.estimatedTime) {
      this.outputChannel.appendLine('');
      this.outputChannel.appendLine(`⏱️  対応目安: ${msg.estimatedTime}`);
    }
    
    this.outputChannel.appendLine('━'.repeat(60));
    this.outputChannel.appendLine('');
  }
}
```

#### 2.2 ステータスバーの改善

**ファイル**: `src/extension.ts`

```typescript
function updateServantStatusBar(activity?: string) {
  const enabled = isEnabled();
  const problemCount = countCurrentProblems();
  
  let statusText: string;
  let statusIcon: string;
  let statusColor: vscode.ThemeColor | undefined;
  
  if (!enabled) {
    statusText = 'Servant: オフ';
    statusIcon = '🔌';
    statusColor = new vscode.ThemeColor('statusBarItem.warningBackground');
  } else if (problemCount > 0) {
    statusText = `Servant: ${problemCount}件の問題`;
    statusIcon = '⚠️';
    statusColor = new vscode.ThemeColor('statusBarItem.errorBackground');
  } else {
    statusText = 'Servant: すべて順調';
    statusIcon = '✅';
    statusColor = undefined;
  }
  
  servantStatusBar.text = `${statusIcon} ${statusText}`;
  servantStatusBar.tooltip = buildTooltip(enabled, problemCount, activity);
  servantStatusBar.backgroundColor = statusColor;
  servantStatusBar.command = 'servant.showProblems';
  servantStatusBar.show();
}

function buildTooltip(enabled: boolean, problemCount: number, activity?: string): string {
  if (!enabled) {
    return 'Servantアシスタントは現在オフです\n\n設定で有効化できます:\n設定 → Servant → Enable';
  }
  
  if (problemCount > 0) {
    return `⚠️ 注意が必要な問題が ${problemCount} 件あります\n\nクリックして詳細を確認\n\n💡 ヒント: 問題の多くは自動修正できます`;
  }
  
  let tooltip = '✅ プロジェクトは正常です\n\n';
  if (activity) {
    tooltip += `現在の状態: ${activity}\n\n`;
  }
  tooltip += '💡 Servantがプロジェクトを監視しています';
  
  return tooltip;
}
```

#### 2.3 起動メッセージの改善

**ファイル**: `src/extension.ts`

```typescript
function showActivationMessage(context: vscode.ExtensionContext): void {
  const userLevel = getUserLevel();
  const stats = collectProjectStats();
  
  if (userLevel === 'beginner') {
    showBeginnerActivation(stats);
  } else {
    showStandardActivation(stats);
  }
}

function showBeginnerActivation(stats: ProjectStats): void {
  outputChannel.appendLine('');
  outputChannel.appendLine('🛡️ Servantアシスタントが起動しました');
  outputChannel.appendLine('━'.repeat(60));
  outputChannel.appendLine('');
  outputChannel.appendLine('📊 プロジェクト状態を確認中...');
  outputChannel.appendLine('');
  
  // プロジェクト分析
  const analysis = analyzeProject(stats);
  
  if (analysis.isHealthy) {
    outputChannel.appendLine('✅ プロジェクトは正常に動作しています');
    outputChannel.appendLine(`   ファイル: ${stats.fileCount}個`);
    outputChannel.appendLine(`   最近の変更: ${stats.recentChanges || 'なし'}`);
  } else {
    outputChannel.appendLine(`⚠️ ${analysis.problemCount}件の問題が見つかりました`);
    outputChannel.appendLine('   クリックして詳細を確認 → ステータスバー左下');
  }
  
  outputChannel.appendLine('');
  outputChannel.appendLine('💡 次のステップ:');
  outputChannel.appendLine('   作業を開始すると、Servantが自動的にサポートします');
  outputChannel.appendLine('');
  outputChannel.appendLine('📌 ヒント: ステータスバー左下の「🛡️ Servant」をクリックすると');
  outputChannel.appendLine('          いつでも詳細を確認できます');
  outputChannel.appendLine('');
  outputChannel.appendLine('━'.repeat(60));
  outputChannel.appendLine('');
}
```

### フェーズ3: 個別機能の改善（Week 4-5）

#### 3.1 Autopilotメッセージの改善

**ファイル**: `src/autopilot/AutopilotController.ts`

現在の問題:
```
=== Servant Autopilot: 事前誘導（最善手順の提案） ===
アクション: unknown (action-1768524908540-rdo6syn3p)
推定タスク: test (信頼度: 80%)
```

改善後:
```
💡 作業のヒント

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
テストの追加が推奨されます
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 推奨理由:
   36個のファイルに変更があります
   テストを追加することで、変更が正しく動作するか確認できます

🔧 推奨手順:
   1. テスト対象のコードを確認
   2. テストケースを設計
   3. テストを実装
   4. カバレッジを確認
   5. エッジケースを追加

⏱️  所要時間: 約30分

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 3.2 天体儀ビューの改善

**ファイル**: `src/constellation/ConstellationDataGenerator.ts`

現在の問題:
```
═══════════════════════════════════════════════════════════
🌟 プロジェクトの全体像（天体儀ビュー）
═══════════════════════════════════════════════════════════
```

改善後:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 プロジェクト概要
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 プロジェクトのゴール:
   英語学習プラットフォーム
   → ユーザーの英語力を効果的に向上させる

📁 重要なファイル（上位10件）:
   1. useAdaptiveNetwork (重要度: 高)
   2. useLearningLimits (重要度: 高)
   3. useQuizState (重要度: 中)
   ...

💡 推奨アクション:
   • 重要度の高いファイルを優先的に改善
   • テストカバレッジを追加
   • ドキュメントを更新

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 3.3 Git関連メッセージの改善

現在の問題:
```
⚠️ [Servant 警告] Git違反を検出しました (1件)
  詳細: コマンドパレット → "Servant: Show Warning Log"
```

改善後:
```
⚠️ コーディングルールに関する注意

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
問題: 1個のファイルがコーディングルールに違反しています
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 詳細:
   以下のファイルを確認してください:
   • src/example.ts

📍 影響:
   このままコミットすると、チーム内のルールに反する可能性があります

🔧 解決方法:
   1. ステータスバーの「⚠️ Servant: 1件の問題」をクリック
   2. 問題の詳細を確認
   3. 「自動修正」をクリック

   または、Copilot Chatで以下を実行:
   「Servantのコーディングルール違反を修正して」

⏱️  対応目安: 3分
🎯 重要度: 中

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### フェーズ4: インタラクティブ機能の追加（Week 6）

#### 4.1 問題詳細ビューの実装

**新規ファイル**: `src/ui/ProblemDetailView.ts`

```typescript
export class ProblemDetailView {
  /**
   * 問題の詳細をWebビューで表示
   */
  static show(problem: Problem): void {
    const panel = vscode.window.createWebviewPanel(
      'servantProblemDetail',
      '問題の詳細',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
      }
    );

    panel.webview.html = this.getHtmlContent(problem);
    
    // ボタンクリックのハンドリング
    panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'autoFix':
          await this.executeAutoFix(problem);
          break;
        case 'showFile':
          await this.showFile(problem.filePath);
          break;
        case 'ignore':
          await this.ignoreProblem(problem);
          break;
      }
    });
  }

  private static getHtmlContent(problem: Problem): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            padding: 20px;
            line-height: 1.6;
          }
          .header {
            border-bottom: 2px solid #007acc;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
          }
          .section {
            margin: 20px 0;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 5px;
          }
          .section-title {
            font-weight: bold;
            margin-bottom: 10px;
          }
          .action-buttons {
            margin-top: 30px;
            display: flex;
            gap: 10px;
          }
          button {
            padding: 10px 20px;
            font-size: 14px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          }
          .btn-primary {
            background: #007acc;
            color: white;
          }
          .btn-secondary {
            background: #e0e0e0;
            color: #333;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">⚠️ ${this.escapeHtml(problem.title)}</div>
        </div>

        <div class="section">
          <div class="section-title">📋 何が起きているか</div>
          <div>${this.escapeHtml(problem.description)}</div>
        </div>

        <div class="section">
          <div class="section-title">📍 影響</div>
          <div>${this.escapeHtml(problem.impact)}</div>
        </div>

        <div class="section">
          <div class="section-title">🔧 解決方法</div>
          <ol>
            ${problem.steps.map(step => `<li>${this.escapeHtml(step)}</li>`).join('')}
          </ol>
        </div>

        <div class="section">
          <div class="section-title">⏱️ 対応目安</div>
          <div>${problem.estimatedTime || '不明'}</div>
        </div>

        <div class="action-buttons">
          <button class="btn-primary" onclick="autoFix()">✅ 自動修正</button>
          <button class="btn-secondary" onclick="showFile()">📁 ファイルを開く</button>
          <button class="btn-secondary" onclick="ignore()">❌ 無視</button>
        </div>

        <script>
          const vscode = acquireVsCodeApi();
          
          function autoFix() {
            vscode.postMessage({ command: 'autoFix' });
          }
          
          function showFile() {
            vscode.postMessage({ command: 'showFile' });
          }
          
          function ignore() {
            vscode.postMessage({ command: 'ignore' });
          }
        </script>
      </body>
      </html>
    `;
  }
}
```

#### 4.2 対話型セットアップウィザード

**新規ファイル**: `src/ui/SetupWizard.ts`

```typescript
export class SetupWizard {
  /**
   * 初回起動時のセットアップウィザードを表示
   */
  static async show(context: vscode.ExtensionContext): Promise<void> {
    const hasShownBefore = context.globalState.get('servant.setupComplete', false);
    
    if (hasShownBefore) {
      return;
    }

    // ステップ1: ようこそ画面
    const proceed = await this.showWelcome();
    if (!proceed) {
      return;
    }

    // ステップ2: スキルレベルの選択
    const level = await this.selectSkillLevel();
    if (!level) {
      return;
    }

    // ステップ3: 機能の説明
    await this.explainFeatures(level);

    // 設定を保存
    await vscode.workspace.getConfiguration('servant').update(
      'ui.languageLevel',
      level,
      vscode.ConfigurationTarget.Global
    );

    await context.globalState.update('servant.setupComplete', true);

    vscode.window.showInformationMessage(
      '✅ Servantのセットアップが完了しました！',
      '詳細を見る'
    ).then(selection => {
      if (selection === '詳細を見る') {
        vscode.commands.executeCommand('servant.showOutput');
      }
    });
  }

  private static async showWelcome(): Promise<boolean> {
    const result = await vscode.window.showInformationMessage(
      '🛡️ Servantへようこそ！\n\nServantは、あなたのコーディングをサポートするアシスタントです。\n簡単なセットアップを行います（30秒程度）',
      { modal: true },
      '開始する',
      'スキップ'
    );

    return result === '開始する';
  }

  private static async selectSkillLevel(): Promise<string | undefined> {
    const items: vscode.QuickPickItem[] = [
      {
        label: '🌱 初心者',
        description: 'VSCodeやプログラミングを学び始めたばかり',
        detail: '詳しい説明と丁寧なガイドを表示します'
      },
      {
        label: '🌿 中級者',
        description: '基本的な開発はできるが、ベストプラクティスは学習中',
        detail: '適度な説明とヒントを表示します'
      },
      {
        label: '🌳 上級者',
        description: '開発経験が豊富で、専門的な情報が欲しい',
        detail: '技術的な詳細と専門用語を使用します'
      }
    ];

    const selected = await vscode.window.showQuickPick(items, {
      title: 'あなたの経験レベルを選択してください',
      placeHolder: 'レベルを選択...',
    });

    if (!selected) {
      return undefined;
    }

    if (selected.label.includes('初心者')) {
      return 'beginner';
    } else if (selected.label.includes('中級者')) {
      return 'intermediate';
    } else {
      return 'expert';
    }
  }

  private static async explainFeatures(level: string): Promise<void> {
    const messages = {
      beginner: 
        'Servantは以下をサポートします:\n\n' +
        '✅ コードの品質チェック\n' +
        '✅ 問題の自動検出と修正提案\n' +
        '✅ プロジェクトの状態監視\n' +
        '✅ わかりやすいヒントの表示\n\n' +
        'ステータスバー左下の「🛡️ Servant」でいつでも状態を確認できます',
      intermediate:
        'Servantの主な機能:\n\n' +
        '✅ リアルタイムコード分析\n' +
        '✅ 自動修正とベストプラクティス提案\n' +
        '✅ プロジェクト構造の最適化支援\n' +
        '✅ Gitフロー統合\n\n' +
        'コマンドパレットから各種機能にアクセスできます',
      expert:
        'Servantの高度な機能:\n\n' +
        '✅ Neural dependency分析\n' +
        '✅ 自動最適化エンジン\n' +
        '✅ カスタムルール設定\n' +
        '✅ CI/CD統合\n\n' +
        '設定で詳細なカスタマイズが可能です'
    };

    await vscode.window.showInformationMessage(
      messages[level as keyof typeof messages],
      { modal: true },
      'OK'
    );
  }
}
```

### フェーズ5: テストと最適化（Week 7）

#### 5.1 ユーザビリティテストの実施

**テスト項目**:

1. **初心者ユーザーテスト**
   - Servantを初めて起動する
   - メッセージが理解できるか
   - 問題が発生した時、どうすればよいか分かるか
   - 各機能にアクセスできるか

2. **タスク完了テスト**
   - 「警告を修正する」タスク
   - 「プロジェクトの状態を確認する」タスク
   - 「設定を変更する」タスク
   - 各タスクを5分以内に完了できるか

3. **メッセージ理解度テスト**
   - 各メッセージを読んだ後、内容を説明できるか
   - 専門用語が分からずに止まることがないか
   - 次のアクションが明確か

4. **ストレステスト**
   - 大量の警告が出た場合の可読性
   - 長時間使用した場合の疲労度
   - エラー連発時のパニック度

#### 5.2 フィードバック収集機能

**新規ファイル**: `src/ui/FeedbackCollector.ts`

```typescript
export class FeedbackCollector {
  /**
   * メッセージの理解度フィードバックを収集
   */
  static async collectFeedback(messageId: string, message: string): Promise<void> {
    const config = vscode.workspace.getConfiguration('servant');
    const feedbackEnabled = config.get<boolean>('feedback.enabled', true);
    
    if (!feedbackEnabled) {
      return;
    }

    // 10%の確率でフィードバックを求める（うるさくなりすぎないように）
    if (Math.random() > 0.1) {
      return;
    }

    const result = await vscode.window.showInformationMessage(
      '💡 このメッセージは分かりやすかったですか？',
      '分かりやすい ✅',
      '普通',
      '分かりにくい ❌'
    );

    if (!result) {
      return;
    }

    let rating: number;
    if (result.includes('✅')) {
      rating = 5;
    } else if (result.includes('❌')) {
      rating = 1;
      // 分かりにくい場合は詳細を聞く
      const detail = await vscode.window.showInputBox({
        prompt: 'どこが分かりにくかったですか？（任意）',
        placeHolder: '例: 専門用語が多い、次に何をすべきか不明、など'
      });
      
      if (detail) {
        this.saveFeedback(messageId, rating, detail);
      }
    } else {
      rating = 3;
    }

    this.saveFeedback(messageId, rating);
  }

  private static saveFeedback(messageId: string, rating: number, comment?: string): void {
    // フィードバックをローカルに保存
    const feedback = {
      messageId,
      rating,
      comment,
      timestamp: new Date().toISOString(),
      userLevel: vscode.workspace.getConfiguration('servant').get('ui.languageLevel'),
    };

    // 開発者がフィードバックを確認できるようログ出力
    console.log('[Servant Feedback]', feedback);
    
    // 将来的には匿名でテレメトリー送信も検討
  }
}
```

### フェーズ6: ドキュメント整備（Week 8）

#### 6.1 ユーザーガイドの作成

**新規ファイル**: `docs/user-guide/getting-started.md`

```markdown
# Servant 初心者ガイド

## 🎯 Servantとは？

Servantは、VSCodeでの開発を助けるアシスタントです。
以下のことを自動的に行います:

- ✅ コードの品質をチェック
- ✅ 問題を見つけて修正を提案
- ✅ プロジェクトの状態を監視
- ✅ わかりやすいヒントを表示

## 📦 インストール

（インストール手順）

## 🚀 使い方

### 1. ステータスバーで状態確認

画面左下の「🛡️ Servant」をクリックすると、
プロジェクトの状態が確認できます。

- ✅ **すべて順調** - 問題なし！
- ⚠️ **○件の問題** - 確認が必要です

### 2. 問題の確認と修正

問題が見つかったら:

1. ステータスバーの「⚠️ Servant」をクリック
2. 問題の詳細を読む
3. 「自動修正」ボタンをクリック

ほとんどの問題は自動で修正できます！

### 3. ヒントの活用

作業中に💡マークが表示されたら、
役立つヒントがあります。

クリックして確認してみましょう。

## ❓ よくある質問

### Q: 専門用語が分かりません

A: 設定で表示レベルを「初心者」に変更すると、
   専門用語が減って、わかりやすくなります。

   設定 → Servant → Language Level → Beginner

### Q: メッセージが多すぎます

A: 設定で「サマリー表示」に変更できます。
   重要なメッセージだけが表示されます。

### Q: エラーが出たけど、どうすれば？

A: ステータスバーをクリックして、
   「解決方法」の手順に従ってください。
   
   分からない場合は、Copilot Chatで
   「Servantの問題を修正して」と入力してください。

## 💬 サポート

（サポート情報）
```

#### 6.2 トラブルシューティングガイド

**新規ファイル**: `docs/user-guide/troubleshooting.md`

```markdown
# トラブルシューティング

## 🔍 問題別の解決方法

### ステータスバーに「問題」と表示される

**対処法**:
1. ステータスバーをクリック
2. 問題の詳細を確認
3. 「自動修正」をクリック

詳しくは: [問題の確認と修正](#)

### メッセージの意味が分からない

**対処法**:
1. 設定を開く（⌘, または Ctrl+,）
2. "Servant" で検索
3. "Language Level" を "Beginner" に変更

### Servantが動作しない

**確認項目**:
- [ ] Servantが有効化されているか
      → 設定 → Servant → Enable
- [ ] VSCodeを再起動してみる
- [ ] 拡張機能が最新版か確認

（以下続く）
```

---

## 📊 成功指標（KPI）

### 定量的指標

1. **メッセージ理解度**: 90%以上のユーザーがメッセージの内容を理解できる
2. **タスク完了率**: 80%以上のユーザーが警告修正タスクを5分以内に完了
3. **設定変更率**: 50%以下（適切なデフォルト設定により変更不要）
4. **フィードバック評価**: 平均4.0以上/5.0

### 定性的指標

1. **初見の印象**: 「親切」「分かりやすい」「安心感がある」
2. **継続使用意欲**: 「ずっと使いたい」「他の人にも勧めたい」
3. **学習効果**: 「Servantのおかげで成長できた」

---

## 🎯 ロードマップ

### 短期（1-2ヶ月）
- ✅ メッセージフォーマッターの実装
- ✅ ServantWarningLoggerの刷新
- ✅ ステータスバーの改善
- ✅ 起動メッセージの改善

### 中期（3-4ヶ月）
- 問題詳細ビューの実装
- セットアップウィザードの追加
- フィードバック収集機能
- ユーザーガイドの整備

### 長期（5-6ヶ月）
- 多言語対応（英語、中国語など）
- パーソナライズ機能（学習に応じた表示レベル自動調整）
- アクセシビリティ対応（スクリーンリーダー対応）
- 音声フィードバック（オプション）

---

## 📝 実装の優先順位

### P0（最優先 - Week 1-2）
1. MessageFormatterの作成
2. ServantWarningLoggerの刷新
3. ステータスバーの改善
4. 起動メッセージの改善

### P1（高優先 - Week 3-4）
5. Autopilotメッセージの改善
6. Git関連メッセージの改善
7. 天体儀ビューの改善

### P2（中優先 - Week 5-6）
8. 問題詳細ビューの実装
9. セットアップウィザード
10. フィードバック収集

### P3（低優先 - Week 7-8）
11. ユーザーガイドの作成
12. トラブルシューティングガイド
13. ユーザビリティテスト

---

## 🤝 レビューと改善サイクル

### 週次レビュー
- フィードバックの確認
- メッセージ理解度の確認
- 問題点の洗い出し

### 月次レビュー
- KPIの評価
- ユーザーインタビュー
- 改善計画の見直し

### 継続的改善
- フィードバックに基づく微調整
- 新しいメッセージパターンの追加
- ドキュメントの更新

---

## 📚 参考資料

### ベストプラクティス
- [Microsoft Design Language](https://www.microsoft.com/design/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/)
- [Google Material Design](https://material.io/design/)

### UXライティング
- [UX Writing Hub](https://uxwritinghub.com/)
- [Mailchimp Content Style Guide](https://styleguide.mailchimp.com/)

---

## ✅ チェックリスト

実装時に確認すべき項目:

### メッセージ作成時
- [ ] 専門用語を使っていないか
- [ ] 一般的な日常語で説明できているか
- [ ] 次のアクションが明確か
- [ ] 所要時間の目安があるか
- [ ] 重要度が示されているか
- [ ] 影響範囲が説明されているか

### UI実装時
- [ ] アイコンの意味が直感的か
- [ ] 色の使い分けが適切か
- [ ] 情報階層が明確か
- [ ] クリック可能な要素が分かりやすいか
- [ ] モバイル/小画面でも見やすいか

### テスト時
- [ ] 初心者が5分で理解できるか
- [ ] タスクを完了できるか
- [ ] 専門用語で止まることはないか
- [ ] ストレスを感じないか
- [ ] 安心感があるか

---

## 📞 連絡先

質問・提案があれば:
- Issue: （GitHubリンク）
- Discussion: （Discussionリンク）

---

**最終更新**: 2026年1月16日  
**バージョン**: 1.0  
**ステータス**: 策定完了
