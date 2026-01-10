/**
 * ReadingPassageView
 * 長文読解の新しいメインビュー
 * ExplanationBoard + 全文表示エリア
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { CompletePassageData, SentenceData, KeyPhrase, SelectedSentenceDetail } from '@/types/passage';
import { loadCompletePassage } from '@/utils/passageDataLoader';
import { extractKeyPhrasesFromSentences } from '@/utils/keyPhraseExtractor';
import { loadDependencyParsedPassage, findDependencySentenceByText } from '@/utils/dependencyParseLoader';
import type { DependencyParsedPassage } from '@/types/passage';
import { parseClausesAndPhrases } from '@/utils/clauseParser';
import ExplanationBoard, {
  type TabType,
  FullTextTab,
  SlashSplitTab,
  ParenSplitTab,
  LiteralTranslationTab,
  SentenceTranslationTab,
  VocabularyTab,
  SettingsTab
} from './ExplanationBoard';
import { logger } from '@/utils/logger';

interface ReadingPassageViewProps {
  onAddWordToCustomSet?: (word: any) => void;
}

function ReadingPassageView({ onAddWordToCustomSet }: ReadingPassageViewProps) {
  const [passageData, setPassageData] = useState<CompletePassageData | null>(null);
  const [dependencyParse, setDependencyParse] = useState<DependencyParsedPassage | null>(null);
  const [selectedSentence, _setSelectedSentence] = useState<SentenceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // パッセージIDリスト（将来的には動的に取得）
  const availablePassages = ['beginner-morning-routine', 'J_2022_5'];
  const [currentPassageId, setCurrentPassageId] = useState(availablePassages[0]);

  // パッセージデータの読み込み
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        logger.log(`[ReadingPassageView] パッセージ読み込み開始: ${currentPassageId}`);
        const parsedPromise = loadDependencyParsedPassage(currentPassageId);
        const dataPromise = parsedPromise.then((parsed) =>
          loadCompletePassage(currentPassageId, parsed)
        );

        const [parsed, data] = await Promise.all([parsedPromise, dataPromise]);

        // 重要語句を抽出
        const keyPhrases = extractKeyPhrasesFromSentences(data.sentences);
        data.keyPhrases = keyPhrases;

        setPassageData(data);
        setDependencyParse(parsed);
        logger.log(`[ReadingPassageView] パッセージ読み込み完了`);
      } catch (err) {
        logger.error(`[ReadingPassageView] 読み込みエラー: ${err}`);
        setError(`パッセージの読み込みに失敗しました: ${err}`);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [currentPassageId]);

  // カスタムセットへの追加
  const handleAddToCustom = useCallback(
    (phrase: KeyPhrase) => {
      if (onAddWordToCustomSet) {
        onAddWordToCustomSet({
          word: phrase.phrase,
          meaning: phrase.meaning,
          category: 'reading',
        });
      }
    },
    [onAddWordToCustomSet]
  );

  // メタ情報をメモ化
  const metaInfo = useMemo(() => {
    if (!passageData) return null;
    return {
      wordCount: passageData.metadata.wordCount,
      sentenceCount: passageData.metadata.sentenceCount,
    };
  }, [passageData]);

  // 選択文の詳細情報を生成（メモ化）
  const sentenceDetail: SelectedSentenceDetail | null = useMemo(() => {
    if (!selectedSentence) return null;

    const depSentence =
      dependencyParse?.sentences?.find(
        (s) => typeof s.id === 'number' && s.id === selectedSentence.id
      ) ?? (dependencyParse ? findDependencySentenceByText(dependencyParse, selectedSentence.english) : null);

    return {
      sentenceData: selectedSentence,
      clauseParsed: parseClausesAndPhrases(selectedSentence.english, {
        dependency: depSentence ?? undefined,
      }),
      relatedPhrases: passageData?.phrases.filter((p) => selectedSentence.phraseIds?.includes(p.id)) || [],
      keyPhrases: passageData?.keyPhrases.filter((kp) => kp.positions.includes(selectedSentence.id)) || [],
    };
  }, [selectedSentence, passageData, dependencyParse]);

  // ローディング中
  if (isLoading) {
    return (
      <div className="reading-passage-view">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">📖 長文を読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  // エラー
  if (error) {
    return (
      <div className="reading-passage-view">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <p className="text-red-800 font-bold mb-2">❌ エラー</p>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // データなし
  if (!passageData) {
    return (
      <div className="reading-passage-view">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600">パッセージデータがありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reading-passage-view">
      {/* ExplanationBoard（ボタンのみ） */}
      <div className="mb-3 sm:mb-6">
        <ExplanationBoard
          passageData={passageData}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* タブコンテンツ表示エリア */}
      <div className="passage-full-text-area">
        {/* 設定タブ */}
        {activeTab === 'settings' && (
          <SettingsTab
            currentPassageId={currentPassageId}
            availablePassages={availablePassages}
            onPassageChange={setCurrentPassageId}
            metadata={metaInfo || undefined}
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
        {activeTab === 'slash-split' && passageData && !dependencyParse && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 shadow-sm">
            <p className="text-yellow-800 font-bold mb-2">⚠️ 解析データがありません</p>
            <p className="text-yellow-700">
              このパッセージは依存関係解析（UDパース）が未提供のため、/分割表示は利用できません。
            </p>
          </div>
        )}

        {/* タブ3: ()分割 */}
        {activeTab === 'paren-split' && passageData && dependencyParse && (
          <ParenSplitTab passageData={passageData} dependencyParse={dependencyParse} />
        )}
        {activeTab === 'paren-split' && passageData && !dependencyParse && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 shadow-sm">
            <p className="text-yellow-800 font-bold mb-2">⚠️ 解析データがありません</p>
            <p className="text-yellow-700">
              このパッセージは依存関係解析（UDパース）が未提供のため、()分割表示は利用できません。
            </p>
          </div>
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
            annotatedWords={passageData.annotatedWords}
            onAddToCustom={handleAddToCustom}
          />
        )}

        {/* 語句確認タブで文が選択されていない場合 */}
        {activeTab === 'vocabulary' && !selectedSentence && (
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200 text-center">
            <p className="text-gray-500">
              💡 文をクリックして選択すると、語句確認が表示されます
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReadingPassageView;
