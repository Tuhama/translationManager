import React, { useState, useEffect } from 'react';
import { getNestedValue } from '../utils/objectUtils';
import { Button, FormGroup, Input, Textarea } from './ui';

/**
 * Handles editing and creating translation entries.
 * Manages its own form state and synchronizes with the selected key.
 */
const Editor = ({
  selectedKey,
  setSelectedKey,
  onSave,
  onCancel,
  languages,
  translations,
  allKeys
}) => {
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [translatingLang, setTranslatingLang] = useState(null);
  const [translatingAll, setTranslatingAll] = useState(false);

  // Sync form data when selectedKey or translations change
  useEffect(() => {
    if (selectedKey === null) return;

    if (selectedKey === '') {
      // New key mode
      setIsEditing(false);
      const values = {};
      languages.forEach(lang => {
        values[lang] = '';
      });
      setFormData(values);
    } else {
      // Edit mode
      setIsEditing(true);
      const values = {};
      languages.forEach(lang => {
        values[lang] = getNestedValue(translations[lang], selectedKey) || '';
      });
      setFormData(values);
    }
  }, [selectedKey, translations, languages]);

  const handleBlurKey = (e) => {
    const key = e.target.value;
    if (allKeys.includes(key)) {
      setSelectedKey(key);
    }
  };

  const handleTranslate = async (targetLang) => {
    // Find source language - usually English (the first lang with content)
    const sourceLang = languages.find(l => formData[l] && l !== targetLang) || languages[0];
    const text = formData[sourceLang];

    if (!text) {
      alert("Please enter a source translation first.");
      return;
    }

    setTranslatingLang(targetLang);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang, sourceLang })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setFormData(prev => ({ ...prev, [targetLang]: data.translatedText }));
    } catch (error) {
      alert(`Translation failed: ${error.message}`);
    } finally {
      setTranslatingLang(null);
    }
  };

  const handleTranslateAll = async () => {
    const sourceLang = languages.find(l => formData[l]);
    const text = formData[sourceLang];

    if (!text) {
        alert("Please enter at least one translation to use as source.");
        return;
    }

    setTranslatingAll(true);
    try {
        const targets = languages.filter(l => l !== sourceLang);
        const newFormData = { ...formData };

        for (const targetLang of targets) {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, targetLang, sourceLang })
            });
            const data = await response.json();
            if (data.translatedText) {
                newFormData[targetLang] = data.translatedText;
            }
        }
        setFormData(newFormData);
    } catch (error) {
        alert("Bulk translation failed. Check your API key.");
    } finally {
        setTranslatingAll(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalKey = selectedKey || e.target.newKey.value;
    await onSave(finalKey, formData);
  };

  if (selectedKey === null) {
    return (
      <div className="empty-state">
        <div className="hero-icon">🌍</div>
        <h2>Global Language Management</h2>
        <p>Select a key from the sidebar to edit or create a new one to get started.</p>
        <Button variant="primary" onClick={() => setSelectedKey('')}>
          Create New Translation
        </Button>
      </div>
    );
  }

  return (
    <div className="editor-form">
      <div className="editor-header-row">
        <h2>{isEditing ? `Edit: ${selectedKey}` : 'Create New Key'}</h2>
        {isEditing && (
          <Button 
            variant="magic" 
            onClick={handleTranslateAll}
            loading={translatingAll}
            loadingText="⏳ Translating..."
            icon="🪄"
          >
            Source-to-All
          </Button>
        )}
      </div>
      <form onSubmit={handleSubmit}>
        {!isEditing && (
          <FormGroup
            label="Key (use dots for nesting)"
            required
          >
            <Input 
              name="newKey" 
              type="text" 
              placeholder="e.g. common.buttons.save" 
              required 
              onBlur={handleBlurKey}
            />
          </FormGroup>
        )}
        {languages.map(lang => {
          const magicButton = (
            <Button 
              variant="icon" 
              onClick={() => handleTranslate(lang)}
              disabled={translatingLang === lang || translatingAll}
              title="Auto-translate this field"
              className="magic-wand"
              icon={translatingLang === lang ? '⏳' : '🪄'}
            />
          );

          return (
            <FormGroup
              key={lang}
              label={lang.toUpperCase()}
              missing={formData[lang] === ''}
            >
              <Textarea 
                value={formData[lang] || ''}
                onChange={(e) => setFormData({ ...formData, [lang]: e.target.value })}
                placeholder={`Translation in ${lang}...`}
                actionButton={magicButton}
              />
            </FormGroup>
          );
        })}
        <div className="form-actions">
          <Button type="submit" variant="primary">Save Translation</Button>
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default Editor;
