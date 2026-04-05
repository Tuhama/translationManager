import React from 'react';
import { createPortal } from 'react-dom';

/**
 * Modal to display and manage missing translation keys.
 */
const MissingKeysModal = ({ show, onClose, missingKeys, onSelectKey }) => {
  if (!show) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚠️ Missing Translation Keys</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <p className="description">
            The following keys were detected in your source code but are not defined in any of your translation files.
          </p>
          <div className="warning-box">
             <strong>Note:</strong> Dynamic keys (e.g. <code>t(variable)</code>) or keys constructed at runtime may not be detected by this scanner.
          </div>
          <ul className="missing-keys-list">
            {missingKeys.map(key => (
              <li key={key} className="missing-key-item">
                <span className="key-path">{key}</span>
                <button 
                  className="primary-btn sm" 
                  onClick={() => {
                    onSelectKey(key);
                    onClose();
                  }}
                >
                  Create
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MissingKeysModal;
