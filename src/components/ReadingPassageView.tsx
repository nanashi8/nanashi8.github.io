/**
 * ReadingPassageView
 * 長文読解の新しいメインビュー
 * ExplanationBoard + 全文表示エリア
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { CompletePassageData, SentenceData, KeyPhrase } from '@/types/passage';
import { loadCompletePassage } from '@/utils/passageDataLoader';
import { extractKeyPhrasesFromSentences } from '@/utils/keyPhraseExtractor';
import { loadDependencyParsedPassage } from '@/utils/dependencyParseLoader';
import type { DependencyParsedPassage } from '@/types/passage';
import ExplanationBoard from './ExplanationBoard';
import { logger } from '@/utils/logger';

interface ReadingPassageViewProps {
  onAddWordToCustomSet?: (word: any) => void;
}

function ReadingPassageView({ onAddWordToCustomSet }: ReadingPassageViewProps) {
  const [passageData, setPassageData] = useState<CompletePassageData | null>(null);
  const [dependencyParse, setDependencyParse] = useState<DependencyParsedPassage | null>(null);
  const [selectedSentence, setSelectedSentence] = useState<SentenceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // 文を選択
  const handleSelectSentence = useCallback((sentence: SentenceData) => {
    setSelectedSentence(sentence);
    logger.log(`[ReadingPassageView] 文を選択: ${sentence.id}`);
  }, []);

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
      {/* ExplanationBoard（解説ボード） */}
      <div className="mb-6">
        <ExplanationBoard
          selectedSentence={selectedSentence}
          phrases={passageData.phrases}
          keyPhrases={passageData.keyPhrases}
          annotatedWords={passageData.annotatedWords}
          dependencyParse={dependencyParse}
          onAddToCustom={handleAddToCustom}
          currentPassageId={currentPassageId}
          availablePassages={availablePassages}
          onPassageChange={setCurrentPassageId}
          metadata={metaInfo || undefined}
        />
      </div>

      {/* 全文表示エリア */}
      <div className="passage-full-text-area">
        <h3 className="text-xl font-bold mb-4">📄 全文</h3>
        <div className="passage-text-container">
          {passageData.sentences.map((sentence, index) => (
            <span
              key={sentence.id}
              className={`sentence-clickable ${
                selectedSentence?.id === sentence.id ? 'sentence-selected' : ''
              }`}
              onClick={() => handleSelectSentence(sentence)}
              title="クリックで選択"
            >
              {sentence.english}
              {index < passageData.sentences.length - 1 && ' '}
            </span>
          ))}
        </div>

        {/* 選択ガイド */}
        {!selectedSentence && (
          <div className="mt-4 text-center text-gray-500 text-sm">
            💡 文をクリックすると、上の解説ボードに詳細が表示されます
          </div>
        )}
      </div>
    </div>
  );
}

export default ReadingPassageView;
