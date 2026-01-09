/**
 * ExplanationBoard（解説ボード）
 * 長文読解専用の解説表示コンポーネント
 * ScoreBoardのレイアウト構造を流用
 */

import { useState, useEffect, useMemo } from 'react';
import type {
  SelectedSentenceDetail,
  SentenceData,
  PhraseData,
  KeyPhrase,
  AnnotatedWord,
  ClauseSegment,
  DependencyParsedPassage,
  CompletePassageData,
} from '@/types/passage';
import { parseClausesAndPhrases } from '@/utils/clauseParser';
import { findDependencySentenceByText } from '@/utils/dependencyParseLoader';
import { flattenClauseSegments, mergeSvocmChunks } from '@/utils/svocmRender';

interface ExplanationBoardProps {
  selectedSentence: SentenceData | null; // 選択された文
  phrases: PhraseData[]; // フレーズデータ
  keyPhrases: KeyPhrase[]; // 重要語句
  annotatedWords: AnnotatedWord[]; // 注釈語句
  dependencyParse?: DependencyParsedPassage | null; // 依存構造解析（あれば優先利用）
  onAddToCustom?: (phrase: KeyPhrase) => void; // カスタム問題追加コールバック
  currentPassageId: string; // 現在のパッセージID
  availablePassages: string[]; // 利用可能なパッセージ一覧
  onPassageChange: (passageId: string) => void; // パッセージ変更コールバック
  metadata?: { wordCount: number; sentenceCount: number }; // メタデータ
  passageData: CompletePassageData | null; // 全パッセージデータ
}

type TabType = 'full-text' | 'slash-split' | 'paren-split' | 'literal-translation' | 'sentence-translation' | 'vocabulary' | 'settings';

