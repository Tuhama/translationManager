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
  missing = false,
  id: providedId
}) => {
  const generatedId = React.useMemo(() => providedId || `field-${Math.random().toString(36).substr(2, 9)}`, [providedId]);
  
  const groupClasses = [
    'form-group',
    missing && 'missing',
    error && 'error',
    className
  ].filter(Boolean).join(' ');

  // Extract actionButton from children if it exists
  const childArray = React.Children.toArray(children);
  const mainChild = childArray[0];
  const actionButton = mainChild?.props?.actionButton;

  return (
    <div className={groupClasses}>
      {label && (
        <div className="label-row">
          <label htmlFor={generatedId}>
            {label}
            {required && <span className="required-indicator"> *</span>}
            {missing && <span className="missing-label"> (Missing)</span>}
          </label>
          {actionButton}
        </div>
      )}
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        
        // Clone child without actionButton and with potential error class and ID
        const { actionButton: _, ...childProps } = child.props;
        return React.cloneElement(child, {
          ...childProps,
          id: child.props.id || generatedId,
          className: `${child.props.className || ''} ${error ? 'error' : ''}`.trim()
        });
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
  actionButton, // Destructured but not passed to input
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
  actionButton, // Destructured but not passed to textarea
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
