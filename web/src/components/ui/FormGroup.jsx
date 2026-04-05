import React from 'react';

/**
 * Reusable FormGroup component for consistent form field layouts.
 */
const FormGroup = ({ 
  label, 
  children, 
  helpText, 
  error, 
  required = false,
  className = '',
  missing = false 
}) => {
  const groupClasses = [
    'form-group',
    missing && 'missing',
    error && 'error',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={groupClasses}>
      {label && (
        <div className="label-row">
          <label>
            {label}
            {required && <span className="required-indicator"> *</span>}
            {missing && <span className="missing-label"> (Missing)</span>}
          </label>
          {children.props && children.props.actionButton && children.props.actionButton}
        </div>
      )}
      {React.cloneElement(children, {
        className: `${children.props.className || ''} ${error ? 'error' : ''}`.trim()
      })}
      {helpText && <p className="help-text">{helpText}</p>}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
};

/**
 * Input component that works well with FormGroup
 */
export const Input = ({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  onBlur,
  required = false,
  disabled = false,
  className = '',
  actionButton,
  ...props 
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      required={required}
      disabled={disabled}
      className={className}
      actionButton={actionButton}
      {...props}
    />
  );
};

/**
 * Textarea component that works well with FormGroup
 */
export const Textarea = ({ 
  placeholder, 
  value, 
  onChange, 
  rows = 3,
  required = false,
  disabled = false,
  className = '',
  ...props 
}) => {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={rows}
      required={required}
      disabled={disabled}
      className={className}
      {...props}
    />
  );
};

export default FormGroup;