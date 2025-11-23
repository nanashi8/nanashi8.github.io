/**
 * パッセージデータアダプター
 * 新しい .txt ベースのパッセージを既存の ReadingPassage 型に変換
 */

import { ReadingPassage, ReadingSegment } from '../types';
import { getPassageList, loadPassage } from './passageLoader';

// 補助関数: 単語の基本形を取得（簡易版）
function getLemma(word: string): string {
  const cleaned = word.toLowerCase().trim();
  
  // -ing形
  if (cleaned.endsWith('ing') && cleaned.length > 4) {
    const base = cleaned.slice(0, -3);
    if (base.endsWith('n') || base.endsWith('m') || base.endsWith('t')) {
      return base.slice(0, -1); // running → run
    }
    return base + 'e'; // making → make (推測)
  }
  
  // -ed形
  if (cleaned.endsWith('ed') && cleaned.length > 3) {
    const base = cleaned.slice(0, -2);
    if (base.endsWith('i')) {
      return base.slice(0, -1) + 'y'; // studied → study
    }
    return base;
  }
  
  // -s/-es形
  if (cleaned.endsWith('es') && cleaned.length > 3) {
    return cleaned.slice(0, -2);
  }
  if (cleaned.endsWith('s') && cleaned.length > 2 && !cleaned.endsWith('ss')) {
    return cleaned.slice(0, -1);
  }
  
  return cleaned;
}

/**
 * .txt パッセージを ReadingPassage 型に変換
 */
