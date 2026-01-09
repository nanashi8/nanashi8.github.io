/**
 * ExplanationBoard（解説ボード）
 * 長文読解専用の解説表示コンポーネント
 * ScoreBoardのレイアウト構造を流用
 */

import type {
  SelectedSentenceDetail,
  KeyPhrase,
  AnnotatedWord,
  DependencyParsedPassage,
  CompletePassageData,
} from '@/types/passage';

interface ExplanationBoardProps {
  passageData?: CompletePassageData | null; // 全パッセージデータ
  activeTab: TabType; // アクティブタブ
  onTabChange: (tab: TabType) => void; // タブ変更コールバック
}

export type TabType = 'full-text' | 'slash-split' | 'paren-split' | 'literal-translation' | 'sentence-translation' | 'vocabulary' | 'settings';

function ExplanationBoard({
  passageData: _passageData,
  activeTab,
  onTabChange,
}: ExplanationBoardProps) {

  return (
    <div className="score-board-compact">
      {/* タブナビゲーション: 7つのボタン */}
      <div className="score-board-tabs flex flex-wrap gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg">
        <button
          className={`flex-1 min-w-[60px] truncate py-1.5 sm:py-2 px-1 sm:px-2 text-xs font-bold rounded-md transition-all duration-200 ${
            activeTab === 'full-text'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-blue-100 hover:text-blue-700 shadow-sm'
          }`}
          onClick={() => onTabChange('full-text')}
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
          onClick={() => onTabChange('slash-split')}
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
          onClick={() => onTabChange('paren-split')}
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
          onClick={() => onTabChange('literal-translation')}
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
          onClick={() => onTabChange('sentence-translation')}
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
          onClick={() => onTabChange('vocabulary')}
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
          onClick={() => onTabChange('settings')}
          title="設定"
        >
          ⚙️ 設定
        </button>
      </div>
    </div>
  );
}

/**
 * タブ1: 全文表示
 */
export function FullTextTab({ passageData }: { passageData: CompletePassageData }) {
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
 * タブ2: /分割表示（/のみで分割、文末の/は除去）
 * ルールベース: 前置詞句、接続詞、従属節で分割
 */
export function SlashSplitTab({ passageData }: { passageData: CompletePassageData, dependencyParse?: DependencyParsedPassage }) {

  // ルールベースで/を挿入する関数
  const splitIntoChunks = (text: string) => {
    let result = text;

    // 1. 文頭の副詞・前置詞句の後に/を挿入（カンマの後）
    result = result.replace(
      /^([A-Z][a-z]+|After [a-z]+|Before [a-z]+|During [a-z]+),\s+/,
      '$1, / '
    );
    
    // 2. 接続詞の前に/を挿入
    result = result.replace(
      /\s+(and|but|or|so|because|if|when|while|although|though)\s+/gi,
      ' / $1 '
    );
    
    // 3. 前置詞句の前に/を挿入（ただしhave toなどは除外）
    const preps = 'at|in|on|by|from|for|with|about|of|during|after|before|around|per';
    result = result.replace(
      new RegExp(`\\s+(${preps})\\s+`, 'gi'),
      ' / $1 '
    );
    
    // 4. to不定詞の前に/を挿入（ただしhave to, want to, need toなどは除外）
    result = result.replace(
      /(?<!have|want|need|try|going|used)\s+to\s+/gi,
      ' / to '
    );

    // 5. 連続する/を1つにまとめる
    result = result.replace(/\s*\/\s*\/+\s*/g, ' / ');
    
    // 6. 文頭の/を削除
    result = result.replace(/^\s*\/\s*/, '');
    
    // 7. 文末の/を削除（句読点の前）
    result = result.replace(/\s*\/\s*([.!?,;:])/, '$1');
    
    // 8. スペースを整理
    result = result.replace(/\s+/g, ' ').trim();
    
    return result;
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
      <div className="text-base leading-relaxed space-y-3">
        {passageData.sentences.map((sentence) => (
          <div key={sentence.id} className="mb-3">
            {splitIntoChunks(sentence.english)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * タブ3: ()分割表示（<>で句を囲み、()で節を囲む）
 * ルールベース: 前置詞句を<>、従属節を()で囲む
 */
export function ParenSplitTab({ passageData }: { passageData: CompletePassageData, dependencyParse?: DependencyParsedPassage }) {
  
  // ルールベースで<>と()を挿入する関数
  const renderWithParens = (text: string) => {
    let result = text;

    // 1. 従属節を()で囲む
    // that節（単語境界を考慮）
    result = result.replace(
      /\b(that\s+[^,.!?()]+?)([,.!?]|\s+and\s+|\s+but\s+|$)/gi,
      '($1)$2'
    );
    
    // if節
    result = result.replace(
      /\b(if\s+[^,()]+?),/gi,
      '($1),'
    );
    
    // because節
    result = result.replace(
      /\b(because\s+[^,.!?()]+?)([,.!?]|\s+and\s+|\s+but\s+|$)/gi,
      '($1)$2'
    );
    
    // when節
    result = result.replace(
      /\b(when\s+[^,()]+?),/gi,
      '($1),'
    );

    // 2. 前置詞句を<>で囲む（単語境界を考慮）
    const preps = 'at|in|on|by|to|from|for|with|about|of|during|after|before|around|per';
    const dets = 'the|a|an|my|your|his|her|their|our|its|this|that|these|those';
    
    // 前置詞 + 冠詞/所有格 + 名詞句（1-4語）
    result = result.replace(
      new RegExp(`\\b(${preps})\\s+(${dets})\\s+([a-z]+\\s+){0,2}[a-z]+\\b`, 'gi'),
      '<$&>'
    );
    
    // 前置詞 + 固有名詞/数字
    result = result.replace(
      new RegExp(`\\b(${preps})\\s+([A-Z][a-z]+|\\d+)\\b`, 'g'),
      '<$&>'
    );
    
    // 前置詞 + 一般名詞（単数）- 冠詞なしの場合
    result = result.replace(
      new RegExp(`\\b(${preps})\\s+(breakfast|lunch|dinner|school|home|work|bed|friends|them|seven|eight|nine|ten|eleven|twelve)\\b`, 'gi'),
      '<$&>'
    );
    
    // 前置詞 + 数量表現（thirty minutes, two hours など）
    result = result.replace(
      /\b(for|in|after|before|during)\s+([a-z]+\s+[a-z]+)\b/gi,
      '<$&>'
    );

    // 3. 重複や入れ子を整理
    // <<>> -> <>
    result = result.replace(/<+([^<>]+?)>+/g, '<$1>');
    // (()) -> ()
    result = result.replace(/\(+([^()]+?)\)+/g, '($1)');
    
    // 4. 句読点の前の余分なスペースを削除
    result = result.replace(/\s+([,.!?])/g, '$1');
    
    return result;
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
      <div className="text-base leading-relaxed space-y-3">
        {passageData.sentences.map((sentence) => (
          <div key={sentence.id} className="mb-3">
            {renderWithParens(sentence.english)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * タブ4: 直訳（フレーズ訳）
 */
export function LiteralTranslationTab({ passageData }: { passageData: CompletePassageData }) {
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
export function SentenceTranslationTab({ passageData }: { passageData: CompletePassageData }) {
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
export function SettingsTab({
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
export function VocabularyTab({
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
