import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

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

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content settings-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Configuration Settings</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label>Locales Directory Path</label>
                        <input 
                            type="text" 
                            value={localesPath} 
                            onChange={(e) => setLocalesPath(e.target.value)} 
                            placeholder="e.g. src/locales or public/locales"
                            className="settings-input"
                        />
                        <p className="help-text">
                            Relative path from the project root to your translation files. 
                            If empty, we'll try to auto-detect common locations.
                        </p>
                    </div>
                    <div className="form-group">
                        <label>Google Translate API Key</label>
                        <input 
                            type="password" 
                            value={apiKey} 
                            onChange={(e) => setApiKey(e.target.value)} 
                            placeholder="Enter your API Key..."
                            className="settings-input"
                        />
                        <p className="help-text">
                            Required for auto-translation features (Magic Wand and Bulk Translate). 
                            You can get your key from the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a>.
                        </p>
                    </div>
                    {message && (
                        <div className={`alert alert-${message.type}`}>
                            {message.type === 'success' ? '✅' : '❌'} {message.text}
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="secondary-btn" onClick={onClose}>Cancel</button>
                    <button 
                        className="primary-btn" 
                        onClick={handleSave} 
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Settings;
