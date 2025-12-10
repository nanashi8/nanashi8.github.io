/**
 * パッセージデータアダプター
 * 新しい .txt ベースのパッセージを既存の ReadingPassage 型に変換
 */

import { ReadingPassage, ReadingSegment } from '../types';
import { getPassageList, loadPassage, loadOriginalPassage } from './passageLoader';
import { logger } from '../logger';

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
 * 長い文を接続詞で分割（20単語超の場合）
 */
function splitLongSentence(sentence: string): string[] {
  const words = sentence.trim().split(/\s+/);
  
  // 20単語以下ならそのまま返す
  if (words.length <= 20) {
    return [sentence];
  }
  
  // 接続詞パターン（大文字小文字両対応）
  const conjunctionPattern = /\b(when|if|because|although|while|since|after|before|unless|until|as|though|whereas)\b/gi;
  
  // 接続詞で分割を試みる
  const parts: string[] = [];
  let currentPart = '';
  let wordCount = 0;
  
  const sentenceWords = sentence.match(/\S+|\s+/g) || [];
  
  for (let i = 0; i < sentenceWords.length; i++) {
    const token = sentenceWords[i];
    
    // 空白はスキップ
    if (/^\s+$/.test(token)) {
      currentPart += token;
      continue;
    }
    
    // 接続詞を検出（20単語以上の場合のみ分割）
    if (wordCount >= 15 && conjunctionPattern.test(token)) {
      // 現在のパートを保存
      if (currentPart.trim()) {
        parts.push(currentPart.trim());
      }
      // 新しいパートを開始（接続詞から）
      currentPart = token;
      wordCount = 1;
    } else {
      currentPart += token;
      wordCount++;
    }
  }
  
  // 最後のパートを追加
  if (currentPart.trim()) {
    parts.push(currentPart.trim());
  }
  
  // 分割できなかった場合は元の文を返す
  return parts.length > 0 ? parts : [sentence];
}

/**
 * 全訳ファイルを読み込む
 */
async function loadFullTranslation(passageId: string): Promise<string> {
  try {
    // passageIdに対応する全訳ファイルパスを構築
    // 例: beginner-morning-routine -> /data/passages/passages-translations/beginner_50_Morning-Routine-ja.txt
    // 旧形式: advanced-environmental-issues -> /data/passages-translations/advanced-environmental-issues-ja.txt
    
    // 新形式のパスを試す (passages/passages-translations/)
    let translationFilePath = `/data/passages/passages-translations/${passageId}-ja.txt`;
    
    console.log(`[全訳] Attempting to load: ${translationFilePath} for passageId: ${passageId}`);
    
    let response = await fetch(translationFilePath);
    
    // 新形式が見つからない場合は旧形式を試す
    if (!response.ok) {
      translationFilePath = `/data/passages-translations/${passageId}-ja.txt`;
      console.log(`[全訳] Trying old path: ${translationFilePath}`);
      response = await fetch(translationFilePath);
    }
    
    if (!response.ok) {
      console.log(`[全訳] File not found (${response.status}): ${translationFilePath}`);
      return '';
    }
    
    const content = await response.text();
    console.log(`[全訳] Successfully loaded ${content.length} characters from ${translationFilePath}`);
    return content;
  } catch (error) {
    console.error(`[全訳] Error loading full translation for ${passageId}:`, error);
    return '';
  }
}

/**
 * 日本語フレーズファイルを読み込む（passages-for-phrase-work-jaから）
 * フレーズ訳: 全訳を尊重しつつ、フレーズごとに意味が通るように直訳されたもの
 * passages-for-phrase-workの英文と行番号が一致
 */
