/**
 * RandomSelectionService
 * Handles random menu selection logic and related functionality
 */

const Menu = require('../models/Menu');

class RandomSelectionService {
  constructor() {
    this.lastSelection = null;
    this.selectionHistory = [];
    this.maxHistorySize = 10;
  }

  /**
   * Selects a random menu from the provided menu list
   */
  selectRandomMenu(menus) {
    if (!Array.isArray(menus) || menus.length === 0) {
      throw new Error('No menus available for random selection');
    }

    // Validate that all items are Menu instances
    const validMenus = menus.filter(menu => menu instanceof Menu);
    if (validMenus.length === 0) {
      throw new Error('No valid menus available for random selection');
    }

    // Select random menu
    const randomIndex = this.generateRandomIndex(validMenus.length);
    const selectedMenu = validMenus[randomIndex];

    // Create a copy to avoid modifying the original
    const selectedMenuCopy = selectedMenu.clone();
    
    // Mark as selected
    selectedMenuCopy.setSelected(true);

    // Update selection history
    this.updateSelectionHistory(selectedMenuCopy.id);

    // Store last selection info
    this.lastSelection = {
      menuId: selectedMenuCopy.id,
      timestamp: new Date().toISOString(),
      totalAvailable: validMenus.length,
    };

    return {
      selectedMenu: selectedMenuCopy,
      totalMenusAvailable: validMenus.length,
      selectionTimestamp: this.lastSelection.timestamp,
    };
  }

  /**
   * Selects a random menu with anti-repetition logic
   */
  selectRandomMenuWithAntiRepeat(menus, avoidRecentCount = 2) {
    if (!Array.isArray(menus) || menus.length === 0) {
      throw new Error('No menus available for random selection');
    }

    const validMenus = menus.filter(menu => menu instanceof Menu);
    if (validMenus.length === 0) {
      throw new Error('No valid menus available for random selection');
    }

    // If we have fewer menus than the avoid count, just do regular selection
    if (validMenus.length <= avoidRecentCount) {
      return this.selectRandomMenu(validMenus);
    }

    // Get recent selections to avoid
    const recentSelections = this.selectionHistory.slice(-avoidRecentCount);
    
    // Filter out recently selected menus
    const availableMenus = validMenus.filter(menu => 
      !recentSelections.includes(menu.id)
    );

    // If all menus were recently selected, fall back to regular selection
    const menusToChooseFrom = availableMenus.length > 0 ? availableMenus : validMenus;

    // Select from filtered list
    const randomIndex = this.generateRandomIndex(menusToChooseFrom.length);
    const selectedMenu = menusToChooseFrom[randomIndex];

    // Create a copy and mark as selected
    const selectedMenuCopy = selectedMenu.clone();
    selectedMenuCopy.setSelected(true);

    // Update selection history
    this.updateSelectionHistory(selectedMenuCopy.id);

    // Store last selection info
    this.lastSelection = {
      menuId: selectedMenuCopy.id,
      timestamp: new Date().toISOString(),
      totalAvailable: validMenus.length,
      availableAfterFiltering: menusToChooseFrom.length,
    };

    return {
      selectedMenu: selectedMenuCopy,
      totalMenusAvailable: validMenus.length,
      selectionTimestamp: this.lastSelection.timestamp,
    };
  }

  /**
   * Selects a random menu from currently available menus only
   */
  selectRandomAvailableMenu(menus) {
    if (!Array.isArray(menus) || menus.length === 0) {
      throw new Error('No menus available for random selection');
    }

    // Filter to only currently available menus
    const availableMenus = menus.filter(menu => 
      menu instanceof Menu && menu.isCurrentlyAvailable()
    );

    if (availableMenus.length === 0) {
      throw new Error('No menus are currently available for selection');
    }

    return this.selectRandomMenu(availableMenus);
  }

  /**
   * Selects a random menu with dietary filter
   */
  selectRandomMenuByDietary(menus, dietaryFilter) {
    if (!Array.isArray(menus) || menus.length === 0) {
      throw new Error('No menus available for random selection');
    }

    // Filter menus that have items matching dietary requirement
    const filteredMenus = menus.filter(menu => {
      if (!(menu instanceof Menu)) return false;
      
      return menu.items.some(item => 
        item.dietary.some(diet => 
          diet.toLowerCase().includes(dietaryFilter.toLowerCase())
        )
      );
    });

    if (filteredMenus.length === 0) {
      throw new Error(`No menus available with dietary requirement: ${dietaryFilter}`);
    }

    return this.selectRandomMenu(filteredMenus);
  }

  /**
   * Generates a cryptographically secure random index
   */
  generateRandomIndex(max) {
    if (max <= 0) {
      throw new Error('Maximum value must be positive');
    }

    if (max === 1) {
      return 0;
    }

    // Use crypto module for better randomness if available
    try {
      const crypto = require('crypto');
      const randomBytes = crypto.randomBytes(4);
      const randomValue = randomBytes.readUInt32BE(0);
      return randomValue % max;
    } catch (error) {
      // Fallback to Math.random() if crypto is not available
      console.warn('Crypto module not available, using Math.random()');
      return Math.floor(Math.random() * max);
    }
  }

