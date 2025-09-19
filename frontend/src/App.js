/**
 * Main App Component
 * Root component with state management for the Tunisafka Food Menu app
 */

import React, { useState, useEffect, useCallback } from 'react';
import MenuList from './components/MenuList';
import RandomButton from './components/RandomButton';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import apiService from './services/ApiService';
import './App.css';

function App() {
  // State management
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [randomSelectionLoading, setRandomSelectionLoading] = useState(false);
  const [randomSelectionError, setRandomSelectionError] = useState(null);
  const [randomMealLoading, setRandomMealLoading] = useState(false);
  const [randomMealError, setRandomMealError] = useState(null);

  /**
   * Loads all menus from the API
   */
  const loadMenus = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      console.log('🍽️ Loading menus...');
      const data = await apiService.getMenus();

      // Clear selection state from all menus
      const menusWithoutSelection = data.menus.map((menu) => ({
        ...menu,
        isSelected: false,
      }));

      setMenus(menusWithoutSelection);
      setLastUpdated(data.lastUpdated);

      console.log(`✅ Loaded ${data.menus.length} menus`);
    } catch (err) {
      console.error('❌ Failed to load menus:', err);

      // More detailed error handling
      let errorMessage = 'Failed to load menu data';
      let errorType = 'error';

      if (err.code === 'TIMEOUT_ERROR' || err.message.includes('timeout')) {
        errorMessage =
          'Request timed out. The server might be busy processing menu data.';
        errorType = 'network';
      } else if (
        err.code === 'NETWORK_ERROR' ||
        err.code === 'CONNECTION_ERROR'
      ) {
        errorMessage =
          'Cannot connect to the server. Please check that the backend is running on port 3001.';
        errorType = 'network';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError({
        message: errorMessage,
        code: err.code || 'UNKNOWN_ERROR',
        canRetry: err.retry !== false,
        type: errorType,
      });
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  /**
   * Handles random menu selection
   */
  const handleRandomSelection = useCallback(async () => {
    try {
      setRandomSelectionLoading(true);
      setRandomSelectionError(null);

      console.log('🎲 Selecting random menu...');
      const data = await apiService.getRandomMenu();

      // Update menus to show the selected one
      setMenus((prevMenus) =>
        prevMenus.map((menu) => ({
          ...menu,
          isSelected: menu.id === data.selectedMenu.id,
        }))
      );

      console.log(`✅ Selected random menu: ${data.selectedMenu.title}`);

      // Scroll to the selected menu after a short delay
      setTimeout(() => {
        const selectedElement = document.querySelector(
          '[data-testid*="menu-"].selected'
        );
        if (selectedElement) {
          selectedElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 100);
    } catch (err) {
      console.error('❌ Failed to select random menu:', err);
      setRandomSelectionError({
        message: err.message || 'Failed to select random menu',
        code: err.code || 'UNKNOWN_ERROR',
        canRetry: err.retry !== false,
        type: err.code?.includes('NO_MENUS') ? 'no-data' : 'error',
      });
    } finally {
      setRandomSelectionLoading(false);
    }
  }, []);

  /**
   * Handles random meal (single item) selection
   */
  const handleRandomMealSelection = useCallback(async () => {
    try {
      setRandomMealLoading(true);
      setRandomMealError(null);

      console.log('🥘 Selecting random meal...');
      const data = await apiService.getRandomMeal();

      // Highlight the parent menu of the selected meal
      setMenus((prevMenus) =>
        prevMenus.map((menu) => ({
          ...menu,
          isSelected: menu.id === data.selectedMenuId,
        }))
      );

      console.log(
        `✅ Selected random meal from menu ${data.selectedMenuTitle}: ${data.selectedMeal.name}`
      );
    } catch (err) {
      console.error('❌ Failed to select random meal:', err);
      setRandomMealError({
        message: err.message || 'Failed to select random meal',
        code: err.code || 'UNKNOWN_ERROR',
        canRetry: err.retry !== false,
        type: err.code?.includes('NO_MENUS') ? 'no-data' : 'error',
      });
    } finally {
      setRandomMealLoading(false);
    }
  }, []);

  /**
   * Handles retry for main menu loading
   */
  const handleRetry = useCallback(() => {
    loadMenus(true);
  }, [loadMenus]);

  /**
   * Handles retry for random selection
   */
  const handleRandomRetry = useCallback(() => {
    handleRandomSelection();
  }, [handleRandomSelection]);

  /**
   * Handles error dismissal
   */
  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Handles random selection error dismissal
   */
  const dismissRandomError = useCallback(() => {
    setRandomSelectionError(null);
  }, []);

  /**
   * Clears current selection
   */
  const clearSelection = useCallback(() => {
    setMenus((prevMenus) =>
      prevMenus.map((menu) => ({
        ...menu,
        isSelected: false,
      }))
    );
  }, []);

  /**
   * Refreshes menu data
   */
  const refreshData = useCallback(async () => {
    try {
      console.log('🔄 Refreshing menu data...');
      clearSelection();
      await loadMenus(true);
    } catch (err) {
      // Error is handled by loadMenus
    }
  }, [loadMenus, clearSelection]);

  // Load menus on component mount
  useEffect(() => {
    loadMenus(true);
  }, [loadMenus]);

  // Format last updated time
  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return '';

    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (error) {
      return '';
    }
  };

  return (
    <div className='app'>
      <header className='app-header'>
        <h1 className='app-title'>🍽️ Tunisafka Food Menu</h1>
        <p className='app-subtitle'>
          Discover delicious meals at TTY university cafeteria
        </p>

        {lastUpdated && !loading && (
          <div className='last-updated'>
            <small>Last updated: {formatLastUpdated(lastUpdated)}</small>
            <button
              className='refresh-button'
              onClick={refreshData}
              title='Refresh menu data'
              aria-label='Refresh menu data'
            >
              🔄
            </button>
          </div>
        )}
      </header>

      <main className='app-main'>
        {/* Random Selection Section */}
        <section className='random-selection-section'>
          <h2>Feeling Adventurous?</h2>
          <p>Let us pick a random menu or a single meal for you!</p>

          <RandomButton
            onClick={handleRandomSelection}
            disabled={loading || menus.length === 0}
            isLoading={randomSelectionLoading}
            noMenusAvailable={!loading && menus.length === 0}
          />

          <div style={{ marginTop: '8px' }}>
            <button
              className='clear-selection-button'
              onClick={handleRandomMealSelection}
              disabled={loading || menus.length === 0 || randomMealLoading}
              aria-label='Select a random meal inside a menu'
              title='Select Random Meal'
            >
              {randomMealLoading ? 'Selecting Meal...' : 'Select Random Meal'}
            </button>
          </div>

          {randomSelectionError && (
            <ErrorMessage
              message={randomSelectionError.message}
              type={randomSelectionError.type}
              severity='error'
              canRetry={randomSelectionError.canRetry}
              onRetry={handleRandomRetry}
              dismissible={true}
              onDismiss={dismissRandomError}
              showSuggestions={true}
            />
          )}

          {randomMealError && (
            <ErrorMessage
              message={randomMealError.message}
              type={randomMealError.type}
              severity='error'
              canRetry={randomMealError.canRetry}
              onRetry={handleRandomMealSelection}
              dismissible={true}
              onDismiss={() => setRandomMealError(null)}
              showSuggestions={true}
            />
          )}

          {menus.some((menu) => menu.isSelected) && (
            <div className='selection-actions'>
              <button
                className='clear-selection-button'
                onClick={clearSelection}
                aria-label='Clear current selection'
              >
                Clear Selection
              </button>
            </div>
          )}
        </section>

        {/* Loading State */}
        {loading && (
          <LoadingSpinner
            isVisible={true}
            type='menu-loading'
            size='large'
            centered={true}
            message='Loading delicious menu options...'
          />
        )}

        {/* Error State */}
        {error && !loading && (
          <ErrorMessage
            message={error.message}
            type={error.type}
            severity='error'
            canRetry={error.canRetry}
            onRetry={handleRetry}
            dismissible={true}
            onDismiss={dismissError}
            showSuggestions={true}
            userGuidance={
              error.type === 'network'
                ? 'Please check your internet connection and try again.'
                : error.type === 'scraping'
                  ? 'The university website may be temporarily unavailable. Please try again in a few minutes.'
                  : undefined
            }
          />
        )}

        {/* Menu List */}
        {!loading && !error && (
          <section className='menus-section'>
            <MenuList menus={menus} />
          </section>
        )}

        {/* Empty State */}
        {!loading && !error && menus.length === 0 && (
          <div className='empty-state'>
            <h3>No Menus Available</h3>
            <p>No menu data is currently available. This could be because:</p>
            <ul>
              <li>The cafeteria is closed</li>
              <li>Menus haven't been updated yet</li>
              <li>There's a temporary issue with the data source</li>
            </ul>
            <button className='retry-button primary' onClick={handleRetry}>
              🔄 Try Again
            </button>
          </div>
        )}
      </main>

      <footer className='app-footer'>
        <p>
          Data sourced from{' '}
          <a
            href='https://unisafka.fi/tty/'
            target='_blank'
            rel='noopener noreferrer'
            aria-label='Visit Unisafka TTY website (opens in new tab)'
          >
            unisafka.fi/tty
          </a>
        </p>
        <p>
          <small>
            Menu information is updated in real-time and may change throughout
            the day.
          </small>
        </p>
      </footer>
    </div>
  );
}

export default App;