async function loadJapanesePhrases(passageId: string): Promise<string[]> {
  try {
    // passageIdからファイルパスの一部を取得
    const metadata = getPassageList().find(p => p.id === passageId);
    if (!metadata) return [];
    
    // ファイル名を取得
    const fileName = metadata.filePath.split('/').pop() || '';
    
    // passages-for-phrase-work-jaのパスを構築
    // 例: beginner_50_Morning-Routine.txt -> /data/passages-for-phrase-work-ja/beginner_50_Morning-Routine-ja.txt
    const jaFilePath = `/data/passages-for-phrase-work-ja/${fileName.replace(/\.txt$/, '-ja.txt')}`;
    
    const response = await fetch(jaFilePath);
    if (!response.ok) {
      logger.log(`No Japanese phrase file found: ${jaFilePath}`);
      return [];
    }
    
    const content = await response.text();
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0); // 空行を除外
    
    logger.log(`Loaded ${lines.length} Japanese phrases from ${jaFilePath}`);
    return lines;
  } catch (error) {
    logger.error(`Error loading Japanese phrases for ${passageId}:`, error);
    return [];
  }
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

  // 日本語フレーズ、全訳、元の全文を並行して読み込む
  const [japanesePhrases, fullTranslation, originalText] = await Promise.all([
    loadJapanesePhrases(passageId),
    loadFullTranslation(passageId),
    loadOriginalPassage(passageId)
  ]);
  let japaneseIndex = 0;

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
          // 先頭の引用符を除去して処理
          let processWord = word;
          let leadingQuote = '';
          if (processWord.startsWith('"')) {
            leadingQuote = '"';
            processWord = processWord.substring(1);
          }
          
          // 略語パターン（Ms., Mr., Dr.など）をチェック
          const abbreviationPattern = /^(Ms|Mr|Mrs|Dr|Prof|St|Ave|Inc|Ltd|etc)\.$|^[A-Z]\.$|^vs\.$|^e\.g\.$|^i\.e\.$/;
          if (abbreviationPattern.test(processWord)) {
            // 略語は分割せずそのまま1単語として扱う
            const lemma = getLemma(processWord.replace(/\.$/, '')); // ピリオドなしで辞書検索
            const wordData = wordDictionary.get(lemma);
            const meaning = wordData?.meaning || '';
            
            const result: ReadingSegment[] = [];
            if (leadingQuote) {
              result.push({
                word: leadingQuote,
                meaning: '',
                isUnknown: false,
              });
            }
            result.push({
              word: processWord,
              meaning: meaning === '-' ? '' : meaning,
              isUnknown: false,
            });
            return result;
          }
          
          // 引用符や句読点を検出
          const punctuationMatch = processWord.match(/([.,!?;:—"])$/);
          
          if (punctuationMatch) {
            const cleanWord = processWord.replace(/[.,!?;:—"]$/, '');
            const punctuation = punctuationMatch[1];
            
            if (!cleanWord) {
              // 引用符のみの場合
              const result: ReadingSegment[] = [];
              if (leadingQuote) {
                result.push({
                  word: leadingQuote,
                  meaning: '',
                  isUnknown: false,
                });
              }
              result.push({
                word: punctuation,
                meaning: '',
                isUnknown: false,
              });
              return result;
            }
            
            const lemma = getLemma(cleanWord);
            const wordData = wordDictionary.get(lemma);
            const meaning = wordData?.meaning || '';
            
            const result: ReadingSegment[] = [];
            if (leadingQuote) {
              result.push({
                word: leadingQuote,
                meaning: '',
                isUnknown: false,
              });
            }
            result.push({
              word: cleanWord,
              meaning: meaning === '-' ? '' : meaning,
              isUnknown: false,
            });
            result.push({
              word: punctuation,
              meaning: '',
              isUnknown: false,
            });
            return result;
          } else {
            // 句読点なしの通常の単語
            const lemma = getLemma(processWord);
            const wordData = wordDictionary.get(lemma);
            const meaning = wordData?.meaning || '';
            
            const result: ReadingSegment[] = [];
            if (leadingQuote) {
              result.push({
                word: leadingQuote,
                meaning: '',
                isUnknown: false,
              });
            }
            result.push({
              word: processWord,
              meaning: meaning === '-' ? '' : meaning,
              isUnknown: false,
            });
            return result;
          }
        }).flat();
        
        // 日本語訳を取得（行番号と対応）
        const japanese = japanesePhrases[japaneseIndex] || '';
        japaneseIndex++;
        
        phrases.push({
          english: fullText,
          japanese: japanese,
          phraseMeaning: japanese, // phraseMeaningも設定
          words: words,
          segments: segments,
        });
      } else {
        // passages-for-phrase-workのファイルは既に節・句で改行済み
        // 各行をそのまま1フレーズとして扱う
        const phraseText = paragraph.trim();
        
        // 単語に分割
        const words = phraseText.split(/\s+/);
        
        // セグメントを生成
        const segments: ReadingSegment[] = words.map(word => {
          // 略語パターン（Ms., Mr., Dr.など）をチェック
          const abbreviationPattern = /^(Ms|Mr|Mrs|Dr|Prof|St|Ave|Inc|Ltd|etc)\.$|^[A-Z]\.$|^vs\.$|^e\.g\.$|^i\.e\.$/;
          if (abbreviationPattern.test(word)) {
            // 略語は分割せずそのまま1単語として扱う
            const lemma = getLemma(word.replace(/\.$/, '')); // ピリオドなしで辞書検索
            const wordData = wordDictionary.get(lemma);
            const meaning = wordData?.meaning || '';
            return {
              word: word,
              meaning: meaning === '-' ? '' : meaning,
              isUnknown: false,
            };
          }
          
          // 句読点を検出
          const punctuationMatch = word.match(/([.,!?;:—])$/);
          
          if (punctuationMatch) {
            const cleanWord = word.replace(/[.,!?;:—]$/, '');
            const punctuation = punctuationMatch[1];
            
            // 空の場合（句読点のみ）
            if (!cleanWord) {
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
            // 句読点なしの通常の単語
            const lemma = getLemma(word);
            const wordData = wordDictionary.get(lemma);
            const meaning = wordData?.meaning || '';
            
            return {
              word: word,
              meaning: meaning === '-' ? '' : meaning,
              isUnknown: false,
            };
          }
        }).flat();
        
        // 日本語訳を取得（行番号と対応）
        const japanese = japanesePhrases[japaneseIndex] || '';
        japaneseIndex++;
        
        phrases.push({
          english: phraseText,
          japanese: japanese,
          phraseMeaning: japanese, // phraseMeaningも設定
          words: words,
          segments: segments,
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
    translation: fullTranslation, // 全訳を設定
    originalText: originalText, // 元の全文を設定
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
      logger.log(`No phrase learning JSON found for ${passageId}, will use .txt conversion`);
      return null; // ファイルが存在しない場合はnullを返す
    }
    
    const data = await response.json();
    logger.log(`Loaded phrase learning JSON for ${passageId}, phrases: ${data.phrases?.length || 0}`);
    
    // 全訳と元の全文を並行して読み込む
    const [fullTranslation, originalText] = await Promise.all([
      loadFullTranslation(passageId),
      loadOriginalPassage(passageId)
    ]);
    
    // JSONデータをそのまま返す(ReadingPassage型に準拠)
    const readingPassage: ReadingPassage = {
      ...data,
      phrases: data.phrases || [], // phrasesが存在しない場合は空配列
      translation: fullTranslation, // 全訳を追加
      originalText: originalText, // 元の全文を追加
    };
    
    return readingPassage;
  } catch (error) {
    // oldフォルダに移動したファイルや存在しないファイルのエラーは静かにスキップ
    // SyntaxErrorは無効なJSONファイル、404は存在しないファイル
    logger.log(`Skipping phrase learning JSON for ${passageId} (file may be old or moved), will use .txt conversion`);
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

  logger.log(`Loading ${metadata.length} passages...`);

  for (const meta of metadata) {
    // まずフレーズ学習JSONを試す
    let passage = await loadPhraseLearningJSON(meta.id);
    
    // JSONがなければ従来の.txt変換を試す
    if (!passage) {
      passage = await convertPassageToReadingFormat(meta.id, wordDictionary);
    }
    
    if (passage) {
      logger.log(`✓ Loaded passage: ${meta.id} (${passage.phrases?.length || 0} phrases)`);
      passages.push(passage);
    } else {
      logger.error(`✗ Failed to load passage: ${meta.id}`);
    }
  }

  logger.log(`Total passages loaded: ${passages.length}`);
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
