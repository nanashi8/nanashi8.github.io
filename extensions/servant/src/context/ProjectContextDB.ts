import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Instruction } from '../loader/InstructionsLoader';

/**
 * ファイル情報
 */
export interface FileInfo {
  /** ファイルパス */
  path: string;

  /** ファイルサイズ（バイト） */
  size: number;

  /** 最終更新日時 */
  lastModified: Date;

  /** ファイルタイプ */
  type: string;

  /** インポート */
  imports: string[];

  /** インポート元 */
  importedBy: string[];
}

/**
 * ファイルコンテキスト
 */
export interface FileContext {
  /** ファイルパス */
  file: string;

  /** 関連ファイル */
  relatedFiles: string[];

  /** 適用される Instructions */
  instructions: Instruction[];

  /** 依存関係情報 */
  dependencies: {
    imports: string[];
    importedBy: string[];
  };

  /** リスクレベル（0-100） */
  riskLevel: number;
}

/**
 * AI向けコンテキスト
 */
export interface AIContext {
  /** タスク説明 */
  task: string;

  /** 関連ファイル */
  relevantFiles: string[];

  /** 推奨アクション */
  suggestedActions: string[];

  /** 警告 */
  warnings: string[];

  /** コード例 */
  examples: CodeExample[];

  /** 適用される Instructions */
  instructions: Instruction[];
}

/**
 * コード例
 */
export interface CodeExample {
  /** 説明 */
  description: string;

  /** コード */
  code: string;

  /** ファイルパス */
  source: string;
}

/**
 * プロジェクトインデックス
 */
interface ProjectIndex {
  files: Map<string, FileInfo>;
  dependencies: Map<string, string[]>;
  instructionsMap: Map<string, Instruction[]>;
  lastIndexed: Date;
}

/**
 * プロジェクトコンテキストデータベース
 *
 * プロジェクト構造を解析し、AIに最適な情報を提供。
 */
