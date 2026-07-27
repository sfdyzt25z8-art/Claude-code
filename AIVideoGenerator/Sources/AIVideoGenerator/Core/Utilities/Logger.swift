import Foundation
import os

/// Centralized logging categories so log output can be filtered per-subsystem in Console.app.
enum AppLogger {
    static let networking = Logger(subsystem: subsystem, category: "networking")
    static let generation = Logger(subsystem: subsystem, category: "generation")
    static let persistence = Logger(subsystem: subsystem, category: "persistence")
    static let auth = Logger(subsystem: subsystem, category: "auth")
    static let ui = Logger(subsystem: subsystem, category: "ui")

    private static let subsystem = Bundle.main.bundleIdentifier ?? "com.aivideogenerator.app"
}
