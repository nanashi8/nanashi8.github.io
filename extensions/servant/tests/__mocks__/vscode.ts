// Mock vscode module for testing

export class Range {
  public start: any;
  public end: any;

  constructor(startLineOrStart: number | any, startCharacterOrEnd?: number | any, endLine?: number, endCharacter?: number) {
    // 2引数の場合: Range(start, end)
    if (typeof startLineOrStart === 'object') {
      this.start = startLineOrStart;
      this.end = startCharacterOrEnd;
    }
    // 4引数の場合: Range(startLine, startChar, endLine, endChar)
    else if (typeof startLineOrStart === 'number' && endLine !== undefined && endCharacter !== undefined) {
      this.start = { line: startLineOrStart, character: startCharacterOrEnd };
      this.end = { line: endLine, character: endCharacter };
    }
    // フォールバック
    else {
      this.start = { line: 0, character: 0 };
      this.end = { line: 0, character: 0 };
    }
  }
}

export class Diagnostic {
  public range: Range;
  public message: string;
  public severity: DiagnosticSeverity;
  public source?: string;
  public code?: string | number;
  public relatedInformation?: any[];

  constructor(
    range: Range,
    message: string,
    severity: DiagnosticSeverity
  ) {
    this.range = range;
    this.message = message;
    this.severity = severity;
  }
}

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Information = 2,
  Hint = 3
}

export class CodeAction {
  constructor(public title: string, public kind?: any) {}
  public diagnostics?: Diagnostic[];
  public edit?: any;
  public command?: any;
  public isPreferred?: boolean;
}

export const CodeActionKind = {
  QuickFix: { value: 'quickfix' },
  Refactor: { value: 'refactor' },
  RefactorExtract: { value: 'refactor.extract' },
  RefactorInline: { value: 'refactor.inline' },
  RefactorRewrite: { value: 'refactor.rewrite' },
  Source: { value: 'source' },
  SourceOrganizeImports: { value: 'source.organizeImports' }
};

export const CodeActionTriggerKind = {
  Automatic: 1,
  Manual: 2
};

export class WorkspaceEdit {
  private edits: Map<string, any[]> = new Map();

  replace(uri: any, range: Range, newText: string): void {
    if (!this.edits.has(uri.fsPath)) {
      this.edits.set(uri.fsPath, []);
    }
    this.edits.get(uri.fsPath)?.push({ type: 'replace', range, newText });
  }

  insert(uri: any, position: any, newText: string): void {
    if (!this.edits.has(uri.fsPath)) {
      this.edits.set(uri.fsPath, []);
    }
    this.edits.get(uri.fsPath)?.push({ type: 'insert', position, newText });
  }

  delete(uri: any, range: Range): void {
    if (!this.edits.has(uri.fsPath)) {
      this.edits.set(uri.fsPath, []);
    }
    this.edits.get(uri.fsPath)?.push({ type: 'delete', range });
  }

  getEdits(): Map<string, any[]> {
    return this.edits;
  }
}

export class Location {
  constructor(public uri: any, public range: Range) {}
}

export class DiagnosticRelatedInformation {
  constructor(public location: Location, public message: string) {}
}

export const languages = {
  createDiagnosticCollection: (_name: string) => ({
    set: () => {},
    clear: () => {},
    dispose: () => {}
  })
};

export const workspace = {
  workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
  openTextDocument: async (uri: any) => ({
    getText: () => '',
    fileName: 'test.ts',
    lineCount: 10,
    lineAt: (_line: number) => ({ text: '' }),
    positionAt: (_offset: number) => ({ line: 0, character: 0 }),
    uri
  }),
  asRelativePath: (_uri: any) => 'test.ts',
  createFileSystemWatcher: () => ({
    onDidChange: () => ({ dispose: () => {} }),
    onDidCreate: () => ({ dispose: () => {} }),
    dispose: () => {}
  }),
  getConfiguration: () => ({
    get: () => true
  }),
  onDidChangeConfiguration: () => ({ dispose: () => {} }),
  fs: {
    readFile: async () => Buffer.from(''),
    readdir: async () => []
  }
};

export const window = {
  activeTextEditor: null,
  showInformationMessage: () => {},
  showErrorMessage: () => {},
  onDidChangeActiveTextEditor: () => ({ dispose: () => {} })
};

export const commands = {
  registerCommand: () => ({ dispose: () => {} })
};

export const Uri = {
  file: (path: string) => ({ fsPath: path })
};

export interface ExtensionContext {
  subscriptions: any[];
}
