import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Bulk Translate Tool with Scan and Review functionality.
 */
const AutoTranslateTool = ({ languages, onUpdate, onClose }) => {
    const [sourceLang, setSourceLang] = useState('en');
    const [report, setReport] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null);

    // Scan for missing keys on mount and when sourceLang changes
    useEffect(() => {
        handleScan();
    }, [sourceLang]);

    const handleScan = async () => {
        setScanning(true);
        setError(null);
        try {
            const response = await fetch(`/api/bulk-translate/scan?sourceLang=${sourceLang}`);
            if (!response.ok) throw new Error('API Key missing or invalid. Check settings.');
            const data = await response.json();
            setReport(data);
        } catch (error) {
            setError(error.message);
        } finally {
            setScanning(false);
        }
    };

    const handleTranslate = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/bulk-translate/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceLang })
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Translation failed.');
            }
            const data = await response.json();
            setPreview(data);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/bulk-save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: preview })
            });
            if (response.ok) {
                onUpdate();
                onClose();
            } else {
                throw new Error('Failed to save translations.');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const totalMissing = report ? Object.values(report).reduce((acc, curr) => acc + curr.count, 0) : 0;

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content bulk-translate-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Auto-Translate Wizard 🪄</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                
                <div className="modal-body">
                    {error && <div className="alert alert-error">❌ {error}</div>}

                    {!preview ? (
                        <>
                            <div className="wizard-step">
                                <label>1. Select Source Language</label>
                                <select 
                                    value={sourceLang} 
                                    onChange={(e) => setSourceLang(e.target.value)}
                                    className="source-select"
                                >
                                    {languages.map(lang => (
                                        <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                                    ))}
                                </select>
                                <p className="help-text">Missing keys in other languages will be translated from this source.</p>
                            </div>

                            <div className="wizard-step">
                                <label>2. Scan Results</label>
                                {scanning ? (
                                    <div className="skeleton-text">Scanning for missing keys...</div>
                                ) : (
                                    <div className="report-summary">
                                        {totalMissing > 0 ? (
                                            <>
                                                <p>Found <strong>{totalMissing}</strong> missing translations across <strong>{Object.keys(report).length}</strong> languages:</p>
                                                <ul>
                                                    {Object.entries(report).map(([lang, data]) => (
                                                        <li key={lang}>{lang.toUpperCase()}: {data.count} keys</li>
                                                    ))}
                                                </ul>
                                            </>
                                        ) : (
                                            <p className="success-text">✅ All languages are fully translated!</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="wizard-step">
                            <label>3. Review Translations</label>
                            <div className="preview-container">
                                {Object.entries(preview).map(([lang, translations]) => (
                                    <div key={lang} className="lang-preview">
                                        <h3>{lang.toUpperCase()}</h3>
                                        <div className="preview-list">
                                            {Object.entries(translations).map(([key, value]) => (
                                                <div key={key} className="preview-item">
                                                    <span className="preview-key">{key}:</span>
                                                    <span className="preview-value">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="secondary-btn" onClick={onClose}>Cancel</button>
                    {!preview ? (
                        <button 
                            className="primary-btn" 
                            onClick={handleTranslate} 
                            disabled={loading || scanning || totalMissing === 0}
                        >
                            {loading ? 'Translating...' : 'Translate Missing Keys'}
                        </button>
                    ) : (
                        <button 
                            className="primary-btn approve-btn" 
                            onClick={handleApprove} 
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Approve & Save All'}
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AutoTranslateTool;
