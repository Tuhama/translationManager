import React, { useState } from 'react';
import CleanupModal from './CleanupModal';

/**
 * CleanupTool manages the "Clean" button and the associated modal.
 * It encapsulates the state for unused key selection.
 */
const CleanupTool = ({ data, onDeleteMultiple, isDropdownItem = false }) => {
  const [showCleanup, setShowCleanup] = useState(false);
  const [selectedUnused, setSelectedUnused] = useState([]);

  const handleOpen = () => {
    setSelectedUnused(data.unused || []);
    setShowCleanup(true);
  };

  const handleConfirm = async () => {
    if (selectedUnused.length === 0) return;
    try {
      await onDeleteMultiple(selectedUnused);
      setShowCleanup(false);
    } catch (err) {
      console.error('Cleanup failed', err);
    }
  };

  const toggleSelection = (key) => {
    setSelectedUnused(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  };

  if (isDropdownItem) {
    return (
      <>
        <button className="dropdown-item" onClick={handleOpen}>
          <span className="item-icon">🧹</span>
          Clean Unused Keys
        </button>

        <CleanupModal 
          show={showCleanup}
          onClose={() => setShowCleanup(false)}
          data={data}
          selectedUnused={selectedUnused}
          onToggleUnused={toggleSelection}
          onConfirm={handleConfirm}
        />
      </>
    );
  }

  return (
    <>
      <button className="header-btn"
        onClick={handleOpen} 
        title="Remove unused keys"
      >
        🧹 Clean
      </button>

      <CleanupModal 
        show={showCleanup}
        onClose={() => setShowCleanup(false)}
        data={data}
        selectedUnused={selectedUnused}
        onToggleUnused={toggleSelection}
        onConfirm={handleConfirm}
      />
    </>
  );
};

export default CleanupTool;
