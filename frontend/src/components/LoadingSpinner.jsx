/**
 * LoadingSpinner Component
 * Displays loading states with appropriate messages and animations
 */

import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({
  isVisible = false,
  message = '',
  type = 'default',
  size = 'medium',
  centered = false,
  overlay = false,
  showProgress = false,
  className = '',
  style = {},
}) => {
  if (!isVisible) {
    return null;
  }

  const getDefaultMessage = () => {
    switch (type) {
      case 'menu-loading':
        return 'Loading menu data...';
      case 'random-selection':
        return 'Selecting random menu...';
      case 'data-refresh':
        return 'Refreshing data...';
      case 'scraping':
        return 'Fetching menu data...';
      default:
        return 'Loading...';
    }
  };

  const displayMessage = message || getDefaultMessage();

  const getSpinnerClass = () => {
    const classes = [
      'loading-spinner',
      `spinner-${size}`,
      `spinner-${type}`,
      className,
    ];

    if (centered) classes.push('spinner-centered');
    if (overlay) classes.push('spinner-overlay');
    if (type === 'random-selection') classes.push('quick');

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    )?.matches;
    if (prefersReducedMotion) {
      classes.push('reduced-motion');
    }

    return classes.filter(Boolean).join(' ');
  };

  const SpinnerElement = () => (
    <div className='spinner-animation'>
      <div className='spinner-circle'></div>
      <div className='spinner-circle'></div>
      <div className='spinner-circle'></div>
    </div>
  );

  const ProgressBar = () =>
    showProgress && (
      <div
        className='progress-bar'
        role='progressbar'
        aria-valuemin='0'
        aria-valuemax='100'
        aria-label='Loading progress'
      >
        <div className='progress-fill'></div>
      </div>
    );

  return (
    <>
      {overlay && (
        <div className='loading-backdrop' data-testid='loading-backdrop' />
      )}

      <div
        className={getSpinnerClass()}
        data-testid='loading-spinner'
        role='status'
        aria-live='polite'
        aria-label={displayMessage}
        style={style}
      >
        <SpinnerElement />

        {displayMessage && (
          <div className='spinner-message'>{displayMessage}</div>
        )}

        <ProgressBar />
      </div>
    </>
  );
};

export default LoadingSpinner;
