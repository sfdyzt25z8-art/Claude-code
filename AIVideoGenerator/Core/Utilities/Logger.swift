import Foundation
import os

/// Thin wrapper over `os.Logger` with per-subsystem categories so log
/// output can be filtered in Console.app during development without
/// leaking sensitive data (prompts, tokens) into release logs.
enum AppLogger {
    private static let subsystem = "com.aivideogenerator.app"

    static let network = Logger(subsystem: subsystem, category: "network")
    static let generation = Logger(subsystem: subsystem, category: "generation")
    static let auth = Logger(subsystem: subsystem, category: "auth")
    static let storage = Logger(subsystem: subsystem, category: "storage")
    static let ui = Logger(subsystem: subsystem, category: "ui")
}
