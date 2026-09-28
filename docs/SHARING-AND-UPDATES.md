# Sharing Sammenheng and maintaining updates

This version adds a desktop application, content updates, personal backups, and a reviewed suggestion workflow. Your GitHub repository holds the authoritative shared content. Each user keeps their own local edits.

## What is ready now

- A Windows installer can be built with `npm run desktop:dist -- --win`. The local build is in `release/Sammenheng-1.1.0-win-x64.exe`.
- Windows users install once and launch Sammenheng from their desktop or Start menu. They do not need Node.js, npm, Git, or Docker.
- The GitHub Actions workflow **Build desktop installers** builds Windows x64 and a universal Mac app for Intel and Apple Silicon, and assembles a draft release.
- The installed app checks for app updates after opening. Users explicitly download and restart to install; it does not interrupt editing to install automatically.
- **Oppdateringer og backup → Se etter nytt faginnhold** checks for approved content releases. Users preview and apply content independently of application updates.
- Changes to the same field create a choice between the user's text and the new shared text. Unchanged fields receive corrections automatically when the update is accepted. Personal notes are retained.
- **Foreslå endring til felles kart** lets a user select changed titles, definitions, explanations, or key points and prepare a GitHub issue. The user reviews and submits it on GitHub. Personal notes are excluded.
- **Lagre sikkerhetskopi / Åpne sikkerhetskopi** transfers personal edits and notes between machines, with conflict previews on import.

Nothing is published simply by building locally. The source changes, workflows and installers must reach GitHub before other people can download them. An actual update installation between two published releases still needs release testing. Mac builds and signing must be tested on macOS.

## One-time setup for you

### 1. Use the configured public repository

