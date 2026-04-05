import React from 'react';

/**
 * Reusable Button component with consistent styling and loading states.
 */
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  loading = false, 
  disabled = false, 
  onClick, 
  type = 'button',
  className = '',
  icon,
  loadingText,
  ...props 
}) => {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'primary-btn',
    secondary: 'secondary-btn',
    icon: 'icon-btn',
    close: 'close-btn',
    magic: 'magic-btn'
  };
  
  const sizeClasses = {
    small: 'btn-small',
    medium: '',
    large: 'btn-large'
  };

  const buttonClasses = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size],
    className
  ].filter(Boolean).join(' ');

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <>
          {icon && <span className="btn-icon">⏳</span>}
          {loadingText || 'Loading...'}
        </>
      ) : (
        <>
          {icon && <span className="btn-icon">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;