import SwiftUI

/// WordIdMap のメンテナンス用ビュー
/// - 何を: 統計表示、プリウォーム、エクスポート、パージ
/// - なぜ: 初回遅延の低減、バックアップ、サイズ抑制
struct IDMapAdminView: View {
    @State private var statsText: String = ""
    @State private var message: String? = nil
    @State private var purgeDays: Int = 90
    @State private var isBusy: Bool = false

    var body: some View {
        List {
            Section(header: SectionHeader(systemImage: "info.circle", title: "Stats")) {
                if statsText.isEmpty {
                    Text("Tap Refresh to fetch stats.").foregroundColor(.secondary)
                } else {
                    Text(statsText)
                        .font(.footnote)
                        .foregroundColor(.secondary)
                }
                Button(action: refreshStats) {
                    Label("Refresh", systemImage: "arrow.clockwise")
                }
                .disabled(isBusy)
            }

            Section(header: SectionHeader(systemImage: "bolt.fill", title: "Prewarm")) {
                Text("既知のCSV（Bundle + Documents）を走査し、安定キーからIDを事前発行します。初回表示の遅延を軽減。")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Button(action: prewarmAll) {
                    Label("Prewarm all known CSVs", systemImage: "flame.fill")
                }
                .disabled(isBusy)
            }

            Section(header: SectionHeader(systemImage: "square.and.arrow.up", title: "Export")) {
                Text("IDマップ全件を CSV として Documents に書き出します。")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Button(action: exportAll) {
                    Label("Export to Documents", systemImage: "square.and.arrow.down.on.square")
                }
                .disabled(isBusy)
            }

            Section(header: SectionHeader(systemImage: "trash", title: "Purge")) {
                Stepper(value: $purgeDays, in: 7...365) {
                    Text("削除対象: lastSeen が \(purgeDays) 日より古い")
                }
                Button(role: .destructive, action: purgeOld) {
                    Label("Purge old mappings", systemImage: "trash")
                }
                .disabled(isBusy)
            }

            if let msg = message {
                Section {
                    Text(msg).font(.caption).foregroundColor(.secondary)
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("ID Map Admin")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear(perform: refreshStats)
    }

    private func refreshStats() {
        isBusy = true
        Task.detached {
            let maintenance = await MainActor.run { IDMapMaintenance.shared }
            let s = maintenance.stats()
            let df = DateFormatter()
            df.dateStyle = .short; df.timeStyle = .short
            let earliest = s.earliest.map { df.string(from: $0) } ?? "-"
            let latest = s.latest.map { df.string(from: $0) } ?? "-"
            let text = "count: \(s.count)\nfirst: \(earliest)\nlast: \(latest)"
            await MainActor.run {
                self.statsText = text
                self.message = "Stats refreshed"
                self.isBusy = false
            }
        }
    }

    private func prewarmAll() {
        isBusy = true
        Task.detached {
            let maintenance = await MainActor.run { IDMapMaintenance.shared }
            let total = maintenance.prewarmAllKnownCSVs()
            await MainActor.run {
                self.message = "Prewarmed rows: \(total)"
                self.refreshStats()
                self.isBusy = false
            }
        }
    }

    private func exportAll() {
        isBusy = true
        Task.detached {
            let filename = "WordIDs_" + ISO8601DateFormatter().string(from: Date()).replacingOccurrences(of: ":", with: "-") + ".csv"
            if let dir = FileUtils.documentsDirectory {
                let url = dir.appendingPathComponent(filename)
                do {
                    let maintenance = await MainActor.run { IDMapMaintenance.shared }
                    try maintenance.exportAll(to: url)
                    await MainActor.run {
                        self.message = "Exported: \(filename)"
                        self.isBusy = false
                    }
                } catch {
                    await MainActor.run {
                        self.message = "Export failed: \(error.localizedDescription)"
                        self.isBusy = false
                    }
                }
            } else {
                await MainActor.run {
                    self.message = "Documents directory not available"
                    self.isBusy = false
                }
            }
        }
    }

    private func purgeOld() {
        isBusy = true
        let days = purgeDays
        Task.detached {
            do {
                let maintenance = await MainActor.run { IDMapMaintenance.shared }
                let removed = try maintenance.purgeOlderThan(days: days)
                await MainActor.run {
                    self.message = "Purged: \(removed) records"
                    self.refreshStats()
                    self.isBusy = false
                }
            } catch {
                await MainActor.run {
                    self.message = "Purge failed: \(error.localizedDescription)"
                    self.isBusy = false
                }
            }
        }
    }
}

#Preview {
    NavigationStack { IDMapAdminView() }
}
