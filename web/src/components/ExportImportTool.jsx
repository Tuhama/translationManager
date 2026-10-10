import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, FormGroup, Input } from './ui';
import TranslationService from '../services/api';

/**
 * Export/Import Tool for missing translation keys
 */
const ExportImportTool = ({ languages, onUpdate, onClose }) => {
    const [activeTab, setActiveTab] = useState('export');
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

    // Load export preview when tab changes
    useEffect(() => {
        if (activeTab === 'export') {
            loadExportPreview();
        }
    }, [activeTab]);

    const loadExportPreview = async () => {
        setLoading(true);
        setError(null);
        try {
            const preview = await TranslationService.getExportPreview();
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
            await TranslationService.exportMissingKeys();
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
            <Button variant="secondary" onClick={onClose} disabled={loading}>
                Close
            </Button>
            {activeTab === 'export' ? (
                <Button 
                    variant="primary" 
                    onClick={handleExport}
                    disabled={loading || !exportPreview}
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
            onClose={loading ? () => {} : onClose}
            title="Export/Import Translations 📤📥"
            className="export-import-modal"
            footer={footer}
            closeOnOverlayClick={!loading}
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
                        disabled={loading}
                    >
                        Export Missing Keys
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'import' ? 'active' : ''}`}
                        onClick={() => setActiveTab('import')}
                        disabled={loading}
                    >
                        Import Translations
                    </button>
                </div>

                {activeTab === 'export' ? (
                    <div className="export-tab">
                        <div className="export-info">
                            <p>Export all missing translation keys. This includes keys found in your source code that are missing from translation files, and keys that exist but are missing translations in some languages.</p>
                        </div>

                        {loading ? (
                            <div className="skeleton-text">Loading export preview...</div>
                        ) : exportPreview ? (
                            <div className="export-preview">
                                <h3>Export Preview</h3>
                                <div className="preview-stats">
                                    <p><strong>{exportPreview.metadata.totalKeys}</strong> translation keys found</p>
                                    <p>Languages: <strong>{exportPreview.metadata.languages.join(', ')}</strong></p>
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
                                    <Alert type="info">
                                        ℹ️ No translation keys found to export.
                                    </Alert>
                                )}
                            </div>
                        ) : null}
                    </div>
                ) : (
                    <div className="import-tab">
                        <FormGroup label="Select Translation File" helpText="Select the JSON file with translated keys to import.">
                            <Input 
                                type="file" 
                                accept=".json"
                                onChange={handleFileSelect}
                                disabled={loading}
                            />
                        </FormGroup>

                        <div className="import-options">
                            <h3>Import Options</h3>
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={importOptions.overwriteExisting}
                                    disabled={loading}
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
                                    disabled={loading}
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
                                    disabled={loading}
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
