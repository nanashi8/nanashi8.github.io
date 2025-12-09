/**
 * パッセージローダー - public/data/passages/*.txt ファイルの読み込み
 * PASSAGE_CREATION_GUIDELINES.md の仕様に基づく
 */

import { logger } from '../logger';

export interface PassageMetadata {
  id: string;
  title: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  topic: string;
  wordCount: number;
  filePath: string;
}

export interface LoadedPassage extends PassageMetadata {
  content: string;
  sections: PassageSection[];
}

export interface PassageSection {
  title: string;
  paragraphs: string[];
}

/**
 * ファイルパスからタイトルを抽出
 * 例: /data/passages-for-phrase-work/beginner_1200_Shopping-at-the-Supermarket.txt
 *     → "Shopping-at-the-Supermarket"
 */
function extractTitleFromPath(filePath: string): string {
  const fileName = filePath.split('/').pop() || '';
  const withoutExt = fileName.replace(/\.txt$/, '');
  const parts = withoutExt.split('_');
  
  if (parts.length >= 3) {
    // 難易度_語数_タイトル の形式
    const titlePart = parts.slice(2).join('_');
    // ファイル名と完全一致させるためハイフンはそのまま維持
    return titlePart;
  }
  
  return fileName;
}

// パッセージ一覧定義（public/data/passages-for-phrase-work/ 配下の全ファイル）
// ファイル名形式: 難易度_語数_タイトル.txt
// titleはファイルパスから自動抽出される
const PASSAGE_FILES_RAW = [
  // Beginner (5 passages)
  { id: 'beginner-supermarket-shopping', level: 'beginner', topic: 'daily-life', wordCount: 1910, filePath: '/data/passages-for-phrase-work/beginner_1910_Shopping-at-the-Supermarket.txt' },
  { id: 'beginner-cafe-menu', level: 'beginner', topic: 'food-culture', wordCount: 1380, filePath: '/data/passages-for-phrase-work/beginner_1380_A-Day-at-the-Cafe.txt' },
  { id: 'beginner-conversation-daily', level: 'beginner', topic: 'communication', wordCount: 3018, filePath: '/data/passages-for-phrase-work/beginner_3018_Daily-Conversations.txt' },
  { id: 'beginner-weather-seasons', level: 'beginner', topic: 'nature', wordCount: 2111, filePath: '/data/passages-for-phrase-work/beginner_2111_Weather-and-Seasons.txt' },
  { id: 'beginner-wildlife-park-guide', level: 'beginner', topic: 'animals', wordCount: 2097, filePath: '/data/passages-for-phrase-work/beginner_2097_Wildlife-Park-Guide.txt' },
  
  // Intermediate (8 passages)
  { id: 'intermediate-exchange-student-australia', level: 'intermediate', topic: 'culture-exchange', wordCount: 3199, filePath: '/data/passages-for-phrase-work/intermediate_3199_Exchange-Student-in-Australia.txt' },
  { id: 'intermediate-homestay-america', level: 'intermediate', topic: 'culture-exchange', wordCount: 3148, filePath: '/data/passages-for-phrase-work/intermediate_3148_Homestay-in-America.txt' },
  { id: 'intermediate-career-day', level: 'intermediate', topic: 'education-career', wordCount: 2895, filePath: '/data/passages-for-phrase-work/intermediate_2895_Career-Day-at-School.txt' },
  { id: 'intermediate-hospital-visit', level: 'intermediate', topic: 'health', wordCount: 2721, filePath: '/data/passages-for-phrase-work/intermediate_2721_A-Visit-to-the-Hospital.txt' },
  { id: 'intermediate-science-museum', level: 'intermediate', topic: 'science-education', wordCount: 3265, filePath: '/data/passages-for-phrase-work/intermediate_3265_Science-Museum-Experience.txt' },
  { id: 'intermediate-community-events', level: 'intermediate', topic: 'community', wordCount: 2216, filePath: '/data/passages-for-phrase-work/intermediate_2216_Community-Events.txt' },
  { id: 'intermediate-school-events-year', level: 'intermediate', topic: 'school-life', wordCount: 2558, filePath: '/data/passages-for-phrase-work/intermediate_2558_A-Year-of-School-Events.txt' },
  { id: 'intermediate-school-news', level: 'intermediate', topic: 'school-life', wordCount: 1937, filePath: '/data/passages-for-phrase-work/intermediate_1937_School-News.txt' },
  
  // Advanced (8 passages)
  { id: 'advanced-environmental-issues', level: 'advanced', topic: 'environment', wordCount: 4263, filePath: '/data/passages-for-phrase-work/advanced_4263_Environmental-Issues-and-Solutions.txt' },
  { id: 'advanced-family-gathering', level: 'advanced', topic: 'culture-family', wordCount: 4493, filePath: '/data/passages-for-phrase-work/advanced_4493_Family-Gathering-Traditions.txt' },
  { id: 'advanced-health-statistics', level: 'advanced', topic: 'health-data', wordCount: 3422, filePath: '/data/passages-for-phrase-work/advanced_3422_Health-Statistics-Analysis.txt' },
  { id: 'advanced-historical-figures', level: 'advanced', topic: 'history', wordCount: 3115, filePath: '/data/passages-for-phrase-work/advanced_3115_Historical-Figures-Study.txt' },
  { id: 'advanced-international-exchange', level: 'advanced', topic: 'culture-global', wordCount: 3813, filePath: '/data/passages-for-phrase-work/advanced_3813_Cultural-Exchange-Insights.txt' },
  { id: 'advanced-school-festival', level: 'advanced', topic: 'school-events', wordCount: 4419, filePath: '/data/passages-for-phrase-work/advanced_4419_School-Festival-Planning.txt' },
  { id: 'advanced-summer-vacation-stories', level: 'advanced', topic: 'personal-growth', wordCount: 3255, filePath: '/data/passages-for-phrase-work/advanced_3255_Summer-Vacation-Stories.txt' },
  { id: 'advanced-technology-future', level: 'advanced', topic: 'technology-innovation', wordCount: 3161, filePath: '/data/passages-for-phrase-work/advanced_3161_Technology-and-Future.txt' },
] as const;

