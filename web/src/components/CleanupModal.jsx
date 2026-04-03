import React from 'react';

/**
 * Modal to cleanup unused translation keys.
 */
const CleanupModal = ({
  show,
  onClose,
  data,
  selectedUnused,
  onToggleUnused,
  onConfirm
}) => {
  if (!show) return null;

  const allUnused = [...(data.unused || []), ...(data.maybeUsed || [])].sort();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Clean Unused Keys</h3>
          <button className="delete-icon" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p>The following keys were not found as literal strings in your project. Review and select the ones you wish to remove.</p>
          <div className="cleanup-list">
            {allUnused.length === 0 ? (
              <p>No unused keys found.</p>
            ) : (
              allUnused.map(key => (
                <div 
                  key={key} 
                  className={`cleanup-item ${selectedUnused.includes(key) ? 'active' : ''}`}
                  onClick={() => onToggleUnused(key)}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedUnused.includes(key)} 
                    readOnly 
                  />
                  <label>{key}</label>
                  {data.maybeUsed?.includes(key) && (
                    <span className="maybe-used-warning">⚠️ Maybe dynamic</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button 
            className="primary-btn" 
            style={{ background: selectedUnused.length > 0 ? 'var(--red)' : 'var(--text-muted)' }}
            disabled={selectedUnused.length === 0}
            onClick={onConfirm}
          >
            Delete Selected ({selectedUnused.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default CleanupModal;
