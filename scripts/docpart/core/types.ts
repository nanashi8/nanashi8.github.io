/**
 * Document Component System - Core Types
 *
 * ドキュメント部品化システムの型定義
 */

/**
 * Signal型（情報の型）
 *
 * ポートを流れる情報の種類を定義
 * バージョン管理により互換性を保証
 */
export type SignalType = string; // 例: "Policy:v1", "Schema:v2"

/**
 * Component Type（部品種別）
 */
export type ComponentType =
  | 'spec'       // 仕様書
  | 'guide'      // ガイド
  | 'report'     // レポート
  | 'adr'        // Architecture Decision Record
  | 'checklist'; // チェックリスト

/**
 * Component Status（部品ステータス）
 */
export type ComponentStatus =
  | 'draft'      // 草稿
  | 'active'     // 有効
  | 'deprecated' // 非推奨
  | 'archived';  // アーカイブ済み

/**
 * Port（ポート・接続点）
 *
 * 部品間の接続インターフェース
 */
export interface Port {
  /** ポート名 */
  name: string;

  /** 信号型（例: "Policy:v1"） */
  signal: SignalType;

  /** 接続元のComponent ID（requiresの場合のみ） */
  from?: string;

  /** 説明（任意） */
  description?: string;
}

/**
 * Component（部品）
 *
 * 1ファイル = 1部品
 */
export interface Component {
  /** 恒久ID（リネーム耐性） */
  id: string;

  /** 部品種別 */
  type: ComponentType;

  /** ファイルパス（相対パス） */
  filePath: string;

  /** バージョン（セマンティックバージョン、任意） */
  version?: string;

  /** ステータス（任意） */
  status?: ComponentStatus;

  /** 所有者リスト（任意） */
  owners?: string[];

  /** 提供するポート */
  provides: Port[];

  /** 要求するポート */
  requires: Port[];

  /** メタデータ（拡張用） */
  metadata?: Record<string, unknown>;
}

/**
 * Signal定義
 */
export interface SignalDefinition {
  /** Signal名（例: "Policy:v1"） */
  name: SignalType;

  /** 説明 */
  description: string;
}

/**
 * ComponentMap（部品マップ）
 *
 * _components.yaml の構造
 */
export interface ComponentMap {
  /** マップバージョン */
  version: string;

  /** 最終更新日時 */
  updated?: string;

  /** 使用可能なSignal型リスト */
  signals?: SignalDefinition[];

  /** 部品マップ（ファイルパス → 部品定義） */
  components: Record<string, ComponentDefinition>;
}

/**
 * ComponentDefinition（YAMLでの部品定義）
 */
export interface ComponentDefinition {
  /** 恒久ID */
  id: string;

  /** 部品種別 */
  type: ComponentType;

  /** バージョン（任意） */
  version?: string;

  /** ステータス（任意） */
  status?: ComponentStatus;

  /** 所有者リスト（任意） */
  owners?: string[];

  /** 提供するポート */
  provides?: Port[];

  /** 要求するポート */
  requires?: Port[];
}

/**
 * ValidationResult（検証結果）
 */
export interface ValidationResult {
  /** 検証対象のファイルパス */
  filePath: string;

  /** エラーリスト */
  errors: ValidationError[];

  /** 警告リスト */
  warnings: ValidationWarning[];
}

/**
 * ValidationError（検証エラー）
 */
export interface ValidationError {
  /** エラー種別 */
  type:
    | 'missing-field'
    | 'duplicate-id'
    | 'unresolved-require'
    | 'signal-mismatch'
    | 'missing-file'
    | 'invalid-format';

  /** エラーメッセージ */
  message: string;

  /** 関連フィールド（任意） */
  field?: string;

  /** 関連値（任意） */
  value?: string;
}

/**
 * ValidationWarning（検証警告）
 */
export interface ValidationWarning {
  /** 警告種別 */
  type: 'orphaned' | 'unused-signal' | 'weak-connection' | 'deprecated';

  /** 警告メッセージ */
  message: string;

  /** 関連フィールド（任意） */
  field?: string;
}

/**
 * DependencyGraph（依存関係グラフ）
 */
export interface DependencyGraph {
  /** ノード（部品）リスト */
  nodes: GraphNode[];

  /** エッジ（依存関係）リスト */
  edges: GraphEdge[];
}

/**
 * GraphNode（グラフノード）
 */
export interface GraphNode {
  /** Component ID */
  id: string;

  /** ラベル（表示名） */
  label: string;

  /** 部品種別 */
  type: ComponentType;

  /** ファイルパス */
  filePath: string;
}

/**
 * GraphEdge（グラフエッジ）
 */
export interface GraphEdge {
  /** 接続元のComponent ID */
  from: string;

  /** 接続先のComponent ID */
  to: string;

  /** ポート名 */
  portName: string;

  /** Signal型 */
  signal: SignalType;

  /** ラベル（表示用） */
  label: string;
}

/**
 * DocPartConfig（設定）
 */
export interface DocPartConfig {
  /** バージョン */
  version: string;

  /** ドキュメントルートディレクトリ */
  rootDir: string;

  /** 出力先ディレクトリ */
  outputDir: string;

  /** Signal型定義 */
  signals: SignalDefinition[];

  /** 型推論ルール */
  typeInference: {
    patterns: TypeInferencePattern[];
    keywords: TypeInferenceKeyword[];
  };

  /** 除外パターン */
  exclude: string[];

  /** lint設定 */
  lint: {
    unresolvedAsWarning: boolean;
    detectOrphans: boolean;
    detectCycles: boolean;
  };

  /** graph設定 */
  graph: {
    direction: 'TD' | 'LR';
    maxNodes: number;
    styles: Record<ComponentType, string>;
  };
}

/**
 * TypeInferencePattern（型推論パターン）
 */
export interface TypeInferencePattern {
  /** ファイルパスパターン（glob） */
  pattern: string;

  /** 推論される型 */
  type: ComponentType;
}

/**
 * TypeInferenceKeyword（型推論キーワード）
 */
export interface TypeInferenceKeyword {
  /** キーワード */
  keyword: string;

  /** 推論される型 */
  type: ComponentType;
}

/**
 * MarkdownLink（Markdownリンク）
 */
export interface MarkdownLink {
  /** リンクテキスト */
  text: string;

  /** リンク先パス */
  href: string;

  /** 行番号 */
  line: number;
}

/**
 * Frontmatter（YAML Frontmatter）
 */
export interface Frontmatter {
  /** docpart設定 */
  docpart?: ComponentDefinition;

  /** その他のfrontmatter */
  [key: string]: unknown;
}
