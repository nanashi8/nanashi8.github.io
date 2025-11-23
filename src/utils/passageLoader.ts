/**
 * パッセージローダー - public/data/passages/*.txt ファイルの読み込み
 * PASSAGE_CREATION_GUIDELINES.md の仕様に基づく
 */

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

// パッセージ一覧定義（public/data/passages/ 配下の全ファイル）
const PASSAGE_FILES: PassageMetadata[] = [
  // Beginner (5 passages)
  { id: 'beginner-supermarket', title: 'Shopping at the Supermarket', level: 'beginner', topic: 'daily-life', wordCount: 1200, filePath: '/data/passages/beginner-supermarket-shopping.txt' },
  { id: 'beginner-cafe', title: 'A Day at the Café', level: 'beginner', topic: 'food-culture', wordCount: 1150, filePath: '/data/passages/beginner-cafe-menu.txt' },
  { id: 'beginner-conversation', title: 'Daily Conversations', level: 'beginner', topic: 'communication', wordCount: 1100, filePath: '/data/passages/beginner-conversation-daily.txt' },
  { id: 'beginner-weather', title: 'Weather and Seasons', level: 'beginner', topic: 'nature', wordCount: 1250, filePath: '/data/passages/beginner-weather-seasons.txt' },
  { id: 'beginner-wildlife', title: 'Wildlife Park Guide', level: 'beginner', topic: 'animals', wordCount: 1100, filePath: '/data/passages/beginner-wildlife-park-guide.txt' },
  
  // Intermediate (8 passages)
  { id: 'intermediate-exchange-student', title: 'Exchange Student in Australia', level: 'intermediate', topic: 'culture-exchange', wordCount: 2100, filePath: '/data/passages/intermediate-exchange-student-australia.txt' },
  { id: 'intermediate-homestay', title: 'Homestay in America', level: 'intermediate', topic: 'culture-exchange', wordCount: 1950, filePath: '/data/passages/intermediate-homestay-america.txt' },
  { id: 'intermediate-career-day', title: 'Career Day at School', level: 'intermediate', topic: 'education-career', wordCount: 2200, filePath: '/data/passages/intermediate-career-day.txt' },
  { id: 'intermediate-hospital', title: 'A Visit to the Hospital', level: 'intermediate', topic: 'health', wordCount: 2100, filePath: '/data/passages/intermediate-hospital-visit.txt' },
  { id: 'intermediate-museum', title: 'Science Museum Experience', level: 'intermediate', topic: 'science-education', wordCount: 2250, filePath: '/data/passages/intermediate-science-museum.txt' },
  { id: 'intermediate-sports', title: 'School Sports Day', level: 'intermediate', topic: 'sports-teamwork', wordCount: 1850, filePath: '/data/passages/intermediate-sports-day.txt' },
  { id: 'intermediate-volunteer', title: 'Volunteer Experience', level: 'intermediate', topic: 'community-service', wordCount: 1900, filePath: '/data/passages/intermediate-volunteer-work.txt' },
  { id: 'intermediate-club', title: 'After-School Club Activities', level: 'intermediate', topic: 'school-life', wordCount: 1800, filePath: '/data/passages/intermediate-club-activities.txt' },
  
  // Advanced (8 passages)
  { id: 'advanced-environmental', title: 'Environmental Issues and Solutions', level: 'advanced', topic: 'environment', wordCount: 4200, filePath: '/data/passages/advanced-environmental-issues.txt' },
  { id: 'advanced-family', title: 'Family Gathering Traditions', level: 'advanced', topic: 'culture-family', wordCount: 4400, filePath: '/data/passages/advanced-family-gathering.txt' },
  { id: 'advanced-health', title: 'Health Statistics Analysis', level: 'advanced', topic: 'health-data', wordCount: 3400, filePath: '/data/passages/advanced-health-statistics.txt' },
  { id: 'advanced-historical', title: 'Historical Figures Study', level: 'advanced', topic: 'history', wordCount: 3150, filePath: '/data/passages/advanced-historical-figures.txt' },
  { id: 'advanced-cultural', title: 'Cultural Exchange Insights', level: 'advanced', topic: 'culture-global', wordCount: 3500, filePath: '/data/passages/advanced-international-exchange.txt' },
  { id: 'advanced-festival', title: 'School Festival Planning', level: 'advanced', topic: 'school-events', wordCount: 3700, filePath: '/data/passages/advanced-school-festival.txt' },
  { id: 'advanced-summer', title: 'Summer Vacation Stories', level: 'advanced', topic: 'personal-growth', wordCount: 3300, filePath: '/data/passages/advanced-summer-vacation-stories.txt' },
  { id: 'advanced-technology', title: 'Technology and Future', level: 'advanced', topic: 'technology-innovation', wordCount: 3800, filePath: '/data/passages/advanced-technology-future.txt' },
];

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
    console.error(`Passage not found: ${passageId}`);
    return null;
  }

  try {
    const response = await fetch(metadata.filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    
    const content = await response.text();
    const sections = parsePassageContent(content);
    
    return {
      ...metadata,
      content,
      sections,
    };
  } catch (error) {
    console.error(`Error loading passage ${passageId}:`, error);
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
