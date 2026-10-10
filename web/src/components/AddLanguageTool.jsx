import React, { useMemo, useState } from 'react';
import { Modal, Button, Alert } from './ui';

const COMMON_LANGUAGES = [
    ['ar', 'Arabic'],
    ['zh', 'Chinese'],
    ['cs', 'Czech'],
    ['da', 'Danish'],
    ['nl', 'Dutch'],
    ['fi', 'Finnish'],
    ['fr', 'French'],
    ['de', 'German'],
    ['el', 'Greek'],
    ['he', 'Hebrew'],
    ['hi', 'Hindi'],
    ['hu', 'Hungarian'],
    ['id', 'Indonesian'],
    ['it', 'Italian'],
    ['ja', 'Japanese'],
    ['ko', 'Korean'],
    ['no', 'Norwegian'],
    ['pl', 'Polish'],
    ['pt', 'Portuguese'],
    ['pt-BR', 'Portuguese (Brazil)'],
    ['ro', 'Romanian'],
    ['ru', 'Russian'],
    ['es', 'Spanish'],
    ['sv', 'Swedish'],
    ['th', 'Thai'],
    ['tr', 'Turkish'],
    ['uk', 'Ukrainian'],
    ['vi', 'Vietnamese']
];

/**
 * One-click new language: pick a code and translate every key from a source locale.
 */
const AddLanguageTool = ({ languages = [], onUpdate, onClose }) => {
    const existing = useMemo(
        () => new Set(languages.map(lang => lang.toLowerCase())),
        [languages]
    );
    const defaultSource = languages.includes('en') ? 'en' : (languages[0] || 'en');
    const firstAvailable = COMMON_LANGUAGES.find(([code]) => !existing.has(code.toLowerCase()));

    const [sourceLang, setSourceLang] = useState(defaultSource);
    const [targetLang, setTargetLang] = useState(firstAvailable ? firstAvailable[0] : '');
    const [customCode, setCustomCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const resolvedCode = (customCode.trim() || targetLang).trim();

    const handleAdd = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/languages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetLang: resolvedCode, sourceLang })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || 'Failed to add language.');
            }
            onUpdate();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <>
            <Button variant="secondary" onClick={onClose} disabled={loading}>
                Cancel
            </Button>
            <Button
                variant="primary"
                onClick={handleAdd}
                disabled={loading || !resolvedCode || !sourceLang}
                loading={loading}
                loadingText="Translating..."
            >
                Add & Translate
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={true}
            onClose={loading ? () => {} : onClose}
            title="Add Language"
            footer={footer}
            closeOnOverlayClick={!loading}
        >
            {error && <Alert type="error">{error}</Alert>}
            <div className="wizard-step">
                <label htmlFor="new-language">New language</label>
                <select
                    id="new-language"
                    className="source-select"
                    value={targetLang}
                    onChange={(e) => {
                        setTargetLang(e.target.value);
                        setCustomCode('');
                    }}
                    disabled={loading}
                >
                    {COMMON_LANGUAGES.map(([code, label]) => (
                        <option key={code} value={code} disabled={existing.has(code.toLowerCase())}>
                            {label} ({code}){existing.has(code.toLowerCase()) ? ' — already added' : ''}
                        </option>
                    ))}
                </select>
                <label htmlFor="custom-language" style={{ marginTop: 12 }}>
                    Or enter a custom code
                </label>
                <input
                    id="custom-language"
                    className="source-select"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    placeholder="e.g. pt-BR"
                    disabled={loading}
                    autoComplete="off"
                />
            </div>
            <div className="wizard-step">
                <label htmlFor="source-language">Translate from</label>
                <select
                    id="source-language"
                    className="source-select"
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    disabled={loading}
                >
                    {languages.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                    ))}
                </select>
                <p className="hint">
                    Creates <strong>{resolvedCode || '…'}.json</strong> and translates every string from <strong>{sourceLang}</strong> in one step.
                </p>
            </div>
        </Modal>
    );
};

export default AddLanguageTool;
