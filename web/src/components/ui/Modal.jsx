import React from 'react';
import { createPortal } from 'react-dom';

/**
 * Reusable Modal component with overlay, header, body, and footer sections.
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer, 
  className = '',
  closeOnOverlayClick = true 
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal-content ${className}`} onClick={e => e.stopPropagation()}>
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;