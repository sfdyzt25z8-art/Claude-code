import Vapor

/// A real token-bucket rate limiter, keyed by bearer token when present
/// (falling back to remote address for unauthenticated requests like
/// `/v1/providers`). Not a placeholder — this actually throttles requests.
actor RateLimiterStore {
    private var buckets: [String: (tokens: Double, lastRefill: Date)] = [:]
    private let capacity: Double
    private let refillPerSecond: Double

    init(capacity: Double = 20, refillPerSecond: Double = 0.5) {
        self.capacity = capacity
        self.refillPerSecond = refillPerSecond
    }

    func allowRequest(for key: String) -> Bool {
        let now = Date()
        var bucket = buckets[key] ?? (tokens: capacity, lastRefill: now)
        let elapsed = now.timeIntervalSince(bucket.lastRefill)
        bucket.tokens = min(capacity, bucket.tokens + elapsed * refillPerSecond)
        bucket.lastRefill = now

        guard bucket.tokens >= 1 else {
            buckets[key] = bucket
            return false
        }
        bucket.tokens -= 1
        buckets[key] = bucket
        return true
    }
}

struct RateLimitMiddleware: AsyncMiddleware {
    let store: RateLimiterStore

    func respond(to request: Request, chainingTo next: AsyncResponder) async throws -> Response {
        let key = request.headers.bearerAuthorization?.token ?? request.remoteAddress?.description ?? "anonymous"
        guard await store.allowRequest(for: key) else {
            throw Abort(.tooManyRequests, reason: "You're generating too quickly. Please slow down and try again shortly.")
        }
        return try await next.respond(to: request)
    }
}
