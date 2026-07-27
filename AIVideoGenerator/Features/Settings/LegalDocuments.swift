import Foundation

/// Locally bundled legal copy shown in Settings and required at sign-up.
/// Keep this in sync with the hosted versions at aivideogenerator.app/legal —
/// the hosted pages are the authoritative source for App Store review links.
enum LegalDocuments {
    static let privacyPolicy = """
    # Privacy Policy

    **Last updated: 2026**

    AI Video Generator ("we", "our", "the app") is designed with privacy as a \
    default, not an afterthought.

    ## What We Collect
    - **Account information**: email address, display name, and authentication \
    provider (Apple, Google, or email) when you create an account.
    - **Generation content**: prompts, generated videos/thumbnails, and edit \
    history, stored to power your project library and (optionally) cloud sync.
    - **Usage data**: crash logs and coarse feature-usage analytics, used only \
    to improve reliability.

    ## What We Never Do
    - We do not sell your data to third parties.
    - We do not use your private prompts or generated content to train models \
    without your explicit, separate opt-in consent.
    - We do not track you across other apps or websites.

    ## Third-Party AI Providers
    When you generate a video or thumbnail, your prompt and selected options \
    are sent to the AI provider you've selected in Settings → AI Provider \
    Selection, so that provider can render your content. Review the selected \
    provider's own privacy policy for how it handles that request.

    ## Your Rights
    You can export or delete your account and all associated content at any \
    time from Settings → Account. Contact privacy@aivideogenerator.app for any \
    data request.

    ## Security
    Credentials and tokens are stored in the iOS Keychain, never in plain \
    text. All network traffic uses HTTPS/TLS.
    """

    static let termsOfService = """
    # Terms of Service

    **Last updated: 2026**

    By using AI Video Generator, you agree to the following terms.

    ## Content Ownership & Rights
    You must own the rights to any content you upload as a reference, and you \
    are responsible for ensuring you have the right to use, publish, and \
    monetize any AI-generated output. Do not submit prompts requesting \
    content that infringes copyright, depicts real people without consent, or \
    violates applicable law.

    ## Acceptable Use
    You may not use the app to generate content that is illegal, that exploits \
    minors, that depicts non-consensual sexual content, or that is intended to \
    deceive (e.g. non-disclosed synthetic media of real people). Violations may \
    result in account suspension. Use the in-app "Report a Problem" tool to \
    flag content you believe violates these terms.

    ## Subscriptions & Generation Limits
    Free accounts include a limited number of monthly generation credits. \
    Paid plans (Plus, Pro, Studio) unlock additional credits, higher \
    resolutions, and longer durations, as configured server-side and shown in \
    Settings → Account. Generation limits are not unlimited on any plan and \
    may be adjusted; current limits are always shown before you submit a job.

    ## Availability
    AI generation depends on third-party providers and is offered on a \
    best-effort basis. We are not liable for provider outages or content \
    moderation decisions made by those providers.

    ## Termination
    You may delete your account at any time. We may suspend accounts that \
    violate these terms or applicable law.

    Contact legal@aivideogenerator.app with questions.
    """
}
