import React, { useState } from 'react';
import MissingKeysModal from './MissingKeysModal';

/**
 * Tool for managing and viewing missing translation keys.
 * Shows a badge if missing keys are detected.
 */
const MissingKeysTool = ({ data, onSelectKey }) => {
  const [showModal, setShowModal] = useState(false);
  const missingCount = data.missingFromFiles?.length || 0;

  if (missingCount === 0) return null;

  return (
    <>
      <button 
        className="warning-badge" 
        onClick={() => setShowModal(true)}
        title={`${missingCount} keys used in source code but missing from translation files`}
      >
        <span>⚠️</span>
        <span>{missingCount} Missing Keys</span>
      </button>

      {showModal && (
        <MissingKeysModal 
          show={showModal}
          onClose={() => setShowModal(false)}
          missingKeys={data.missingFromFiles}
          onSelectKey={onSelectKey}
        />
      )}
    </>
  );
};

export default MissingKeysTool;