function ExplanationBoard({
  selectedSentence,
  phrases,
  keyPhrases,
  annotatedWords,
  dependencyParse,
  onAddToCustom,
  currentPassageId,
  availablePassages,
  onPassageChange,
  metadata,
  passageData,
}: ExplanationBoardProps) {
  // アクティブタブをlocalStorageに永続化
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem('explanation-board-active-tab');
    const validTabs: TabType[] = ['full-text', 'slash-split', 'paren-split', 'literal-translation', 'sentence-translation', 'vocabulary', 'settings'];
    return validTabs.includes(saved as TabType) ? (saved as TabType) : 'full-text';
  });

  // activeTabの変更をlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('explanation-board-active-tab', activeTab);
  }, [activeTab]);

  // 選択文の詳細情報を生成（メモ化）
  const sentenceDetail: SelectedSentenceDetail | null = useMemo(() => {
    if (!selectedSentence) return null;

    // UDの文突合は旧UIと同等の正規化ロジックを優先
    // - id が一致するならそれを最優先
    // - それ以外は findDependencySentenceByText の正規化比較を使用
    const depSentence =
      dependencyParse?.sentences?.find(
        (s) => typeof s.id === 'number' && s.id === selectedSentence.id
      ) ?? (dependencyParse ? findDependencySentenceByText(dependencyParse, selectedSentence.english) : null);

    return {
      sentenceData: selectedSentence,
      clauseParsed: parseClausesAndPhrases(selectedSentence.english, {
        dependency: depSentence ?? undefined,
      }),
      relatedPhrases: phrases.filter((p) => selectedSentence.phraseIds?.includes(p.id)),
      keyPhrases: keyPhrases.filter((kp) => kp.positions.includes(selectedSentence.id)),
    };
  }, [selectedSentence, phrases, keyPhrases, dependencyParse]);

  return (
    <div className="score-board-compact">
      {/* タブナビゲーション: 7つのボタン */}
      <div className="score-board-tabs flex flex-wrap gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-lg">
        <button
          className={`flex-1 min-w-[60px] truncate py-1.5 sm:py-2 px-1 sm:px-2 text-xs font-bold rounded-md transition-all duration-200 ${
            activeTab === 'full-text'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-blue-100 hover:text-blue-700 shadow-sm'
          }`}
          onClick={() => setActiveTab('full-text')}
          title="全文"
        >
          📖 全文
        </button>
        <button
          className={`flex-1 min-w-[60px] truncate py-1.5 sm:py-2 px-1 sm:px-2 text-xs font-bold rounded-md transition-all duration-200 ${
            activeTab === 'slash-split'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-blue-100 hover:text-blue-700 shadow-sm'
          }`}
          onClick={() => setActiveTab('slash-split')}
          title="/分割"
        >
          📐 /分割
        </button>
        <button
          className={`flex-1 min-w-[60px] truncate py-1.5 sm:py-2 px-1 sm:px-2 text-xs font-bold rounded-md transition-all duration-200 ${
            activeTab === 'paren-split'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-blue-100 hover:text-blue-700 shadow-sm'
          }`}
          onClick={() => setActiveTab('paren-split')}
          title="()分割"
        >
          🔀 ()分割
        </button>
        <button
          className={`flex-1 min-w-[60px] truncate py-1.5 sm:py-2 px-1 sm:px-2 text-xs font-bold rounded-md transition-all duration-200 ${
            activeTab === 'literal-translation'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-blue-100 hover:text-blue-700 shadow-sm'
          }`}
          onClick={() => setActiveTab('literal-translation')}
          title="直訳"
        >
          🔤 直訳
        </button>
        <button
          className={`flex-1 min-w-[60px] truncate py-1.5 sm:py-2 px-1 sm:px-2 text-xs font-bold rounded-md transition-all duration-200 ${
            activeTab === 'sentence-translation'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-blue-100 hover:text-blue-700 shadow-sm'
          }`}
          onClick={() => setActiveTab('sentence-translation')}
          title="一文訳"
        >
          🇯🇵 一文訳
        </button>
        <button
          className={`flex-1 min-w-[60px] truncate py-1.5 sm:py-2 px-1 sm:px-2 text-xs font-bold rounded-md transition-all duration-200 ${
            activeTab === 'vocabulary'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-blue-100 hover:text-blue-700 shadow-sm'
          }`}
          onClick={() => setActiveTab('vocabulary')}
          title="語句確認"
        >
          📚 語句
        </button>
        <button
          className={`flex-1 min-w-[60px] truncate py-1.5 sm:py-2 px-1 sm:px-2 text-xs font-bold rounded-md transition-all duration-200 ${
            activeTab === 'settings'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-blue-100 hover:text-blue-700 shadow-sm'
          }`}
          onClick={() => setActiveTab('settings')}
          title="設定"
        >
          ⚙️ 設定
        </button>
      </div>

      {/* タブコンテンツ */}
      <div className="score-board-content">
        {/* 設定タブ */}
        {activeTab === 'settings' && (
          <SettingsTab
            currentPassageId={currentPassageId}
            availablePassages={availablePassages}
            onPassageChange={onPassageChange}
            metadata={metadata}
          />
        )}

        {/* タブ1: 全文 */}
        {activeTab === 'full-text' && passageData && (
          <FullTextTab passageData={passageData} />
        )}

        {/* タブ2: /分割 */}
        {activeTab === 'slash-split' && passageData && dependencyParse && (
          <SlashSplitTab passageData={passageData} dependencyParse={dependencyParse} />
        )}

        {/* タブ3: ()分割 */}
        {activeTab === 'paren-split' && passageData && dependencyParse && (
          <ParenSplitTab passageData={passageData} dependencyParse={dependencyParse} />
        )}

        {/* タブ4: 直訳 */}
        {activeTab === 'literal-translation' && passageData && (
          <LiteralTranslationTab passageData={passageData} />
        )}

        {/* タブ5: 一文訳 */}
        {activeTab === 'sentence-translation' && passageData && (
          <SentenceTranslationTab passageData={passageData} />
        )}

        {/* タブ6: 語句確認 */}
        {activeTab === 'vocabulary' && sentenceDetail && (
          <VocabularyTab
            sentenceDetail={sentenceDetail}
            annotatedWords={annotatedWords}
            onAddToCustom={onAddToCustom}
          />
        )}
      </div>
    </div>
  );
}

