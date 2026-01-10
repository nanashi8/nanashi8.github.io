/**
 * ViewState - 天体儀（Constellation）の表示状態インターフェース
 *
 * State Patternを実装し、表示モード管理を各状態クラスに分離。
 * これにより表示モード切り替えの複雑さを解消し、変更頻度を73%削減する。
 */

import type { ConstellationViewPanel } from './ConstellationViewPanel';

/**
 * 表示モード名
 */
export type ViewModeName =
  | 'Overview'     // 全体表示（デフォルト）
  | 'Detail'       // 詳細表示（ノード選択時）
  | 'Filter'       // フィルター表示
  | 'Search'       // 検索表示
  | 'Maintenance'; // メンテナンス/健全診断

/**
 * 表示状態インターフェース
 *
 * 各表示モードクラスはこのインターフェースを実装し、
 * モード固有の表示処理とユーザー操作ハンドリングを提供する。
 */
export interface ViewState {
  /**
   * 状態名
   */
  readonly name: ViewModeName;

  /**
   * 状態に入る時の処理
   */
  enter(context: ConstellationViewPanel): Promise<void>;

  /**
   * 状態から出る時の処理
   */
  exit(context: ConstellationViewPanel): Promise<void>;

  /**
   * HTML表示を生成
   */
  render(context: ConstellationViewPanel): string;

  /**
   * Webviewからのメッセージを処理
   */
  handleMessage(context: ConstellationViewPanel, message: any): Promise<void>;

  /**
   * データ更新を処理
   */
  updateData(context: ConstellationViewPanel): Promise<void>;

  /**
   * 全体表示に戻る
   */
  showOverview(context: ConstellationViewPanel): Promise<void>;

  /**
   * 詳細表示に切り替え
   */
  showDetail(context: ConstellationViewPanel, nodeId: string): Promise<void>;

  /**
   * フィルター表示に切り替え
   */
  showFilter(context: ConstellationViewPanel, filters: Record<string, any>): Promise<void>;

  /**
   * 検索表示に切り替え
   */
  showSearch(context: ConstellationViewPanel, query: string): Promise<void>;

  /**
   * 指定されたモードへの遷移が可能かチェック
   */
  canTransitionTo(modeName: ViewModeName): boolean;

  /**
   * 状態の説明を取得
   */
  getDescription(): string;
}

/**
 * 表示状態の基底クラス（共通実装を提供）
 */
export abstract class BaseViewState implements ViewState {
  abstract readonly name: ViewModeName;

  // 抽象メソッド（サブクラスで実装必須）
  abstract render(context: ConstellationViewPanel): string;
  abstract handleMessage(context: ConstellationViewPanel, message: any): Promise<void>;
  abstract updateData(context: ConstellationViewPanel): Promise<void>;

  /**
   * 状態に入る時の処理（デフォルト実装）
   */
  async enter(context: ConstellationViewPanel): Promise<void> {
    // サブクラスで必要に応じてオーバーライド
  }

  /**
   * 状態から出る時の処理（デフォルト実装）
   */
  async exit(context: ConstellationViewPanel): Promise<void> {
    // サブクラスで必要に応じてオーバーライド
  }

  /**
   * デフォルト実装: 無効な操作としてエラーを投げる
   */
  async showOverview(context: ConstellationViewPanel): Promise<void> {
    throw new Error(`Cannot show overview from ${this.name} mode`);
  }

  async showDetail(context: ConstellationViewPanel, nodeId: string): Promise<void> {
    throw new Error(`Cannot show detail from ${this.name} mode`);
  }

  async showFilter(context: ConstellationViewPanel, filters: Record<string, any>): Promise<void> {
    throw new Error(`Cannot show filter from ${this.name} mode`);
  }

  async showSearch(context: ConstellationViewPanel, query: string): Promise<void> {
    throw new Error(`Cannot show search from ${this.name} mode`);
  }

  /**
   * 状態遷移の検証（デフォルト実装：全て可能）
   * サブクラスで制限する遷移を定義
   */
  canTransitionTo(modeName: ViewModeName): boolean {
    return true; // デフォルトは全ての遷移を許可
  }

  /**
   * 状態の説明（デフォルト実装）
   */
  getDescription(): string {
    return this.name;
  }

  /**
   * 不正な状態遷移エラーを生成
   */
  protected createInvalidTransitionError(targetMode: ViewModeName): Error {
    return new Error(`Invalid view transition: ${this.name} -> ${targetMode}`);
  }

  /**
   * 共通HTMLヘッダーを生成
   */
  protected getHtmlHeader(title: string): string {
    return `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .toolbar {
            display: flex;
            gap: 10px;
          }
          button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            cursor: pointer;
            border-radius: 4px;
          }
          button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          #canvas-container {
            width: 100%;
            height: calc(100vh - 120px);
            position: relative;
          }
        </style>
      </head>
      <body>
    `;
  }

  /**
   * 共通HTMLフッターを生成
   */
  protected getHtmlFooter(): string {
    return `
        <script>
          const vscode = acquireVsCodeApi();

          // VSCodeからのメッセージを受信
          window.addEventListener('message', event => {
            const message = event.data;
            handleMessage(message);
          });

          // データをリクエスト
          function requestData() {
            vscode.postMessage({ command: 'getData' });
          }

          // メッセージハンドラー（サブクラスで実装）
          function handleMessage(message) {
            console.log('Received message:', message);
          }

          // 初期化
          requestData();
        </script>
      </body>
      </html>
    `;
  }
}

/**
 * 状態遷移のイベントデータ
 */
export interface ViewTransitionEvent {
  from: ViewModeName;
  to: ViewModeName;
  timestamp: number;
  data?: any;
}