  /**
   * Updates the selection history
   */
  updateSelectionHistory(menuId) {
    this.selectionHistory.push(menuId);
    
    // Keep history size manageable
    if (this.selectionHistory.length > this.maxHistorySize) {
      this.selectionHistory = this.selectionHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Gets the last selection information
   */
  getLastSelection() {
    return this.lastSelection;
  }

  /**
   * Gets the selection history
   */
  getSelectionHistory() {
    return [...this.selectionHistory]; // Return copy to prevent modification
  }

  /**
   * Clears the selection history
   */
  clearHistory() {
    this.selectionHistory = [];
    this.lastSelection = null;
  }

  /**
   * Gets selection statistics
   */
  getSelectionStatistics() {
    if (this.selectionHistory.length === 0) {
      return {
        totalSelections: 0,
        uniqueMenus: 0,
        mostSelectedMenu: null,
        selectionFrequency: {},
      };
    }

    const frequency = {};
    this.selectionHistory.forEach(menuId => {
      frequency[menuId] = (frequency[menuId] || 0) + 1;
    });

    const mostSelected = Object.keys(frequency).reduce((a, b) => 
      frequency[a] > frequency[b] ? a : b
    );

    return {
      totalSelections: this.selectionHistory.length,
      uniqueMenus: Object.keys(frequency).length,
      mostSelectedMenu: mostSelected,
      selectionFrequency: frequency,
    };
  }

  /**
   * Validates that randomness is working correctly
   */
  testRandomness(menus, iterations = 100) {
    if (!Array.isArray(menus) || menus.length < 2) {
      throw new Error('Need at least 2 menus to test randomness');
    }

    const validMenus = menus.filter(menu => menu instanceof Menu);
    if (validMenus.length < 2) {
      throw new Error('Need at least 2 valid menus to test randomness');
    }

    const selections = {};
    const originalHistory = [...this.selectionHistory];
    
    // Clear history for testing
    this.clearHistory();

    try {
      // Perform multiple selections
      for (let i = 0; i < iterations; i++) {
        const result = this.selectRandomMenu(validMenus);
        const menuId = result.selectedMenu.id;
        selections[menuId] = (selections[menuId] || 0) + 1;
      }

      // Calculate statistics
      const expectedFrequency = iterations / validMenus.length;
      const tolerance = expectedFrequency * 0.3; // 30% tolerance
      
      const isRandom = Object.values(selections).every(count => 
        Math.abs(count - expectedFrequency) <= tolerance
      );

      return {
        isRandom,
        iterations,
        menuCount: validMenus.length,
        expectedFrequency: Math.round(expectedFrequency * 100) / 100,
        actualFrequencies: selections,
        tolerance: Math.round(tolerance * 100) / 100,
      };

    } finally {
      // Restore original history
      this.selectionHistory = originalHistory;
    }
  }

  /**
   * Creates multiple random selections for comparison
   */
  createMultipleSelections(menus, count = 5) {
    if (!Array.isArray(menus) || menus.length === 0) {
      throw new Error('No menus available for selection');
    }

    const selections = [];
    const originalHistory = [...this.selectionHistory];

    try {
      for (let i = 0; i < count; i++) {
        const result = this.selectRandomMenu(menus);
        selections.push({
          index: i + 1,
          menuId: result.selectedMenu.id,
          menuTitle: result.selectedMenu.title,
          timestamp: result.selectionTimestamp,
        });
      }

      return {
        selections,
        totalMenusAvailable: menus.length,
        requestTimestamp: new Date().toISOString(),
      };

    } finally {
      // Restore original history
      this.selectionHistory = originalHistory;
    }
  }

  /**
   * Gets weighted random selection based on menu characteristics
   */
  selectWeightedRandomMenu(menus, weights = {}) {
    if (!Array.isArray(menus) || menus.length === 0) {
      throw new Error('No menus available for random selection');
    }

    const validMenus = menus.filter(menu => menu instanceof Menu);
    if (validMenus.length === 0) {
      throw new Error('No valid menus available for random selection');
    }

    // Calculate weights for each menu
    const menuWeights = validMenus.map(menu => {
      let weight = weights.baseWeight || 1;

      // Add weight based on item count
      if (weights.itemCountBonus) {
        weight += menu.getItemCount() * weights.itemCountBonus;
      }

      // Add weight based on dietary options
      if (weights.dietaryBonus) {
        weight += menu.getAllDietaryCategories().length * weights.dietaryBonus;
      }

      // Add weight based on current availability
      if (weights.availabilityBonus && menu.isCurrentlyAvailable()) {
        weight += weights.availabilityBonus;
      }

      return Math.max(weight, 0.1); // Ensure minimum weight
    });

    // Select based on weighted probability
    const totalWeight = menuWeights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < validMenus.length; i++) {
      random -= menuWeights[i];
      if (random <= 0) {
        const selectedMenu = validMenus[i].clone();
        selectedMenu.setSelected(true);

        this.updateSelectionHistory(selectedMenu.id);
        this.lastSelection = {
          menuId: selectedMenu.id,
          timestamp: new Date().toISOString(),
          totalAvailable: validMenus.length,
          selectionMethod: 'weighted',
          weight: menuWeights[i],
        };

        return {
          selectedMenu,
          totalMenusAvailable: validMenus.length,
          selectionTimestamp: this.lastSelection.timestamp,
          selectionWeight: menuWeights[i],
        };
      }
    }

    // Fallback to last menu (shouldn't happen with proper weights)
    return this.selectRandomMenu(validMenus);
  }

  /**
   * Sets maximum history size
   */
  setMaxHistorySize(size) {
    this.maxHistorySize = Math.max(1, size);
    
    // Trim current history if needed
    if (this.selectionHistory.length > this.maxHistorySize) {
      this.selectionHistory = this.selectionHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Gets service configuration
   */
  getConfig() {
    return {
      maxHistorySize: this.maxHistorySize,
      currentHistorySize: this.selectionHistory.length,
      lastSelectionTime: this.lastSelection ? this.lastSelection.timestamp : null,
    };
  }
}

module.exports = RandomSelectionService;
