# Translation Manager UI 🌍

A modern, web-based interface for managing i18n translation files in React and other JavaScript projects.

## Features
- **Modern UI**: Dark mode, glassmorphism, and smooth animations.
- **Auto-Translation**: Integrated Google Translate support for single-key and bulk translations.
- **Missing Keys Detection**: Identifies translation keys used in source code but missing from files.
- **Cleanup Tool**: Detects and batch-removes unused translation keys.
- **Normalization**: Synchronizes keys across all languages and sorts them alphabetically with one click.
- **Nested Keys**: Supports dot-notation for nested JSON structures.
- **Tree View**: Easy navigation and management of translation keys.
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

## Usage

### ⚠️ Missing Keys Detection
The application automatically scans your source code for translation keys used (e.g., `t('key.name')`) but missing from your translation files. Click the "**Missing**" button in the sidebar to review and create them instantly.

### 🧹 Cleaning Unused Keys
Over time, some translation keys might become obsolete. Use the "**Clean**" button to identify and batch-delete keys that are no longer referenced in your source code.

### 🪄 Auto-Translation
Specify a Google Translate API Key in the settings to enable auto-translation. Use the "**Source-to-All**" button in the editor to quickly populate all languages from a single source translation.

### 🪄 Normalization
To keep your translation files organized, use the "**Normalize**" button to synchronize keys across all files and sort them alphabetically.

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

## Limitations
- **Dynamic Keys**: The scanner uses regex to find translation keys. Highly dynamic keys (e.g. `t(someVar + '.key')` or `t(dynamicValue)`) may not be detected by the "Missing Keys" or "Unused Keys" tools.
- **Namespaces**: Currently optimized for single-namespace or default-namespace projects.

## License
MIT © [Tuhama](mailto:tuhama.gh.qlyshi@gmail.com)
