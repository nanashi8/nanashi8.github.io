import Foundation

/// クイズのバッチ管理を担当
/// 問題の繰り返しとラウンドロビンシャッフルを実行
struct QuizBatchManager {
    
    /// バッチを準備
    /// 指定されたバッチサイズと繰り返し回数で問題プールを作成
    /// - Parameters:
    ///   - items: 全問題アイテム
    ///   - order: 出題順序
    ///   - batchSize: バッチサイズ
    ///   - repeatCount: 繰り返し回数
    /// - Returns: ラウンドロビンシャッフルされた問題プール
    func prepareBatch(
        from items: [QuestionItem],
        order: [QuestionItem],
        batchSize: Int,
        repeatCount: Int
    ) -> [QuestionItem] {
        guard !order.isEmpty else { return [] }
        
        // バッチサイズ分を取得
        let batchItems = Array(order.prefix(batchSize))
        guard !batchItems.isEmpty else { return [] }
        
        // 繰り返し回数を使用（最低1回は保証）
        var poolItems: [QuestionItem] = []
        let actualRepeatCount = max(1, repeatCount)
        
        for item in batchItems {
            for _ in 0..<actualRepeatCount {
                poolItems.append(item)
            }
        }
        
        // ラウンドロビン配置（同じ単語が連続しないように分散）
        return roundRobinShuffle(items: batchItems, pool: poolItems)
    }
    
    /// ラウンドロビンシャッフル
    /// 同じ問題が連続しないように、問題を均等に分散配置
    /// - Parameters:
    ///   - items: バッチ内の問題アイテム（重複なし）
    ///   - pool: 繰り返しを含む問題プール
    /// - Returns: シャッフルされた問題プール
    private func roundRobinShuffle(items: [QuestionItem], pool: [QuestionItem]) -> [QuestionItem] {
        var result: [QuestionItem] = []
        var queues = [UUID: [QuestionItem]]()
        
        // 各問題のキューを作成
        for item in pool {
            queues[item.id, default: []].append(item)
        }
        
        // ラウンドロビン方式で取り出し
        var hasMore = true
        while hasMore {
            hasMore = false
            for item in items {
                if var queue = queues[item.id], !queue.isEmpty {
                    result.append(queue.removeFirst())
                    queues[item.id] = queue
                    hasMore = true
                }
            }
        }
        
        return result
    }
}
