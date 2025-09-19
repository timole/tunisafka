/**
 * ErrorMessage Component
 * Displays user-friendly error messages with retry and dismiss options
 */

import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({
  message,
  type = 'error',
  severity = 'error',
  canRetry = false,
  onRetry = null,
  dismissible = false,
  onDismiss = null,
  errorCode = null,
  timestamp = null,
  showTimestamp = false,
  showErrorCode = false,
  showSuggestions = false,
  userGuidance = null,
  retryLikelihood = null,
}) => {
  if (!message) {
    return null;
  }

  const getIconForSeverity = () => {
    switch (severity) {
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'error':
      default:
        return '❌';
    }
  };

  const getErrorSuggestions = () => {
    if (!showSuggestions) return null;

    const suggestions = {
      network: 'Please check your internet connection and try again.',
      scraping:
        'The university website may be temporarily unavailable. Please try again later.',
      'no-data':
        'No menu data is currently available. Please check back later.',
      server:
        'Our servers are experiencing issues. Please try again in a few minutes.',
      timeout: 'The request timed out. Please try again.',
      maintenance:
        'The service is currently under maintenance. Please check back later.',
    };

    return (
      suggestions[type] ||
      'Please try again or contact support if the problem persists.'
    );
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';

    try {
      const date = new Date(ts);
      return date.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (error) {
      return '';
    }
  };

  const getRetryButtonText = () => {
    if (retryLikelihood === 'high') {
      return 'Try Again';
    } else if (retryLikelihood === 'low') {
      return 'Retry Anyway';
    }
    return 'Retry';
  };

  const getRetryAriaLabel = () => {
    if (type === 'network') {
      return 'Retry loading menu data';
    } else if (type === 'scraping') {
      return 'Retry to load menu';
    }
    return 'Retry';
  };

  // Sanitize message to prevent XSS
  const sanitizeMessage = (text) => {
    if (!text) return '';
    // Simple text-only sanitization - remove HTML tags
    return text.replace(/<[^>]*>/g, '');
  };

  return (
    <div
      className={`error-message ${severity} ${type}`}
      data-testid='error-message'
      role='alert'
      aria-live='assertive'
      aria-atomic='true'
    >
      <div className='error-content'>
        <div className='error-header'>
          <span
            className='error-icon'
            data-testid={`${severity}-icon`}
            aria-hidden='true'
          >
            {getIconForSeverity()}
          </span>

          <div className='error-main'>
            <div className='error-message-text'>{sanitizeMessage(message)}</div>

            {showErrorCode && errorCode && (
              <div className='error-code'>Error Code: {errorCode}</div>
            )}

            {showTimestamp && timestamp && (
              <div className='error-timestamp'>
                {formatTimestamp(timestamp)}
              </div>
            )}
          </div>

          {canRetry && onRetry && (
            <button
              type='button'
              className='retry-button'
              onClick={onRetry}
              aria-label={getRetryAriaLabel()}
            >
              🔄 {getRetryButtonText()}
            </button>
          )}

          {dismissible && onDismiss && (
            <button
              type='button'
              className='error-dismiss'
              onClick={onDismiss}
              aria-label='Close error message'
              title='Dismiss'
            >
              ✕
            </button>
          )}
        </div>

        {(showSuggestions || userGuidance) && (
          <div className='error-suggestions'>
            {userGuidance || getErrorSuggestions()}
          </div>
        )}

        {type === 'stale-data' && (
          <div className='error-suggestions'>
            Try refreshing the page or reload the browser to get fresh data.
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