export class ProjectContextDB {
  private workspaceRoot: string;
  private index: ProjectIndex | null = null;
  private indexPath: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.indexPath = path.join(workspaceRoot, '.vscode', 'project-index.json');
  }

  /**
   * プロジェクトをインデックス化
   */
  async indexProject(): Promise<void> {
    console.log('🔍 Indexing project...');

    const files = new Map<string, FileInfo>();
    const dependencies = new Map<string, string[]>();

    // ワークスペース内のファイルをスキャン
    const fileUris = await vscode.workspace.findFiles(
      '**/*.{ts,js,tsx,jsx,json,md}',
      '**/node_modules/**'
    );

    for (const uri of fileUris) {
      const filePath = uri.fsPath;
      const relativePath = path.relative(this.workspaceRoot, filePath);

      try {
        const stat = fs.statSync(filePath);
        const content = fs.readFileSync(filePath, 'utf-8');
        const imports = this.extractImports(content, path.extname(filePath));

        files.set(relativePath, {
          path: relativePath,
          size: stat.size,
          lastModified: stat.mtime,
          type: path.extname(filePath),
          imports,
          importedBy: []
        });

        if (imports.length > 0) {
          dependencies.set(relativePath, imports);
        }
      } catch (error) {
        console.error(`Failed to index ${relativePath}:`, error);
      }
    }

    // importedBy を逆引き構築
    dependencies.forEach((imports, file) => {
      imports.forEach(importPath => {
        const imported = files.get(importPath);
        if (imported) {
          imported.importedBy.push(file);
        }
      });
    });

    this.index = {
      files,
      dependencies,
      instructionsMap: new Map(),
      lastIndexed: new Date()
    };

    await this.saveIndex();
    console.log(`✅ Indexed ${files.size} files`);
  }

  /**
   * ファイルからインポートを抽出
   */
  private extractImports(content: string, ext: string): string[] {
    const imports: string[] = [];

    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      // import 文を正規表現で抽出
      const importRegex = /import\s+.*\s+from\s+['"](.+)['"]/g;
      let match;

      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];

        // 相対パスのみを対象（ライブラリは除外）
        if (importPath.startsWith('.') || importPath.startsWith('/')) {
          imports.push(this.normalizeImportPath(importPath));
        }
      }

      // require も対象
      const requireRegex = /require\(['"](.+)['"]\)/g;
      while ((match = requireRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath.startsWith('.') || importPath.startsWith('/')) {
          imports.push(this.normalizeImportPath(importPath));
        }
      }
    }

    return imports;
  }

  /**
   * インポートパスを正規化
   */
  private normalizeImportPath(importPath: string): string {
    // 拡張子を追加
    if (!path.extname(importPath)) {
      importPath += '.ts';
    }
    return importPath.replace(/^\.\//, '').replace(/^\//, '');
  }

  /**
   * ファイルのコンテキストを取得
   */
  async getContextForFile(filePath: string): Promise<FileContext | null> {
    if (!this.index) {
      await this.loadIndex();
    }

    if (!this.index) {
      return null;
    }

    const relativePath = path.relative(this.workspaceRoot, filePath);
    const fileInfo = this.index.files.get(relativePath);

    if (!fileInfo) {
      return null;
    }

    // 関連ファイル: インポート先 + インポート元
    const relatedFiles = [
      ...fileInfo.imports,
      ...fileInfo.importedBy
    ].filter((f, i, arr) => arr.indexOf(f) === i);

    // 適用される Instructions（簡易版）
    const instructions: Instruction[] = [];

    // リスクレベル計算
    const riskLevel = this.calculateRiskLevel(fileInfo);

    return {
      file: relativePath,
      relatedFiles,
      instructions,
      dependencies: {
        imports: fileInfo.imports,
        importedBy: fileInfo.importedBy
      },
      riskLevel
    };
  }

  /**
   * リスクレベルを計算
   */
  private calculateRiskLevel(fileInfo: FileInfo): number {
    // インポート数が多い = 依存度が高い = リスク高
    const importRisk = Math.min(fileInfo.imports.length * 5, 50);

    // 他ファイルから多く参照されている = 影響範囲が大きい = リスク高
    const usageRisk = Math.min(fileInfo.importedBy.length * 10, 50);

    return importRisk + usageRisk;
  }

  /**
   * AIタスク向けコンテキストを収集
   */
  async collectContextForAI(task: string): Promise<AIContext> {
    if (!this.index) {
      await this.loadIndex();
    }

    const relevantFiles = await this.findRelevantFiles(task);
    const suggestedActions = this.generateSuggestedActions(task);
    const warnings = this.generateWarnings(task);
    const examples = await this.findCodeExamples(task);

    return {
      task,
      relevantFiles,
      suggestedActions,
      warnings,
      examples,
      instructions: []
    };
  }

  /**
   * タスクに関連するファイルを検索
   */
  private async findRelevantFiles(task: string): Promise<string[]> {
    if (!this.index) {
      return [];
    }

    const keywords = this.extractKeywords(task);
    const relevantFiles: string[] = [];

    this.index.files.forEach((fileInfo, filePath) => {
      // ファイル名にキーワードが含まれるか
      const fileName = path.basename(filePath).toLowerCase();
      const isRelevant = keywords.some(keyword =>
        fileName.includes(keyword.toLowerCase())
      );

      if (isRelevant) {
        relevantFiles.push(filePath);
      }
    });

    return relevantFiles.slice(0, 10); // 上位10件
  }

  /**
   * タスクからキーワードを抽出
   */
  private extractKeywords(task: string): string[] {
    // 簡易的なキーワード抽出
    const words = task.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3);

    return words;
  }

  /**
   * 推奨アクションを生成
   */
  private generateSuggestedActions(task: string): string[] {
    const actions: string[] = [];

    if (task.toLowerCase().includes('test')) {
      actions.push('テストファイルを作成');
      actions.push('既存のテストを参考にする');
    }

    if (task.toLowerCase().includes('fix') || task.toLowerCase().includes('bug')) {
      actions.push('関連ファイルの最近の変更を確認');
      actions.push('ログやエラーメッセージを確認');
    }

    if (task.toLowerCase().includes('new') || task.toLowerCase().includes('add')) {
      actions.push('類似機能の実装を参考にする');
      actions.push('設計パターンを確認');
    }

    return actions;
  }

  /**
   * 警告を生成
   */
  private generateWarnings(task: string): string[] {
    const warnings: string[] = [];

    if (task.toLowerCase().includes('delete') || task.toLowerCase().includes('remove')) {
      warnings.push('⚠️ 削除前に依存関係を確認してください');
    }

    if (task.toLowerCase().includes('refactor')) {
      warnings.push('⚠️ リファクタリング前にテストを実行してください');
    }

    return warnings;
  }

  /**
   * コード例を検索
   */
  private async findCodeExamples(task: string): Promise<CodeExample[]> {
    // 簡易実装: 実際には類似コードを検索
    return [];
  }

  /**
   * インデックスを保存
   */
  private async saveIndex(): Promise<void> {
    if (!this.index) {
      return;
    }

    const data = {
      files: Array.from(this.index.files.entries()),
      dependencies: Array.from(this.index.dependencies.entries()),
      lastIndexed: this.index.lastIndexed.toISOString()
    };

    const dir = path.dirname(this.indexPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.indexPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * インデックスを読み込み
   */
  private async loadIndex(): Promise<void> {
    if (!fs.existsSync(this.indexPath)) {
      return;
    }

    try {
      const content = fs.readFileSync(this.indexPath, 'utf-8');
      const data = JSON.parse(content);

      this.index = {
        files: new Map(data.files),
        dependencies: new Map(data.dependencies),
        instructionsMap: new Map(),
        lastIndexed: new Date(data.lastIndexed)
      };
    } catch (error) {
      console.error('Failed to load project index:', error);
    }
  }

  /**
   * 統計情報を取得
   */
  getStats() {
    if (!this.index) {
      return null;
    }

    return {
      totalFiles: this.index.files.size,
      totalDependencies: this.index.dependencies.size,
      lastIndexed: this.index.lastIndexed,
      avgImports: Array.from(this.index.files.values())
        .reduce((sum, f) => sum + f.imports.length, 0) / this.index.files.size
    };
  }
}
