const { TranslationServiceClient } = require('@google-cloud/translate');

/**
 * Service for interacting with Google Cloud Translation API v3.
 */
class GoogleTranslator {
    constructor(config) {
        // Support both old API key format and new v3 config
        if (typeof config === 'string') {
            // Legacy API key - throw error to guide migration
            throw new Error('Google Translate API v2 is deprecated. Please update your configuration to use v3 with projectId and keyFilename.');
        }

        this.projectId = config.projectId;
        this.keyFilename = config.keyFilename;

        if (!this.projectId) {
            throw new Error('Google Cloud Project ID is required for Translate API v3. Please add it in Settings.');
        }

        // Initialize the translate client
        const clientConfig = { projectId: this.projectId };
        if (this.keyFilename) {
            clientConfig.keyFilename = this.keyFilename;
        }

        this.client = new TranslationServiceClient(clientConfig);
    }

    /**
     * Translates text or an array of texts.
     * @param {string|string[]} text - Text(s) to translate
     * @param {string} targetLang - Target language code (e.g. 'fr')
     * @param {string} sourceLang - Source language code (e.g. 'en')
     */
    async translate(text, targetLang, sourceLang = 'en') {
        if (!this.projectId) {
            throw new Error('Google Cloud Project ID is missing. Please add it in Settings.');
        }

        if (!text || (Array.isArray(text) && text.length === 0)) {
            return text;
        }

        try {
            const location = 'global';
            const request = {
                parent: `projects/${this.projectId}/locations/${location}`,
                contents: Array.isArray(text) ? text : [text],
                mimeType: 'text/plain',
                sourceLanguageCode: sourceLang,
                targetLanguageCode: targetLang,
            };

            const [response] = await this.client.translateText(request);
            const translations = response.translations.map(t => t.translatedText);

            if (Array.isArray(text)) {
                return translations;
            }
            return translations[0];
        } catch (error) {
            const message = error.message || 'Unknown translation error';
            throw new Error(`Google Translate Error: ${message}`);
        }
    }
}

module.exports = GoogleTranslator;
