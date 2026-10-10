/**
 * Service for translation API calls.
 */
class TranslationService {
  /**
   * Fetches translation data.
   */
  static async fetchTranslations() {
    const res = await fetch('/api/translations');
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch translations');
    }
    return await res.json();
  }

  /**
   * Saves a translation.
   */
  static async saveTranslation(key, values, format = true) {
    const res = await fetch('/api/translations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, values, format })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Save failed');
    }
    return await res.json();
  }

  /**
   * Deletes a translation.
   */
  static async deleteTranslation(key) {
    const res = await fetch('/api/translations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Delete failed');
    }
    return await res.json();
  }

  /**
   * Deletes multiple translations.
   */
  static async deleteMultiple(keys) {
    const res = await fetch('/api/delete-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Batch delete failed');
    }
    return await res.json();
  }

  /**
   * Saves bulk translations.
   */
  /**
   * Creates a locale file and translates every string from the source language.
   */
  static async addLanguage(targetLang, sourceLang) {
    const res = await fetch('/api/languages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetLang, sourceLang })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to add language');
    }
    return await res.json();
  }

  static async saveBulkTranslations(data, format = true) {
    const res = await fetch('/api/bulk-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, format })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Bulk save failed');
    }
    return await res.json();
  }

  /**
   * Normalizes translation files.
   */
  static async normalize() {
    const res = await fetch('/api/normalize', { method: 'POST' });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Normalization failed');
    }
    return await res.json();
  }

  /**
   * Exports all translation keys for all languages
   */
  static async exportMissingKeys() {
    const res = await fetch('/api/export-missing');
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Export failed');
    }

    // Trigger download
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

  /**
   * Gets preview of all translations export
   */
  static async getExportPreview() {
    const res = await fetch('/api/export-missing/preview');
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to get export preview');
    }
    return await res.json();
  }

  /**
   * Imports translated keys
   */
  static async importTranslations(data, options = {}) {
    const res = await fetch('/api/import-translations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, options })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Import failed');
    }
    return await res.json();
  }
}

export default TranslationService;
