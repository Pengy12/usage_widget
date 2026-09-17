# Usage Widget

A tray/menu-bar widget that shows your AI usage limits at a glance. Starting
with Claude: hover the tray icon for a quick session/weekly percentage, or
click it for a small popover with progress bars and reset countdowns.

## Download

Grab the latest build for your OS — no Node.js or build tools required, just
download and run:

- [Windows](https://github.com/Pengy12/usage_widget/releases/latest/download/UsageWidget-win.exe)
- [macOS](https://github.com/Pengy12/usage_widget/releases/latest/download/UsageWidget-mac.dmg)
- [Linux (AppImage)](https://github.com/Pengy12/usage_widget/releases/latest/download/UsageWidget-linux.AppImage)

The app starts at login by default (Windows/macOS) and lives in the
tray/menu bar — no dock icon, no window to manage. Toggle "Start at Login"
from its right-click menu at any time.

macOS note: since builds aren't code-signed (no Apple Developer account),
Gatekeeper will flag it as from an unidentified developer the first time.
Right-click the app and choose "Open" instead of double-clicking to bypass
that warning once.

## How it gets Claude's numbers

Anthropic doesn't publish a public API for the session/weekly limits shown in
Claude.ai and Claude Code. This app reads the OAuth access token that Claude
Code already stores locally on your machine (macOS Keychain, or
`~/.claude/.credentials.json` on Linux/Windows) and calls the same
undocumented endpoint (`api.anthropic.com/api/oauth/usage`) the official apps
use. It's read-only and never writes or shares that token anywhere else. You
need to have logged into Claude Code (or Claude Desktop's CLI) at least once
for this to find a token.

Because it's an undocumented endpoint, field names and behavior could change
without notice.

## Development

```bash
npm install
npm start        # builds TypeScript and launches the Electron app
```

`npm run watch` recompiles on save; relaunch with `npx electron .` to pick up
changes.

## Packaging

```bash
npm run dist      # builds an installer via electron-builder for your current OS, local only
```

## Cutting a release

Pushing a version tag builds Windows/macOS/Linux installers on GitHub
Actions ([.github/workflows/release.yml](.github/workflows/release.yml)) and
publishes them to a GitHub Release automatically — that's what the Download
links above point to.

```bash
npm version patch   # bumps package.json's version and creates a matching git tag
git push --follow-tags
```

## Roadmap

- [x] Tray tooltip + popover with Claude session/weekly usage
- [x] Auto-launch at login (Windows/macOS — Linux needs a manual autostart entry)
- [ ] Animated avatar that reacts while Claude is actively working
- [ ] Support for other AI tools beyond Claude
