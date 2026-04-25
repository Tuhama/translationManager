/**
 * Service for interacting with AI-based Translation APIs (OpenAI, Gemini, etc.)
 * This service is "context-aware" and uses extracted code snippets to improve translation quality.
 */
class AITranslator {
    constructor(config) {
        this.provider = config.provider || 'openai'; // 'openai' or 'gemini'
        this.apiKey = config.apiKey;
        this.model = config.model || (this.provider === 'openai' ? 'gpt-4o' : 'gemini-1.5-flash');

        if (!this.apiKey) {
            throw new Error(`API Key is required for ${this.provider} translation.`);
        }
    }

    /**
     * Translates text with optional context.
     * @param {string|string[]} text - Text(s) to translate
     * @param {string} targetLang - Target language code
     * @param {string} sourceLang - Source language code
     * @param {Object} context - Optional context mapping keys to snippets
     */
    async translate(text, targetLang, sourceLang = 'en', context = {}) {
        if (!text || (Array.isArray(text) && text.length === 0)) {
            return text;
        }

        const isArray = Array.isArray(text);
        const textsToTranslate = isArray ? text : [text];

        // Prepare the prompt
        let prompt = `Translate the following ${sourceLang} strings to ${targetLang}. 
Return only a JSON object where keys are the original strings and values are the translations.
Maintain any placeholders like {name} or {{count}}.

Strings to translate:
${textsToTranslate.map(t => `- "${t}"`).join('\n')}
`;

        // Add context if available
        const contextEntries = Object.entries(context);
        if (contextEntries.length > 0) {
            prompt += `\nContext for some strings:\n`;
            contextEntries.forEach(([key, occs]) => {
                const snippets = occs.map(o => o.snippet).join('\n---\n');
                prompt += `Key "${key}": used in these code locations:\n${snippets}\n`;
            });
        }

        try {
            const result = await this._callAI(prompt);
            const translationsMap = JSON.parse(result);

            if (isArray) {
                return textsToTranslate.map(t => translationsMap[t] || t);
            }
            return translationsMap[textsToTranslate[0]] || textsToTranslate[0];
        } catch (error) {
            throw new Error(`AI Translation Error (${this.provider}): ${error.message}`);
        }
    }

    async _callAI(prompt) {
        if (this.provider === 'openai') {
            return await this._callOpenAI(prompt);
        } else if (this.provider === 'gemini') {
            return await this._callGemini(prompt);
        }
        throw new Error(`Unsupported AI provider: ${this.provider}`);
    }

    async _callOpenAI(prompt) {
        // We'll use fetch to avoid adding heavy dependencies like 'openai' package
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: 'system', content: 'You are a professional translator for software applications.' },
                    { role: 'user', content: prompt }
                ],
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `OpenAI API returned status ${response.status}`);
        }

        const data = await response.json();
        if (!data.choices || data.choices.length === 0) {
            throw new Error('OpenAI API returned no results');
        }
        return data.choices[0].message.content;
    }

    async _callGemini(prompt) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: 'application/json' }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `Gemini API returned status ${response.status}`);
        }

        const data = await response.json();
        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content?.parts?.length) {
            throw new Error('Gemini API returned no results');
        }
        return data.candidates[0].content.parts[0].text;
    }
}

module.exports = AITranslator;
