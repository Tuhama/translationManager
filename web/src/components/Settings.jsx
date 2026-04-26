import React, { useState, useEffect } from 'react';
import { Modal, Button, FormGroup, Input, Alert } from './ui';

/**
 * Settings modal for managing configuration like API keys.
 */
const Settings = ({ onClose }) => {
    const [projectId, setProjectId] = useState('');
    const [keyFilename, setKeyFilename] = useState('');
    const [aiProvider, setAiProvider] = useState('openai');
    const [aiApiKey, setAiApiKey] = useState('');
    const [aiModel, setAiModel] = useState('');
    const [localesPath, setLocalesPath] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch('/api/config');
                const config = await response.json();

                setProjectId(config.googleTranslate?.projectId || '');
                setKeyFilename(config.googleTranslate?.keyFilename || '');
                setAiProvider(config.aiTranslate?.provider || 'openai');
                setAiApiKey(config.aiTranslate?.apiKey || '');
                setAiModel(config.aiTranslate?.model || '');
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
                            model: aiModel
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
                    className="settings-input"
                />
            </FormGroup>

            <div className="settings-divider">AI Translation (OpenAI / Gemini)</div>

            <FormGroup label="AI Provider">
                <select 
                    value={aiProvider} 
                    onChange={(e) => setAiProvider(e.target.value)}
                    className="settings-select"
                >
                    <option value="openai">OpenAI (GPT-4o)</option>
                    <option value="gemini">Google Gemini (1.5 Flash)</option>
                </select>
            </FormGroup>

            <FormGroup label="API Key">
                <Input 
                    type="password" 
                    value={aiApiKey} 
                    onChange={(e) => setAiApiKey(e.target.value)} 
                    placeholder="sk-..."
                    className="settings-input"
                />
            </FormGroup>

            <FormGroup label="Model (Optional)" helpText="Defaults: gpt-4o for OpenAI, gemini-1.5-flash for Gemini.">
                <Input 
                    type="text" 
                    value={aiModel} 
                    onChange={(e) => setAiModel(e.target.value)} 
                    placeholder="e.g. gpt-3.5-turbo"
                    className="settings-input"
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
                    className="settings-input"
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
                    className="settings-input"
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
