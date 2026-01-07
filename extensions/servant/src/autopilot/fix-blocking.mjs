#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'AutopilotController.ts');
let content = fs.readFileSync(filePath, 'utf8');

// blockingCritical部分を静かな警告に置き換え
const oldCode = `        const selection = await this.notifier.blockingCritical(
          'Servant Autopilot: 審議が必要（Specチェック）。\\n\\nSpecチェックが未記録/期限切れです。このまま変更を続けないでください。まず「必須指示書を開く」→「記録」を行ってください。',
          '必須指示書を開く',
          '今すぐ記録（メモ入力）',
          '今回は中止（30分）'
        );

        if (selection === '必須指示書を開く') {
          await vscode.commands.executeCommand('servant.reviewRequiredInstructions');
        } else if (selection === '今すぐ記録（メモ入力）') {
          const note = await vscode.window.showInputBox({
            title: 'Specチェック記録',
            prompt: '今回の作業内容/確認した指示書（任意）',
            placeHolder: '例: batch-system + meta-ai 指示を確認 / 修正方針を決めた',
          });
          if (note !== undefined) {
            recordSpecCheck(this.workspaceRoot, note, { requiredInstructions: required });
            this.outputChannel.appendLine('[Autopilot] Specチェックを記録しました');
            this.pendingReview = null;
            this.setStatusIdle();
            this.lastSpecCheckPromptTime = 0; // 記録成功時はリセット
          }
        } else if (selection === '今回は中止（30分）') {
          this.pendingReview = null;
          this.applySnooze(30);
        } else {
          // キャンセル（×/Esc）は審議継続
          this.pendingReview = {
            severity: 'error',
            reasons: ['Specチェック'],
            createdAt: Date.now(),
          };
          this.setStatusReviewRequired({ severity: 'error', reason: 'Specチェック' });
        }`;

const newCode = `        // 構造化ログを出力（AI対応用）
        this.warningLogger.logSpecCheckWarning(required, maxAgeHours);`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ AutopilotController.ts を更新しました');
} else {
  console.log('⚠️  該当箇所が見つかりませんでした');
  process.exit(1);
}
