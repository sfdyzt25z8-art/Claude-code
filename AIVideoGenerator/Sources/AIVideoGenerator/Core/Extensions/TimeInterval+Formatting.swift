import Foundation

extension TimeInterval {
    /// Formats a duration as `MM:SS` or `HH:MM:SS` for durations at or beyond an hour,
    /// used throughout duration pickers, timelines, and progress rows.
    var formattedDuration: String {
        let totalSeconds = Int(self.rounded())
        let hours = totalSeconds / 3600
        let minutes = (totalSeconds % 3600) / 60
        let seconds = totalSeconds % 60

        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        }
        return String(format: "%d:%02d", minutes, seconds)
    }

    /// Compact human-readable ETA, e.g. "~3 min" or "~1h 20m".
    var formattedETA: String {
        let totalMinutes = Int((self / 60).rounded(.up))
        if totalMinutes < 1 {
            return "< 1 min"
        }
        if totalMinutes < 60 {
            return "~\(totalMinutes) min"
        }
        let hours = totalMinutes / 60
        let minutes = totalMinutes % 60
        return minutes == 0 ? "~\(hours)h" : "~\(hours)h \(minutes)m"
    }
}
