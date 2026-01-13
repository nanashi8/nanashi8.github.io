---
title: "⚡ 重複警告の抑制とサマリー情報の表示"
labels: ["P1", "enhancement", "ux", "servant"]
assignees: []
---

## 📋 問題

Servantの出力に以下の問題があります：

1. **重複警告の氾濫**: 同じ警告が10回以上繰り返し出力される
2. **サマリー情報の欠如**: ステータスバー「監視中19件違反14件修正0件」がOutputに表示されない
3. **ノイズの過多**: 1,200行以上の出力で本質的情報が埋もれる

### 現状の出力例

```
======================================================================
⚠️ [Servant 警告] Specチェックが未記録/期限切れです
======================================================================
{ type: "spec-check-required", ... } (30行のJSON)
======================================================================
💡 対処方法: ...
🤖 AI対応ガイド: ...

# ↑これが10回以上繰り返される
```

### ユーザー影響

- 重要情報の発見に45秒かかる（改善前）
- AI（Copilot Chat）が冗長な出力を処理しにくい
- 作業効率の低下

## 💡 提案

### 1. 警告の重複防止（必須）

`ServantWarningLogger`にcooldown機構を追加：

```typescript
export class ServantWarningLogger {
  private recentWarnings = new Map<string, number>();
  private readonly COOLDOWN_MS = 60000; // 1分

  public logWarning(warning: ServantWarning): void {
    const hash = `${warning.type}:${warning.severity}:${warning.message}`;
    const lastLog = this.recentWarnings.get(hash);
    
    if (lastLog && Date.now() - lastLog < this.COOLDOWN_MS) {
      // 抑制（簡潔な通知のみ）
      this.outputChannel.appendLine(
        `[${new Date().toLocaleTimeString()}] ⚡ 同じ警告を検出（抑制中）: ${warning.type}`
      );
      return;
    }

    this.recentWarnings.set(hash, Date.now());
    this.outputFullWarning(warning); // 既存のフル出力
  }
}
```

### 2. サマリー情報の表示（必須）

ステータスバーの情報をOutputにも出力：

```typescript
export class ServantWarningLogger {
  public logStatusSummary(monitored: number, violations: number, fixed: number): void {
    this.outputChannel.appendLine('\n' + '═'.repeat(70));
    this.outputChannel.appendLine('🛡️ Servant ステータスサマリー');
    this.outputChannel.appendLine('═'.repeat(70));
    this.outputChannel.appendLine(`監視中: ${monitored}件`);
    this.outputChannel.appendLine(`違反: ${violations}件`);
    this.outputChannel.appendLine(`修正: ${fixed}件`);
    this.outputChannel.appendLine('═'.repeat(70) + '\n');
  }
}
```

**呼び出しタイミング**:
- Servant起動時
- 新しい警告発生時
- `servant.showOutput`コマンド実行時

### 3. 詳細JSONの折りたたみ（推奨）

デフォルトは簡潔な要約のみ、詳細はコマンドで表示：

```typescript
// 簡潔な出力（デフォルト）
⚠️ [spec-check-required] Specチェックが未記録/期限切れです
   対処: コマンドパレット → "Servant: Review Required Instructions"
   詳細: servant.showWarningDetails で表示

// 新しいコマンド
- Servant: Show Warning Details
- Servant: Clear Warning History
```

## 📊 期待される効果

| 項目 | 現状 | 改善後 | 削減率 |
|------|------|--------|--------|
| 出力行数 | ~1,200行 | ~150行 | 87.5% |
| 重複警告 | 10-15回 | 1回 | 90% |
| 情報発見時間 | 45秒 | 5秒 | 88.9% |

## 🚀 実装計画

### フェーズ1（緊急）

**期間**: 1-2日  
**リリース**: v0.4.0

- [ ] `ServantWarningLogger`に重複防止を実装
- [ ] サマリー情報の出力機能を追加
- [ ] 既存の警告呼び出し箇所を修正
- [ ] テスト・検証

### フェーズ2（推奨）

**期間**: 3-5日  
**リリース**: v0.5.0

- [ ] 詳細JSONの折りたたみ
- [ ] 新コマンド追加（Show Details, Clear History）
- [ ] Autopilot出力の最適化
- [ ] ドキュメント更新

## 🔧 実装ガイドライン

### 後方互換性

- 既存のログフォーマットは維持
- 新しい設定で機能を制御

### 設定項目

```json
{
  "servant.warnings.enableCooldown": true,
  "servant.warnings.cooldownMs": 60000,
  "servant.warnings.showFullJson": false,
  "servant.warnings.showSummary": true
}
```

### テストケース

- [ ] 重複警告が1回のみ表示
- [ ] cooldown期間後は再度表示
- [ ] サマリー情報が正しく更新
- [ ] 詳細コマンドで全情報取得可能

## 🔗 関連情報

**影響を受けるファイル**:
- `extensions/servant/src/ui/ServantWarningLogger.ts` (主要変更)
- `extensions/servant/src/autopilot/AutopilotController.ts`
- `extensions/servant/src/extension.ts`

**参考PR**:
- #113 Quiet Warning System

**詳細設計書**:
- [issues/servant-output-improvement-proposal.md](./servant-output-improvement-proposal.md)

## 📅 タイムライン

- **2026-01-14**: 問題発見・提案作成
- **2026-01-15**: Issue作成・レビュー
- **2026-01-16-17**: 実装
- **2026-01-18**: リリース（v0.4.0）

---

**報告者**: @yuichinakamura  
**優先度**: P1（高）  
**難易度**: 中
