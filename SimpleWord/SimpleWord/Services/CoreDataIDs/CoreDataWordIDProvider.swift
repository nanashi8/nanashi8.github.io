// CoreDataWordIDProvider.swift
// - 何を: 安定キー→SHA256→hashKey で検索し、UUID を取得/新規発行して返すサービス。
// - なぜ: CSV間で同一語を同じIDで扱い、学習履歴を安定して紐づけるため。

import Foundation
import CoreData
import CryptoKit

/// Core Data 版の ID 取得サービス。
/// ・安定キー（WordKeyBuilder）→ SHA256 → hashKey
/// ・hashKey で検索、無ければ UUID を新規発行して保存
final class CoreDataWordIDProvider {
    static let shared = CoreDataWordIDProvider()

    private let keyBuilder = WordKeyBuilder.shared
    private let stack = CoreDataStack.shared
    private let context: NSManagedObjectContext

    private init() {
        let ctx = stack.container.newBackgroundContext()
        ctx.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        self.context = ctx
    }

    /// 行データから内部用 UUID を返す。`sourceId` は例: `Resources/高校単語.csv`
    @discardableResult
    func idFor(term: String, reading: String?, meaning: String, etymology: String?, sourceId: String? = nil) -> UUID {
        let stableKey = keyBuilder.makeStableKey(term: term, reading: reading, meaning: meaning, etymology: etymology)
        let hashKey = sha256Hex(of: stableKey)
        return getOrCreateUUID(hashKey: hashKey, sourceId: sourceId)
    }

    /// 既存があれば返す。無ければ `nil`
    func existingIdFor(term: String, reading: String?, meaning: String, etymology: String?, sourceId: String? = nil) -> UUID? {
        let stableKey = keyBuilder.makeStableKey(term: term, reading: reading, meaning: meaning, etymology: etymology)
        let hashKey = sha256Hex(of: stableKey)
        return fetchUUID(hashKey: hashKey)
    }

    // MARK: - Core

    private func getOrCreateUUID(hashKey: String, sourceId: String?) -> UUID {
        var result = UUID()
        context.performAndWait {
            if let u = fetchWord(hashKey: hashKey)?.uuid, let parsed = UUID(uuidString: u) {
                updateLastSeen(hashKey: hashKey)
                result = parsed
                return
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
                if let u = fetchWord(hashKey: hashKey)?.uuid, let parsed = UUID(uuidString: u) {
                    result = parsed
                    return
                }
                NSLog("WordID create save error: \(error)")
            }
            result = uuid
        }
        return result
    }

    private func fetchUUID(hashKey: String) -> UUID? {
        var result: UUID?
        context.performAndWait {
            if let u = fetchWord(hashKey: hashKey)?.uuid {
                result = UUID(uuidString: u)
                updateLastSeen(hashKey: hashKey)
            }
        }
        return result
    }

    private func fetchWord(hashKey: String) -> WordIdMap? {
        let req = NSFetchRequest<WordIdMap>(entityName: "WordIdMap")
        req.predicate = NSPredicate(format: "hashKey == %@", hashKey)
        req.fetchLimit = 1
        return try? context.fetch(req).first
    }

    private func updateLastSeen(hashKey: String) {
        if let obj = fetchWord(hashKey: hashKey) {
            obj.lastSeen = Date()
            try? context.save()
        }
    }

    private func sha256Hex(of text: String) -> String {
        let digest = SHA256.hash(data: Data(text.utf8))
        return digest.map { String(format: "%02x", $0) }.joined()
    }
}