Verified on 27 September 2026: [KevinAmundsenDale/org-webpage](https://github.com/KevinAmundsenDale/org-webpage) is public and has Issues enabled. `distribution.json` already points app downloads, shared content and suggestions to this repository. Recipients do not need credentials to download public releases. No separate distribution token is needed for this setup.

Keep this configuration for the simplest setup. No release or Actions workflow was present on GitHub when checked; the implementation is currently in your local project and must be pushed before the steps below are available.

**Optional: use a separate distribution repository later.** If you prefer to keep the source private, create a public repository for downloads and proposals with a README and Issues enabled. In `distribution.json`, change all three values to that public `OWNER/REPOSITORY`. This configuration is the only place to set the repositories; the installer builder uses it too. Rebuild the installer after changing it.

The public distribution repository will contain shared topic data, figures, installers and submitted proposals. Making only the source private does not make the distributed content private. Never put personal backups or signing credentials in either repository.

Only when using a separate distribution repository, the workflows in your source repository need permission to create releases there. Create a fine-grained GitHub token limited to that distribution repository, with **Contents: read and write** and **Issues: read**, and add it as the source repository's Actions secret **DISTRIBUTION_TOKEN**. GitHub's normal workflow token is used for branches and pull requests in the source repository. No token is built into the application or sent to recipients.

Keep the configured distribution repository under your control. Do not rename/delete it after distributing the app without first planning a migration for installed clients.

### 2. Push the project changes

Commit and push the updated source, `.github/`, `desktop/`, `lib/`, `scripts/`, `build/` icons, `distribution.json`, package files, and documentation. `release/`, `dist/`, personal edits, downloaded content snapshots and backups are intentionally ignored.

In a PowerShell terminal, from this project:

```powershell
Set-Location D:\org-webpage
git diff --stat
git status --short
git add .
git commit -m "Add desktop distribution, content updates and reviewed suggestions"
git push origin main
```

Review the listed files before committing. The installer itself is uploaded by the release workflow, not committed to Git.

In GitHub, open **Settings → Actions → General** and allow the workflows to run. To use the suggestion-to-pull-request workflow, also enable **Allow GitHub Actions to create and approve pull requests** where available. The workflow creates review requests; it does not approve or merge them.

### 3. Set up signing before broad distribution

The Windows installer built in this session is **unsigned**. It is suitable for controlled testing but may display security warnings. The smoothest experience requires a signing identity. macOS requires Developer ID signing and notarization for normal direct distribution; its automatic update mechanism requires a signed app.

The workflow supports these Actions secrets:

| Platform | Secrets |
|---|---|
| Windows certificate signing | `WIN_CSC_LINK` (base64 certificate/PFX), `WIN_CSC_KEY_PASSWORD` |
| Mac signing | `CSC_LINK` (base64 Developer ID certificate/P12), `CSC_KEY_PASSWORD` |
| Mac notarization | `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` |

Windows signing providers that require a hardware device or cloud signing service need an additional provider-specific setup; the supplied workflow's Windows path is for certificate-based signing. Do not paste credentials into code, issues, chat, or tracked files. Add them through GitHub's secret settings.

Without these secrets, the workflows can produce testing builds, but that is not the final smooth installation experience for ordinary recipients. Use a consistent signing identity across updates. See the official [Electron signing guide](https://www.electronjs.org/docs/latest/tutorial/code-signing) and [electron-builder update guide](https://www.electron.build/v26/docs/features/auto-update/).

### 4. Build and publish the first app release

1. On GitHub, choose **Actions → Build desktop installers → Run workflow**.
2. Wait for Windows and Mac builds to finish. A draft release is created in the configured release repository.
3. Test the installers on Windows and Mac. Confirm that a test profile retains its notes after replacing the app with a newer version.
4. Review the release notes and signing status, then publish the draft. Mark an **app** release as **Latest**.
5. Share the release page. Windows users choose the `.exe`; Mac users choose the `.dmg` and drag the app into Applications. Leave `.zip`, `.yml` and `.blockmap` assets in the release: the updater needs them.

The Mac `.dmg` is universal, so users do not need to identify their processor. The Windows installer currently targets x64. It installs per user and does not request an administrator install.

Re-running the same workflow version will not overwrite an existing release. Inspect or remove your own incomplete draft, or bump the version before rerunning. Do not silently replace a published version.

## Your normal workflow after installation

### Change the application

Make the code changes, run checks, and bump `package.json` to the next semantic version, for example `1.1.1`. Refresh the lockfile with `npm install --package-lock-only`, commit/push, run **Build desktop installers**, test and publish the draft as Latest.

Installed copies can then offer the update. **Pushing a commit alone does not update installed apps.** App versions use tags such as `v1.1.1`.

### Correct topic descriptions or names

The shared files are `data/topics.json`, `data/relationships.json`, `data/relationship-analysis.json` and `data/relationship-matrix.json`. App edits in `edits.json` are personal and do not automatically modify these shared files.

If accepting a proposal, use the workflow below to prepare consistent revisions and hashes. Otherwise update the canonical dataset and review affected relationships. Content validation will reject mismatched topic hashes, incomplete edges, missing figures, or a matrix that disagrees with the edge list.

Increment the integer `version` in `data/content-version.json` and write clear release notes in its `notes` field. Keep `min_app_version` at `1.1.0` unless the content requires a newer app format. Run **Build shared content release** on GitHub. Review and publish its draft as **not Latest**. Content tags are `content-v1`, `content-v2`, etc.; app tags are `v1.1.0`, `v1.1.1`, etc.

Users can now download only the new content. The app receives the topic file, complete relationships, explanations, matrix, source map and figures as one validated package. It checks checksums and cross-file consistency before making it active. Earlier files remain intact if checking or download fails.

### Review a user's proposed correction

1. Read the issue in the suggestions repository. The app includes before/after values and a machine-readable proposal block. It never includes the separate personal-notes field.
2. Decide whether you agree. Nothing changes for other users at this stage.
3. Check whether the existing relationship weights still make sense. A wording correction may leave them valid; a change in meaning may require re-scoring first.
4. If weights remain valid, run **Actions → Prepare a topic suggestion for review** in the source repository. Enter the issue number and explicitly check the weights-reviewed box.
5. The workflow reads only the structured proposal, validates it against the current topic, updates revisions/hashes, bumps the content version and opens a pull request. It does not execute instructions from issue text and does not merge or publish anything.
6. Review the pull request and edit it if needed. Merge when satisfied. Run **Build shared content release** and publish the resulting content draft as not Latest.

If the topic has changed since the suggestion was made, the automated workflow stops instead of applying outdated text. Compare it manually or request a fresh proposal.

The local alternative is to save the proposal JSON and run:

```sh
npm run proposal:apply -- path/to/proposal.json
```

That command only previews. After reviewing the proposal and confirming existing weights remain valid:

```sh
npm run proposal:apply -- path/to/proposal.json --apply --weights-reviewed
```

Then increment the content version yourself, build/validate the content package, review Git changes and publish. The command makes local canonical-file backups in `.maintainer-backups/`. It preserves the current numeric weights; it does not perform a new semantic assessment for you.

## What your users need to know

They can read and edit entirely offline. Internet is needed only for checking/downloading updates and opening GitHub suggestions. A GitHub account is needed to submit a suggestion, but not to download public releases or content updates.

Their edits are private by default. To suggest a correction, they edit and save a node, choose **Foreslå endring til felles kart**, select fields, review the proposal, then finish submitting it on GitHub. For a long proposal, the app offers to copy the text so they can paste it into the issue. The app never claims an issue was sent merely because the browser opened.

If a shared update and their own edit change the same field, they choose **Min tekst** or **Ny felles tekst**. Their separate notes survive either choice. Lists such as key points are compared as a complete field, not line by line. Notes for removed topics stay available under the update/backup panel as archived topics.

Each person has an independent local copy. Suggestions are reviewed contributions, not real-time collaborative editing. Exporting a personal backup includes private notes, so users should only share that file intentionally.

## Storage and recovery

### Windows reports "cannot be closed" or "error writing to file"

Check free disk space before retrying. The older 1.1.0 installer also used "cannot be closed" for file-copy failures caused by a full drive. It can leave incomplete files even when no Sammenheng process is running. The temporary-files drive (usually C:) needs room for the compressed package and an expanded copy, in addition to the final installation. Free about 2 GB on that drive and the installation drive, then run the installer again. Saved notes live separately from the program files.

Starting with 1.1.1, the installer checks available space before it removes or replaces an existing app. Release builds also test an actual Windows installation, replacement while the app is running, note persistence and uninstall. The Mac build runs a separate packaged-app launch test; it does not use the Windows installer.

The desktop app stores its profile in the operating system's per-user app-data directory, under `Sammenheng/profile` (normally `%APPDATA%/Sammenheng/profile` on Windows and `~/Library/Application Support/Sammenheng/profile` on Mac). The development/browser version uses the project `data/` folder.

`edits.json` contains personal edits, baseline information and the active content snapshot pointer. It is committed by atomic file replacement, so a content update and its resolved personal edits become active together. `.content/` stores complete content snapshots. `backups/` keeps the most recent 20 prior state files. Do not manually delete snapshot folders that a state file references.

Application upgrades do not overwrite this profile. The updater does not treat an app's newer bundled content as permission to discard personal work: it remains a content update to preview and apply. A personal export/import transfers notes between installations. Browser users moving to the desktop app should export from the browser page and import in the desktop app.

## Validation and limits

The local checks cover graph controls, update package consistency, three-way merging, stale preview rejection, backup conflicts, persistence, private-note exclusion, the GitHub draft workflow and the sandboxed desktop renderer. Desktop update UI states are exercised with simulated updater events. A real signed update download/install across published versions and Mac installation cannot be confirmed until those releases and signing credentials exist.

```sh
npm ci
npm run build
npm test
npm run test:browser
npm run test:sync-browser
npm run test:desktop
npm run content:build
npm run desktop:dist -- --win
node tests/desktop.mjs --packaged
```

The browser tests currently use Microsoft Edge on Windows. The desktop test can launch the development app on either platform; the `--packaged` test path is Windows-specific. Test data is isolated from personal profiles.

For enrollment and verification steps, see [Signing setup](SIGNING-SETUP.md). Version 1.3.0 remains unsigned until verified signing identities are configured.
