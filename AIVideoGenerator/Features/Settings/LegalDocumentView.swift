import SwiftUI

/// Renders a Markdown-formatted legal document (Privacy Policy, Terms of
/// Service) shipped locally so it's always available, even offline.
struct LegalDocumentView: View {
    let title: String
    let markdown: String

    var body: some View {
        ScrollView {
            Text(LocalizedStringKey(markdown))
                .font(.AIVG.body)
                .padding(Theme.Spacing.medium)
        }
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
    }
}

/// A lightweight in-app reporting flow so users can flag content that
/// infringes copyright or violates guidelines, satisfying the App Store's
/// requirement that AI-generation apps provide a reporting mechanism.
struct ReportIssueView: View {
    @State private var category = "Inappropriate Content"
    @State private var details = ""
    @State private var submitted = false

    private let categories = ["Inappropriate Content", "Copyright Infringement", "App Bug", "Billing Issue", "Other"]

    var body: some View {
        Form {
            Section("What's the issue?") {
                Picker("Category", selection: $category) {
                    ForEach(categories, id: \.self) { Text($0) }
                }
                TextEditor(text: $details)
                    .frame(minHeight: 120)
            }

            Section {
                Button("Submit Report") {
                    // Production: POST to /reports with category, details, and
                    // the associated project/job ID for moderation review.
                    submitted = true
                }
                .disabled(details.trimmingCharacters(in: .whitespaces).isEmpty)
            }
        }
        .navigationTitle("Report a Problem")
        .alert("Report Submitted", isPresented: $submitted) {
            Button("OK") {}
        } message: {
            Text("Thanks — our moderation team will review this shortly.")
        }
    }
}
