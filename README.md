# Translation Manager UI 🌍

A modern, web-based interface for managing i18n translation files in React and other JavaScript projects. Now with **AI-Friendly** features and an **AI Skill File** to make localization faster and more accurate.

> [!TIP]
> This project is **AI-Ready**. AI agents can use the included `translations.skill` to automatically audit and manage your translations.

## Features

- **Modern UI**: Dark mode, glassmorphism, and smooth animations.
- **AI-Powered Translation**: OpenAI, Google Gemini, Groq’s free tier, local Ollama and LM Studio, any OpenAI-compatible server, and Google Cloud Translate.
- **Add Language**: Create a new locale (flat file or namespace folder) and translate every string from a source language in one step.
- **Auto-Translate Wizard**: Scan missing values, generate translations, review them, then save in bulk.
- **Context-Aware Scanning**: Extracts code snippets where translation keys are used, providing crucial context for AI translations.
- **Missing Keys Detection**: Identifies translation keys used in source code but missing from files.
- **Cleanup Tool**: Detects and batch-removes unused translation keys.
- **Normalization**: Synchronizes keys across all languages and sorts them alphabetically with one click.
- **External Namespaces**: Support for directory-based translation storage (e.g., `en/common.json`, `en/auth.json`).
- **Multiple Namespace Scanning**: Automatically detects multiple `useTranslation` hooks and array-based namespace definitions in a single file.
- **Deep Nesting**: Supports deep-nested directory structures for complex projects.
- **Export/Import**: Export all missing translations to an **AI-Friendly** JSON file (including code context) for external translation.
- **CLI Status**: Machine-readable JSON output for project health monitoring.
- **Tree View**: Easy navigation and management of translation keys.
- **Zero Config**: Auto-detects common locales folders.

## Installation

Install globally, or add it as a devDependency (`npm install -D @tuhama/translation-manager`):

```bash
npm install -g @tuhama/translation-manager
```

Or run directly with npx:

```bash
npx @tuhama/translation-manager
```

## Usage

### 📂 External Namespaces (Directory-based)

Translation Manager now supports both flat JSON files (e.g., `en.json`) and directory-based namespaces. This is ideal for large projects where you want to split translations into logical modules.

**How it works:**

- If a folder named `en` exists in your locales directory, the manager will read all `.json` files inside it as namespaces.
- Nested folders are also supported (e.g., `en/auth/errors.json` -> `en.auth.errors`).
- Adding a language copies that layout: a namespaced project gets `de/common.json`, not a mixed `de.json`.
- When scanning source code, `useTranslation('auth')` will correctly map relative keys to the `auth` namespace.

### 🤖 AI-Friendly Localization

The manager now extracts the **surrounding code** for every translation key it finds. This context is passed to AI models (like OpenAI or Gemini) to ensure highly accurate translations that respect your code's intent.

### 📤📥 Export/Import (AI-Enhanced)

You can export all missing translation keys to a single JSON file. The download includes `exportData`, `context` (file, line, snippet), and `metadata`. Import accepts that same file or a bare `{ "key": { "fr": "..." } }` object.

### 📊 CLI Status

Check your translation coverage programmatically:

```bash
npx @tuhama/translation-manager status
```

Outputs a machine-readable JSON summary of missing keys, coverage percentage, and project health.

### ⚠️ Missing Keys Detection

The application automatically scans your source code for translation keys used (e.g., `t('key.name')`) but missing from your translation files. Click the **Missing Keys** badge in the header to review and create them instantly.

### 🌐 Add Language

Use **Tools → Add Language** to create a new locale (for example `de`, `DE`, or `pt-BR`) and fill it from an existing source language. Codes are normalized (`DE` → `de`, `pt-br` → `pt-BR`). Every non-empty string is translated with the configured provider; nested objects and namespace folders are preserved.

This requires a usable AI provider or Google Cloud Translate in settings. An incomplete AI block falls through to Google Cloud when that is configured. Duplicate codes are rejected.

```http
POST /api/languages
Content-Type: application/json

{ "targetLang": "de", "sourceLang": "en" }
```

The response includes `{ "language": "de", "translated": 42, "sourceLang": "en" }`.

### 🪄 Auto-Translation

Configure an AI provider or Google Cloud Translate in settings. Then:

- **Tools → Auto-Translate**: scan missing keys from a source language, generate translations, review the preview, and approve the save.
- **Source-to-All** in the editor: fill every other language for the key you are editing.

Bulk translate APIs:

```http
GET  /api/bulk-translate/scan?sourceLang=en
POST /api/bulk-translate/execute
{ "sourceLang": "en" }
POST /api/bulk-save
{ "data": { "de": { "hello": "Hallo" } }, "format": true }
```

## Configuration

You can optionally create a `translation.config.json` in your project root:

The UI listens on `127.0.0.1` only. Pass `--host` if you intentionally want another interface. API keys saved in settings are written to `translation.config.json` and are not returned to the browser. Prefer `TRANSLATION_MANAGER_API_KEY` in the environment, and do not commit a file that contains a real key.

### Using OpenAI

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

### Using Gemini

```json
{
  "path": "src/locales",
  "aiTranslate": {
    "provider": "gemini",
    "apiKey": "your-gemini-api-key",
    "model": "gemini-3.8-flash"
  }
}
```

### Using a local or free model

Ollama and LM Studio run on your machine and do not need an API key. Groq has a free developer tier. Any other OpenAI-compatible server can be set as `custom`.

```json
{
  "path": "src/locales",
  "aiTranslate": {
    "provider": "ollama",
    "model": "llama3.2",
    "baseUrl": "http://127.0.0.1:11434/v1"
  }
}
```

`provider` may be `openai`, `gemini`, `ollama`, `lmstudio`, `groq`, or `custom`. Leave `model` or `baseUrl` empty to use that provider’s default.

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

## License

MIT © [Tuhama](mailto:tuhama.gh.qlyshi@gmail.com)
