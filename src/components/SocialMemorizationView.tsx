import { useEffect, useMemo, useState } from 'react';
import type { Question, QuestionSet } from '@/types';
import { loadSocialStudiesCSV } from '@/utils/socialStudiesLoader';
import MemorizationView from './MemorizationView';
import LoadingIndicator from './LoadingIndicator';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; questions: Question[] };

function buildSocialQuestionSets(allQuestions: Question[]): QuestionSet[] {
  const bySource = new Map<string, Question[]>();
  for (const q of allQuestions) {
    const source = (q as any).source ? String((q as any).source) : 'junior';
    const bucket = bySource.get(source);
    if (bucket) bucket.push(q);
    else bySource.set(source, [q]);
  }

  const now = Date.now();

  const nameForSource = (source: string): string => {
    switch (source) {
      case 'history':
        return '歴史';
      case 'geography':
        return '地理';
      case 'civics':
        return '公民';
      case 'junior':
        return '中学（総合）';
      default:
        return `社会（${source}）`;
    }
  };

  return Array.from(bySource.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([source, questions]) => ({
      id: source,
      name: nameForSource(source),
      questions,
      createdAt: now,
      isBuiltIn: true,
      source: '社会',
    }));
}

// 国語（古文）用のデータソース設定
const classicalJapaneseDataSources = [
  { id: 'all', name: '総合', filename: 'classical-words.csv' },
  { id: 'vocabulary', name: '単語', filename: 'classical-vocabulary.csv' },
  { id: 'knowledge', name: '古文知識', filename: 'classical-knowledge.csv' },
  { id: 'grammar', name: '文法', filename: 'classical-grammar.csv' },
];

type SocialMemorizationViewProps = {
  dataSource?: string;
};

export default function SocialMemorizationView({ dataSource = 'all-social-studies.csv' }: SocialMemorizationViewProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  // 国語用の設定状態
  const [selectedSource, setSelectedSource] = useState('all');
  const [batchSize, setBatchSize] = useState(10);
  const [incorrectLimit, setIncorrectLimit] = useState(3);
  const [settingsOpen, setSettingsOpen] = useState(true); // 初期状態で開く

  // 現在のデータソースを決定
  const isClassical = dataSource.includes('classical');
  const currentFilename = isClassical
    ? classicalJapaneseDataSources.find(s => s.id === selectedSource)?.filename || dataSource
    : dataSource;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const questions = await loadSocialStudiesCSV(currentFilename);
        if (cancelled) return;
        setState({ status: 'ready', questions });
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : '不明なエラーが発生しました';
        setState({ status: 'error', message });
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [currentFilename]);

  const questionSets = useMemo(() => {
    if (state.status !== 'ready') return [];
    return buildSocialQuestionSets(state.questions);
  }, [state]);

  // データソースから教科とラベルを判定
  const subject = isClassical ? 'japanese' : 'social';
  const label = isClassical ? '国語（古文）' : '社会（総合）';

  if (state.status === 'loading') {
    return <LoadingIndicator isVisible={true} />;
  }

  if (state.status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">エラーが発生しました</p>
          <p>{state.message}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 国語の場合、設定UIを表示 */}
      {isClassical && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
          <div
            className="flex items-center justify-between cursor-pointer mb-4"
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            <h3 className="text-lg font-semibold">学習設定</h3>
            <span className="text-gray-500">
              {settingsOpen ? '▼' : '▶'}
            </span>
          </div>

          {settingsOpen && (
            <>
              {/* 出題元選択 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  出題元
                </label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="出題元を選択"
                >
                  {classicalJapaneseDataSources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* バッチ数 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  バッチ数
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={batchSize}
                  onChange={(e) => setBatchSize(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="バッチ数"
                />
              </div>

              {/* 不正解の上限 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  不正解の上限
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={incorrectLimit}
                  onChange={(e) => setIncorrectLimit(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="不正解の上限"
                />
              </div>

              {/* 自動発音設定（国語の場合は非表示） */}
              {/* 古文の自動読み上げは今後実装予定 */}
            </>
          )}
        </div>
      )}

      <MemorizationView
        subject={subject}
        allDataSourceLabel={label}
        allQuestions={state.questions}
        questionSets={questionSets}
        initialBatchSize={isClassical ? batchSize : undefined}
        initialIncorrectLimit={isClassical ? incorrectLimit : undefined}
      />
    </>
  );
}
