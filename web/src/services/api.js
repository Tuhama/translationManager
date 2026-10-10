/**
 * Service for translation API calls.
 */
class TranslationService {
  static async request(url, options = {}) {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || options.errorMessage || 'Request failed');
    }
    return data;
  }

  static async fetchTranslations() {
    return TranslationService.request('/api/translations', { errorMessage: 'Failed to fetch translations' });
  }

  static async saveTranslation(key, values, format = true) {
    return TranslationService.request('/api/translations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, values, format }),
      errorMessage: 'Save failed'
    });
  }

  static async deleteTranslation(key) {
    return TranslationService.request('/api/translations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
      errorMessage: 'Delete failed'
    });
  }

  static async deleteMultiple(keys) {
    return TranslationService.request('/api/delete-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys }),
      errorMessage: 'Batch delete failed'
    });
  }

  static async addLanguage(targetLang, sourceLang) {
    return TranslationService.request('/api/languages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetLang, sourceLang }),
      errorMessage: 'Failed to add language'
    });
  }

  static async saveBulkTranslations(data, format = true) {
    return TranslationService.request('/api/bulk-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, format }),
      errorMessage: 'Bulk save failed'
    });
  }

  static async normalize() {
    return TranslationService.request('/api/normalize', {
      method: 'POST',
      errorMessage: 'Normalization failed'
    });
  }

  static async translate(text, targetLang, sourceLang, key) {
    return TranslationService.request('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang, sourceLang, key }),
      errorMessage: 'Translation failed'
    });
  }

  static async scanBulkTranslate(sourceLang) {
    return TranslationService.request(`/api/bulk-translate/scan?sourceLang=${encodeURIComponent(sourceLang)}`, {
      errorMessage: 'Failed to scan missing translations.'
    });
  }

  static async executeBulkTranslate(sourceLang) {
    return TranslationService.request('/api/bulk-translate/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceLang }),
      errorMessage: 'Translation failed.'
    });
  }

  static async getConfig() {
    return TranslationService.request('/api/config', { errorMessage: 'Failed to fetch config' });
  }

  static async saveSettings(settings) {
    return TranslationService.request('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
      errorMessage: 'Failed to save settings'
    });
  }

  static async exportMissingKeys() {
    const res = await fetch('/api/export-missing');
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Export failed');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `missing-keys-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return true;
  }

  static async getExportPreview() {
    return TranslationService.request('/api/export-missing/preview', {
      errorMessage: 'Failed to get export preview'
    });
  }

  static async importTranslations(data, options = {}) {
    return TranslationService.request('/api/import-translations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, options }),
      errorMessage: 'Import failed'
    });
  }
}

export default TranslationService;
