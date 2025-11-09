// FileWatcher.swift
// ファイル変更を監視する軽量ユーティリティ
// - 何を: 指定ファイルの変更（書き込み）を監視し、コールバックを呼びます。
// - なぜ: CSV編集や外部更新を自動で画面に反映するため。

import Foundation

@MainActor
public final class FileWatcher {
    private var source: DispatchSourceFileSystemObject?
    private var fileDescriptor: Int32 = -1

    public init?(url: URL, onChange: @escaping @MainActor () -> Void) {
        // URL がファイルならそのパスで FD を作る
        let path = url.path
        fileDescriptor = open(path, O_EVTONLY)
        if fileDescriptor == -1 { return nil }
        // Create the DispatchSource and assign to self.source to keep a strong reference
        self.source = DispatchSource.makeFileSystemObjectSource(fileDescriptor: fileDescriptor, eventMask: .write, queue: DispatchQueue.main)
        guard let src = self.source else { return nil }
        // バッファリングや連続イベントに備え、簡単なデバウンス
        var pending = false
        src.setEventHandler {
            guard !pending else { return }
            pending = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                pending = false
                Task { @MainActor in
                    onChange()
                }
            }
        }
        src.setCancelHandler { [fd = fileDescriptor] in
            close(fd)
        }
        src.resume()
        // self.source already set above
    }

    nonisolated public func invalidate() {
        Task { @MainActor in
            source?.cancel()
            source = nil
        }
    }

    deinit {
        invalidate()
    }
}
