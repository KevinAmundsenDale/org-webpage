# Signing Sammenheng

Version 1.3.0 remains unsigned. No signing identity has been purchased or enrolled. The current workflow supports certificate-based signing when credentials are supplied, but a successfully built installer alone is not proof of signing or notarization.

## Mac: next steps for the owner

1. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/enroll/), using your legal identity. Apple lists USD 99 per year, with local pricing during enrollment.
2. On your Mac, create a **Developer ID Application** certificate and retain its private key. This is the certificate for distributing this app outside the App Store. Follow [Apple's instructions](https://developer.apple.com/help/account/certificates/create-developer-id-certificates).
3. Export the certificate **and private key** from Keychain Access as a password-protected P12 file. Encode that file as base64 for the GitHub secret `CSC_LINK`; put its export password in `CSC_KEY_PASSWORD`.
4. Add `APPLE_ID`, `APPLE_TEAM_ID`, and `APPLE_APP_SPECIFIC_PASSWORD` in the repository's **Settings → Secrets and variables → Actions**. Use an app-specific password for notarization, not your ordinary account password. The existing desktop workflow supplies these values to electron-builder.
5. Build a new app version through **Build desktop installers**. Inspect the macOS log for successful Developer ID signing and notarization. On a Mac verify the packaged application with `codesign --verify --deep --strict --verbose=2 Sammenheng.app` and `spctl --assess --type execute --verbose=2 Sammenheng.app`; validate the stapled ticket with `xcrun stapler validate Sammenheng.app`.
6. Test the downloaded DMG on a second Mac and test an update from the preceding version before publishing. Keep the same signing identity for future releases.

Signing and Apple's notarization are separate steps; both matter for direct distribution. See [Developer ID](https://developer.apple.com/developer-id/).

## Windows: choose a provider before configuring CI

A trusted code-signing identity is required. A self-signed certificate will not remove the trust warnings for other people.

Microsoft [Artifact Signing eligibility](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart) currently includes organizations in Norway, but individual developers must be in the US or Canada. If you are signing as a Norwegian individual, do not purchase Azure resources assuming Public Trust enrollment will be available. If signing through an eligible organization, Artifact Signing is an option; it needs its own Azure identity validation, certificate profile and CI configuration.

For an individual, choose a public certificate authority/service that explicitly supports Norwegian individuals and unattended GitHub Actions builds. Confirm eligibility, identity checks, renewal cost, and how its hardware/cloud-held key integrates with electron-builder before purchasing. Modern services may require a provider-specific signing hook or cloud configuration; a USB token on your laptop is not automatically accessible to GitHub's hosted runner.

The existing workflow accepts `WIN_CSC_LINK` and `WIN_CSC_KEY_PASSWORD` for a compatible certificate-backed setup. Do not assume every provider can supply an exportable PFX. Provider-specific cloud signing still needs to be wired into the workflow after choosing a provider. See the [electron-builder v26 Windows signing guide](https://www.electron.build/v26/docs/features/code-signing/code-signing-win/).

After configuring signing, verify the downloaded installer with PowerShell `Get-AuthenticodeSignature`, requiring `Status` to be `Valid` and the expected publisher identity. Also check the installed app executable and test installation and replacement. Signing establishes a verified publisher; it does not guarantee that SmartScreen will never warn about a newly distributed app.

## Credential handling and publication

Store secrets only in GitHub Actions secrets or the signing provider's protected storage, never in the repository or an issue. Don't send private keys or passwords in chat. Verify signing on actual output files before describing a release as signed. Use the same publisher identity across updates and retain secure recovery copies of credentials.

The desktop release workflow creates a draft. Publish that draft as Latest only after installer tests and the signature/notarization checks pass. App updates and shared-content updates remain separate; no shared-content release is needed solely to change signing.
