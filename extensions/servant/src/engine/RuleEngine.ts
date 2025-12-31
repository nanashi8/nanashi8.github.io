import * as vscode from 'vscode';
import { Instruction, Rule } from '../loader/InstructionsLoader';

export interface Violation {
  range: vscode.Range;
  message: string;
  severity: 'error' | 'warning' | 'information' | 'hint';
  ruleId: string;
  suggestedFix?: string;
}

export class RuleEngine {
  validate(
    document: vscode.TextDocument,
    instructions: Instruction[]
  ): Violation[] {
    const violations: Violation[] = [];

    for (const instruction of instructions) {
      // 各instructionのルールを検証
      for (const rule of instruction.rules) {
        violations.push(...this.checkRule(document, rule, instruction.id));
      }

      // 特定のinstructionsに対するカスタム検証
      if (instruction.id === 'position-invariant-conditions') {
        violations.push(...this.checkPositionInvariant(document, instruction.id));
      }

      if (instruction.id === 'batch-processing-principles') {
        violations.push(...this.checkBatchPrinciples(document, instruction.id));
      }

      if (instruction.id === 'mandatory-spec-check') {
        violations.push(...this.checkSpecBeforeModification(document, instruction.id));
      }
    }

    return violations;
  }

  private checkRule(
    document: vscode.TextDocument,
    rule: Rule,
    instructionId: string
  ): Violation[] {
    const violations: Violation[] = [];
    const text = document.getText();

    // MUST NOT: 禁止パターンの検出
    if (rule.type === 'MUST_NOT') {
      const patterns = this.extractForbiddenPatterns(rule.message);

      for (const pattern of patterns) {
        const regex = new RegExp(pattern, 'gi');
        let match;

        while ((match = regex.exec(text)) !== null) {
          const startPos = document.positionAt(match.index);
          const endPos = document.positionAt(match.index + match[0].length);

          violations.push({
            range: new vscode.Range(startPos, endPos),
            message: `${rule.type}: ${rule.message}`,
            severity: rule.severity,
            ruleId: instructionId,
            suggestedFix: this.suggestFix(pattern, match[0])
          });
        }
      }
    }

    return violations;
  }

  private checkPositionInvariant(document: vscode.TextDocument, ruleId: string): Violation[] {
    const violations: Violation[] = [];
    const text = document.getText();

    // Position階層不変条件の検証
    // 1. Magic Numberの検出（Position値のハードコード）
    const magicNumberPattern = /(?:position|pos)\s*[=:]\s*(\d+)/gi;
    let match;

    while ((match = magicNumberPattern.exec(text)) !== null) {
      const value = parseInt(match[1]);

      // Position値の範囲チェック（-10 ~ 10）
      if (value >= -10 && value <= 10) {
        const startPos = document.positionAt(match.index);
        const endPos = document.positionAt(match.index + match[0].length);

        violations.push({
          range: new vscode.Range(startPos, endPos),
          message: 'CRITICAL: Position値のMagic Number使用禁止。Position定数を使用してください（例: Position.NEUTRAL）',
          severity: 'error',
          ruleId,
          suggestedFix: `Position.NEUTRAL (現在: ${match[0]})`
        });
      }
    }

    // 2. Position階層の直接変更検出
    const hierarchyViolation = /Position\s*\.\s*\w+\s*[-+]=|Position\s*\.\s*\w+\s*\+\+|Position\s*\.\s*\w+\s*--/gi;

    while ((match = hierarchyViolation.exec(text)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);

      violations.push({
        range: new vscode.Range(startPos, endPos),
        message: 'CRITICAL: Position階層の直接変更禁止。PositionCalculatorを使用してください',
        severity: 'error',
        ruleId,
        suggestedFix: 'PositionCalculator.calculate()を使用'
      });
    }

    return violations;
  }

