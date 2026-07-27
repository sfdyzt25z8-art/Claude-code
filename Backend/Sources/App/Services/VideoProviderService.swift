import Vapor
import Fluent

/// Server-side mirror of the client's `AIVideoProviding`/`ProviderRegistry`
/// (`AIVideoGenerator/Sources/AIVideoGenerator/Services/Providers/`). Real
/// third-party providers are wired in here — behind this protocol — never in
/// the iOS client, so provider API keys stay server-side.
protocol VideoProviderService: Sendable {
    func availableProviders() -> [ProviderInfo]
    func simulateGeneration(job: GenerationJobRecord, db: Database) async
}

struct ProviderInfo: Content {
    let id: String
    let displayName: String
}

/// Offline mock mirroring `MockAIVideoProvider` on the client: ticks a job's
/// progress forward on a timer and marks it completed with a placeholder
/// asset URL. Replace with a real provider integration by implementing
/// `VideoProviderService` against that provider's actual API.
struct MockVideoProviderService: VideoProviderService {
    func availableProviders() -> [ProviderInfo] {
        [ProviderInfo(id: "mock.studio", displayName: "Preview Studio (Mock)")]
    }

    func simulateGeneration(job: GenerationJobRecord, db: Database) async {
        do {
            job.status = "generatingScenes"
            try await job.save(on: db)

            var progress = 0.0
            while progress < 1.0 {
                try await Task.sleep(nanoseconds: 500_000_000)
                progress = min(progress + 0.2, 1.0)
                job.progress = progress
                try await job.save(on: db)
            }

            job.status = "completed"
            job.resultAssetURL = "https://example.com/mock-assets/\(job.id?.uuidString ?? UUID().uuidString).mp4"
            try await job.save(on: db)
        } catch {
            job.status = "failed"
            job.errorMessage = "Generation failed: \(error.localizedDescription)"
            try? await job.save(on: db)
        }
    }
}
