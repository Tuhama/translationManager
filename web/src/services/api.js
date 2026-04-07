/**
 * Service for translation API calls.
 */
class TranslationService {
  /**
   * Fetches translation data.
   */
  static async fetchTranslations() {
    const res = await fetch('/api/translations');
    if (!res.ok) throw new Error('Failed to fetch translations');
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
    if (!res.ok) throw new Error('Save failed');
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
    if (!res.ok) throw new Error('Delete failed');
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
    if (!res.ok) throw new Error('Batch delete failed');
    return await res.json();
  }

  /**
   * Saves bulk translations.
   */
  static async saveBulkTranslations(data, format = true) {
    const res = await fetch('/api/bulk-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, format })
    });
    if (!res.ok) throw new Error('Bulk save failed');
    return await res.json();
  }

  /**
   * Normalizes translation files.
   */
  static async normalize() {
    const res = await fetch('/api/normalize', { method: 'POST' });
    if (!res.ok) throw new Error('Normalization failed');
    return await res.json();
  }

  /**
   * Exports missing translation keys
   */
  static async exportMissingKeys(sourceLang = 'en') {
    const res = await fetch(`/api/export-missing?sourceLang=${sourceLang}`);
    if (!res.ok) throw new Error('Export failed');

    // Trigger download
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `missing-translations-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return true;
  }

  /**
   * Gets preview of missing keys export
   */
  static async getExportPreview(sourceLang = 'en') {
    const res = await fetch(`/api/export-missing/preview?sourceLang=${sourceLang}`);
    if (!res.ok) throw new Error('Failed to get export preview');
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
    if (!res.ok) throw new Error('Import failed');
    return await res.json();
  }
}

export default TranslationService;