// ファイルパスからtitleを自動生成
const PASSAGE_FILES: PassageMetadata[] = PASSAGE_FILES_RAW.map(passage => ({
  ...passage,
  title: extractTitleFromPath(passage.filePath),
  level: passage.level as 'beginner' | 'intermediate' | 'advanced'
}));

/**
 * パッセージ一覧を取得
 */
export function getPassageList(): PassageMetadata[] {
  return PASSAGE_FILES;
}

/**
 * レベル別にパッセージをフィルタ
 */
export function getPassagesByLevel(level: 'beginner' | 'intermediate' | 'advanced'): PassageMetadata[] {
  return PASSAGE_FILES.filter(p => p.level === level);
}

/**
 * パッセージを読み込み
 */
export async function loadPassage(passageId: string): Promise<LoadedPassage | null> {
  const metadata = PASSAGE_FILES.find(p => p.id === passageId);
  if (!metadata) {
    logger.error(`Passage not found: ${passageId}`);
    return null;
  }

  try {
    const response = await fetch(metadata.filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    
    const content = await response.text();
    const sections = parsePassageContent(content);
    
    // ファイルの1行目を実際のタイトルとして使用
    const actualTitle = content.split('\n')[0]?.trim() || metadata.title;
    
    return {
      ...metadata,
      title: actualTitle,
      content,
      sections,
    };
  } catch (error) {
    logger.error(`Error loading passage ${passageId}:`, error);
    return null;
  }
}

/**
 * パッセージ内容を解析してセクションに分割
 * PASSAGE_CREATION_GUIDELINES.md の構造に基づく
 */
function parsePassageContent(content: string): PassageSection[] {
  const lines = content.split('\n');
  const sections: PassageSection[] = [];
  let currentSection: PassageSection | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // 空行はスキップ
    if (!trimmed) {
      continue;
    }
    
    // セクションタイトル判定（段落字下げなし、短い行）
    // ガイドラインに基づき、セクションヘッダーは字下げなし
    if (!line.startsWith('    ') && trimmed.length > 0 && trimmed.length < 80) {
      // 新しいセクション開始
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: trimmed,
        paragraphs: [],
      };
    } else if (line.startsWith('    ') && currentSection) {
      // 段落（4スペース字下げ）
      currentSection.paragraphs.push(trimmed);
    }
  }
  
  // 最後のセクションを追加
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
}

/**
 * パッセージの統計情報を取得
 */
export function getPassageStats() {
  const stats = {
    total: PASSAGE_FILES.length,
    byLevel: {
      beginner: PASSAGE_FILES.filter(p => p.level === 'beginner').length,
      intermediate: PASSAGE_FILES.filter(p => p.level === 'intermediate').length,
      advanced: PASSAGE_FILES.filter(p => p.level === 'advanced').length,
    },
    totalWords: PASSAGE_FILES.reduce((sum, p) => sum + p.wordCount, 0),
  };
  
  return stats;
}
