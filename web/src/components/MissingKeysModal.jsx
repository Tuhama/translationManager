import React from 'react';
import Modal from './ui/Modal';

/**
 * Modal to display and manage missing translation keys.
 */
const MissingKeysModal = ({ show, onClose, missingKeys, onSelectKey }) => {
  return (
    <Modal 
      isOpen={show} 
      onClose={onClose} 
      title="⚠️ Keys Missing from Translation Files"
      footer={
        <button className="secondary-btn" onClick={onClose}>Close</button>
      }
    >
      <p className="description">
        The following keys were detected in your source code but are not defined in any of your translation files. These keys need to be created in your translation files.
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
    </Modal>
  );
};

export default MissingKeysModal;
