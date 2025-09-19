import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RandomButton from '../RandomButton';

describe('RandomButton Component', () => {
  const mockOnClick = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  describe('Visibility and Accessibility (FR-003)', () => {
    test('should be clearly visible and accessible', () => {
      render(<RandomButton onClick={mockOnClick} disabled={false} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();

      // Should have clear, actionable text
      expect(button).toHaveTextContent(/select random menu/i);
    });

    test('should have proper button semantics', () => {
      render(<RandomButton onClick={mockOnClick} disabled={false} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');

      // Should have descriptive aria-label
      expect(button).toHaveAttribute('aria-label');
      expect(button.getAttribute('aria-label')).toMatch(/random.*menu/i);
    });

    test('should be keyboard accessible', async () => {
      render(<RandomButton onClick={mockOnClick} disabled={false} />);

      const button = screen.getByRole('button');

      // Should be focusable
      await user.tab();
      expect(button).toHaveFocus();

      // Should be activatable with Enter key
      await user.keyboard('{Enter}');
      expect(mockOnClick).toHaveBeenCalledTimes(1);

      // Should be activatable with Space key
      await user.keyboard(' ');
      expect(mockOnClick).toHaveBeenCalledTimes(2);
    });

    test('should have proper visual styling for visibility', () => {
      render(<RandomButton onClick={mockOnClick} disabled={false} />);

      const button = screen.getByRole('button');

      // Should have distinguishing CSS classes
      expect(button).toHaveClass(/random-button|primary|btn/);

      // Should have appropriate styling attributes
      expect(button).toHaveStyle('cursor: pointer');
    });
  });

  describe('Click Interaction (FR-004)', () => {
    test('should trigger random selection on click', async () => {
      render(<RandomButton onClick={mockOnClick} disabled={false} />);

      const button = screen.getByRole('button');

      await user.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    test('should respond immediately to clicks (<1s)', async () => {
      render(<RandomButton onClick={mockOnClick} disabled={false} />);

      const button = screen.getByRole('button');

      const startTime = performance.now();
      await user.click(button);
      const clickTime = performance.now() - startTime;

      // Click should register immediately
      expect(clickTime).toBeLessThan(100); // Much less than 1s requirement
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    test('should handle multiple rapid clicks', async () => {
      render(<RandomButton onClick={mockOnClick} disabled={false} />);

      const button = screen.getByRole('button');

      // Simulate rapid clicking
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });

    test('should maintain responsiveness during selection process', async () => {
      const slowMockOnClick = jest.fn(async () => {
        // Simulate some processing time
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      render(<RandomButton onClick={slowMockOnClick} disabled={false} />);

      const button = screen.getByRole('button');

      // Should still be responsive even during processing
      await user.click(button);

      // Button should remain interactive
      expect(button).not.toHaveAttribute('disabled');
      expect(slowMockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled State Handling', () => {
    test('should be disabled when disabled prop is true', () => {
      render(<RandomButton onClick={mockOnClick} disabled={true} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    test('should not trigger onClick when disabled', async () => {
      render(<RandomButton onClick={mockOnClick} disabled={true} />);

      const button = screen.getByRole('button');

      await user.click(button);

      expect(mockOnClick).not.toHaveBeenCalled();
    });

    test('should have appropriate visual styling when disabled', () => {
      render(<RandomButton onClick={mockOnClick} disabled={true} />);

      const button = screen.getByRole('button');

      // Should have disabled styling
      expect(button).toHaveStyle('cursor: not-allowed');
      expect(button).toHaveClass(/disabled/);
    });

    test('should have proper accessibility attributes when disabled', () => {
      render(<RandomButton onClick={mockOnClick} disabled={true} />);

      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('disabled');
    });
  });

  describe('Loading State (FR-008)', () => {
    test('should display loading state when isLoading is true', () => {
      render(
        <RandomButton onClick={mockOnClick} disabled={false} isLoading={true} />
      );

      const button = screen.getByRole('button');

      // Should show loading indicator
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Should have loading text or maintain button text
      expect(button).toHaveTextContent(/selecting|loading|select random menu/i);
    });

    test('should be disabled during loading', () => {
      render(
        <RandomButton onClick={mockOnClick} disabled={false} isLoading={true} />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    test('should not trigger onClick during loading', async () => {
      render(
        <RandomButton onClick={mockOnClick} disabled={false} isLoading={true} />
      );

      const button = screen.getByRole('button');

      await user.click(button);

      expect(mockOnClick).not.toHaveBeenCalled();
    });

    test('should provide appropriate loading feedback', () => {
      render(
        <RandomButton onClick={mockOnClick} disabled={false} isLoading={true} />
      );

      // Should have aria-live region for screen readers
      expect(screen.getByLabelText(/loading|selecting/i)).toBeInTheDocument();

      // Should have visual loading indicator
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('No Menus Available State', () => {
    test('should handle no menus available gracefully', () => {
      render(
        <RandomButton
          onClick={mockOnClick}
          disabled={true}
          noMenusAvailable={true}
        />
      );

      const button = screen.getByRole('button');

      // Should be disabled
      expect(button).toBeDisabled();

      // Should show appropriate text
      expect(button).toHaveTextContent(/no menus available/i);
    });

    test('should provide helpful message when no menus exist', () => {
      render(
        <RandomButton
          onClick={mockOnClick}
          disabled={true}
          noMenusAvailable={true}
        />
      );

      // Should have explanatory text
      expect(screen.getByText(/no menus available/i)).toBeInTheDocument();

      // Should have appropriate aria attributes
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby');
    });
  });

  describe('Visual Feedback and States', () => {
    test('should provide visual feedback on hover', async () => {
      render(<RandomButton onClick={mockOnClick} disabled={false} />);

      const button = screen.getByRole('button');

      await user.hover(button);

      // Should have hover state classes/styles
      expect(button).toHaveClass(/hover|btn-hover/);
    });

    test('should provide visual feedback on focus', async () => {
      render(<RandomButton onClick={mockOnClick} disabled={false} />);

      const button = screen.getByRole('button');

      await user.tab();

      // Should have focus state styling
      expect(button).toHaveFocus();
      expect(button).toHaveClass(/focus|btn-focus/);
    });

    test('should provide visual feedback on active state', async () => {
      render(<RandomButton onClick={mockOnClick} disabled={false} />);

      const button = screen.getByRole('button');

      fireEvent.mouseDown(button);

      // Should have active state styling
      expect(button).toHaveClass(/active|btn-active/);
    });
  });

  describe('Error Handling', () => {
    test('should handle onClick errors gracefully', async () => {
      const errorOnClick = jest.fn(() => {
        throw new Error('Test error');
      });

      // Should not crash the component
      expect(() => {
        render(<RandomButton onClick={errorOnClick} disabled={false} />);
      }).not.toThrow();

      const button = screen.getByRole('button');

      // Clicking should not crash the app
      expect(async () => {
        await user.click(button);
      }).not.toThrow();
    });

    test('should handle missing onClick prop gracefully', () => {
      expect(() => {
        render(<RandomButton disabled={false} />);
      }).not.toThrow();

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Accessibility Compliance (FR-009)', () => {
    test('should meet basic accessibility requirements', () => {
      render(<RandomButton onClick={mockOnClick} disabled={false} />);

      const button = screen.getByRole('button');

      // Should have proper role
      expect(button).toHaveAttribute('role', 'button');

      // Should have accessible name
      expect(button).toHaveAccessibleName();

      // Should be keyboard accessible
      expect(button).toHaveAttribute('tabindex');
    });

    test('should have proper ARIA attributes', () => {
      render(<RandomButton onClick={mockOnClick} disabled={false} />);

      const button = screen.getByRole('button');

      // Should have descriptive aria-label
      expect(button).toHaveAttribute('aria-label');

      // Should communicate button purpose
      const ariaLabel = button.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/random.*menu/i);
    });

    test('should announce state changes to screen readers', () => {
      const { rerender } = render(
        <RandomButton onClick={mockOnClick} disabled={false} />
      );

      // Change to loading state
      rerender(
        <RandomButton onClick={mockOnClick} disabled={false} isLoading={true} />
      );

      // Should have aria-live region for state announcements
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    test('should support high contrast mode', () => {
      render(<RandomButton onClick={mockOnClick} disabled={false} />);

      const button = screen.getByRole('button');

      // Should have sufficient contrast indicators
      expect(button).toHaveStyle('border: solid');

      // Should have focus indicators that work in high contrast
      fireEvent.focus(button);
      expect(button).toHaveStyle('outline: auto');
    });
  });

  describe('Performance and Optimization', () => {
    test('should render efficiently', () => {
      const startTime = performance.now();
      render(<RandomButton onClick={mockOnClick} disabled={false} />);
      const renderTime = performance.now() - startTime;

      // Should render quickly
      expect(renderTime).toBeLessThan(20); // Under 20ms
    });

    test('should handle rapid state changes efficiently', async () => {
      const { rerender } = render(
        <RandomButton onClick={mockOnClick} disabled={false} />
      );

      // Rapid state changes
      for (let i = 0; i < 10; i++) {
        rerender(<RandomButton onClick={mockOnClick} disabled={i % 2 === 0} />);
      }

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Props Validation and Edge Cases', () => {
    test('should handle all prop combinations correctly', () => {
      const propCombinations = [
        { disabled: true, isLoading: false, noMenusAvailable: false },
        { disabled: false, isLoading: true, noMenusAvailable: false },
        { disabled: true, isLoading: false, noMenusAvailable: true },
        { disabled: false, isLoading: false, noMenusAvailable: false },
      ];

      propCombinations.forEach((props) => {
        expect(() => {
          render(<RandomButton onClick={mockOnClick} {...props} />);
        }).not.toThrow();
      });
    });

    test('should maintain consistent behavior across prop changes', async () => {
      const { rerender } = render(
        <RandomButton onClick={mockOnClick} disabled={true} />
      );

      // Change to enabled state
      rerender(<RandomButton onClick={mockOnClick} disabled={false} />);

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();

      // Should be clickable after enabling
      await user.click(button);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration with Parent Components', () => {
    test('should communicate selection events properly', async () => {
      const selectionHandler = jest.fn();

      render(<RandomButton onClick={selectionHandler} disabled={false} />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Should call handler with appropriate parameters
      expect(selectionHandler).toHaveBeenCalledTimes(1);
    });

    test('should work correctly in different container contexts', () => {
      // Test in different container types
      render(
        <div>
          <RandomButton onClick={mockOnClick} disabled={false} />
        </div>
      );

      render(
        <form>
          <RandomButton onClick={mockOnClick} disabled={false} />
        </form>
      );

      // Should render correctly in both contexts
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      buttons.forEach((button) => {
        expect(button).toBeInTheDocument();
      });
    });
  });
});
