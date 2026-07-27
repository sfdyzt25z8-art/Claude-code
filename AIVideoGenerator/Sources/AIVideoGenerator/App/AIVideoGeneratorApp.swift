import SwiftUI

@main
struct AIVideoGeneratorApp: App {
    @State private var container = DependencyContainer.live()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(container)
                .preferredColorScheme(nil)
        }
    }
}
