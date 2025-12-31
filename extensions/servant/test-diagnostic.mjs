import { Diagnostic, Range, DiagnosticSeverity } from './tests/__mocks__/vscode.ts';

const diagnostic = new Diagnostic(
  new Range(0, 0, 0, 40),
  'Position階層不変条件: BasePositionではなくPositionを継承してください',
  DiagnosticSeverity.Error
);

console.log('diagnostic:', diagnostic);
console.log('diagnostic.message:', diagnostic.message);
console.log('diagnostic.message type:', typeof diagnostic.message);
