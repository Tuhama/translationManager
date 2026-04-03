const axios = require('axios');

/**
 * Service for interacting with Google Cloud Translation API.
 */
class GoogleTranslator {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://translation.googleapis.com/language/translate/v2';
    }

    /**
     * Translates text or an array of texts.
     * @param {string|string[]} text - Text(s) to translate
     * @param {string} targetLang - Target language code (e.g. 'fr')
     * @param {string} sourceLang - Source language code (e.g. 'en')
     */
    async translate(text, targetLang, sourceLang = 'en') {
        if (!this.apiKey) {
            throw new Error('Google Translate API Key is missing. Please add it in Settings.');
        }

        if (!text || (Array.isArray(text) && text.length === 0)) {
            return text;
        }

        try {
            const response = await axios.post(
                `${this.baseUrl}?key=${this.apiKey}`,
                {
                    q: text,
                    target: targetLang,
                    source: sourceLang,
                    format: 'text'
                }
            );

            const translations = response.data.data.translations;
            
            if (Array.isArray(text)) {
                return translations.map(t => t.translatedText);
            }
            return translations[0].translatedText;
        } catch (error) {
            const message = error.response?.data?.error?.message || error.message;
            throw new Error(`Google Translate Error: ${message}`);
        }
    }
}

module.exports = GoogleTranslator;
