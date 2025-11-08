// CoreDataWordIDProvider.swift
// - 何を: 安定キー→SHA256→hashKey で検索し、UUID を取得/新規発行して返すサービス。
// - なぜ: CSV間で同一語を同じIDで扱い、学習履歴を安定して紐づけるため。

import Foundation
@preconcurrency import CoreData
import CryptoKit

/// Core Data 版の ID 取得サービス。
/// ・安定キー（WordKeyBuilder）→ SHA256 → hashKey
/// ・hashKey で検索、無ければ UUID を新規発行して保存
final class CoreDataWordIDProvider: Sendable {
    static let shared = CoreDataWordIDProvider()

    private let keyBuilder: WordKeyBuilder
    private let stack: CoreDataStack
    private let context: NSManagedObjectContext

    private init() {
        self.keyBuilder = WordKeyBuilder.shared
        self.stack = CoreDataStack.shared
        let ctx = self.stack.container.newBackgroundContext()
        ctx.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        self.context = ctx
    }

    /// 行データから内部用 UUID を返す。`sourceId` は例: `Resources/高校単語.csv`
    @discardableResult
    nonisolated func idFor(term: String, reading: String?, meaning: String, etymology: String?, sourceId: String? = nil) -> UUID {
        let stableKey = keyBuilder.makeStableKey(term: term, reading: reading, meaning: meaning, etymology: etymology)
        let hashKey = sha256Hex(of: stableKey)
        return getOrCreateUUID(hashKey: hashKey, sourceId: sourceId)
    }

    /// 既存があれば返す。無ければ `nil`
    nonisolated func existingIdFor(term: String, reading: String?, meaning: String, etymology: String?, sourceId: String? = nil) -> UUID? {
        let stableKey = keyBuilder.makeStableKey(term: term, reading: reading, meaning: meaning, etymology: etymology)
        let hashKey = sha256Hex(of: stableKey)
        return fetchUUID(hashKey: hashKey)
    }

    // MARK: - Core

    nonisolated private func getOrCreateUUID(hashKey: String, sourceId: String?) -> UUID {
        return context.performAndWait {
            let req = NSFetchRequest<WordIdMap>(entityName: "WordIdMap")
            req.predicate = NSPredicate(format: "hashKey == %@", hashKey)
            req.fetchLimit = 1
            let existing = try? context.fetch(req).first
            
            if let existingMap = existing {
                let uuidString = existingMap.uuid
                if let parsed = UUID(uuidString: uuidString) {
                    // lastSeenを更新
                    existingMap.lastSeen = Date()
                    try? context.save()
                    return parsed
                }
            }
            
            let uuid = UUID()
            let now = Date()
            let m = WordIdMap(context: context)
            m.hashKey = hashKey
            m.uuid = uuid.uuidString
            m.sourceId = sourceId
            m.createdAt = now
            m.lastSeen = now
            do {
                try context.save()
            } catch {
                context.rollback()
                // 再度チェック
                let existing2 = try? context.fetch(req).first
                if let existingMap2 = existing2 {
                    let uuidString = existingMap2.uuid
                    if let parsed = UUID(uuidString: uuidString) {
                        return parsed
                    }
                }
                NSLog("WordID create save error: \(error)")
            }
            return uuid
        }
    }

    nonisolated private func fetchUUID(hashKey: String) -> UUID? {
        return context.performAndWait {
            let req = NSFetchRequest<WordIdMap>(entityName: "WordIdMap")
            req.predicate = NSPredicate(format: "hashKey == %@", hashKey)
            req.fetchLimit = 1
            if let existing = try? context.fetch(req).first {
                let uuidString = existing.uuid
                let result = UUID(uuidString: uuidString)
                // lastSeenを更新
                existing.lastSeen = Date()
                try? context.save()
                return result
            }
            return nil
        }
    }

    nonisolated private func sha256Hex(of text: String) -> String {
        let digest = SHA256.hash(data: Data(text.utf8))
        return digest.map { String(format: "%02x", $0) }.joined()
    }
}
