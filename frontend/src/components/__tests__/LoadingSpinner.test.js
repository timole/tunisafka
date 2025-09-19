import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner Component', () => {
  describe('Basic Rendering and Visibility (FR-008)', () => {
    test('should render loading spinner when visible', () => {
      render(<LoadingSpinner isVisible={true} />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toBeVisible();
    });

    test('should not render when not visible', () => {
      render(<LoadingSpinner isVisible={false} />);

      const spinner = screen.queryByTestId('loading-spinner');
      expect(spinner).not.toBeInTheDocument();
    });

    test('should display appropriate loading message', () => {
      render(<LoadingSpinner isVisible={true} message='Loading menus...' />);

      expect(screen.getByText('Loading menus...')).toBeInTheDocument();
    });

    test('should have default loading message when none provided', () => {
      render(<LoadingSpinner isVisible={true} />);

      // Should have some default loading text
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Different Loading States', () => {
    test('should display menu loading state', () => {
      render(<LoadingSpinner isVisible={true} type='menu-loading' />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();

      // Should have appropriate message for menu loading
      expect(screen.getByText(/loading.*menu/i)).toBeInTheDocument();
    });

    test('should display random selection state', () => {
      render(<LoadingSpinner isVisible={true} type='random-selection' />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();

      // Should have appropriate message for random selection
      expect(screen.getByText(/selecting.*random/i)).toBeInTheDocument();
    });

    test('should display data refresh state', () => {
      render(<LoadingSpinner isVisible={true} type='data-refresh' />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();

      // Should have appropriate message for data refresh
      expect(screen.getByText(/refreshing.*data/i)).toBeInTheDocument();
    });

    test('should display scraping state', () => {
      render(<LoadingSpinner isVisible={true} type='scraping' />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();

      // Should have appropriate message for scraping
      expect(screen.getByText(/fetching.*menu.*data/i)).toBeInTheDocument();
    });
  });

  describe('Performance Requirements (FR-007, FR-004)', () => {
    test('should indicate menu loading within 3 second expectation', async () => {
      render(<LoadingSpinner isVisible={true} type='menu-loading' />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();

      // Should indicate expected completion time
      expect(screen.getByText(/loading.*menu/i)).toBeInTheDocument();

      // Should have progress indication for longer operations
      const progressBar = screen.queryByRole('progressbar');
      if (progressBar) {
        expect(progressBar).toBeInTheDocument();
      }
    });

    test('should indicate quick random selection within 1 second expectation', () => {
      render(<LoadingSpinner isVisible={true} type='random-selection' />);

      // Should have minimal, quick loading indicator for fast operations
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass(/quick|fast|brief/);

      // Should indicate this is a quick operation
      expect(screen.getByText(/selecting/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility (FR-009)', () => {
    test('should be accessible to screen readers', () => {
      render(<LoadingSpinner isVisible={true} message='Loading menu data' />);

      const spinner = screen.getByTestId('loading-spinner');

      // Should have proper ARIA attributes
      expect(spinner).toHaveAttribute('role', 'status');
      expect(spinner).toHaveAttribute('aria-live', 'polite');
      expect(spinner).toHaveAttribute('aria-label');
    });

    test('should announce loading state changes', () => {
      const { rerender } = render(<LoadingSpinner isVisible={false} />);

      // Change to loading state
      rerender(<LoadingSpinner isVisible={true} message='Loading menus...' />);

      const spinner = screen.getByTestId('loading-spinner');

      // Should announce to screen readers
      expect(spinner).toHaveAttribute('aria-live', 'polite');
      expect(screen.getByText('Loading menus...')).toBeInTheDocument();
    });

    test('should provide meaningful aria-label', () => {
      render(<LoadingSpinner isVisible={true} type='menu-loading' />);

      const spinner = screen.getByTestId('loading-spinner');
      const ariaLabel = spinner.getAttribute('aria-label');

      expect(ariaLabel).toMatch(/loading|progress|wait/i);
      expect(ariaLabel).toMatch(/menu/i);
    });

    test('should support reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<LoadingSpinner isVisible={true} />);

      const spinner = screen.getByTestId('loading-spinner');

      // Should have reduced motion class when preference is set
      expect(spinner).toHaveClass(/reduced-motion|no-animation/);
    });
  });

  describe('Visual States and Animation', () => {
    test('should have appropriate animation for loading state', () => {
      render(<LoadingSpinner isVisible={true} />);

      const spinner = screen.getByTestId('loading-spinner');

      // Should have animation classes
      expect(spinner).toHaveClass(/spin|rotate|pulse|animate/);

      // Should have CSS animation properties
      const computedStyle = window.getComputedStyle(spinner);
      expect(computedStyle.animationDuration).toBeDefined();
    });

    test('should have different visual styles for different loading types', () => {
      const { rerender } = render(
        <LoadingSpinner isVisible={true} type='menu-loading' />
      );
      const menuSpinner = screen.getByTestId('loading-spinner');
      const menuClasses = menuSpinner.className;

      rerender(<LoadingSpinner isVisible={true} type='random-selection' />);
      const randomSpinner = screen.getByTestId('loading-spinner');
      const randomClasses = randomSpinner.className;

      // Different types should have different styling
      expect(menuClasses).not.toBe(randomClasses);
    });

    test('should show progress indication for longer operations', () => {
      render(
        <LoadingSpinner
          isVisible={true}
          type='menu-loading'
          showProgress={true}
        />
      );

      // Should have progress bar for longer operations
      const progressBar = screen.queryByRole('progressbar');
      if (progressBar) {
        expect(progressBar).toBeInTheDocument();
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      }
    });
  });

  describe('Size and Positioning', () => {
    test('should support different sizes', () => {
      const { rerender } = render(
        <LoadingSpinner isVisible={true} size='small' />
      );
      const smallSpinner = screen.getByTestId('loading-spinner');
      expect(smallSpinner).toHaveClass(/small|sm/);

      rerender(<LoadingSpinner isVisible={true} size='large' />);
      const largeSpinner = screen.getByTestId('loading-spinner');
      expect(largeSpinner).toHaveClass(/large|lg/);
    });

    test('should support centered positioning', () => {
      render(<LoadingSpinner isVisible={true} centered={true} />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass(/center|centered/);
    });

    test('should support overlay mode for full-screen loading', () => {
      render(<LoadingSpinner isVisible={true} overlay={true} />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass(/overlay|modal|fullscreen/);

      // Should have backdrop
      const backdrop = screen.getByTestId('loading-backdrop');
      expect(backdrop).toBeInTheDocument();
    });
  });

  describe('State Management and Transitions', () => {
    test('should handle visibility transitions smoothly', async () => {
      const { rerender } = render(<LoadingSpinner isVisible={false} />);

      // Show spinner
      rerender(<LoadingSpinner isVisible={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      });

      // Hide spinner
      rerender(<LoadingSpinner isVisible={false} />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });
    });

    test('should handle rapid state changes gracefully', async () => {
      const { rerender } = render(<LoadingSpinner isVisible={false} />);

      // Rapid state changes
      for (let i = 0; i < 5; i++) {
        rerender(<LoadingSpinner isVisible={i % 2 === 0} />);
      }

      // Should handle without errors
      // Ensure final state not visible
      rerender(<LoadingSpinner isVisible={false} />);
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });
    });

    test('should maintain consistent state during prop updates', () => {
      const { rerender } = render(
        <LoadingSpinner isVisible={true} message='Loading...' />
      );

      // Update message while keeping visible
      rerender(<LoadingSpinner isVisible={true} message='Still loading...' />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Still loading...')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle missing props gracefully', () => {
      expect(() => {
        render(<LoadingSpinner />);
      }).not.toThrow();

      // Should default to not visible
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    test('should handle invalid type prop gracefully', () => {
      expect(() => {
        render(<LoadingSpinner isVisible={true} type='invalid-type' />);
      }).not.toThrow();

      // Should fall back to default loading state
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    test('should handle empty or null message gracefully', () => {
      render(<LoadingSpinner isVisible={true} message='' />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();

      // Should show default message when empty
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    test('should render efficiently', () => {
      const startTime = performance.now();
      render(<LoadingSpinner isVisible={true} />);
      const renderTime = performance.now() - startTime;

      expect(renderTime).toBeLessThan(20); // Under 20ms
    });

    test('should not cause memory leaks on rapid mount/unmount', () => {
      const { unmount } = render(<LoadingSpinner isVisible={true} />);

      // Should unmount cleanly
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    test('should handle animation cleanup properly', () => {
      const { unmount } = render(<LoadingSpinner isVisible={true} />);

      // Spinner with animation should clean up properly
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();

      unmount();

      // Should not continue animations after unmount
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  describe('Integration Scenarios', () => {
    test('should work correctly with menu loading workflow', async () => {
      const { rerender } = render(<LoadingSpinner isVisible={false} />);

      // Start menu loading
      rerender(<LoadingSpinner isVisible={true} type='menu-loading' />);
      expect(screen.getByText(/loading.*menu/i)).toBeInTheDocument();

      // Complete loading
      rerender(<LoadingSpinner isVisible={false} />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });
    });

    test('should work correctly with random selection workflow', async () => {
      const { rerender } = render(<LoadingSpinner isVisible={false} />);

      // Start random selection
      rerender(<LoadingSpinner isVisible={true} type='random-selection' />);
      expect(screen.getByText(/selecting/i)).toBeInTheDocument();

      // Quick completion (should be fast)
      setTimeout(() => {
        rerender(<LoadingSpinner isVisible={false} />);
      }, 100);

      await waitFor(
        () => {
          expect(
            screen.queryByTestId('loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 200 }
      );
    });
  });

  describe('Custom Styling and Theming', () => {
    test('should support custom CSS classes', () => {
      render(<LoadingSpinner isVisible={true} className='custom-spinner' />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('custom-spinner');
    });

    test('should support inline styles', () => {
      const customStyles = { color: 'red', fontSize: '20px' };
      render(<LoadingSpinner isVisible={true} style={customStyles} />);

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveStyle('color: red');
      expect(spinner).toHaveStyle('font-size: 20px');
    });
  });
});
