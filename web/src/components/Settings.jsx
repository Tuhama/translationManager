import React, { useState, useEffect } from 'react';
import { Modal, Button, FormGroup, Input, Alert } from './ui';

/**
 * Settings modal for managing configuration like API keys.
 */
const Settings = ({ onClose }) => {
    const [projectId, setProjectId] = useState('');
    const [keyFilename, setKeyFilename] = useState('');
    const [localesPath, setLocalesPath] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch('/api/config');
                const config = await response.json();

                // Support both old and new config formats
                if (config.googleTranslateApiKey) {
                    setMessage({ 
                        type: 'warning', 
                        text: 'Your configuration uses the deprecated Google Translate API v2. Please update to v3 format below.' 
                    });
                }

                setProjectId(config.googleTranslate?.projectId || '');
                setKeyFilename(config.googleTranslate?.keyFilename || '');
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
                label="Google Cloud Project ID"
                helpText={
                    <>
                        Required for auto-translation features (Magic Wand and Bulk Translate). 
                        Create a project and enable the Translation API in the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a>.
                    </>
                }
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
                label="Authentication Method"
                helpText={
                    <>
                        <strong>Recommended:</strong> Use Google Cloud CLI authentication by running <code>gcloud auth application-default login</code>. 
                        Leave the field below empty to use this method.<br/><br/>
                        <strong>Alternative:</strong> Provide a path to your service account JSON key file. 
                        Create a service account with "Cloud Translation API User" role and download the key file.
                        You can also set the GOOGLE_APPLICATION_CREDENTIALS environment variable instead.
                    </>
                }
            >
                <Input 
                    type="text" 
                    value={keyFilename} 
                    onChange={(e) => setKeyFilename(e.target.value)} 
                    placeholder="Leave empty to use Google Cloud CLI auth, or enter path to service-account-key.json"
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
