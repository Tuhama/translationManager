# Translation Manager UI 🌍

A modern, web-based interface for managing i18n translation files in React and other JavaScript projects. Now with **AI-Friendly** features and an **AI Skill File** to make localization faster and more accurate.

> [!TIP]
> This project is **AI-Ready**. AI agents can use the included `translations.skill` to automatically audit and manage your translations.

## Features

- **Modern UI**: Dark mode, glassmorphism, and smooth animations.
- **AI-Powered Translation**: OpenAI, Google Gemini, Groq’s free tier, local Ollama and LM Studio, any OpenAI-compatible server, and Google Cloud Translate.
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

Add it as a devDependency to your project:

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
- When scanning source code, `useTranslation('auth')` will correctly map relative keys to the `auth` namespace.

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
