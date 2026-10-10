/**
 * Context-aware translation through OpenAI, Gemini, Groq, or a local
 * OpenAI-compatible server (Ollama, LM Studio, llama.cpp).
 */
class AITranslator {
    static PROVIDERS = {
        openai: {
            label: 'OpenAI',
            defaultModel: 'gpt-4o',
            defaultBaseUrl: 'https://api.openai.com/v1',
            requiresApiKey: true,
            allowsBaseUrl: false,
            jsonMode: true,
            help: 'Paid OpenAI API. The key is stored in translation.config.json on this machine and is not returned to the browser.'
        },
        gemini: {
            label: 'Google Gemini',
            defaultModel: 'gemini-3.8-flash',
            defaultBaseUrl: '',
            requiresApiKey: true,
            allowsBaseUrl: false,
            jsonMode: false,
            help: 'Google AI Studio key. Default model is gemini-3.8-flash. Gemini 1.5 models have been shut down.'
        },
        ollama: {
            label: 'Ollama (local, free)',
            defaultModel: 'llama3.2',
            defaultBaseUrl: 'http://127.0.0.1:11434/v1',
            requiresApiKey: false,
            allowsBaseUrl: true,
            jsonMode: false,
            help: 'Free local model. Run `ollama serve` and `ollama pull llama3.2`. No API key. Text stays on this computer unless you change the base URL.'
        },
        lmstudio: {
            label: 'LM Studio (local, free)',
            defaultModel: '',
            defaultBaseUrl: 'http://127.0.0.1:1234/v1',
            requiresApiKey: false,
            allowsBaseUrl: true,
            jsonMode: false,
            help: 'Free local model. Start the LM Studio server and set the model id shown in its server tab.'
        },
        groq: {
            label: 'Groq (free tier)',
            defaultModel: 'openai/gpt-oss-20b',
            defaultBaseUrl: 'https://api.groq.com/openai/v1',
            requiresApiKey: true,
            allowsBaseUrl: true,
            jsonMode: true,
            help: 'Free developer tier at console.groq.com. Uses Groq’s OpenAI-compatible API.'
        },
        custom: {
            label: 'Other OpenAI-compatible server',
            defaultModel: '',
            defaultBaseUrl: '',
            requiresApiKey: false,
            allowsBaseUrl: true,
            jsonMode: false,
            help: 'Any OpenAI-compatible endpoint, such as llama.cpp, OpenRouter, or a remote free model. Set the base URL and model id. Add an API key only if that server requires one.'
        }
    };

    static resolveApiKey(config = {}) {
        return config.apiKey || process.env.TRANSLATION_MANAGER_API_KEY || '';
    }

    static listProviders() {
        return Object.entries(AITranslator.PROVIDERS).map(([id, meta]) => ({
            id,
            label: meta.label,
            requiresApiKey: meta.requiresApiKey,
            allowsBaseUrl: meta.allowsBaseUrl,
            defaultModel: meta.defaultModel,
            defaultBaseUrl: meta.defaultBaseUrl,
            help: meta.help
        }));
    }

    static isConfigured(config) {
        if (!config || typeof config !== 'object') return false;
        try {
            new AITranslator(config);
            return true;
        } catch {
            return false;
        }
    }

    static normalizeProvider(provider) {
        const aliases = {
            local: 'ollama',
            'openai-compatible': 'custom',
            openai_compatible: 'custom'
        };
        return aliases[provider] || provider;
    }

    constructor(config = {}) {
        this.provider = AITranslator.normalizeProvider(config.provider || 'openai');
        const meta = AITranslator.PROVIDERS[this.provider];
        if (!meta) {
            throw new Error(`Unsupported AI provider: ${config.provider}`);
        }

        this.meta = meta;
        this.apiKey = AITranslator.resolveApiKey(config);
        this.model = config.model || meta.defaultModel;
        this.baseUrl = (config.baseUrl || meta.defaultBaseUrl || '').replace(/\/$/, '');

        if (meta.requiresApiKey && !this.apiKey) {
            throw new Error(`API Key is required for ${this.provider} translation. You can save it in settings or set TRANSLATION_MANAGER_API_KEY.`);
        }
        if ((this.provider === 'custom' || this.provider === 'lmstudio') && !this.baseUrl) {
            throw new Error(`A base URL is required for the ${this.provider} provider.`);
        }
        if (!this.model) {
            throw new Error(`A model name is required for the ${this.provider} provider.`);
        }
    }

