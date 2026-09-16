lsco# Usage Widget

A tray/menu-bar widget that shows your AI usage limits at a glance. Starting
with Claude: hover the tray icon for a quick session/weekly percentage, or
click it for a small popover with progress bars and reset countdowns.

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
npm run dist      # builds an installer via electron-builder for your current OS
```

## Roadmap

- [x] Tray tooltip + popover with Claude session/weekly usage
- [ ] Auto-launch at login
- [ ] Animated avatar that reacts while Claude is actively working
- [ ] Support for other AI tools beyond Claude