  private checkBatchPrinciples(document: vscode.TextDocument, ruleId: string): Violation[] {
    const violations: Violation[] = [];
    const text = document.getText();

    // バッチ方式3原則の検証
    // 1. 単語単位のPosition更新検出（原則1違反）
    const singleWordUpdate = /updatePosition\s*\([^)]*\bword\b[^)]*\)/gi;
    let match;

    while ((match = singleWordUpdate.exec(text)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);

      violations.push({
        range: new vscode.Range(startPos, endPos),
        message: 'CRITICAL: 単語単位のPosition更新禁止（バッチ方式原則1）。バッチ処理を使用してください',
        severity: 'error',
        ruleId,
        suggestedFix: 'バッチ方式: processBatch(words)'
      });
    }

    // 2. カテゴリー変更時のPosition初期化忘れ検出（原則2違反）
    const categoryChange = /category\s*=\s*(?!.*position\s*=)/gi;

    while ((match = categoryChange.exec(text)) !== null) {
      // 同じ行または次の5行以内にposition初期化があるか確認
      const contextStart = match.index;
      const contextEnd = Math.min(match.index + 500, text.length);
      const context = text.substring(contextStart, contextEnd);

      if (!/position\s*=\s*Position\.NEUTRAL/i.test(context)) {
        const startPos = document.positionAt(match.index);
        const endPos = document.positionAt(match.index + match[0].length);

        violations.push({
          range: new vscode.Range(startPos, endPos),
          message: 'WARNING: カテゴリー変更時はPosition初期化（Position.NEUTRAL）が必要です（バッチ方式原則2）',
          severity: 'warning',
          ruleId,
          suggestedFix: 'position = Position.NEUTRAL を追加'
        });
      }
    }

    return violations;
  }

  private checkSpecBeforeModification(document: vscode.TextDocument, ruleId: string): Violation[] {
    const violations: Violation[] = [];

    // ファイル先頭にコメントで仕様書参照があるかチェック
    const firstLine = document.lineAt(0).text;
    const hasSpecReference = /\/\/\s*(?:仕様|spec|参照|reference)|\/\*\*?\s*(?:仕様|spec)/i.test(firstLine);

    // 実装ファイルの判定（テストファイル除外）
    const isImplementationFile = /\.(ts|tsx|js|jsx)$/.test(document.fileName) &&
                                 !document.fileName.includes('.test.') &&
                                 !document.fileName.includes('.spec.');

    // 実装ファイルで仕様参照がない場合に警告
    if (!hasSpecReference && isImplementationFile) {
      violations.push({
        range: new vscode.Range(0, 0, 0, firstLine.length),
        message: 'INFO: コード変更前に仕様書を確認してください。ファイル先頭に参照コメントを追加することを推奨します',
        severity: 'information',
        ruleId,
        suggestedFix: '// 仕様: docs/specifications/XXX.md'
      });
    }

    return violations;
  }

  private extractForbiddenPatterns(message: string): string[] {
    const patterns: string[] = [];

    // メッセージから禁止キーワードを抽出
    // 例: "Magic Numberの使用禁止" → "Magic Number"
    const keywordPattern = /(?:「|『|")(.+?)(?:」|』|")/g;
    let match;

    while ((match = keywordPattern.exec(message)) !== null) {
      patterns.push(match[1]);
    }

    // よくある禁止パターン
    if (/magic\s*number/i.test(message)) {
      patterns.push('\\b\\d+\\b(?!\\s*(?:px|ms|%|em|rem))'); // 単体の数値（単位なし）
    }

    if (/console\.log/i.test(message)) {
      patterns.push('console\\.log');
    }

    if (/debugger/i.test(message)) {
      patterns.push('\\bdebugger\\b');
    }

    return patterns;
  }

  private suggestFix(pattern: string, matched: string): string {
    // パターンに応じた修正提案
    if (/console\.log/i.test(pattern)) {
      return 'logger.debug() を使用してください';
    }

    if (/debugger/i.test(pattern)) {
      return 'debuggerステートメントを削除してください';
    }

    if (/\d+/.test(matched)) {
      return '定数を定義して使用してください（例: const TIMEOUT = 5000）';
    }

    return '推奨される実装方法を確認してください';
  }
}
