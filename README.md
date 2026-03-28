# Translation Manager UI 🌍

A modern, web-based interface for managing i18n translation files in React and other JavaScript projects.

## Features
- **Modern UI**: Dark mode, glassmorphism, and smooth animations.
- **Nested Keys**: Supports dot-notation for nested JSON structures.
- **Tree View**: Easy navigation and deletion of translation keys.
- **Auto-population**: Automatically populates existing values when entering an existing key.
- **Zero Config**: Auto-detects common locales folders.

## Installation
Add it as a devDependency to your project:
```bash
npm install -g @tuhama/translation-manager
```
Or run directly with npx:
```bash
npx @tuhama/translation-manager
```

## Configuration
You can optionally create a `translation.config.json` in your project root:
```json
{
  "path": "src/locales",
  "port": 5000
}
```

## Development
To work on this repo:
1. `npm install`
2. `cd web && npm install`
3. `npm run dev` (starts both the API and the Vite UI)