    /**
     * Translates text with optional code context.
     * Context may be either `{ key: { occurrences: [{ context }] } }` from the scanner
     * or `{ key: [{ snippet }] }` from an export file.
     * `keys` aligns each string with a translation key so duplicate source text stays distinct.
     * @param {string|string[]} text
     * @param {string} targetLang
     * @param {string} [sourceLang]
     * @param {Object} [context]
     * @param {string[]} [keys]
     */
    async translate(text, targetLang, sourceLang = 'en', context = {}, keys = null) {
        if (!text || (Array.isArray(text) && text.length === 0)) {
            return text;
        }

        const isArray = Array.isArray(text);
        const textsToTranslate = isArray ? text : [text];
        const keyList = Array.isArray(keys) ? keys : null;

        if (textsToTranslate.length > AITranslator.CHUNK_SIZE) {
            const results = [];
            for (let i = 0; i < textsToTranslate.length; i += AITranslator.CHUNK_SIZE) {
                const sliceKeys = keyList ? keyList.slice(i, i + AITranslator.CHUNK_SIZE) : null;
                const part = await this.translate(
                    textsToTranslate.slice(i, i + AITranslator.CHUNK_SIZE),
                    targetLang,
                    sourceLang,
                    context,
                    sliceKeys
                );
                results.push(...part);
            }
            return isArray ? results : results[0];
        }

        const prompt = this._buildPrompt(textsToTranslate, targetLang, sourceLang, context, keyList);

        try {
            const result = await this._callAI(prompt);
            const translations = this._parseTranslations(result, textsToTranslate.length);
            return isArray ? translations : translations[0];
        } catch (error) {
            if (error.message.startsWith('AI Translation Error')) throw error;
            throw new Error(`AI Translation Error (${this.provider}): ${error.message}`);
        }
    }

    _buildPrompt(texts, targetLang, sourceLang, context, keys) {
        const normalized = AITranslator.normalizeContext(context);
        const items = texts.map((value, id) => {
            const key = keys?.[id] || null;
            const occurrences = (key && normalized[key]) || normalized[value] || [];
            return {
                id,
                key,
                text: value,
                context: occurrences.slice(0, 2).map(entry => ({
                    file: entry.file,
                    line: entry.line,
                    snippet: String(entry.snippet || '').slice(0, 400)
                })).filter(entry => entry.snippet)
            };
        });

        return `Translate each item from ${sourceLang} to ${targetLang} for a software user interface.
Return only a JSON object with this shape: {"translations":[{"id":0,"text":"translated text"}]}
Rules:
- Include every id exactly once.
- Preserve placeholders exactly, including {name}, {{count}}, %{name}, and ICU message tokens.
- Use the key and code snippets to choose the right meaning.
- Do not add notes, markdown, or extra keys.

Items:
${JSON.stringify(items)}`;
    }

    _parseTranslations(raw, count) {
        const parsed = AITranslator.parseModelJson(raw);
        if (!parsed || !Array.isArray(parsed.translations)) {
            throw new Error('Model did not return a translations array.');
        }

        const byId = new Map();
        parsed.translations.forEach(item => {
            if (item && item.id !== undefined && typeof item.text === 'string') {
                byId.set(Number(item.id), item.text);
            }
        });

        const translations = [];
        for (let id = 0; id < count; id++) {
            if (!byId.has(id)) {
                throw new Error(`Model response missing translation for item ${id}.`);
            }
            translations.push(byId.get(id));
        }
        return translations;
    }

    static parseModelJson(raw) {
        let text = String(raw || '').trim();
        const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fence) text = fence[1].trim();
        return JSON.parse(text);
    }

    /**
     * Accepts scanner context and export context.
     * @returns {Object<string, Array<{file?: string, line?: number, snippet: string}>>}
     */
    static normalizeContext(context) {
        if (!context || typeof context !== 'object' || Array.isArray(context)) return {};

        const normalized = {};
        for (const [key, value] of Object.entries(context)) {
            let occurrences = [];
            if (Array.isArray(value)) {
                occurrences = value;
            } else if (value && Array.isArray(value.occurrences)) {
                occurrences = value.occurrences;
            }

            normalized[key] = occurrences.map(entry => ({
                file: entry?.file,
                line: entry?.line,
                snippet: entry?.snippet || entry?.context || ''
            })).filter(entry => entry.snippet);
        }
        return normalized;
    }

    async _callAI(prompt) {
        if (this.provider === 'gemini') {
            return await this._callGemini(prompt);
        }
        return await this._callOpenAICompatible(prompt, { jsonMode: this.meta.jsonMode });
    }

    async _callOpenAICompatible(prompt, { jsonMode = false } = {}) {
        const body = {
            model: this.model,
            temperature: 0.2,
            messages: [
                { role: 'system', content: 'You are a professional translator for software applications. Reply with JSON only.' },
                { role: 'user', content: prompt }
            ]
        };
        if (jsonMode) {
            body.response_format = { type: 'json_object' };
        }

        const headers = { 'Content-Type': 'application/json' };
        if (this.apiKey) {
            headers.Authorization = `Bearer ${this.apiKey}`;
        }

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `${this.provider} API returned status ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error(`${this.provider} API returned no results`);
        }
        return content;
    }

    async _callGemini(prompt) {
        const generationConfig = {
            responseMimeType: 'application/json'
        };
        if (String(this.model).startsWith('gemini-3')) {
            generationConfig.thinkingConfig = { thinkingLevel: 'low' };
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': this.apiKey
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `Gemini API returned status ${response.status}`);
        }

        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const text = parts.filter(part => part?.text && !part.thought).map(part => part.text).join('\n').trim();
        if (!text) {
            throw new Error('Gemini API returned no results');
        }
        return text;
    }
}

AITranslator.CHUNK_SIZE = 20;

module.exports = AITranslator;
