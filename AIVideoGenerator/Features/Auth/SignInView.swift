import SwiftUI
import AuthenticationServices

struct SignInView: View {
    @StateObject private var viewModel: AuthViewModel
    @FocusState private var focusedField: Field?

    private enum Field {
        case email, password, displayName
    }

    init(viewModel: AuthViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(spacing: Theme.Spacing.large) {
                    VStack(spacing: Theme.Spacing.xSmall) {
                        Image(systemName: "sparkles.rectangle.stack.fill")
                            .font(.system(size: 44))
                            .foregroundStyle(Theme.Gradients.brand)
                        Text("AI Video Generator")
                            .font(.AIVG.title)
                        Text(viewModel.mode == .signIn ? "Welcome back" : "Create your account")
                            .font(.AIVG.subheadline)
                            .foregroundStyle(Theme.Colors.textSecondary)
                    }
                    .padding(.top, Theme.Spacing.xxLarge)

                    VStack(spacing: Theme.Spacing.small) {
                        SignInWithAppleButton(.signIn) { request in
                            request.requestedScopes = [.fullName, .email]
                        } onCompletion: { _ in
                            Task { await viewModel.signInWithApple() }
                        }
                        .signInWithAppleButtonStyle(.white)
                        .frame(height: 50)
                        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.medium, style: .continuous))

                        SecondaryButton(title: "Continue with Google", systemImage: "globe") {
                            Task { await viewModel.signInWithGoogle() }
                        }
                    }
                    .padding(.horizontal, Theme.Spacing.medium)

                    dividerRow

                    VStack(spacing: Theme.Spacing.small) {
                        if viewModel.mode == .signUp {
                            TextField("Full Name", text: $viewModel.displayName)
                                .textContentType(.name)
                                .focused($focusedField, equals: .displayName)
                                .padding(Theme.Spacing.small)
                                .glassCard(padding: 0)
                        }

                        TextField("Email", text: $viewModel.email)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .focused($focusedField, equals: .email)
                            .padding(Theme.Spacing.small)
                            .glassCard(padding: 0)

                        SecureField("Password", text: $viewModel.password)
                            .textContentType(viewModel.mode == .signIn ? .password : .newPassword)
                            .focused($focusedField, equals: .password)
                            .padding(Theme.Spacing.small)
                            .glassCard(padding: 0)

                        if viewModel.mode == .signIn {
                            HStack {
                                Spacer()
                                Button("Forgot Password?") {
                                    viewModel.showingForgotPassword = true
                                }
                                .font(.AIVG.footnote)
                            }
                        }

                        PrimaryButton(
                            title: viewModel.mode == .signIn ? "Sign In" : "Sign Up",
                            isLoading: viewModel.isLoading
                        ) {
                            Task { await viewModel.submitEmailForm() }
                        }
                    }
                    .padding(.horizontal, Theme.Spacing.medium)

                    Button {
                        withAnimation(Theme.Animation.standard) {
                            viewModel.mode = viewModel.mode == .signIn ? .signUp : .signIn
                        }
                    } label: {
                        Text(viewModel.mode == .signIn ? "Don't have an account? Sign Up" : "Already have an account? Sign In")
                            .font(.AIVG.subheadline)
                    }

                    legalFooter
                }
                .padding(.bottom, Theme.Spacing.xLarge)
            }
        }
        .alert("Reset Password", isPresented: $viewModel.showingForgotPassword) {
            TextField("Email", text: $viewModel.email)
            Button("Cancel", role: .cancel) {}
            Button("Send Reset Link") { Task { await viewModel.requestPasswordReset() } }
        } message: {
            Text("We'll email you a link to reset your password.")
        }
        .toast($viewModel.toast)
    }

    private var dividerRow: some View {
        HStack {
            Rectangle().fill(Theme.Colors.textTertiary.opacity(0.3)).frame(height: 1)
            Text("or").font(.AIVG.caption).foregroundStyle(Theme.Colors.textTertiary)
            Rectangle().fill(Theme.Colors.textTertiary.opacity(0.3)).frame(height: 1)
        }
        .padding(.horizontal, Theme.Spacing.medium)
    }

    private var legalFooter: some View {
        Text("By continuing, you agree to our Terms of Service and Privacy Policy.")
            .font(.AIVG.caption)
            .foregroundStyle(Theme.Colors.textTertiary)
            .multilineTextAlignment(.center)
            .padding(.horizontal, Theme.Spacing.xLarge)
    }
}
