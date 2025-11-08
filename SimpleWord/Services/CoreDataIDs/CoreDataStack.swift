// CoreDataStack.swift (IDマップ用)
// - 何を: WordIdMap を保存するための独立した Core Data スタックを構築します。
// - なぜ: アプリ本体のモデルと分離し、安全にIDマップを管理するため。

import Foundation
@preconcurrency import CoreData

/// Core Data スタック（WordIdMap 用）。
/// 既存の xcdatamodeld に干渉しないよう、コードで独立したモデル/ストアを構築します。
/// SQLite は Application Support/"SimpleWord/WordIDs.sqlite" に作成します。
final class CoreDataStack: Sendable {
    static let shared = CoreDataStack()

    let container: NSPersistentContainer

    nonisolated private init() {
        let model = CoreDataStack.makeModel()
        container = NSPersistentContainer(name: "SimpleWordWordIDs", managedObjectModel: model)

        // 保存先: Application Support/SimpleWord/WordIDs.sqlite
        let appSupport = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        let dir = appSupport.appendingPathComponent("SimpleWord", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let storeURL = dir.appendingPathComponent("WordIDs.sqlite")

        let desc = NSPersistentStoreDescription(url: storeURL)
        desc.setOption(true as NSNumber, forKey: NSMigratePersistentStoresAutomaticallyOption)
        desc.setOption(true as NSNumber, forKey: NSInferMappingModelAutomaticallyOption)
        container.persistentStoreDescriptions = [desc]

        container.loadPersistentStores { _, error in
            if let error = error {
                NSLog("Core Data store load error: \(error)")
            }
        }

        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        container.viewContext.automaticallyMergesChangesFromParent = true
    }

nonisolated     private static func makeModel() -> NSManagedObjectModel {
        let model = NSManagedObjectModel()

        let entity = NSEntityDescription()
        entity.name = "WordIdMap"
        entity.managedObjectClassName = NSStringFromClass(WordIdMap.self)

        let hashKey = NSAttributeDescription()
        hashKey.name = "hashKey"
        hashKey.attributeType = .stringAttributeType
        hashKey.isOptional = false

        let uuid = NSAttributeDescription()
        uuid.name = "uuid"
        uuid.attributeType = .stringAttributeType
        uuid.isOptional = false

        let sourceId = NSAttributeDescription()
        sourceId.name = "sourceId"
        sourceId.attributeType = .stringAttributeType
        sourceId.isOptional = true

        let createdAt = NSAttributeDescription()
        createdAt.name = "createdAt"
        createdAt.attributeType = .dateAttributeType
        createdAt.isOptional = false

        let lastSeen = NSAttributeDescription()
        lastSeen.name = "lastSeen"
        lastSeen.attributeType = .dateAttributeType
        lastSeen.isOptional = false

        entity.properties = [hashKey, uuid, sourceId, createdAt, lastSeen]
        entity.uniquenessConstraints = [["hashKey"]]

        model.entities = [entity]
        return model
    }
}
