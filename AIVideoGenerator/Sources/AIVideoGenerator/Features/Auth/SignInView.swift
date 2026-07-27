import SwiftUI
import AuthenticationServices

/// Sign-in / sign-up screen offering Sign in with Apple, Google Sign-In, and
/// email/password, plus a password-reset entry point.
struct SignInView: View {
    @Environment(DependencyContainer.self) private var container
    @State private var viewModel: AuthViewModel?
    let onSignedIn: () -> Void

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()

            if let viewModel {
                ScrollView {
                    VStack(spacing: Spacing.lg) {
                        header

                        SignInWithAppleButton(.signIn) { request in
                            request.requestedScopes = [.fullName, .email]
                        } onCompletion: { _ in
                            Task {
                                if await viewModel.signInWithApple() { onSignedIn() }
                            }
                        }
                        .signInWithAppleButtonStyle(.black)
                        .frame(height: 50)
                        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.small, style: .continuous))

                        SecondaryButton(title: "Continue with Google", systemImage: "globe") {
                            Task {
                                if await viewModel.signInWithGoogle() { onSignedIn() }
                            }
                        }

                        dividerRow

                        emailForm(viewModel: viewModel)

                        modeToggle(viewModel: viewModel)
                    }
                    .padding(Spacing.lg)
                }
            } else {
                ProgressView()
            }
        }
        .task {
            if viewModel == nil {
                viewModel = AuthViewModel(authService: container.authService)
            }
        }
        .alert(
            "Sign In Failed",
            isPresented: Binding(
                get: { viewModel?.lastError != nil },
                set: { if !$0 { viewModel?.lastError = nil } }
            )
        ) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(viewModel?.lastError?.errorDescription ?? "")
        }
    }

    private var header: some View {
        VStack(spacing: Spacing.sm) {
            Image(systemName: "sparkles.tv.fill")
                .font(.system(size: 48))
                .foregroundStyle(Theme.brandGradient)
            Text("AI Video Generator")
                .font(Typography.largeTitle)
                .foregroundStyle(Theme.primaryText)
            Text("Sign in to create, save, and sync your AI-generated videos.")
                .font(Typography.subheadline)
                .foregroundStyle(Theme.secondaryText)
                .multilineTextAlignment(.center)
        }
        .padding(.top, Spacing.xl)
    }

    private var dividerRow: some View {
        HStack {
            Rectangle().fill(Theme.divider).frame(height: 1)
            Text("or").font(Typography.caption).foregroundStyle(Theme.secondaryText)
            Rectangle().fill(Theme.divider).frame(height: 1)
        }
    }

    @ViewBuilder
    private func emailForm(viewModel: AuthViewModel) -> some View {
        VStack(spacing: Spacing.sm) {
            if viewModel.mode == .signUp {
                TextField("Name", text: Binding(get: { viewModel.displayName }, set: { viewModel.displayName = $0 }))
                    .textFieldStyle(.roundedBorder)
                    .textContentType(.name)
            }

            TextField("Email", text: Binding(get: { viewModel.email }, set: { viewModel.email = $0 }))
                .textFieldStyle(.roundedBorder)
                .textContentType(.emailAddress)
                .keyboardType(.emailAddress)
                .autocapitalization(.none)

            SecureField("Password", text: Binding(get: { viewModel.password }, set: { viewModel.password = $0 }))
                .textFieldStyle(.roundedBorder)
                .textContentType(viewModel.mode == .signIn ? .password : .newPassword)

            PrimaryButton(
                title: viewModel.mode == .signIn ? "Sign In" : "Create Account",
                isLoading: viewModel.isLoading,
                isEnabled: viewModel.canSubmit
            ) {
                Task {
                    if await viewModel.submitEmailFlow() { onSignedIn() }
                }
            }

            if viewModel.mode == .signIn {
                Button("Forgot password?") {
                    Task { await viewModel.sendPasswordReset() }
                }
                .font(Typography.caption)
                .foregroundStyle(Theme.secondaryText)
            }
        }
    }

    private func modeToggle(viewModel: AuthViewModel) -> some View {
        Button {
            viewModel.mode = viewModel.mode == .signIn ? .signUp : .signIn
        } label: {
            Text(viewModel.mode == .signIn ? "Don't have an account? Sign Up" : "Already have an account? Sign In")
                .font(Typography.subheadline)
                .foregroundStyle(Theme.secondaryText)
        }
    }
}

#Preview {
    SignInView(onSignedIn: {})
        .environment(DependencyContainer.preview())
}