/**
 * タブ1: 全文表示
 */
function FullTextTab({ passageData }: { passageData: CompletePassageData }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
      <div className="text-base leading-relaxed space-y-2">
        {passageData.sentences.map((sentence, _index) => (
          <div key={sentence.id} className="mb-2">
            {sentence.english}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * タブ2: /分割表示
 */
function SlashSplitTab({ passageData, dependencyParse }: { passageData: CompletePassageData, dependencyParse: DependencyParsedPassage }) {
  // 文節ごとに/で区切る関数
  const splitIntoChunks = (sentence: SentenceData) => {
    const depSentence = dependencyParse.sentences.find(s => s.id === sentence.id)
      || findDependencySentenceByText(dependencyParse, sentence.english);

    if (!depSentence) {
      return [sentence.english];
    }

    const clauseParsed = parseClausesAndPhrases(sentence.english, {
      dependency: depSentence,
    });

    const tokens = flattenClauseSegments(clauseParsed.segments);
    const chunks = mergeSvocmChunks(tokens);

    // ピリオドの前の/を除去
    const parts: string[] = [];
    chunks.forEach((chunk, idx) => {
      const nextChunk = chunks[idx + 1];
      parts.push(chunk.text);
      // 次のチャンクがピリオドでない場合のみ/を追加
      if (nextChunk && !nextChunk.text.trim().match(/^[.!?]$/)) {
        parts.push(' / ');
      } else if (nextChunk) {
        parts.push(' ');
      }
    });

    return parts;
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
      <div className="text-base leading-relaxed space-y-3">
        {passageData.sentences.map((sentence) => {
          const parts = splitIntoChunks(sentence);
          return (
            <div key={sentence.id} className="mb-3">
              {parts}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * タブ3: ()分割表示（従属節を()で囲む）
 */
function ParenSplitTab({ passageData, dependencyParse }: { passageData: CompletePassageData, dependencyParse: DependencyParsedPassage }) {
  const renderWithParens = (sentence: SentenceData) => {
    const depSentence = dependencyParse.sentences.find(s => s.id === sentence.id)
      || findDependencySentenceByText(dependencyParse, sentence.english);

    if (!depSentence) {
      return sentence.english;
    }

    const clauseParsed = parseClausesAndPhrases(sentence.english, {
      dependency: depSentence,
    });

    const renderSegment = (seg: ClauseSegment): string => {
      if (seg.type === 'subordinate-clause') {
        const childText = seg.children ? seg.children.map(renderSegment).join(' ') : seg.text;
        return `(${childText})`;
      } else if (seg.children && seg.children.length > 0) {
        return seg.children.map(renderSegment).join(' ');
      } else {
        return seg.text;
      }
    };

    return clauseParsed.segments.map(renderSegment).join(' ');
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
      <div className="text-base leading-relaxed space-y-3">
        {passageData.sentences.map((sentence) => (
          <div key={sentence.id} className="mb-3">
            {renderWithParens(sentence)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * タブ4: 直訳（フレーズ訳）
 */
function LiteralTranslationTab({ passageData }: { passageData: CompletePassageData }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
      <div className="space-y-4">
        {passageData.sentences.map((sentence) => {
          const relatedPhrases = passageData.phrases.filter(p => sentence.phraseIds?.includes(p.id));

          if (relatedPhrases.length === 0) {
            return (
              <div key={sentence.id} className="mb-4">
                <div className="text-gray-500 text-sm">フレーズデータがありません</div>
              </div>
            );
          }

          const englishLine = relatedPhrases.map(p => p.english).join(' / ');
          const japaneseLine = relatedPhrases.map(p => p.japanese).join(' / ');

          return (
            <div key={sentence.id} className="mb-4">
              <div className="phrase-translation-grid">
                <div className="phrase-translation-row">
                  <div className="phrase-english">{englishLine}</div>
                  <div className="phrase-japanese">{japaneseLine}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * タブ5: 一文訳（日本語訳）
 */
function SentenceTranslationTab({ passageData }: { passageData: CompletePassageData }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
      <div className="space-y-4">
        {passageData.sentences.map((sentence) => (
          <div key={sentence.id} className="mb-4">
            <div className="phrase-english mb-2">{sentence.english}</div>
            <div className="japanese-translation-display">{sentence.japanese}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * タブ7: 設定
 */
function SettingsTab({
  currentPassageId,
  availablePassages,
  onPassageChange,
  metadata,
}: {
  currentPassageId: string;
  availablePassages: string[];
  onPassageChange: (passageId: string) => void;
  metadata?: { wordCount: number; sentenceCount: number };
}) {
  return (
    <div className="bg-white rounded-lg p-3 shadow-md border border-gray-200">
      <h4 className="text-lg font-bold mb-3">⚙️ 設定</h4>

      {/* パッセージ選択 */}
      <div className="mb-4">
        <label htmlFor="passage-select" className="block text-sm font-semibold text-gray-700 mb-2">
          📖 パッセージ選択
        </label>
        <select
          id="passage-select"
          value={currentPassageId}
          onChange={(e) => onPassageChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {availablePassages.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>

      {/* メタ情報表示 */}
      {metadata && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <h5 className="text-sm font-semibold text-gray-700 mb-2">📊 パッセージ情報</h5>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>総語数:</span>
              <span className="font-bold">{metadata.wordCount}語</span>
            </div>
            <div className="flex justify-between">
              <span>文数:</span>
              <span className="font-bold">{metadata.sentenceCount}文</span>
            </div>
          </div>
        </div>
      )}

      {/* ヘルプ */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <h5 className="text-sm font-semibold text-blue-800 mb-2">💡 使い方</h5>
        <ul className="text-xs text-gray-700 space-y-1">
          <li>• 各タブで全文の様々な表示形式を確認できます</li>
          <li>• /分割タブでは、文を文節ごとに区切って表示します</li>
          <li>• ()分割タブでは、従属節を括弧で囲んで表示します</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * タブ6: 語句確認表示
 */
function VocabularyTab({
  sentenceDetail,
  annotatedWords,
  onAddToCustom,
}: {
  sentenceDetail: SelectedSentenceDetail;
  annotatedWords: AnnotatedWord[];
  onAddToCustom?: (phrase: KeyPhrase) => void;
}) {
  // この文に含まれる注釈語句をフィルター
  const sentenceAnnotations = annotatedWords.filter((word) =>
    sentenceDetail.sentenceData.english.toLowerCase().includes(word.inText.toLowerCase())
  );

  const combined: KeyPhrase[] = [];
  for (const w of sentenceAnnotations) {
    combined.push({
      phrase: w.word,
      meaning: w.meaning,
      type: 'annotated',
      positions: [sentenceDetail.sentenceData.id],
    });
  }
  for (const kp of sentenceDetail.keyPhrases) {
    combined.push(kp);
  }

  // 重複除去（phrase+meaning）
  const seen = new Set<string>();
  const items = combined.filter((it) => {
    const key = `${it.phrase}__${it.meaning}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
      {items.length > 0 && (
        <div className="vocabulary-inline">
          {items.map((it, idx) => (
            <span key={`${it.phrase}-${idx}`} className="vocabulary-inline-item">
              {onAddToCustom && (
                <button className="add-to-custom-btn" onClick={() => onAddToCustom(it)}>
                  + 追加
                </button>
              )}
              <span className="vocabulary-word">{it.phrase}</span>
              <span className="vocabulary-meaning">{it.meaning}</span>
              {idx < items.length - 1 && <span className="vocabulary-sep">/</span>}
            </span>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <p className="text-gray-500 text-center py-4">
          この文に重要語句・熟語は検出されませんでした
        </p>
      )}
    </div>
  );
}

export default ExplanationBoard;
