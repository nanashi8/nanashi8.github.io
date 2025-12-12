import { describe, it, expect } from 'vitest';
import { parseCSV } from '@/utils';

/**
 * CSVパーサーのテスト
 *
 * 重要: データ読み込みの品質を保証
 */

describe('Utils - parseCSV', () => {
  it('基本的な3列CSVをパースできる', () => {
    const csv = 'apple,アップル,りんご';
    const questions = parseCSV(csv);

    expect(questions.length).toBe(1);
    expect(questions[0].word).toBe('apple');
    expect(questions[0].reading).toBe('アップル');
    expect(questions[0].meaning).toBe('りんご');
  });

  it('7列の完全なCSVをパースできる', () => {
    const csv = 'apple,ˈæpl,りんご,fruit apple,orange,食品,beginner';
    const questions = parseCSV(csv);

    expect(questions.length).toBe(1);
    expect(questions[0].word).toBe('apple');
    expect(questions[0].reading).toBe('ˈæpl');
    expect(questions[0].meaning).toBe('りんご');
    expect(questions[0].etymology).toBe('fruit apple');
  });

  it('複数行のCSVをパースできる', () => {
    const csv = `apple,アップル,りんご
banana,バナナ,バナナ
carrot,キャロット,にんじん`;
    const questions = parseCSV(csv);

    expect(questions.length).toBe(3);
    expect(questions[0].word).toBe('apple');
    expect(questions[1].word).toBe('banana');
    expect(questions[2].word).toBe('carrot');
  });

  it('ヘッダー行を自動的にスキップする', () => {
    const csv = `語句,読み,意味
apple,アップル,りんご
banana,バナナ,バナナ`;
    const questions = parseCSV(csv);

    expect(questions.length).toBe(2);
    expect(questions[0].word).toBe('apple');
  });

  it('空行をスキップする', () => {
    const csv = `apple,アップル,りんご

banana,バナナ,バナナ

carrot,キャロット,にんじん`;
    const questions = parseCSV(csv);

    expect(questions.length).toBe(3);
  });

  it('コメント行をスキップする', () => {
    const csv = `apple,アップル,りんご
// これはコメントです
banana,バナナ,バナナ
# これもコメントです
carrot,キャロット,にんじん`;
    const questions = parseCSV(csv);

    expect(questions.length).toBe(3);
  });

  it('引用符で囲まれたフィールド内のカンマを正しく処理する', () => {
    const csv = 'apple,"アップル, りんご","果物, 赤い"';
    const questions = parseCSV(csv);

    expect(questions.length).toBe(1);
    expect(questions[0].word).toBe('apple');
    expect(questions[0].reading).toBe('アップル, りんご');
    expect(questions[0].meaning).toBe('果物, 赤い');
  });

  it('特殊文字を含むフィールドを処理する', () => {
    const csv = 'café,カフェ,カフェ・喫茶店';
    const questions = parseCSV(csv);

    expect(questions.length).toBe(1);
    expect(questions[0].word).toBe('café');
    expect(questions[0].meaning).toBe('カフェ・喫茶店');
  });

  it('空のCSVテキストは空配列を返す', () => {
    const questions = parseCSV('');
    expect(questions).toEqual([]);
  });

  it('ヘッダーのみのCSVは空配列を返す', () => {
    const csv = '語句,読み,意味';
    const questions = parseCSV(csv);
    expect(questions).toEqual([]);
  });

  it('先頭と末尾の空白をトリムする', () => {
    const csv = ' apple , アップル , りんご ';
    const questions = parseCSV(csv);

    expect(questions[0].word).toBe('apple');
    expect(questions[0].reading).toBe('アップル');
    expect(questions[0].meaning).toBe('りんご');
  });

  it('3列未満の行をスキップする', () => {
    const csv = `apple,アップル,りんご
incomplete,data
banana,バナナ,バナナ`;
    const questions = parseCSV(csv);

    expect(questions.length).toBe(2);
    expect(questions[0].word).toBe('apple');
    expect(questions[1].word).toBe('banana');
  });
});