export async function convertPassageToReadingFormat(
  passageId: string,
  wordDictionary: Map<string, any>
): Promise<ReadingPassage | null> {
  const loaded = await loadPassage(passageId);
  if (!loaded) return null;

  // セクションごとにフレーズ（文単位）を生成
  const phrases: any[] = [];
  
  loaded.sections.forEach((section) => {
    section.paragraphs.forEach((paragraph) => {
      // 会話形式（Speaker: "..."）のパターンをチェック
      const conversationMatch = paragraph.match(/^([^:]+):\s*"([^"]+)"$/);
      
      if (conversationMatch) {
        // 会話文の場合: 全体を1つのフレーズとして扱う
        const fullText = paragraph.trim();
        const words = fullText.split(/\s+/);
        
        // セグメントを生成
        const segments: ReadingSegment[] = words.map(word => {
          // 引用符や句読点を検出
          const punctuationMatch = word.match(/([.,!?;:—"])$/);
          
          if (punctuationMatch) {
            const cleanWord = word.replace(/[.,!?;:—"]$/, '');
            const punctuation = punctuationMatch[1];
            
            if (!cleanWord) {
              // 引用符のみの場合
              return {
                word: punctuation,
                meaning: '',
                isUnknown: false,
              };
            }
            
            const lemma = getLemma(cleanWord);
            const wordData = wordDictionary.get(lemma);
            const meaning = wordData?.meaning || '';
            
            return [
              {
                word: cleanWord,
                meaning: meaning === '-' ? '' : meaning,
                isUnknown: false,
              },
              {
                word: punctuation,
                meaning: '',
                isUnknown: false,
              }
            ];
          } else {
            // 先頭の引用符を処理
            if (word.startsWith('"')) {
              const cleanWord = word.substring(1);
              if (!cleanWord) {
                return {
                  word: '"',
                  meaning: '',
                  isUnknown: false,
                };
              }
              const lemma = getLemma(cleanWord);
              const wordData = wordDictionary.get(lemma);
              const meaning = wordData?.meaning || '';
              
              return [
                {
                  word: '"',
                  meaning: '',
                  isUnknown: false,
                },
                {
                  word: cleanWord,
                  meaning: meaning === '-' ? '' : meaning,
                  isUnknown: false,
                }
              ];
            }
            
            const lemma = getLemma(word);
            const wordData = wordDictionary.get(lemma);
            const meaning = wordData?.meaning || '';
            
            return {
              word,
              meaning: meaning === '-' ? '' : meaning,
              isUnknown: false,
            };
          }
        }).flat();
        
        phrases.push({
          english: fullText,
          japanese: '', // 翻訳は後で追加可能
          words: words,
          segments: segments,
        });
      } else {
        // 通常の文: .!?で区切る
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
        
        sentences.forEach((sentence) => {
          // 単語に分割
          const words = sentence.trim().split(/\s+/);
          
          // セグメントを生成
          const segments: ReadingSegment[] = words.map(word => {
            // 句読点を検出
            const punctuationMatch = word.match(/([.,!?;:—])$/);
            
            if (punctuationMatch) {
              const cleanWord = word.replace(/[.,!?;:—]$/, '');
              const punctuation = punctuationMatch[1];
              
              const lemma = getLemma(cleanWord);
              const wordData = wordDictionary.get(lemma);
              const meaning = wordData?.meaning || '';
              
              return [
                {
                  word: cleanWord,
                  meaning: meaning === '-' ? '' : meaning,
                  isUnknown: false,
                },
                {
                  word: punctuation,
                  meaning: '',
                  isUnknown: false,
                }
              ];
            } else {
              const lemma = getLemma(word);
              const wordData = wordDictionary.get(lemma);
              const meaning = wordData?.meaning || '';
              
              return {
                word,
                meaning: meaning === '-' ? '' : meaning,
                isUnknown: false,
              };
            }
          }).flat();
          
          phrases.push({
            english: sentence.trim(),
            japanese: '', // 翻訳は後で追加可能
            words: words,
            segments: segments,
          });
        });
      }
    });
  });

  // ReadingPassage型に変換
  const readingPassage: ReadingPassage = {
    id: loaded.id,
    title: loaded.title,
    level: loaded.level,
    actualWordCount: loaded.wordCount,
    phrases: phrases,
  };

  return readingPassage;
}

/**
 * フレーズ学習用JSONファイルを読み込み（新形式）
 * public/data/passages-phrase-learning/*.json
 */
export async function loadPhraseLearningJSON(passageId: string): Promise<ReadingPassage | null> {
  try {
    const response = await fetch(`/data/passages-phrase-learning/${passageId}.json`);
    if (!response.ok) {
      return null; // ファイルが存在しない場合はnullを返す
    }
    
    const data = await response.json();
    
    // JSONデータをそのまま返す（ReadingPassage型に準拠）
    // phraseMeaning → japanese へのマッピング
    const readingPassage: ReadingPassage = {
      ...data,
      phrases: data.phrases.map((phrase: any) => ({
        ...phrase,
        phraseMeaning: phrase.japanese || phrase.phraseMeaning, // japanese フィールドを優先
      }))
    };
    
    return readingPassage;
  } catch (error) {
    console.error(`Error loading phrase learning JSON for ${passageId}:`, error);
    return null;
  }
}

/**
 * 全パッセージを読み込んで ReadingPassage[] に変換
 * 優先順位: 1) フレーズ学習JSON, 2) .txtファイル
 */
export async function loadAllPassagesAsReadingFormat(
  wordDictionary: Map<string, any>
): Promise<ReadingPassage[]> {
  const metadata = getPassageList();
  const passages: ReadingPassage[] = [];

  for (const meta of metadata) {
    // まずフレーズ学習JSONを試す
    let passage = await loadPhraseLearningJSON(meta.id);
    
    // JSONがなければ従来の.txt変換を試す
    if (!passage) {
      passage = await convertPassageToReadingFormat(meta.id, wordDictionary);
    }
    
    if (passage) {
      passages.push(passage);
    }
  }

  return passages;
}

/**
 * レベルラベルを統一（'beginner' → '初級'）
 */
export function getLevelLabel(level: string): string {
  const levelMap: Record<string, string> = {
    'beginner': '初級',
    'intermediate': '中級',
    'advanced': '上級',
  };
  return levelMap[level] || level;
}
