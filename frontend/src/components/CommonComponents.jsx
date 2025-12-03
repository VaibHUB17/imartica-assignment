import React from 'react';
import { Spinner, Alert, Button } from 'react-bootstrap';

// Loading Spinner Component
export const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'primary', 
  text = 'Loading...',
  className = '',
  centered = true 
}) => {
  const spinnerSize = size === 'sm' ? 'spinner-border-sm' : '';
  
  if (centered) {
    return (
      <div className={`d-flex flex-column justify-content-center align-items-center py-5 ${className}`}>
        <Spinner animation="border" variant={variant} className={spinnerSize} />
        {text && <div className="mt-2 text-muted">{text}</div>}
      </div>
    );
  }

  return (
    <div className={`d-flex align-items-center ${className}`}>
      <Spinner animation="border" variant={variant} className={spinnerSize} size={size} />
      {text && <span className="ms-2">{text}</span>}
    </div>
  );
};

// Error Message Component
export const ErrorMessage = ({ 
  message, 
  variant = 'danger',
  dismissible = false,
  onRetry,
  retryText = 'Try Again',
  className = ''
}) => {
  return (
    <Alert variant={variant} dismissible={dismissible} className={className}>
      <Alert.Heading className="h6">
        <i className="bi bi-exclamation-triangle me-2"></i>
        Oops! Something went wrong
      </Alert.Heading>
      <p className="mb-0">{message}</p>
      {onRetry && (
        <div className="mt-3">
          <Button variant={`outline-${variant}`} size="sm" onClick={onRetry}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            {retryText}
          </Button>
        </div>
      )}
    </Alert>
  );
};

// Empty State Component
export const EmptyState = ({ 
  icon = 'bi-inbox',
  title = 'No items found',
  description,
  actionButton,
  className = ''
}) => {
  return (
    <div className={`text-center py-5 ${className}`}>
      <i className={`${icon} text-muted mb-3`} style={{ fontSize: '4rem' }}></i>
      <h4 className="text-muted mb-2">{title}</h4>
      {description && (
        <p className="text-muted mb-3">{description}</p>
      )}
      {actionButton && actionButton}
    </div>
  );
};

// Success Message Component
export const SuccessMessage = ({ 
  message, 
  dismissible = true,
  className = '' 
}) => {
  return (
    <Alert variant="success" dismissible={dismissible} className={className}>
      <i className="bi bi-check-circle me-2"></i>
      {message}
    </Alert>
  );
};

// Page Header Component
export const PageHeader = ({ 
  title, 
  subtitle, 
  breadcrumb,
  actions,
  className = '' 
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {breadcrumb && (
        <nav aria-label="breadcrumb" className="mb-2">
          <ol className="breadcrumb">
            {breadcrumb.map((item, index) => (
              <li 
                key={index}
                className={`breadcrumb-item ${index === breadcrumb.length - 1 ? 'active' : ''}`}
              >
                {item.link ? (
                  <a href={item.link}>{item.text}</a>
                ) : (
                  item.text
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <h1 className="h2 mb-1">{title}</h1>
          {subtitle && (
            <p className="text-muted mb-0">{subtitle}</p>
          )}
        </div>
        
        {actions && (
          <div className="d-flex gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

// Confirmation Modal Component
export const ConfirmationModal = ({ 
  show,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false
}) => {
  return (
    <div className={`modal ${show ? 'd-block' : 'd-none'}`} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onCancel}
              disabled={loading}
            ></button>
          </div>
          
          <div className="modal-body">
            <p>{message}</p>
          </div>
          
          <div className="modal-footer">
            <Button 
              variant="secondary" 
              onClick={onCancel}
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button 
              variant={variant}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Loading...
                </>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Search Box Component
export const SearchBox = ({ 
  value = '',
  onChange,
  onSearch,
  placeholder = 'Search...',
  size = 'md',
  className = ''
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="input-group">
        <input
          type="text"
          className={`form-control ${size === 'sm' ? 'form-control-sm' : size === 'lg' ? 'form-control-lg' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button className="btn btn-outline-secondary" type="submit">
          <i className="bi bi-search"></i>
        </button>
      </div>
    </form>
  );
};