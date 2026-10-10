import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert } from './ui';
import TranslationService from '../services/api';
import { defaultSourceLang } from '../utils/languageUtils';

/**
 * Bulk Translate Tool with Scan and Review functionality.
 */
const AutoTranslateTool = ({ languages, onUpdate, onClose, actions }) => {
    const [sourceLang, setSourceLang] = useState(() => defaultSourceLang(languages));
    const [report, setReport] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!languages.length) return;
        if (!languages.includes(sourceLang)) {
            setSourceLang(defaultSourceLang(languages));
            return;
        }
        handleScan();
    }, [sourceLang, languages]);

    const handleScan = async () => {
        setScanning(true);
        setError(null);
        try {
            setReport(await TranslationService.scanBulkTranslate(sourceLang));
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
            setPreview(await TranslationService.executeBulkTranslate(sourceLang));
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        // Create a custom dialog with three options
        const choice = window.prompt(
            'Choose how to save the translation files:\n\n' +
            '1 - Save with pretty-printing and sorting (recommended)\n' +
            '2 - Save without formatting (faster)\n' +
            '0 - Cancel\n\n' +
            'Enter your choice (0, 1, or 2):'
        );

        if (choice === null || choice === '0') return; // Cancel

        const format = choice === '1'; // true for formatted, false for unformatted

        setLoading(true);
        try {
            if (actions && actions.saveBulk) {
                // Use the actions prop if available
                await actions.saveBulk(preview, format);
                onUpdate();
                onClose();
            } else {
                await TranslationService.saveBulkTranslations(preview, format);
                onUpdate();
                onClose();
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const totalMissing = report ? Object.values(report).reduce((acc, curr) => acc + curr.count, 0) : 0;
    const busy = loading || scanning;

    const footer = (
        <>
            <Button variant="secondary" onClick={onClose} disabled={busy}>
                Cancel
            </Button>
            {!preview ? (
                <Button 
                    variant="primary" 
                    onClick={handleTranslate} 
                    disabled={busy || totalMissing === 0}
                    loading={loading}
                    loadingText="Translating..."
                >
                    Translate Missing Keys
                </Button>
            ) : (
                <Button 
                    variant="primary" 
                    onClick={handleApprove} 
                    loading={loading}
                    loadingText="Saving..."
                    className="approve-btn"
                >
                    Approve & Save All
                </Button>
            )}
        </>
    );

    return (
        <Modal
            isOpen={true}
            onClose={busy ? () => {} : onClose}
            title="Auto-Translate Wizard 🪄"
            className="bulk-translate-modal"
            footer={footer}
            closeOnOverlayClick={!busy}
        >
            {error && (
                <Alert type="error">
                    {error}
                </Alert>
            )}

            {!preview ? (
                <>
                    <div className="wizard-step">
                        <label>1. Select Source Language</label>
                        <select 
                            value={sourceLang} 
                            onChange={(e) => setSourceLang(e.target.value)}
                            className="source-select"
                            disabled={busy}
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
        </Modal>
    );
};

export default AutoTranslateTool;
