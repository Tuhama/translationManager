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
        className="tool-btn icon-text warning" 
        onClick={() => setShowModal(true)}
        title={`${missingCount} keys used in source but missing from files`}
      >
        ⚠️ {missingCount} Missing
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
