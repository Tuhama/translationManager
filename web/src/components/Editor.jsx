import React, { useState, useEffect } from 'react';
import { getNestedValue } from '../utils/objectUtils';

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
        <button className="primary-btn" onClick={() => setSelectedKey('')}>
          Create New Translation
        </button>
      </div>
    );
  }

  return (
    <div className="editor-form">
      <h2>{isEditing ? `Edit: ${selectedKey}` : 'Create New Key'}</h2>
      <form onSubmit={handleSubmit}>
        {!isEditing && (
          <div className="form-group">
            <label>Key (use dots for nesting)</label>
            <input 
              name="newKey" 
              type="text" 
              placeholder="e.g. common.buttons.save" 
              required 
              onBlur={handleBlurKey}
            />
          </div>
        )}
        {languages.map(lang => (
          <div className={`form-group ${formData[lang] === '' ? 'missing' : ''}`} key={lang}>
            <label>
              {lang.toUpperCase()}
              {formData[lang] === '' && <span className="missing-label"> (Missing)</span>}
            </label>
            <textarea 
              value={formData[lang] || ''}
              onChange={(e) => setFormData({ ...formData, [lang]: e.target.value })}
              placeholder={`Translation in ${lang}...`}
            />
          </div>
        ))}
        <div className="form-actions">
          <button type="submit" className="primary-btn">Save Translation</button>
          <button type="button" className="secondary-btn" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default Editor;
