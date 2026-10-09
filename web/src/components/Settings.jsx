import React, { useState, useEffect } from 'react';
import { Modal, Button, FormGroup, Input, Alert } from './ui';

const AI_PROVIDERS = [
    {
        id: 'openai',
        label: 'OpenAI',
        requiresApiKey: true,
        allowsBaseUrl: false,
        defaultModel: 'gpt-4o',
        help: 'Paid OpenAI API. Leave the key blank to keep the one already saved on this machine.'
    },
    {
        id: 'gemini',
        label: 'Google Gemini',
        requiresApiKey: true,
        allowsBaseUrl: false,
        defaultModel: 'gemini-3.8-flash',
        help: 'Google AI Studio key. Default model is gemini-3.8-flash.'
    },
    {
        id: 'ollama',
        label: 'Ollama (local, free)',
        requiresApiKey: false,
        allowsBaseUrl: true,
        defaultModel: 'llama3.2',
        defaultBaseUrl: 'http://127.0.0.1:11434/v1',
        help: 'Free local model. Run ollama serve, then ollama pull llama3.2. No API key. Text stays on this computer unless you change the base URL.'
    },
    {
        id: 'lmstudio',
        label: 'LM Studio (local, free)',
        requiresApiKey: false,
        allowsBaseUrl: true,
        defaultModel: '',
        defaultBaseUrl: 'http://127.0.0.1:1234/v1',
        help: 'Free local model. Start the LM Studio server and enter the model id from its server tab.'
    },
    {
        id: 'groq',
        label: 'Groq (free tier)',
        requiresApiKey: true,
        allowsBaseUrl: true,
        defaultModel: 'openai/gpt-oss-20b',
        defaultBaseUrl: 'https://api.groq.com/openai/v1',
        help: 'Free developer key from console.groq.com. Requests go to Groq’s OpenAI-compatible API.'
    },
    {
        id: 'custom',
        label: 'Other OpenAI-compatible server',
        requiresApiKey: false,
        allowsBaseUrl: true,
        defaultModel: '',
        defaultBaseUrl: '',
        help: 'llama.cpp, OpenRouter, or any other OpenAI-compatible endpoint. Set the base URL and model. Add a key only if that server requires one.'
    }
];

/**
 * Settings modal for managing configuration like API keys.
 */
