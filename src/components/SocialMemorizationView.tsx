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

// 国語（古文・漢文）用のデータソース設定（出題元=CSVファイル切替）
const classicalJapaneseDataSources = [
  { id: 'all', name: '古文総合', filename: 'classical-words.csv' },
  { id: 'vocabulary', name: '古文単語', filename: 'classical-vocabulary.csv' },
  { id: 'knowledge', name: '古文知識', filename: 'classical-knowledge.csv' },
  { id: 'grammar', name: '古文文法', filename: 'classical-grammar.csv' },
  { id: 'kanbun', name: '漢文総合', filename: 'kanbun-words.csv' },
  { id: 'kanbun-practice', name: '漢文実践', filename: 'kanbun-practice.csv' },
] as const;

type SocialMemorizationViewProps = {
  dataSource?: string;
};

export default function SocialMemorizationView({ dataSource = 'all-social-studies.csv' }: SocialMemorizationViewProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const isClassical = dataSource.includes('classical');

  const classicalSourceStorageKey = 'japanese-classical-source';
  const [selectedClassicalSourceId, setSelectedClassicalSourceId] = useState<string>(() => {
    if (!isClassical) return 'all';
    try {
      return localStorage.getItem(classicalSourceStorageKey) || 'all';
    } catch {
      return 'all';
    }
  });

  const currentFilename = (() => {
    if (!isClassical) return dataSource;
    const match = classicalJapaneseDataSources.find((s) => s.id === selectedClassicalSourceId);
    return match?.filename || dataSource;
  })();

  useEffect(() => {
    if (!isClassical) return;
    const handler = () => {
      try {
        setSelectedClassicalSourceId(localStorage.getItem(classicalSourceStorageKey) || 'all');
      } catch {
        setSelectedClassicalSourceId('all');
      }
    };
    window.addEventListener('japanese-classical-source-changed', handler);
    return () => window.removeEventListener('japanese-classical-source-changed', handler);
  }, [isClassical]);

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
      <MemorizationView
        subject={subject}
        allDataSourceLabel={label}
        allQuestions={state.questions}
        questionSets={questionSets}
      />
    </>
  );
}
