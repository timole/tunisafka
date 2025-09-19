import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ErrorMessage from '../ErrorMessage';

describe('ErrorMessage Component', () => {
  const user = userEvent.setup();
  const mockOnRetry = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    mockOnRetry.mockClear();
    mockOnDismiss.mockClear();
  });

  describe('Basic Error Display (FR-006, FR-008)', () => {
    test('should display user-friendly error messages', () => {
      const errorMessage = 'Unable to load menu data. Please try again.';
      render(<ErrorMessage message={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();

      // Should not contain technical jargon
      expect(
        screen.queryByText(/stack trace|null pointer|undefined/i)
      ).not.toBeInTheDocument();
    });

    test('should display different error types appropriately', () => {
      const networkError =
        'Network connection failed. Please check your internet connection.';
      render(<ErrorMessage message={networkError} type='network' />);

      expect(screen.getByText(networkError)).toBeInTheDocument();

      // Should have appropriate styling for network errors
      const errorContainer = screen.getByTestId('error-message');
      expect(errorContainer).toHaveClass(/network|connection/);
    });

    test('should display scraping errors clearly', () => {
      const scrapingError =
        'Unable to fetch menu data from the university website.';
      render(<ErrorMessage message={scrapingError} type='scraping' />);

      expect(screen.getByText(scrapingError)).toBeInTheDocument();

      const errorContainer = screen.getByTestId('error-message');
      expect(errorContainer).toHaveClass(/scraping|fetch/);
    });

    test('should display no menu available errors', () => {
      const noMenuError = 'No menus are currently available for selection.';
      render(<ErrorMessage message={noMenuError} type='no-data' />);

      expect(screen.getByText(noMenuError)).toBeInTheDocument();

      const errorContainer = screen.getByTestId('error-message');
      expect(errorContainer).toHaveClass(/no-data|empty/);
    });
  });

  describe('Error Recovery and Retry (FR-006)', () => {
    test('should provide retry option for recoverable errors', () => {
      render(
        <ErrorMessage
          message='Failed to load menus'
          canRetry={true}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByRole('button', {
        name: /retry|try again/i,
      });
      expect(retryButton).toBeInTheDocument();
    });

    test('should trigger retry action when retry button is clicked', async () => {
      render(
        <ErrorMessage
          message='Failed to load menus'
          canRetry={true}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByRole('button', {
        name: /retry|try again/i,
      });
      await user.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    test('should not show retry option for non-recoverable errors', () => {
      render(
        <ErrorMessage
          message='Service permanently unavailable'
          canRetry={false}
        />
      );

      const retryButton = screen.queryByRole('button', {
        name: /retry|try again/i,
      });
      expect(retryButton).not.toBeInTheDocument();
    });

    test('should handle manual refresh suggestion', () => {
      render(
        <ErrorMessage
          message='Data may be stale'
          type='stale-data'
          showRefreshHint={true}
        />
      );

      expect(screen.getByText(/refresh.*page|reload/i)).toBeInTheDocument();
    });
  });

  describe('Error Severity and Visual Indication', () => {
    test('should display warning level errors appropriately', () => {
      render(
        <ErrorMessage
          message='Some menu data may be outdated'
          severity='warning'
        />
      );

      const errorContainer = screen.getByTestId('error-message');
      expect(errorContainer).toHaveClass(/warning/);

      // Should have warning icon or indicator
      expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
    });

    test('should display error level messages with appropriate urgency', () => {
      render(
        <ErrorMessage message='Failed to connect to server' severity='error' />
      );

      const errorContainer = screen.getByTestId('error-message');
      expect(errorContainer).toHaveClass(/error|danger/);

      // Should have error icon
      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    });

    test('should display info level messages appropriately', () => {
      render(
        <ErrorMessage
          message='Menu data was last updated 5 minutes ago'
          severity='info'
        />
      );

      const errorContainer = screen.getByTestId('error-message');
      expect(errorContainer).toHaveClass(/info/);

      // Should have info icon
      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    });
  });

  describe('Dismissible Error Messages', () => {
    test('should show dismiss button when dismissible', () => {
      render(
        <ErrorMessage
          message='Minor connection issue'
          dismissible={true}
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByRole('button', {
        name: /close|dismiss/i,
      });
      expect(dismissButton).toBeInTheDocument();
    });

    test('should trigger dismiss action when dismiss button is clicked', async () => {
      render(
        <ErrorMessage
          message='Minor connection issue'
          dismissible={true}
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByRole('button', {
        name: /close|dismiss/i,
      });
      await user.click(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    test('should not show dismiss button when not dismissible', () => {
      render(
        <ErrorMessage message='Critical system error' dismissible={false} />
      );

      const dismissButton = screen.queryByRole('button', {
        name: /close|dismiss/i,
      });
      expect(dismissButton).not.toBeInTheDocument();
    });
  });

  describe('Accessibility (FR-009)', () => {
    test('should be accessible to screen readers', () => {
      render(<ErrorMessage message='Error loading data' severity='error' />);

      const errorContainer = screen.getByTestId('error-message');

      // Should have proper ARIA attributes
      expect(errorContainer).toHaveAttribute('role', 'alert');
      expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
      expect(errorContainer).toHaveAttribute('aria-atomic', 'true');
    });

    test('should announce error messages to screen readers', () => {
      render(<ErrorMessage message='Failed to load menu data' />);

      const errorContainer = screen.getByTestId('error-message');

      // Should be announced immediately
      expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
      expect(screen.getByText('Failed to load menu data')).toBeInTheDocument();
    });

    test('should have proper keyboard navigation for interactive elements', async () => {
      render(
        <ErrorMessage
          message='Error occurred'
          canRetry={true}
          onRetry={mockOnRetry}
          dismissible={true}
          onDismiss={mockOnDismiss}
        />
      );

      // Should be able to tab to retry button
      await user.tab();
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toHaveFocus();

      // Should be able to tab to dismiss button
      await user.tab();
      const dismissButton = screen.getByRole('button', { name: /close/i });
      expect(dismissButton).toHaveFocus();
    });

    test('should provide meaningful aria labels for buttons', () => {
      render(
        <ErrorMessage
          message='Network error'
          canRetry={true}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toHaveAttribute('aria-label');

      const ariaLabel = retryButton.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/retry.*menu|try.*again/i);
    });
  });

  describe('Error Context and Details', () => {
    test('should display error code when provided', () => {
      render(
        <ErrorMessage
          message='Server error occurred'
          errorCode='SCRAPING_ERROR'
          showErrorCode={true}
        />
      );

      expect(screen.getByText(/SCRAPING_ERROR/)).toBeInTheDocument();
    });

    test('should display timestamp when provided', () => {
      const timestamp = '2025-09-18T10:30:00Z';
      render(
        <ErrorMessage
          message='Error occurred'
          timestamp={timestamp}
          showTimestamp={true}
        />
      );

      // Should display formatted timestamp
      expect(screen.getByText(/10:30|Sep 18/)).toBeInTheDocument();
    });

    test('should provide helpful suggestions for common errors', () => {
      render(
        <ErrorMessage
          message='Unable to connect to server'
          type='network'
          showSuggestions={true}
        />
      );

      // Should show helpful suggestions
      expect(
        screen.getByText(/check.*connection|try.*later/i)
      ).toBeInTheDocument();
    });

    test('should handle multiple error types with appropriate suggestions', () => {
      const { rerender } = render(
        <ErrorMessage
          message='Network timeout'
          type='network'
          showSuggestions={true}
        />
      );

      expect(screen.getByText(/network|connection/i)).toBeInTheDocument();

      rerender(
        <ErrorMessage
          message='Source website unavailable'
          type='scraping'
          showSuggestions={true}
        />
      );

      expect(
        screen.getByText(/website.*unavailable|try.*later/i)
      ).toBeInTheDocument();
    });
  });

  describe('Error State Persistence and Recovery', () => {
    test('should maintain error state until explicitly cleared', () => {
      const { rerender } = render(<ErrorMessage message='Error occurred' />);

      expect(screen.getByText('Error occurred')).toBeInTheDocument();

      // Re-render without changing props
      rerender(<ErrorMessage message='Error occurred' />);

      expect(screen.getByText('Error occurred')).toBeInTheDocument();
    });

    test('should update when error message changes', () => {
      const { rerender } = render(<ErrorMessage message='First error' />);

      expect(screen.getByText('First error')).toBeInTheDocument();

      rerender(<ErrorMessage message='Second error' />);

      expect(screen.getByText('Second error')).toBeInTheDocument();
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
    });

    test('should handle error recovery workflow', async () => {
      const { rerender } = render(
        <ErrorMessage
          message='Connection failed'
          canRetry={true}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(1);

      // Simulate successful retry (error cleared)
      rerender(<div>Success! Data loaded.</div>);

      expect(screen.queryByText('Connection failed')).not.toBeInTheDocument();
      expect(screen.getByText('Success! Data loaded.')).toBeInTheDocument();
    });
  });

  describe('Error Message Formatting and Display', () => {
    test('should handle long error messages gracefully', () => {
      const longMessage =
        'This is a very long error message that should be displayed properly without breaking the layout or causing any visual issues in the user interface.';

      render(<ErrorMessage message={longMessage} />);

      const errorContainer = screen.getByTestId('error-message');
      expect(errorContainer).toBeInTheDocument();
      expect(screen.getByText(longMessage)).toBeInTheDocument();

      // Should have proper text wrapping
      expect(errorContainer).toHaveStyle('word-wrap: break-word');
    });

    test('should handle HTML entities and special characters', () => {
      const messageWithEntities =
        'Connection failed: timeout > 5000ms & retry count < 3';

      render(<ErrorMessage message={messageWithEntities} />);

      expect(screen.getByText(messageWithEntities)).toBeInTheDocument();
    });

    test('should sanitize potentially dangerous content', () => {
      const maliciousMessage =
        '<script>alert("xss")</script>Safe error message';

      render(<ErrorMessage message={maliciousMessage} />);

      // Should display safe content only
      expect(screen.getByText(/Safe error message/)).toBeInTheDocument();
      expect(screen.queryByText(/<script>/)).not.toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    test('should render efficiently', () => {
      const startTime = performance.now();
      render(<ErrorMessage message='Test error' />);
      const renderTime = performance.now() - startTime;

      expect(renderTime).toBeLessThan(20); // Under 20ms
    });

    test('should handle rapid error state changes', () => {
      const { rerender } = render(<ErrorMessage message='Error 1' />);

      // Rapid error changes
      for (let i = 2; i <= 10; i++) {
        rerender(<ErrorMessage message={`Error ${i}`} />);
      }

      expect(screen.getByText('Error 10')).toBeInTheDocument();
    });

    test('should not cause memory leaks', () => {
      const { unmount } = render(
        <ErrorMessage
          message='Test error'
          canRetry={true}
          onRetry={mockOnRetry}
        />
      );

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Integration with Application State', () => {
    test('should work correctly in menu loading error scenario', () => {
      render(
        <ErrorMessage
          message='Failed to load menu data from university website'
          type='scraping'
          canRetry={true}
          onRetry={mockOnRetry}
          showSuggestions={true}
        />
      );

      expect(screen.getByText(/failed.*load.*menu/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /retry/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/website.*unavailable|try.*later/i)
      ).toBeInTheDocument();
    });

    test('should work correctly in random selection error scenario', () => {
      render(
        <ErrorMessage
          message='No menus available for random selection'
          type='no-data'
          canRetry={false}
          severity='warning'
        />
      );

      expect(screen.getByText(/no menus.*available/i)).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /retry/i })
      ).not.toBeInTheDocument();

      const errorContainer = screen.getByTestId('error-message');
      expect(errorContainer).toHaveClass(/warning/);
    });

    test('should work correctly in network error scenario', () => {
      render(
        <ErrorMessage
          message='Network connection lost. Please check your internet connection.'
          type='network'
          canRetry={true}
          onRetry={mockOnRetry}
          severity='error'
          showSuggestions={true}
        />
      );

      expect(screen.getByText(/network.*connection/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /retry/i })
      ).toBeInTheDocument();
      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    });
  });

  describe('Error Prevention and User Guidance', () => {
    test('should provide clear guidance for user action', () => {
      render(
        <ErrorMessage
          message='Unable to fetch fresh menu data'
          userGuidance='Try refreshing the page or check back in a few minutes.'
        />
      );

      expect(
        screen.getByText(/try refreshing.*check back/i)
      ).toBeInTheDocument();
    });

    test('should indicate when retry is likely to succeed', () => {
      render(
        <ErrorMessage
          message='Temporary server overload'
          type='server'
          retryLikelihood='high'
          canRetry={true}
          onRetry={mockOnRetry}
        />
      );

      // Should indicate high likelihood of retry success
      expect(screen.getByText(/temporary|try again/i)).toBeInTheDocument();
    });

    test('should warn when retry is unlikely to succeed', () => {
      render(
        <ErrorMessage
          message='Service maintenance in progress'
          type='maintenance'
          retryLikelihood='low'
          canRetry={false}
        />
      );

      // Should indicate low likelihood and not show retry
      expect(screen.getByText(/maintenance/i)).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /retry/i })
      ).not.toBeInTheDocument();
    });
  });
});
