// QuestionItemCSVSchema.swift
// CSV構造を定数で管理
//
// 何を: QuestionItem用のCSV構造定義
// なぜ: 列数や列名を一元管理し、変更時の影響を最小化するため

import Foundation

/// QuestionItem用のCSVスキーマ定義
public enum QuestionItemCSVSchema {
    /// 基本的な列数（IDを含まない7列固定）
    public static let standardColumnCount = 7
    
    /// 列のインデックス定義（IDなし）
    public enum Column: Int {
        case term = 0         // 語句・単語・年号
        case reading = 1      // 読み・登場人物
        case meaning = 2      // 意味・史実名
        case etymology = 3    // 語源・解説
        case relatedWords = 4 // 関連語・関連史実
        case relatedFields = 5 // 関連分野・シチュエーション
        case difficulty = 6   // 難易度
    }
    
    /// ヘッダ名の候補（日本語・英語対応）
    public enum HeaderNames {
        /// term（問題）の候補
        public static let term = ["term", "word", "question", "語句", "単語", "フレーズ", "年号"]
        
        /// reading（読み）の候補
        public static let reading = ["reading", "読み", "読み方", "読み（カタカナ）", "読み（ひらがな）", "発音（カタカナ）", "登場人物", "人物"]
        
        /// meaning（意味）の候補
        public static let meaning = ["meaning", "definition", "translation", "意味", "和訳", "意味（日本語）", "史実名", "史実"]
        
        /// etymology（語源）の候補
        public static let etymology = ["etymology", "語源等解説", "語源", "語源等解説（日本語）", "解説", "経緯", "解説や覚え方や語呂合わせ"]
        
        /// relatedWords（関連語）の候補
        public static let relatedWords = ["relatedwords", "related_words", "relatedword", "related_word", "related", "related words", "関連語", "関連語と意味", "関連語（英語）と意味（日本語）", "関連史実", "paraphrase", "paraphrases", "synonyms"]
        
        /// relatedFields（関連分野）の候補
        public static let relatedFieldsJP = ["関連分野", "関連分野（日本語）", "分野", "カテゴリー", "カテゴリ", "シチュエーション", "シチュエーション（日本語）", "登場人物"]
        public static let relatedFieldsEN = ["relatedfields", "related_fields", "relatedfield", "related_field", "fields", "field", "related fields", "category", "categories"]
        
        /// difficulty（難易度）の候補
        public static let difficulty = ["difficulty", "level", "難易度", "レベル"]
    }
}
