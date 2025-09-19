import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MenuList from '../MenuList';

// Mock menu data for testing
const mockMenus = [
  {
    id: 'lunch-menu',
    title: 'Lunch Menu',
    description: 'Daily hot lunch offerings',
    items: [
      {
        id: 'chicken-curry',
        name: 'Chicken Curry',
        description: 'Spicy chicken curry with rice',
        price: '€3.50',
        dietary: ['gluten-free'],
        allergens: ['contains dairy'],
        availability: '',
      },
      {
        id: 'veggie-pasta',
        name: 'Vegetable Pasta',
        description: 'Fresh vegetables with pasta',
        price: '€3.50',
        dietary: ['vegetarian'],
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
  },
  {
    id: 'vegetarian-menu',
    title: 'Vegetarian Menu',
    description: 'Plant-based options',
    items: [
      {
        id: 'veggie-burger',
        name: 'Veggie Burger',
        description: 'House-made veggie patty with fries',
        price: '€3.50',
        dietary: ['vegetarian'],
        allergens: ['contains gluten'],
        availability: '',
      },
    ],
    availability: {
      startTime: '11:00',
      endTime: '15:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    },
    lastUpdated: '2025-09-18T10:30:00Z',
    isSelected: true,
  },
];

const mockEmptyMenus = [];

describe('MenuList Component', () => {
  describe('Display Functionality (FR-002)', () => {
    test('should render all available menus in clear, readable format', () => {
      render(<MenuList menus={mockMenus} />);

      // Should display all menus
      expect(screen.getByText('Lunch Menu')).toBeInTheDocument();
      expect(screen.getByText('Vegetarian Menu')).toBeInTheDocument();

      // Should display menu descriptions
      expect(screen.getByText('Daily hot lunch offerings')).toBeInTheDocument();
      expect(screen.getByText('Plant-based options')).toBeInTheDocument();
    });

    test('should display menu items with names, descriptions, and prices', () => {
      render(<MenuList menus={mockMenus} />);

      // Should display menu item names
      expect(screen.getByText('Chicken Curry')).toBeInTheDocument();
      expect(screen.getByText('Vegetable Pasta')).toBeInTheDocument();
      expect(screen.getByText('Veggie Burger')).toBeInTheDocument();

      // Should display prices - all 3 items have the same price
      expect(screen.getAllByText('€3.50')).toHaveLength(3);

      // Should display descriptions
      expect(
        screen.getByText('Spicy chicken curry with rice')
      ).toBeInTheDocument();
      expect(
        screen.getByText('House-made veggie patty with fries')
      ).toBeInTheDocument();
    });

    test('should display dietary information and allergens', () => {
      render(<MenuList menus={mockMenus} />);

      // Should display dietary information - use getAllBy since "vegetarian" appears in title and tags
      expect(screen.getByText(/gluten-free/i)).toBeInTheDocument();
      expect(screen.getAllByText(/vegetarian/i)).toHaveLength(3); // In title and 2 dietary tags

      // Should display allergen information
      expect(screen.getByText(/contains dairy/i)).toBeInTheDocument();
      expect(screen.getAllByText(/contains gluten/i)).toHaveLength(2); // Both pasta and veggie burger contain gluten
    });

    test('should display availability information', () => {
      render(<MenuList menus={mockMenus} />);

      // Should display time information
      expect(screen.getAllByText(/11:00/)).toHaveLength(2); // Both menus show 11:00
      expect(screen.getByText(/14:00/)).toBeInTheDocument();
      expect(screen.getByText(/15:00/)).toBeInTheDocument();
    });
  });

  describe('Visual Selection Indication (FR-005)', () => {
    test('should visually indicate selected menu', () => {
      render(<MenuList menus={mockMenus} />);

      // Should identify the selected menu container
      const menuListContainer = screen.getByTestId('menu-list');
      expect(menuListContainer).toBeInTheDocument();

      // Selected menu should have visual indication
      const vegetarianMenu = screen.getByTestId('menu-vegetarian-menu');
      expect(vegetarianMenu).toHaveClass('selected');

      // Non-selected menu should not have selection class
      const lunchMenu = screen.getByTestId('menu-lunch-menu');
      expect(lunchMenu).not.toHaveClass('selected');
    });

    test('should apply proper CSS classes for selection state', () => {
      render(<MenuList menus={mockMenus} />);

      // Should have different classes for selected vs non-selected
      const selectedMenu = screen.getByTestId('menu-vegetarian-menu');
      const nonSelectedMenu = screen.getByTestId('menu-lunch-menu');

      expect(selectedMenu.className).toContain('selected');
      expect(nonSelectedMenu.className).not.toContain('selected');
    });

    test('should handle no selection state gracefully', () => {
      const menusWithoutSelection = mockMenus.map((menu) => ({
        ...menu,
        isSelected: false,
      }));

      render(<MenuList menus={menusWithoutSelection} />);

      // Should render without errors when no menu is selected
      expect(screen.getByText('Lunch Menu')).toBeInTheDocument();
      expect(screen.getByText('Vegetarian Menu')).toBeInTheDocument();

      // No menu should have selected class
      const menuItems = screen.getAllByTestId(/menu-/);
      menuItems.forEach((item) => {
        expect(item).not.toHaveClass('selected');
      });
    });
  });

  describe('Empty State Handling', () => {
    test('should display appropriate message when no menus available', () => {
      render(<MenuList menus={mockEmptyMenus} />);

      // Should display empty state message
      expect(screen.getByText(/no menus available/i)).toBeInTheDocument();

      // Should not display any menu items
      expect(screen.queryByText('Lunch Menu')).not.toBeInTheDocument();
    });

    test('should handle undefined/null menus prop gracefully', () => {
      render(<MenuList menus={null} />);

      // Should not crash and should show appropriate message
      expect(screen.getByText(/no menus available/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility (FR-009)', () => {
    test('should have proper semantic structure', () => {
      render(<MenuList menus={mockMenus} />);

      // Should use proper semantic elements - get the main menu list
      const menuList = screen.getByLabelText('Available menu list');
      expect(menuList).toBeInTheDocument();

      // Each menu should be a list item - filter to get only the container divs
      const allElements = screen.getAllByTestId(/^menu-\w+-menu$/);
      const menuContainers = allElements.filter(el => el.tagName === 'DIV');
      expect(menuContainers).toHaveLength(mockMenus.length);
    });

    test('should have proper heading hierarchy', () => {
      render(<MenuList menus={mockMenus} />);

      // Menu titles should be headings
      const menuHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(menuHeadings).toHaveLength(mockMenus.length);
    });

    test('should provide screen reader accessible content', () => {
      render(<MenuList menus={mockMenus} />);

      // Should have descriptive labels
      expect(screen.getByLabelText(/menu list/i)).toBeInTheDocument();

      // Selected menu should be announced
      const selectedMenu = screen.getByLabelText(/selected menu/i);
      expect(selectedMenu).toBeInTheDocument();
    });
  });

  describe('Performance and Rendering', () => {
    test('should render efficiently with large menu lists', () => {
      // Create a larger menu list for performance testing
      const largeMenuList = Array.from({ length: 20 }, (_, index) => ({
        ...mockMenus[0],
        id: `menu-${index}`,
        title: `Menu ${index}`,
        isSelected: index === 5,
      }));

      const startTime = performance.now();
      render(<MenuList menus={largeMenuList} />);
      const renderTime = performance.now() - startTime;

      // Should render reasonably quickly
      expect(renderTime).toBeLessThan(100); // Under 100ms

      // Should display all menus - only count the menu containers, not individual food items
      expect(screen.getAllByTestId(/^menu-menu-/)).toHaveLength(20);
    });

    test('should update efficiently when selection changes', async () => {
      const { rerender } = render(<MenuList menus={mockMenus} />);

      // Change selection
      const updatedMenus = mockMenus.map((menu) => ({
        ...menu,
        isSelected: menu.id === 'lunch-menu',
      }));

      rerender(<MenuList menus={updatedMenus} />);

      await waitFor(() => {
        const selectedMenuContainer = screen.getByTestId('menu-lunch-menu');
        expect(selectedMenuContainer).toHaveClass('selected');
      });
    });
  });

  describe('Data Validation and Error Handling', () => {
    test('should handle malformed menu data gracefully', () => {
      const malformedMenus = [
        {
          id: 'test-menu',
          title: 'Test Menu',
          // Missing some required fields
          items: [],
          isSelected: false,
        },
      ];

      // Should not crash with incomplete data
      expect(() => {
        render(<MenuList menus={malformedMenus} />);
      }).not.toThrow();

      expect(screen.getByText('Test Menu')).toBeInTheDocument();
    });

    test('should handle missing item data gracefully', () => {
      const menusWithMissingItems = [
        {
          ...mockMenus[0],
          items: [
            {
              id: 'incomplete-item',
              name: 'Incomplete Item',
              // Missing other fields
            },
          ],
        },
      ];

      expect(() => {
        render(<MenuList menus={menusWithMissingItems} />);
      }).not.toThrow();

      expect(screen.getByText('Incomplete Item')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('should be responsive to different screen sizes', () => {
      render(<MenuList menus={mockMenus} />);

      const menuList = screen.getByTestId('menu-list');

      // Should have responsive classes
      expect(menuList).toHaveClass(/responsive|grid|flex/);
    });
  });

  describe('Props Validation', () => {
    test('should handle required props correctly', () => {
      // Should work with minimal required props
      const minimalMenus = [
        {
          id: 'minimal-menu',
          title: 'Minimal Menu',
          items: [],
          isSelected: false,
        },
      ];

      expect(() => {
        render(<MenuList menus={minimalMenus} />);
      }).not.toThrow();

      expect(screen.getByText('Minimal Menu')).toBeInTheDocument();
    });

    test('should handle optional props gracefully', () => {
      const menusWithOptionalFields = [
        {
          id: 'full-menu',
          title: 'Full Menu',
          description: 'Complete menu with all fields',
          items: [
            {
              id: 'full-item',
              name: 'Full Item',
              description: 'Complete item',
              price: '€10.00',
              dietary: ['vegan'],
              allergens: ['none'],
              availability: 'All day',
            },
          ],
          availability: {
            startTime: '09:00',
            endTime: '21:00',
            days: [
              'monday',
              'tuesday',
              'wednesday',
              'thursday',
              'friday',
              'saturday',
              'sunday',
            ],
          },
          lastUpdated: '2025-09-18T12:00:00Z',
          isSelected: false,
        },
      ];

      render(<MenuList menus={menusWithOptionalFields} />);

      expect(screen.getByText('Full Menu')).toBeInTheDocument();
      expect(
        screen.getByText('Complete menu with all fields')
      ).toBeInTheDocument();
      expect(screen.getByText('€10.00')).toBeInTheDocument();
    });
  });
});
