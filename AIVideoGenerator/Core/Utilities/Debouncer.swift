import Foundation

/// Debounces rapid, repeated async work (e.g. live prompt-assist suggestions
/// as the user types) so only the last call within `interval` executes.
actor Debouncer {
    private let interval: Duration
    private var task: Task<Void, Never>?

    init(interval: Duration = .milliseconds(400)) {
        self.interval = interval
    }

    func run(_ operation: @escaping @Sendable () async -> Void) {
        task?.cancel()
        task = Task {
            try? await Task.sleep(for: interval)
            guard !Task.isCancelled else { return }
            await operation()
        }
    }

    func cancel() {
        task?.cancel()
    }
}
