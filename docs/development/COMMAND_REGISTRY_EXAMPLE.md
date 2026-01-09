---
title: Command Registry Integration Example
created: 2026-01-09
updated: 2026-01-09
status: draft
tags: [refactoring, example, servant]
---

# Command Registry 統合例

## Before（現在のextension.ts）

```typescript
export function activate(context: vscode.ExtensionContext) {
  // ... 初期化 ...
  
  // コマンド登録が散在（20箇所以上）
  const showOutputCommand = vscode.commands.registerCommand('servant.showOutput', () => {
    outputChannel.show();
  });
  context.subscriptions.push(showOutputCommand);
  
  const validateDocumentsCommand = vscode.commands.registerCommand('servant.validateDocuments', async () => {
    await documentGuard.validateExistingDocuments();
  });
  context.subscriptions.push(validateDocumentsCommand);
  
  // ... 以下、多数のコマンド登録 ...
}
```

**問題点**:
- 2170行中、約200行がコマンド登録
- 新規コマンド追加時に extension.ts を必ず変更
- コマンドロジックとインフラコードが混在

## After（Command Registry使用）

### 1. extension.ts（簡素化）

```typescript
import { CommandRegistry } from './commands/CommandRegistry';
import * as Commands from './commands';

export function activate(context: vscode.ExtensionContext) {
  // ... 初期化 ...
  
  // Command Registry 初期化
  const commandRegistry = new CommandRegistry();
  
  // コマンド登録（一括）
  commandRegistry.registerAll([
    new Commands.ShowOutputCommand(outputChannel),
    new Commands.ValidateDocumentsCommand(documentGuard),
    new Commands.BatchAddFrontMatterCommand(documentGuard),
    new Commands.ShowConstellationCommand(extensionUri, neuralGraph, goalManager, generator),
    // ... 他のコマンド ...
  ]);
  
  // VS Codeに登録
  commandRegistry.activateAll(context);
}
```

**改善点**:
- コマンド登録が約20行に圧縮
- 新規コマンド追加時は `commands/handlers/` にファイル追加のみ
- extension.ts の変更は最小限

### 2. 新規コマンドの追加手順

#### Step 1: ハンドラー作成

```typescript
// src/commands/handlers/NewFeatureCommand.ts
import { CommandHandler } from '../CommandRegistry';

export class NewFeatureCommand implements CommandHandler {
  readonly id = 'servant.newFeature';
  readonly legacyId = 'instructionsValidator.newFeature'; // 後方互換性（任意）
  
  constructor(private dependency: SomeDependency) {}
  
  async execute(arg1?: string): Promise<void> {
    // コマンドの実装
    await this.dependency.doSomething(arg1);
  }
}
```

#### Step 2: index.ts にエクスポート追加

```typescript
// src/commands/index.ts
export { NewFeatureCommand } from './handlers/NewFeatureCommand';
```

#### Step 3: extension.ts で登録

```typescript
commandRegistry.registerAll([
  // ... 既存コマンド ...
  new Commands.NewFeatureCommand(dependency),
]);
```

**所要時間**: 5分以内（extension.ts の変更は1行追加のみ）

## 効果測定

### 定量的効果

| 項目 | Before | After | 削減率 |
|------|--------|-------|--------|
| extension.ts 行数 | 2170行 | 約1900行 | -12% |
| コマンド登録コード | 約200行 | 約20行 | -90% |
| 新規コマンド追加時の変更箇所 | 2箇所（extension.ts + package.json） | 1箇所（package.json）+ 新規ファイル | - |

### 定性的効果

1. **可読性向上**: コマンド登録が一箇所に集約
2. **保守性向上**: 変更時の影響範囲が限定される
3. **テスタビリティ向上**: コマンドハンドラーを個別にテスト可能
4. **拡張性向上**: 新規コマンド追加が容易

## 移行戦略

### Phase 1: 基盤構築（完了）
- ✅ CommandRegistry クラス作成
- ✅ 基本的なハンドラー作成（4コマンド）

### Phase 2: 段階的移行（推奨）

1. **低リスクコマンドから移行**:
   - showOutput
   - validateDocuments
   - batchAddFrontMatter
   
2. **中リスクコマンドを移行**:
   - validate
   - validateBeforeCommit
   - recordSpecCheck
   
3. **高リスクコマンド移行**:
   - Autopilot関連
   - Git統合関連

### Phase 3: 完全移行
- 全20+コマンドを移行
- extension.ts から直接登録コードを削除
- レガシーコード削除

## 次のステップ

1. **Service Container 導入** - 依存関係管理を改善
2. **Event Bus 導入** - モジュール間通信を疎結合化
3. **Config Manager 導入** - 設定管理を一元化

## 補足: package.json の変更

```json
{
  "contributes": {
    "commands": [
      {
        "command": "servant.showOutput",
        "title": "Show Output",
        "category": "Servant"
      },
      {
        "command": "servant.validateDocuments",
        "title": "Validate Documents",
        "category": "Servant"
      }
      // ... 他のコマンド ...
    ]
  }
}
```

package.json のコマンド定義は変更不要（既存のまま）。
