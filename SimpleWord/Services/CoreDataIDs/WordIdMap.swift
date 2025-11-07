// WordIdMap.swift
// - 何を: 安定キー（hashKey）とUUIDの対応を保持するCore Dataモデル。
// - なぜ: 同じ語を同じIDで管理し、学習履歴を安定化するため。

import Foundation
@preconcurrency import CoreData

/// Core Data モデル: hashKey ↔ uuid を保持
@objc(WordIdMap)
final class WordIdMap: NSManagedObject, @unchecked Sendable {
    @NSManaged var hashKey: String
    @NSManaged var uuid: String
    @NSManaged var sourceId: String?
    @NSManaged var createdAt: Date
    @NSManaged var lastSeen: Date
}
