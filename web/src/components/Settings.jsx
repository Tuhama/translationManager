import React, { useState, useEffect } from 'react';
import { Modal, Button, FormGroup, Input, Alert } from './ui';

/**
 * Settings modal for managing configuration like API keys.
 */
const Settings = ({ onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [localesPath, setLocalesPath] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch('/api/config');
                const config = await response.json();
                setApiKey(config.googleTranslateApiKey || '');
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
                        googleTranslateApiKey: apiKey,
                        path: localesPath 
                    } 
                })
            });
            if (response.ok) {
                setMessage({ type: 'success', text: 'Settings saved successfully!' });
                setTimeout(() => {
                    // Trigger a reload of the main translation data since the path might have changed
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

            <FormGroup
                label="Google Translate API Key"
                helpText={
                    <>
                        Required for auto-translation features (Magic Wand and Bulk Translate). 
                        You can get your key from the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a>.
                    </>
                }
            >
                <Input 
                    type="password" 
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)} 
                    placeholder="Enter your API Key..."
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
