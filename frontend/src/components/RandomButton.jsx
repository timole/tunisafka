/**
 * RandomButton Component
 * Button for triggering random menu selection
 */

import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import './RandomButton.css';

const RandomButton = ({
  onClick,
  disabled = false,
  isLoading = false,
  noMenusAvailable = false,
}) => {
  const handleClick = () => {
    if (onClick && !disabled && !isLoading) {
      onClick();
    }
  };

  const handleKeyDown = (event) => {
    if (
      (event.key === 'Enter' || event.key === ' ') &&
      !disabled &&
      !isLoading
    ) {
      event.preventDefault();
      handleClick();
    }
  };

  const getButtonText = () => {
    if (noMenusAvailable) {
      return 'No Menus Available';
    }
    if (isLoading) {
      return 'Selecting...';
    }
    return 'Select Random Menu';
  };

  const getAriaLabel = () => {
    if (noMenusAvailable) {
      return 'No menus available for random selection';
    }
    if (isLoading) {
      return 'Selecting random menu, please wait';
    }
    return 'Select a random menu from available options';
  };

  const isButtonDisabled = disabled || isLoading || noMenusAvailable;

  return (
    <div className='random-button-container'>
      <button
        type='button'
        className={`random-button btn primary ${isLoading ? 'loading' : ''} ${noMenusAvailable ? 'disabled' : ''}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={isButtonDisabled}
        aria-label={getAriaLabel()}
        aria-disabled={isButtonDisabled}
        tabIndex={isButtonDisabled ? -1 : 0}
        style={{
          cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
        }}
      >
        <span className='button-content'>
          {isLoading && (
            <span className='button-spinner'>
              <LoadingSpinner
                isVisible={true}
                size='small'
                type='random-selection'
              />
            </span>
          )}

          <span className='button-text'>{getButtonText()}</span>
        </span>
      </button>

      {isLoading && (
        <div
          className='sr-only'
          role='status'
          aria-live='polite'
          aria-label='Loading random menu selection'
        >
          Selecting random menu...
        </div>
      )}

      {noMenusAvailable && (
        <p className='no-menus-help-text'>
          Menus will appear here when they become available.
        </p>
      )}
    </div>
  );
};

export default RandomButton;