const Settings = ({ onClose }) => {
    const [projectId, setProjectId] = useState('');
    const [keyFilename, setKeyFilename] = useState('');
    const [aiProvider, setAiProvider] = useState('openai');
    const [aiApiKey, setAiApiKey] = useState('');
    const [aiModel, setAiModel] = useState('');
    const [aiBaseUrl, setAiBaseUrl] = useState('');
    const [hasApiKey, setHasApiKey] = useState(false);
    const [hasSavedApiKey, setHasSavedApiKey] = useState(false);
    const [clearApiKey, setClearApiKey] = useState(false);
    const [localesPath, setLocalesPath] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const provider = AI_PROVIDERS.find(item => item.id === aiProvider) || AI_PROVIDERS[0];

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch('/api/config');
                const config = await response.json();

                setProjectId(config.googleTranslate?.projectId || '');
                setKeyFilename(config.googleTranslate?.keyFilename || '');
                setAiProvider(config.aiTranslate?.provider || 'openai');
                setAiModel(config.aiTranslate?.model || '');
                setAiBaseUrl(config.aiTranslate?.baseUrl || '');
                setHasApiKey(Boolean(config.aiTranslate?.hasApiKey));
                setHasSavedApiKey(Boolean(config.aiTranslate?.hasSavedApiKey));
                setLocalesPath(config.path || '');
            } catch (error) {
                console.error('Failed to fetch config:', error);
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    settings: { 
                        googleTranslate: {
                            projectId: projectId,
                            keyFilename: keyFilename
                        },
                        aiTranslate: {
                            provider: aiProvider,
                            apiKey: aiApiKey,
                            model: aiModel,
                            baseUrl: aiBaseUrl,
                            ...(clearApiKey ? { clearApiKey: true } : {})
                        },
                        path: localesPath 
                    } 
                })
            });
            if (response.ok) {
                setMessage({ type: 'success', text: 'Settings saved successfully!' });
                setTimeout(() => {
                    window.location.reload(); 
                }, 1000);
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save settings');
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <>
            <Button variant="secondary" onClick={onClose}>
                Cancel
            </Button>
            <Button 
                variant="primary" 
                onClick={handleSave} 
                loading={loading}
                loadingText="Saving..."
            >
                Save Settings
            </Button>
        </>
    );

    const showApiKey = provider.requiresApiKey || provider.id === 'custom';

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Configuration Settings"
            className="settings-modal"
            footer={footer}
        >
            <FormGroup
                label="Locales Directory Path"
                helpText="Relative path from the project root to your translation files. If empty, we'll try to auto-detect common locations."
            >
                <Input 
                    type="text" 
                    value={localesPath} 
                    onChange={(e) => setLocalesPath(e.target.value)} 
                    placeholder="e.g. src/locales or public/locales"
                    className="settings-input settings-input-plain"
                />
            </FormGroup>

            <div className="settings-divider">AI Translation</div>

            <FormGroup label="AI Provider" helpText={provider.help}>
                <select 
                    value={aiProvider} 
                    onChange={(e) => {
                        setAiProvider(e.target.value);
                        setAiModel('');
                        setAiBaseUrl('');
                    }}
                    className="settings-select"
                >
                    {AI_PROVIDERS.map(item => (
                        <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                </select>
            </FormGroup>

            {showApiKey && (
                <FormGroup
                    label={provider.requiresApiKey ? 'API Key' : 'API Key (optional)'}
                    helpText={hasApiKey && !clearApiKey
                        ? 'A key is already saved on this machine, or TRANSLATION_MANAGER_API_KEY is set. Enter a new key to replace the saved one. The key is never sent back to the browser.'
                        : 'You can leave this blank and set TRANSLATION_MANAGER_API_KEY in the environment instead. Do not commit the key.'}
                >
                    <Input 
                        type="password" 
                        value={aiApiKey} 
                        onChange={(e) => {
                            setAiApiKey(e.target.value);
                            if (e.target.value) setClearApiKey(false);
                        }} 
                        placeholder={hasApiKey ? 'Saved key stays if this is blank' : 'sk-...'}
                        className="settings-input"
                        autoComplete="off"
                    />
                </FormGroup>
            )}

            {showApiKey && hasSavedApiKey && !clearApiKey && (
                <Button
                    variant="secondary"
                    size="small"
                    className="settings-key-action"
                    onClick={() => {
                        setClearApiKey(true);
                        setAiApiKey('');
                        setHasApiKey(false);
                        setHasSavedApiKey(false);
                    }}
                >
                    Remove saved API key
                </Button>
            )}

            {provider.allowsBaseUrl && (
                <FormGroup
                    label={provider.id === 'custom' ? 'Base URL' : 'Base URL (optional)'}
                    helpText={provider.defaultBaseUrl
                        ? `Leave blank to use ${provider.defaultBaseUrl}`
                        : 'OpenAI-compatible base URL, for example http://127.0.0.1:8080/v1'}
                >
                    <Input
                        type="text"
                        value={aiBaseUrl}
                        onChange={(e) => setAiBaseUrl(e.target.value)}
                        placeholder={provider.defaultBaseUrl || 'http://127.0.0.1:8080/v1'}
                        className="settings-input settings-input-plain"
                    />
                </FormGroup>
            )}

            <FormGroup
                label="Model (optional)"
                helpText={provider.defaultModel
                    ? `Leave blank to use ${provider.defaultModel}`
                    : 'Required for this provider. Use the model id loaded on the server.'}
            >
                <Input 
                    type="text" 
                    value={aiModel} 
                    onChange={(e) => setAiModel(e.target.value)} 
                    placeholder={provider.defaultModel || 'model id'}
                    className="settings-input settings-input-plain"
                />
            </FormGroup>

            <div className="settings-divider">Google Cloud Translation (v3)</div>

            <FormGroup
                label="Google Cloud Project ID"
            >
                <Input 
                    type="text" 
                    value={projectId} 
                    onChange={(e) => setProjectId(e.target.value)} 
                    placeholder="your-google-cloud-project-id"
                    className="settings-input settings-input-plain"
                />
            </FormGroup>

            <FormGroup
                label="Service Account Key Path (Optional)"
                helpText="Leave empty to use Google Cloud CLI auth (recommended)."
            >
                <Input 
                    type="text" 
                    value={keyFilename} 
                    onChange={(e) => setKeyFilename(e.target.value)} 
                    placeholder="path/to/service-account-key.json"
                    className="settings-input settings-input-plain"
                />
            </FormGroup>

            {message && (
                <Alert type={message.type}>
                    {message.text}
                </Alert>
            )}
        </Modal>
    );
};

export default Settings;
