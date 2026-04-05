import React from 'react';

/**
 * Reusable Alert component for displaying messages with different types.
 */
const Alert = ({ 
  type = 'info', 
  children, 
  onClose, 
  className = '',
  icon,
  ...props 
}) => {
  const typeConfig = {
    success: {
      className: 'alert-success',
      defaultIcon: '✅'
    },
    error: {
      className: 'alert-error',
      defaultIcon: '❌'
    },
    warning: {
      className: 'alert-warning',
      defaultIcon: '⚠️'
    },
    info: {
      className: 'alert-info',
      defaultIcon: 'ℹ️'
    }
  };

  const config = typeConfig[type] || typeConfig.info;
  const alertClasses = [
    'alert',
    config.className,
    className
  ].filter(Boolean).join(' ');

  const displayIcon = icon !== null ? (icon || config.defaultIcon) : null;

  return (
    <div className={alertClasses} {...props}>
      <div className="alert-content">
        {displayIcon && <span className="alert-icon">{displayIcon}</span>}
        <div className="alert-message">{children}</div>
      </div>
      {onClose && (
        <button 
          className="alert-close" 
          onClick={onClose}
          aria-label="Close alert"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default Alert;