import SwiftUI

struct TitlesPanel: View {
    @Bindable var viewModel: VideoEditorViewModel
    @State private var newTitleText = ""

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            SectionHeader(title: "Titles")

            HStack {
                TextField("Title text", text: $newTitleText)
                    .textFieldStyle(.roundedBorder)
                Button("Add") {
                    guard !newTitleText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
                    viewModel.addTitle(TitleOverlay(text: newTitleText, timelineStart: 0))
                    newTitleText = ""
                }
                .buttonStyle(.borderedProminent)
            }

            if viewModel.project.titles.isEmpty {
                EmptyStateRow(message: "No titles yet. Add one above.")
            } else {
                ForEach(viewModel.project.titles) { title in
                    HStack {
                        VStack(alignment: .leading) {
                            Text(title.text).font(Typography.subheadline)
                            Text("Starts at \(title.timelineStart.formattedDuration), lasts \(title.duration.formattedDuration)")
                                .font(Typography.caption)
                                .foregroundStyle(Theme.secondaryText)
                        }
                        Spacer()
                        Button(role: .destructive) {
                            viewModel.removeTitle(id: title.id)
                        } label: {
                            Image(systemName: "trash")
                        }
                    }
                    .padding(.vertical, Spacing.xxs)
                }
            }
        }
        .padding(Spacing.md)
    }
}

struct CaptionsPanel: View {
    @Bindable var viewModel: VideoEditorViewModel
    @State private var isGenerating = false

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            SectionHeader(title: "Captions")

            PrimaryButton(
                title: "Auto-Generate Captions",
                systemImage: "captions.bubble",
                isLoading: isGenerating
            ) {
                isGenerating = true
                Task {
                    await viewModel.generateAutomaticCaptions()
                    isGenerating = false
                }
            }

            if viewModel.project.captions.isEmpty {
                EmptyStateRow(message: "No captions yet. Generate them automatically or add manually.")
            } else {
                ForEach(viewModel.project.captions) { caption in
                    HStack {
                        VStack(alignment: .leading) {
                            Text(caption.text).font(Typography.subheadline).lineLimit(2)
                            Text("\(caption.timelineStart.formattedDuration) – \(caption.timelineEnd.formattedDuration)")
                                .font(Typography.caption)
                                .foregroundStyle(Theme.secondaryText)
                        }
                        Spacer()
                        Button(role: .destructive) {
                            viewModel.removeCaption(id: caption.id)
                        } label: {
                            Image(systemName: "trash")
                        }
                    }
                    .padding(.vertical, Spacing.xxs)
                }
            }
        }
        .padding(Spacing.md)
    }
}
