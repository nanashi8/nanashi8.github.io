/**
 * 言語学的関連性ビュー - 単語間のつながりを視覚化
 */

import { useState } from 'react';
import { Question } from '../types';
import { 
  extractLinguisticFeatures, 
  generateRelatedWordClusters,
  LinguisticFeatures,
  RelatedWordCluster,
  LinguisticRelationType 
} from '@/ai/analysis/linguisticRelationsAI';
import { logger } from '../logger';
import './LinguisticRelationsView.css';

interface LinguisticRelationsViewProps {
  allQuestions: Question[];
}

const relationTypeLabels: Record<LinguisticRelationType, string> = {
  etymology: '語源',
  derivation: '派生語',
  synonym: '類義語',
  antonym: '対義語',
  collocation: 'コロケーション',
  semantic_field: '意味分野',
  grammatical: '文法関連',
  phonetic: '音韻類似',
  compound: '複合語',
  phrasal_verb: '句動詞'
};

export default function LinguisticRelationsView({ allQuestions }: LinguisticRelationsViewProps) {
  const [selectedWord, setSelectedWord] = useState<string>('');
  const [features, setFeatures] = useState<LinguisticFeatures | null>(null);
  const [clusters, setClusters] = useState<RelatedWordCluster[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 単語検索
  const filteredWords = allQuestions
    .filter(q => 
      q.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.meaning.includes(searchQuery)
    )
    .slice(0, 50); // 表示は最大50件

  const handleWordSelect = (word: string) => {
    setSelectedWord(word);
    const question = allQuestions.find(q => q.word === word);
    
    if (question) {
      // 言語学的特徴を抽出
      const linguisticFeatures = extractLinguisticFeatures(question);
      setFeatures(linguisticFeatures);
      
      // 関連単語クラスターを生成
      const wordClusters = generateRelatedWordClusters(allQuestions, word);
      setClusters(wordClusters);
      
      logger.log('📚 言語学的特徴:', linguisticFeatures);
      logger.log('🔗 関連単語クラスター:', wordClusters);
    }
  };

  return (
    <div className="linguistic-relations-view">
      <h2>🧬 言語学的関連性分析</h2>
      
      <div className="word-search">
        <input
          type="text"
          placeholder="単語を検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        
        <div className="word-list">
          {filteredWords.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleWordSelect(q.word)}
              className={`word-button ${selectedWord === q.word ? 'selected' : ''}`}
            >
              {q.word}
            </button>
          ))}
        </div>
      </div>

      {selectedWord && features && (
        <div className="analysis-results">
          <h3>📖 {selectedWord} の言語学的分析</h3>
          
          {/* 形態素分析 */}
          <div className="feature-section">
            <h4>形態素分析</h4>
            <div className="feature-grid">
              {features.morphology.prefix && (
                <div className="feature-item">
                  <span className="label">接頭辞:</span>
                  <span className="value">{features.morphology.prefix}-</span>
                </div>
              )}
              {features.morphology.root && (
                <div className="feature-item">
                  <span className="label">語根:</span>
                  <span className="value">{features.morphology.root}</span>
                </div>
              )}
              {features.morphology.stem && (
                <div className="feature-item">
                  <span className="label">語幹:</span>
                  <span className="value">{features.morphology.stem}</span>
                </div>
              )}
              {features.morphology.suffix && (
                <div className="feature-item">
                  <span className="label">接尾辞:</span>
                  <span className="value">-{features.morphology.suffix}</span>
                </div>
              )}
            </div>
          </div>

          {/* 品詞情報 */}
          <div className="feature-section">
            <h4>品詞</h4>
            <div className="feature-grid">
              <div className="feature-item">
                <span className="label">主要品詞:</span>
                <span className="value">{features.partOfSpeech.primary}</span>
              </div>
              {features.partOfSpeech.subcategory && (
                <div className="feature-item">
                  <span className="label">下位分類:</span>
                  <span className="value">{features.partOfSpeech.subcategory}</span>
                </div>
              )}
            </div>
          </div>

          {/* 意味分類 */}
          <div className="feature-section">
            <h4>意味分類</h4>
            <div className="feature-grid">
              <div className="feature-item">
                <span className="label">意味領域:</span>
                <span className="value">{features.semanticCategory.domain}</span>
              </div>
              {features.semanticCategory.subcategory && (
                <div className="feature-item">
                  <span className="label">下位分類:</span>
                  <span className="value">{features.semanticCategory.subcategory}</span>
                </div>
              )}
              <div className="feature-item">
                <span className="label">抽象度:</span>
                <span className="value">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      data-width={features.semanticCategory.abstractness * 100}
                    />
                  </div>
                  {(features.semanticCategory.abstractness * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* 動作・状態分類 */}
          {features.actionType && (
            <div className="feature-section">
              <h4>動作・状態</h4>
              <div className="feature-grid">
                {features.actionType.isAction && (
                  <div className="feature-item">
                    <span className="badge badge-action">動作</span>
                  </div>
                )}
                {features.actionType.isState && (
                  <div className="feature-item">
                    <span className="badge badge-state">状態</span>
                  </div>
                )}
                {features.actionType.isProcess && (
                  <div className="feature-item">
                    <span className="badge badge-process">過程</span>
                  </div>
                )}
                {features.actionType.transitivity && (
                  <div className="feature-item">
                    <span className="label">他動性:</span>
                    <span className="value">{features.actionType.transitivity}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 感情・評価 */}
          {features.sentiment && (
            <div className="feature-section">
              <h4>感情・評価</h4>
              <div className="feature-grid">
                <div className="feature-item">
                  <span className="label">極性:</span>
                  <span className={`badge badge-${features.sentiment.polarity}`}>
                    {features.sentiment.polarity === 'positive' ? 'ポジティブ' : 
                     features.sentiment.polarity === 'negative' ? 'ネガティブ' : '中立'}
                  </span>
                </div>
                <div className="feature-item">
                  <span className="label">強度:</span>
                  <span className="value">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        data-width={features.sentiment.intensity * 100}
                      />
                    </div>
                    {(features.sentiment.intensity * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 関連単語クラスター */}
          {clusters.length > 0 && (
            <div className="clusters-section">
              <h4>🔗 関連単語</h4>
              {clusters.map((cluster, idx) => (
                <div key={idx} className="cluster">
                  <div className="cluster-header">
                    <span className="cluster-theme">テーマ: {cluster.clusterTheme}</span>
                    <span className="cluster-priority">
                      優先度: {(cluster.studyPriority * 100).toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="related-words">
                    {cluster.relatedWords.map((rw, rwIdx) => (
                      <div 
                        key={rwIdx} 
                        className={`related-word ${rw.shouldStudyTogether ? 'high-priority' : ''}`}
                      >
                        <button
                          onClick={() => handleWordSelect(rw.word)}
                          className="related-word-button"
                        >
                          {rw.word}
                        </button>
                        <div className="relation-info">
                          <span className="relation-type">
                            {relationTypeLabels[rw.relationType]}
                          </span>
                          <span className="relation-strength">
                            関連度: {(rw.strength * 100).toFixed(0)}%
                          </span>
                          {rw.shouldStudyTogether && (
                            <span className="study-together-badge">一緒に学習推奨</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedWord && (
        <div className="empty-state">
          <p>👆 上の検索欄から単語を選択して、言語学的な分析と関連語を確認できます</p>
        </div>
      )}
    </div>
  );
}
