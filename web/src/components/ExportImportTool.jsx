import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, FormGroup, Input } from './ui';
import TranslationService from '../services/api';

/**
 * Export/Import Tool for missing translation keys
 */
const ExportImportTool = ({ languages, onUpdate, onClose }) => {
    const [activeTab, setActiveTab] = useState('export');
    const [sourceLang, setSourceLang] = useState('en');
    const [exportPreview, setExportPreview] = useState(null);
    const [importFile, setImportFile] = useState(null);
    const [importOptions, setImportOptions] = useState({
        overwriteExisting: false,
        skipEmpty: true,
        format: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [importResult, setImportResult] = useState(null);

    // Load export preview when tab or source language changes
    useEffect(() => {
        if (activeTab === 'export') {
            loadExportPreview();
        }
    }, [activeTab, sourceLang]);

    const loadExportPreview = async () => {
        setLoading(true);
        setError(null);
        try {
            const preview = await TranslationService.getExportPreview(sourceLang);
            setExportPreview(preview);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setLoading(true);
        setError(null);
        try {
            await TranslationService.exportMissingKeys(sourceLang);
            // File download is handled by the service
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'application/json') {
            setImportFile(file);
            setImportResult(null);
            setError(null);
        } else {
            setError('Please select a valid JSON file');
        }
    };

    const handleImport = async () => {
        if (!importFile) {
            setError('Please select a file to import');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const fileContent = await importFile.text();
            const importData = JSON.parse(fileContent);
            
            const result = await TranslationService.importTranslations(importData, importOptions);
            setImportResult(result.stats);
            onUpdate(); // Refresh the main data
        } catch (error) {
            setError(`Import failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <>
            <Button variant="secondary" onClick={onClose}>
                Close
            </Button>
            {activeTab === 'export' ? (
                <Button 
                    variant="primary" 
                    onClick={handleExport}
                    disabled={loading || !exportPreview || exportPreview.metadata.totalKeys === 0}
                    loading={loading}
                    loadingText="Exporting..."
                >
                    Download Export File
                </Button>
            ) : (
                <Button 
                    variant="primary" 
                    onClick={handleImport}
                    disabled={loading || !importFile}
                    loading={loading}
                    loadingText="Importing..."
                >
                    Import Translations
                </Button>
            )}
        </>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Export/Import Missing Keys 📤📥"
            className="export-import-modal"
            footer={footer}
        >
            {error && (
                <Alert type="error">
                    {error}
                </Alert>
            )}

            <div className="tab-container">
                <div className="tab-buttons">
                    <button 
                        className={`tab-button ${activeTab === 'export' ? 'active' : ''}`}
                        onClick={() => setActiveTab('export')}
                    >
                        Export Missing Keys
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'import' ? 'active' : ''}`}
                        onClick={() => setActiveTab('import')}
                    >
                        Import Translations
                    </button>
                </div>

                {activeTab === 'export' ? (
                    <div className="export-tab">
                        <FormGroup label="Source Language">
                            <select 
                                value={sourceLang} 
                                onChange={(e) => setSourceLang(e.target.value)}
                                className="source-select"
                            >
                                {languages.map(lang => (
                                    <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                                ))}
                            </select>
                            <p className="help-text">Keys missing in other languages will be exported for translation.</p>
                        </FormGroup>

                        {loading ? (
                            <div className="skeleton-text">Loading export preview...</div>
                        ) : exportPreview ? (
                            <div className="export-preview">
                                <h3>Export Preview</h3>
                                <div className="preview-stats">
                                    <p><strong>{exportPreview.metadata.totalKeys}</strong> missing keys found</p>
                                    <p>Target languages: <strong>{exportPreview.metadata.targetLanguages.join(', ')}</strong></p>
                                </div>
                                
                                {exportPreview.metadata.totalKeys > 0 ? (
                                    <div className="preview-sample">
                                        <h4>Sample keys to be exported:</h4>
                                        <pre>
                                            {JSON.stringify(
                                                Object.fromEntries(
                                                    Object.entries(exportPreview.exportData).slice(0, 3)
                                                ), 
                                                null, 
                                                2
                                            )}
                                        </pre>
                                        {Object.keys(exportPreview.exportData).length > 3 && (
                                            <p>... and {Object.keys(exportPreview.exportData).length - 3} more keys</p>
                                        )}
                                    </div>
                                ) : (
                                    <Alert type="success">
                                        ✅ All translations are complete! No missing keys to export.
                                    </Alert>
                                )}
                            </div>
                        ) : null}
                    </div>
                ) : (
                    <div className="import-tab">
                        <FormGroup label="Select Translation File">
                            <Input 
                                type="file" 
                                accept=".json"
                                onChange={handleFileSelect}
                            />
                            <p className="help-text">Select the JSON file with translated keys to import.</p>
                        </FormGroup>

                        <div className="import-options">
                            <h3>Import Options</h3>
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={importOptions.overwriteExisting}
                                    onChange={(e) => setImportOptions({
                                        ...importOptions, 
                                        overwriteExisting: e.target.checked
                                    })}
                                />
                                Overwrite existing translations
                            </label>
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={importOptions.skipEmpty}
                                    onChange={(e) => setImportOptions({
                                        ...importOptions, 
                                        skipEmpty: e.target.checked
                                    })}
                                />
                                Skip empty translations
                            </label>
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={importOptions.format}
                                    onChange={(e) => setImportOptions({
                                        ...importOptions, 
                                        format: e.target.checked
                                    })}
                                />
                                Format and sort files
                            </label>
                        </div>

                        {importResult && (
                            <Alert type="success">
                                Import completed! 
                                <br />✅ {importResult.imported} translations imported
                                <br />⏭️ {importResult.skipped} translations skipped
                                {importResult.errors.length > 0 && (
                                    <>
                                        <br />❌ {importResult.errors.length} errors occurred
                                        <details>
                                            <summary>View errors</summary>
                                            <ul>
                                                {importResult.errors.map((error, idx) => (
                                                    <li key={idx}>{error}</li>
                                                ))}
                                            </ul>
                                        </details>
                                    </>
                                )}
                            </Alert>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ExportImportTool;