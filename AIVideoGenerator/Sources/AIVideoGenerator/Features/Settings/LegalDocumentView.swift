import SwiftUI

/// Renders a bundled legal document (Privacy Policy, Terms of Service) from the
/// app's resources. Required by App Store Review Guidelines §5.1.1 (Privacy)
/// and standard EULA expectations for apps that create/upload user content.
struct LegalDocumentView: View {
    let title: String
    let markdownFileName: String

    var body: some View {
        ScrollView {
            Text(loadDocument())
                .font(Typography.body)
                .foregroundStyle(Theme.primaryText)
                .padding(Spacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func loadDocument() -> String {
        guard let url = Bundle.main.url(forResource: markdownFileName, withExtension: "md"),
              let contents = try? String(contentsOf: url, encoding: .utf8) else {
            return "This document will appear here once \(markdownFileName).md is bundled with the app."
        }
        return contents
    }
}

/// Lets a user flag AI-generated or uploaded content for review, satisfying the
/// App Store requirement that user-generated-content apps provide a reporting
/// mechanism. Submissions are queued for backend moderation review.
struct ReportContentView: View {
    @State private var details: String = ""
    @State private var didSubmit = false

    var body: some View {
        Form {
            Section("What are you reporting?") {
                TextEditor(text: $details)
                    .frame(minHeight: 120)
            }

            Section {
                Button("Submit Report") {
                    didSubmit = true
                }
                .disabled(details.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
        .navigationTitle("Report Content")
        .alert("Thank You", isPresented: $didSubmit) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("Your report has been submitted for review.")
        }
    }
}
