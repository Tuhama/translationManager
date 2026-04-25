# Translation Manager UI 🌍

A modern, web-based interface for managing i18n translation files in React and other JavaScript projects. Now with **AI-Friendly** features and an **AI Skill File** to make localization faster and more accurate.

> [!TIP]
> This project is **AI-Ready**. AI agents can use the included `translations.skill` to automatically audit and manage your translations.

## Features
- **Modern UI**: Dark mode, glassmorphism, and smooth animations.
- **AI-Powered Translation**: Support for **OpenAI (GPT-4o)**, **Google Gemini**, and Google Cloud Translate.
- **Context-Aware Scanning**: Extracts code snippets where translation keys are used, providing crucial context for AI translations.
- **Missing Keys Detection**: Identifies translation keys used in source code but missing from files.
- **Cleanup Tool**: Detects and batch-removes unused translation keys.
- **Normalization**: Synchronizes keys across all languages and sorts them alphabetically with one click.
- **Export/Import**: Export all missing translations to an **AI-Friendly** JSON file (including code context) for external translation.
- **CLI Status**: Machine-readable JSON output for project health monitoring.
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

### 🤖 AI-Friendly Localization
The manager now extracts the **surrounding code** for every translation key it finds. This context is passed to AI models (like OpenAI or Gemini) to ensure highly accurate translations that respect your code's intent.

### 📤📥 Export/Import (AI-Enhanced)
You can export all missing translation keys to a single JSON file. This export is **AI-Ready**, containing code snippets for each key so you can feed it to an LLM for context-aware translations.

### 📊 CLI Status
Check your translation coverage programmatically:
```bash
npx @tuhama/translation-manager status
```
Outputs a machine-readable JSON summary of missing keys, coverage percentage, and project health.

### ⚠️ Missing Keys Detection
The application automatically scans your source code for translation keys used (e.g., `t('key.name')`) but missing from your translation files. Click the "**Missing**" button in the sidebar to review and create them instantly.

### 🪄 Auto-Translation
Configure Google Cloud, OpenAI, or Gemini in the settings to enable auto-translation. Use the "**Source-to-All**" button in the editor to quickly populate all languages.

## Configuration
You can optionally create a `translation.config.json` in your project root:

### Using OpenAI (Recommended for AI Quality)
```json
{
  "path": "src/locales",
  "aiTranslate": {
    "provider": "openai",
    "apiKey": "your-openai-api-key",
    "model": "gpt-4o"
  }
}
```

### Using Google Cloud Translate
```json
{
  "path": "src/locales",
  "googleTranslate": {
    "projectId": "your-google-cloud-project-id"
  }
}
```

## Development
To work on this repo:
1. `npm install`
2. `cd web && npm install`
3. `npm run dev` (starts both the API and the Vite UI)

## Limitations
- **Dynamic Keys**: Highly dynamic keys (e.g. `t(someVar + '.key')`) may not be detected by the "Missing Keys" tool.
- **Namespaces**: Currently optimized for single-namespace or default-namespace projects.

## License
MIT © [Tuhama](mailto:tuhama.gh.qlyshi@gmail.com)
