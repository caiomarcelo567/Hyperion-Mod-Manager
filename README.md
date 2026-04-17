# Hyperion

<p align="center">
  <img src="src/main/resources/hyperion-logo.svg" alt="Hyperion logo" width="520" />
</p>

<p align="center">
  A desktop mod manager for Cyberpunk 2077 built with Electron, React, TypeScript, and a sharp industrial UI.
</p>

## Overview

Hyperion is focused on a fast day-to-day workflow for Cyberpunk 2077 mod management:

- first-run path setup
- installed mod library browsing
- download inspection and install/reinstall flows
- launch-game shortcut
- GitHub-based self-update flow

The current UI direction is dark, precise, and information-dense. The app avoids neon sci-fi clutter and keeps the Cyberpunk yellow accent disciplined and functional.

## Current Stack

- Electron for the desktop shell and main process
- React 18 + TypeScript for the renderer
- Zustand for app state
- Tailwind CSS for renderer styling
- electron-builder for Windows packaging
- electron-updater for GitHub release updates

## Main Features

- Detect and store the Cyberpunk 2077 install path
- Manage a dedicated mod library folder
- Inspect archives from a downloads directory
- Install mods from archives and reuse original install sources for reinstalls
- Restore previously enabled mods after rescans
- Launch the game directly from the app
- Show in-app update availability and download status

## Development

Install dependencies:

```bash
npm ci
```

Run the app in development:

```bash
npm run dev
```

Build the app bundles:

```bash
npm run build
```

Preview unpacked Windows output:

```bash
npm run preview:win
```

## Packaging

Build the local NSIS installer:

```bash
npm run dist
```

Important behavior:

- `npm run dist` cleans the `dist` folder before packaging
- the installer version always comes from `package.json`
- local packaging generates `latest.yml`, installer `.exe`, and `.blockmap`
- local packaging does not publish release artifacts to GitHub

## Release Flow

Hyperion uses GitHub Releases for auto-update distribution.

Recommended release flow:

```bash
npm run release:patch
git push origin main
```

What happens next:

1. `package.json` version is bumped
2. the push triggers `.github/workflows/release.yml`
3. GitHub Actions builds the installer
4. the workflow creates or updates the GitHub Release for `vX.Y.Z`
5. the release uploads:
   - `Hyperion-X.Y.Z.exe`
   - `Hyperion-X.Y.Z.exe.blockmap`
   - `latest.yml`

## Auto Update Notes

The updater is configured against the GitHub repository release feed.

- the installed app version comes from `package.json`
- `latest.yml` is the primary metadata file used to detect a newer version
- the `.exe` is the installer payload
- the `.blockmap` supports differential update downloads when applicable

To test whether an update applied successfully, open Configuration inside the app and check the discreet version label shown there.

## Design Reference

The canonical UI reference is in [DESIGN.md](DESIGN.md).

If you change the renderer UI:

- update the implementation first
- update [DESIGN.md](DESIGN.md) in the same task if behavior or visuals changed
- for bigger visual explorations, prototype direction in Google Stitch before implementation

## Repository Files

- [CLAUDE.md](CLAUDE.md): project instructions for coding agents and future AI sessions
- [DESIGN.md](DESIGN.md): current visual and interaction specification
- [.github/workflows/release.yml](.github/workflows/release.yml): release automation