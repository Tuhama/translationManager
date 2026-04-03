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
  static async saveTranslation(key, values) {
    const res = await fetch('/api/translations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, values })
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
   * Normalizes translation files.
   */
  static async normalize() {
    const res = await fetch('/api/normalize', { method: 'POST' });
    if (!res.ok) throw new Error('Normalization failed');
    return await res.json();
  }
}

export default TranslationService;
