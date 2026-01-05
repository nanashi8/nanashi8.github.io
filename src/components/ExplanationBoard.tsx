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
  SVOCMComponent,
  DependencyParsedPassage,
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
}

type TabType = 'clause' | 'phrase-translation' | 'japanese' | 'vocabulary' | 'settings';

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
}: ExplanationBoardProps) {
  // アクティブタブをlocalStorageに永続化
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem('explanation-board-active-tab');
    const validTabs: TabType[] = ['clause', 'phrase-translation', 'japanese', 'vocabulary', 'settings'];
    return validTabs.includes(saved as TabType) ? (saved as TabType) : 'clause';
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
      {/* タブナビゲーション: ScoreBoardと同じスタイル */}
      <div className="score-board-tabs flex gap-2 px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-lg">
        <button
          className={`flex-1 min-w-0 truncate py-2 px-2 sm:px-3 text-xs sm:text-sm font-bold rounded-md transition-all duration-200 ${
            activeTab === 'clause'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-blue-100 hover:text-blue-700 shadow-sm'
          }`}
          onClick={() => setActiveTab('clause')}
          title="節句分割"
        >
          <span className="hidden sm:inline">📐 節句分割</span>
          <span className="sm:hidden">節句</span>
        </button>
        <button
          className={`flex-1 min-w-0 truncate py-2 px-2 sm:px-3 text-xs sm:text-sm font-bold rounded-md transition-all duration-200 ${
            activeTab === 'phrase-translation'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-blue-100 hover:text-blue-700 shadow-sm'
          }`}
          onClick={() => setActiveTab('phrase-translation')}
          title="フレーズ訳"
        >
          <span className="hidden sm:inline">🔤 フレーズ訳</span>
          <span className="sm:hidden">訳</span>
        </button>
        <button
          className={`flex-1 min-w-0 truncate py-2 px-2 sm:px-3 text-xs sm:text-sm font-bold rounded-md transition-all duration-200 ${
            activeTab === 'japanese'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-blue-100 hover:text-blue-700 shadow-sm'
          }`}
          onClick={() => setActiveTab('japanese')}
          title="日本語訳"
        >
          <span className="hidden sm:inline">🇯🇵 日本語訳</span>
          <span className="sm:hidden">訳</span>
        </button>
        <button
          className={`flex-1 min-w-0 truncate py-2 px-2 sm:px-3 text-xs sm:text-sm font-bold rounded-md transition-all duration-200 ${
            activeTab === 'vocabulary'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-blue-100 hover:text-blue-700 shadow-sm'
          }`}
          onClick={() => setActiveTab('vocabulary')}
          title="語句確認"
        >
          <span className="hidden sm:inline">� 語句確認</span>
          <span className="sm:hidden">語句</span>
        </button>
        <button
          className={`flex-1 min-w-0 truncate py-2 px-2 sm:px-3 text-xs sm:text-sm font-bold rounded-md transition-all duration-200 ${
            activeTab === 'settings'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-blue-100 hover:text-blue-700 shadow-sm'
          }`}
          onClick={() => setActiveTab('settings')}
          title="設定"
        >
          <span className="hidden sm:inline">⚙️ 設定</span>
          <span className="sm:hidden">設定</span>
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

        {/* 文が選択されていない場合の表示 */}
        {activeTab !== 'settings' && !sentenceDetail && (
          <div className="bg-white rounded-lg p-3 shadow-md border border-gray-200">
            <div className="text-center py-8 text-gray-500">
              👆 下の全文から一文を選択してください
            </div>
          </div>
        )}

        {/* タブ1: 節句分割 */}
        {activeTab === 'clause' && sentenceDetail && (
          <ClauseTab sentenceDetail={sentenceDetail} />
        )}

        {/* タブ2: フレーズ訳 */}
        {activeTab === 'phrase-translation' && sentenceDetail && (
          <PhraseTranslationTab sentenceDetail={sentenceDetail} />
        )}

        {/* タブ3: 日本語訳 */}
        {activeTab === 'japanese' && selectedSentence && (
          <JapaneseTab sentenceData={selectedSentence} />
        )}

        {/* タブ4: 語句確認 */}
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
 * タブ5: 設定
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
          <li>• 全文中の文をクリックすると、解説ボードに詳細が表示されます</li>
          <li>• 節句分割タブでは、文の構造をビジュアル化して確認できます</li>
          <li>• 語句確認タブから重要語句をカスタム問題セットに追加できます</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * タブ1: 節句分割表示（ネスト構造対応）
 */
function ClauseTab({ sentenceDetail }: { sentenceDetail: SelectedSentenceDetail }) {
  // SVOCM成分ごとのクラス名を取得
  const getSVOCMClass = (component: SVOCMComponent | undefined): string => {
    if (!component) return '';
    return `svocm-${component.toLowerCase()}`;
  };

  // SVOCMのまとまり単位で、色付き太実線下線を「伸ばす」表示
  const renderSentenceWithSvocmUnderline = (segments: ClauseSegment[]): JSX.Element => {
    const tokens = flattenClauseSegments(segments);
    const chunks = mergeSvocmChunks(tokens);

    return (
      <span>
        {chunks.map((c, i) => {
          const className = getSVOCMClass(c.component) || 'svocm-plain';
          return (
            <span key={i} className={className}>
              {c.text}
            </span>
          );
        })}
      </span>
    );
  };

  const collectWordsByComponent = (segments: ClauseSegment[]) => {
    const buckets: Record<SVOCMComponent, Array<{ word: string; component: SVOCMComponent }>> = {
      S: [],
      V: [],
      O: [],
      C: [],
      M: [],
    };

    const visit = (seg: ClauseSegment) => {
      if (seg.children && seg.children.length > 0) {
        seg.children.forEach(visit);
        return;
      }

      for (const w of seg.words) {
        if (!w.component) continue;
        if (/^[.,!?;:()"]$/.test(w.word)) continue;
        buckets[w.component].push({ word: w.word, component: w.component });
      }
    };

    segments.forEach(visit);
    return buckets;
  };

  const svocmBuckets = collectWordsByComponent(sentenceDetail.clauseParsed.segments);
  const hasAnySVOCM = (Object.keys(svocmBuckets) as SVOCMComponent[]).some(
    (k) => svocmBuckets[k].length > 0
  );

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
      <div className="clause-display text-lg leading-relaxed">
        {renderSentenceWithSvocmUnderline(sentenceDetail.clauseParsed.segments)}
      </div>

      {hasAnySVOCM && (
        <div className="mt-4 text-sm text-gray-700">
          <div className="grid grid-cols-1 gap-2">
            {(Object.keys(svocmBuckets) as SVOCMComponent[]).map((component) => {
              const words = svocmBuckets[component];
              if (words.length === 0) return null;
              return (
                <div key={component} className="flex flex-wrap gap-2 items-baseline">
                  <span className="font-bold w-10">{component}:</span>
                  <span>
                    {words.map((w, idx) => (
                      <span key={idx} className={getSVOCMClass(w.component)}>
                        {w.word}{' '}
                      </span>
                    ))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p>
          <span className="font-bold">表記:</span> &lt;&gt; = 句 / () = 従属節
        </p>
        <p className="mt-2">
          <span className="font-bold">下線:</span> <span className="svocm-s">S(主語)</span>{' '}
          <span className="svocm-v">V(動詞)</span> <span className="svocm-o">O(目的語)</span>{' '}
          <span className="svocm-c">C(補語)</span> <span className="svocm-m">M(修飾語)</span>
        </p>
      </div>
    </div>
  );
}

/**
 * タブ2: フレーズ訳表示
 */
function PhraseTranslationTab({ sentenceDetail }: { sentenceDetail: SelectedSentenceDetail }) {
  const englishLine = sentenceDetail.relatedPhrases.map((p) => p.english).join(' / ');
  const japaneseLine = sentenceDetail.relatedPhrases.map((p) => p.japanese).join(' / ');

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
      {sentenceDetail.relatedPhrases.length > 0 && (
        <div className="phrase-translation-grid">
          <div className="phrase-translation-row">
            <div className="phrase-english">{englishLine}</div>
            <div className="phrase-japanese">{japaneseLine}</div>
          </div>
        </div>
      )}
      {sentenceDetail.relatedPhrases.length === 0 && (
        <p className="text-gray-500 text-center py-4">
          この文のフレーズデータがありません
        </p>
      )}
    </div>
  );
}

/**
 * タブ3: 日本語訳表示
 */
function JapaneseTab({ sentenceData }: { sentenceData: SentenceData }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
      <div className="space-y-3">
        <div className="phrase-english">{sentenceData.english}</div>
        <div className="japanese-translation-display">{sentenceData.japanese}</div>
      </div>
    </div>
  );
}

/**
 * タブ4: 語句確認表示
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
