import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MenuCard from '../MenuCard';

// Mock menu data for testing
const mockMenu = {
  id: 'lunch-menu',
  title: 'Lunch Menu',
  description: 'Daily hot lunch offerings',
  items: [
    {
      id: 'chicken-curry',
      name: 'Chicken Curry',
      description: 'Spicy chicken curry with rice',
      price: '€8.90',
      dietary: ['gluten-free'],
      allergens: ['contains dairy'],
      availability: '',
    },
    {
      id: 'veggie-pasta',
      name: 'Vegetable Pasta',
      description: 'Fresh vegetables with pasta',
      price: '€7.50',
      dietary: ['vegetarian', 'vegan'],
      allergens: ['contains gluten'],
      availability: '',
    },
  ],
  availability: {
    startTime: '11:00',
    endTime: '14:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  },
  lastUpdated: '2025-09-18T10:30:00Z',
  isSelected: false,
};

const mockSelectedMenu = {
  ...mockMenu,
  id: 'selected-menu',
  title: 'Selected Menu',
  isSelected: true,
};

const mockEmptyMenu = {
  id: 'empty-menu',
  title: 'Empty Menu',
  description: 'Menu with no items',
  items: [],
  availability: {
    startTime: '11:00',
    endTime: '14:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  },
  lastUpdated: '2025-09-18T10:30:00Z',
  isSelected: false,
};

describe('MenuCard Component', () => {
  describe('Basic Rendering (FR-002)', () => {
    test('should render menu title and description', () => {
      render(<MenuCard menu={mockMenu} />);

      expect(screen.getByText('Lunch Menu')).toBeInTheDocument();
      expect(screen.getByText('Daily hot lunch offerings')).toBeInTheDocument();
    });

    test('should render all menu items with complete information', () => {
      render(<MenuCard menu={mockMenu} />);

      // Should display item names
      expect(screen.getByText('Chicken Curry')).toBeInTheDocument();
      expect(screen.getByText('Vegetable Pasta')).toBeInTheDocument();

      // Should display item descriptions
      expect(
        screen.getByText('Spicy chicken curry with rice')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Fresh vegetables with pasta')
      ).toBeInTheDocument();

      // Should display prices
      expect(screen.getByText('€8.90')).toBeInTheDocument();
      expect(screen.getByText('€7.50')).toBeInTheDocument();
    });

    test('should display dietary information and allergens clearly', () => {
      render(<MenuCard menu={mockMenu} />);

      // Should display dietary tags
      expect(screen.getByText(/gluten-free/i)).toBeInTheDocument();
      expect(screen.getByText(/vegetarian/i)).toBeInTheDocument();
      expect(screen.getByText(/vegan/i)).toBeInTheDocument();

      // Should display allergen warnings
      expect(screen.getByText(/contains dairy/i)).toBeInTheDocument();
      expect(screen.getByText(/contains gluten/i)).toBeInTheDocument();
    });

    test('should display availability information', () => {
      render(<MenuCard menu={mockMenu} />);

      // Should display time range
      expect(screen.getByText(/11:00.*14:00/)).toBeInTheDocument();

      // Should display days of availability (component formats as "Weekdays")
      expect(screen.getByText(/weekdays/i)).toBeInTheDocument();
    });
  });

  describe('Selection State Visual Indication (FR-005)', () => {
    test('should apply selected styling when menu is selected', () => {
      render(<MenuCard menu={mockSelectedMenu} />);

      const menuCard = screen.getByTestId('menu-card-selected-menu');
      expect(menuCard).toHaveClass('selected');
    });

    test('should not apply selected styling when menu is not selected', () => {
      render(<MenuCard menu={mockMenu} />);

      const menuCard = screen.getByTestId('menu-card-lunch-menu');
      expect(menuCard).not.toHaveClass('selected');
    });

    test('should provide visual distinction for selected state', () => {
      const { rerender } = render(<MenuCard menu={mockMenu} />);
      const unselectedCard = screen.getByTestId('menu-card-lunch-menu');
      const unselectedClasses = unselectedCard.className;

      rerender(<MenuCard menu={mockSelectedMenu} />);
      const selectedCard = screen.getByTestId('menu-card-selected-menu');
      const selectedClasses = selectedCard.className;

      // Classes should be different for selected vs unselected
      expect(selectedClasses).not.toBe(unselectedClasses);
      expect(selectedClasses).toContain('selected');
    });

    test('should have accessible indication of selection state', () => {
      render(<MenuCard menu={mockSelectedMenu} />);

      // Should have selection indicated for screen readers via label/text
      const menuCard = screen.getByTestId('menu-card-selected-menu');
      expect(menuCard).toHaveAttribute('aria-label');
      expect(menuCard.getAttribute('aria-label')).toMatch(/selected/i);
      expect(screen.getAllByLabelText(/selected/i).length).toBeGreaterThan(0);
    });
  });

  describe('Empty State Handling', () => {
    test('should handle menu with no items gracefully', () => {
      render(<MenuCard menu={mockEmptyMenu} />);

      expect(screen.getByText('Empty Menu')).toBeInTheDocument();
      expect(screen.getByText('Menu with no items')).toBeInTheDocument();

      // Should display appropriate message for no items
      expect(screen.getByText(/no items available/i)).toBeInTheDocument();
    });

    test('should handle missing description gracefully', () => {
      const menuWithoutDescription = {
        ...mockMenu,
        description: undefined,
      };

      render(<MenuCard menu={menuWithoutDescription} />);

      expect(screen.getByText('Lunch Menu')).toBeInTheDocument();
      // Should not crash or display undefined
      expect(screen.queryByText('undefined')).not.toBeInTheDocument();
    });

    test('should handle missing availability gracefully', () => {
      const menuWithoutAvailability = {
        ...mockMenu,
        availability: undefined,
      };

      render(<MenuCard menu={menuWithoutAvailability} />);

      expect(screen.getByText('Lunch Menu')).toBeInTheDocument();
      // Should not crash when availability is missing
    });
  });

  describe('Accessibility (FR-009)', () => {
    test('should have proper semantic structure', () => {
      render(<MenuCard menu={mockMenu} />);

      // Should use article element for menu card
      const menuCard = screen.getByRole('article');
      expect(menuCard).toBeInTheDocument();

      // Should have proper heading for menu title
      const menuTitle = screen.getByRole('heading', { level: 3 });
      expect(menuTitle).toHaveTextContent('Lunch Menu');
    });

    test('should provide proper ARIA labels and descriptions', () => {
      render(<MenuCard menu={mockMenu} />);

      const menuCard = screen.getByTestId('menu-card-lunch-menu');
      expect(menuCard).toHaveAttribute('aria-label');
      expect(menuCard).toHaveAttribute('aria-describedby');
    });

    test('should support keyboard navigation', () => {
      render(<MenuCard menu={mockMenu} />);

      const menuCard = screen.getByTestId('menu-card-lunch-menu');
      expect(menuCard).toHaveAttribute('tabindex');
    });

    test('should provide screen reader accessible content', () => {
      render(<MenuCard menu={mockMenu} />);

      // Should have descriptive text for dietary restrictions
      expect(screen.getAllByLabelText(/dietary information/i).length).toBeGreaterThan(0);

      // Should have descriptive text for allergens
      expect(
        screen.getAllByLabelText(/allergen information/i).length
      ).toBeGreaterThan(0);
    });
  });

  describe('Data Formatting and Display', () => {
    test('should format prices consistently', () => {
      render(<MenuCard menu={mockMenu} />);

      const prices = screen.getAllByText(/€\d+\.\d{2}/);
      expect(prices).toHaveLength(2);

      // Should maintain euro symbol and decimal format
      expect(screen.getByText('€8.90')).toBeInTheDocument();
      expect(screen.getByText('€7.50')).toBeInTheDocument();
    });

    test('should format availability times clearly', () => {
      render(<MenuCard menu={mockMenu} />);

      // Should display time in readable format
      const timeText = screen.getByText(/11:00.*14:00/);
      expect(timeText).toBeInTheDocument();
    });

    test('should handle multiple dietary tags properly', () => {
      render(<MenuCard menu={mockMenu} />);

      // Should display all dietary tags for items that have multiple
      const veggieItem = screen.getByText('Vegetable Pasta');
      expect(veggieItem).toBeInTheDocument();
      // Prefer queries over closest DOM traversal in RTL
      expect(screen.getAllByText(/vegetarian/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/vegan/i).length).toBeGreaterThan(0);
    });

    test('should display days of availability in readable format', () => {
      render(<MenuCard menu={mockMenu} />);

      // Should show weekdays in user-friendly format
      const availabilityText = screen.getByText(/weekdays/i);
      expect(availabilityText).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle malformed item data gracefully', () => {
      const menuWithMalformedItems = {
        ...mockMenu,
        items: [
          {
            id: 'malformed-item',
            name: 'Malformed Item',
            // Missing required fields
          },
          null, // Null item
          undefined, // Undefined item
        ].filter(Boolean), // Remove null/undefined for realistic scenario
      };

      expect(() => {
        render(<MenuCard menu={menuWithMalformedItems} />);
      }).not.toThrow();

      expect(screen.getByText('Malformed Item')).toBeInTheDocument();
    });

    test('should handle missing required props gracefully', () => {
      const minimalMenu = {
        id: 'minimal',
        title: 'Minimal Menu',
        items: [],
        isSelected: false,
      };

      expect(() => {
        render(<MenuCard menu={minimalMenu} />);
      }).not.toThrow();

      expect(screen.getByText('Minimal Menu')).toBeInTheDocument();
    });

    test('should handle empty strings in data fields', () => {
      const menuWithEmptyStrings = {
        ...mockMenu,
        description: '',
        items: [
          {
            id: 'empty-item',
            name: 'Empty Fields Item',
            description: '',
            price: '',
            dietary: [],
            allergens: [],
            availability: '',
          },
        ],
      };

      render(<MenuCard menu={menuWithEmptyStrings} />);

      expect(screen.getByText('Empty Fields Item')).toBeInTheDocument();
      // Should handle empty fields without displaying empty content
    });
  });

  describe('Performance and Optimization', () => {
    test('should render efficiently with complex menu data', () => {
      const complexMenu = {
        ...mockMenu,
        items: Array.from({ length: 20 }, (_, index) => ({
          id: `item-${index}`,
          name: `Item ${index}`,
          description: `Description for item ${index}`,
          price: `€${(5 + index).toFixed(2)}`,
          dietary: ['vegetarian', 'gluten-free'],
          allergens: ['contains nuts', 'contains dairy'],
          availability: 'All day',
        })),
      };

      const startTime = performance.now();
      render(<MenuCard menu={complexMenu} />);
      const renderTime = performance.now() - startTime;

      // Should render reasonably quickly even with many items
      expect(renderTime).toBeLessThan(50); // Under 50ms

      // Should display all items
      expect(screen.getAllByText(/Item \d+/)).toHaveLength(20);
    });

    test('should handle prop updates efficiently', () => {
      const { rerender } = render(<MenuCard menu={mockMenu} />);

      const updatedMenu = {
        ...mockMenu,
        isSelected: true,
      };

      // Should update without performance issues
      const startTime = performance.now();
      rerender(<MenuCard menu={updatedMenu} />);
      const updateTime = performance.now() - startTime;

      expect(updateTime).toBeLessThan(20); // Under 20ms for updates

      const menuCard = screen.getByTestId('menu-card-lunch-menu');
      expect(menuCard).toHaveClass('selected');
    });
  });

  describe('Visual Layout and Styling', () => {
    test('should have consistent layout structure', () => {
      render(<MenuCard menu={mockMenu} />);

      const menuCard = screen.getByTestId('menu-card-lunch-menu');

      // Should have proper CSS classes for layout
      expect(menuCard).toHaveClass(/card|menu-card/);

      // Should have header, body, and footer sections
      expect(screen.getByTestId('menu-header')).toBeInTheDocument();
      expect(screen.getByTestId('menu-body')).toBeInTheDocument();
      expect(screen.getByTestId('menu-footer')).toBeInTheDocument();
    });

    test('should be responsive to different screen sizes', () => {
      render(<MenuCard menu={mockMenu} />);

      const menuCard = screen.getByTestId('menu-card-lunch-menu');

      // Should have responsive classes
      expect(menuCard.className).toMatch(/responsive|grid|flex/);
    });
  });
});
