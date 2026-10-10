import React from 'react';
import Modal from './ui/Modal';

/**
 * Modal to cleanup unused translation keys.
 */
const CleanupModal = ({
  show,
  onClose,
  data,
  selectedUnused,
  onToggleUnused,
  onConfirm,
  deleting = false
}) => {
  const allUnused = [...(data.unused || []), ...(data.maybeUsed || [])].sort();

  return (
    <Modal
      isOpen={show}
      onClose={deleting ? () => {} : onClose}
      title="Clean Unused Keys"
      closeOnOverlayClick={!deleting}
      footer={
        <>
          <button className="secondary-btn" onClick={onClose} disabled={deleting}>Cancel</button>
          <button 
            className="primary-btn" 
            style={{ background: selectedUnused.length > 0 && !deleting ? 'var(--red)' : 'var(--text-muted)' }}
            disabled={deleting || selectedUnused.length === 0}
            onClick={onConfirm}
          >
            {deleting ? 'Deleting...' : `Delete Selected (${selectedUnused.length})`}
          </button>
        </>
      }
    >
      <p>The following keys were not found as literal strings in your project. Review and select the ones you wish to remove.</p>
      <div className="cleanup-list">
        {allUnused.length === 0 ? (
          <p>No unused keys found.</p>
        ) : (
          allUnused.map(key => (
            <div 
              key={key} 
              className={`cleanup-item ${selectedUnused.includes(key) ? 'active' : ''}`}
              onClick={() => { if (!deleting) onToggleUnused(key); }}
            >
              <input 
                type="checkbox" 
                checked={selectedUnused.includes(key)} 
                readOnly
                disabled={deleting}
              />
              <label>{key}</label>
              {data.maybeUsed?.includes(key) && (
                <span className="maybe-used-warning">⚠️ Maybe dynamic</span>
              )}
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};

export default CleanupModal;
