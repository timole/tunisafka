/**
 * Menu Model
 * Represents a complete food menu offering from the university cafeteria
 */

class Menu {
  constructor({
    id,
    title,
    description = '',
    items = [],
    availability = null,
    lastUpdated = null,
    isSelected = false,
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.items = items;
    this.availability = availability;
    this.lastUpdated = lastUpdated || new Date().toISOString();
    this.isSelected = isSelected;

    this.validate();
  }

  /**
   * Validates the menu data according to business rules
   */
  validate() {
    if (!this.id || typeof this.id !== 'string' || this.id.trim().length === 0) {
      throw new Error('Menu ID is required and must be a non-empty string');
    }

    if (!this.title || typeof this.title !== 'string' || this.title.trim().length === 0) {
      throw new Error('Menu title is required and must be a non-empty string');
    }

    if (!Array.isArray(this.items)) {
      throw new Error('Menu items must be an array');
    }

    if (this.availability && !this.isValidAvailability(this.availability)) {
      throw new Error('Menu availability must have valid format');
    }

    if (typeof this.isSelected !== 'boolean') {
      throw new Error('isSelected must be a boolean');
    }
  }

  /**
   * Validates availability object structure
   */
  isValidAvailability(availability) {
    if (!availability || typeof availability !== 'object') {
      return false;
    }

    const { startTime, endTime, days } = availability;

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (startTime && !timeRegex.test(startTime)) {
      return false;
    }
    if (endTime && !timeRegex.test(endTime)) {
      return false;
    }

    // Validate days array
    if (days && Array.isArray(days)) {
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      return days.every(day => validDays.includes(day.toLowerCase()));
    }

    return true;
  }

  /**
   * Generates a menu ID from title
   */
  static generateId(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Creates a Menu instance from scraped data
   */
  static fromScrapedData(data) {
    const id = data.id || Menu.generateId(data.title);
    
    return new Menu({
      id,
      title: data.title,
      description: data.description || '',
      items: data.items || [],
      availability: data.availability,
      lastUpdated: new Date().toISOString(),
      isSelected: false,
    });
  }

  /**
   * Marks this menu as selected and others as not selected
   */
  setSelected(selected = true) {
    this.isSelected = selected;
    return this;
  }

  /**
   * Returns a plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      items: this.items,
      availability: this.availability,
      lastUpdated: this.lastUpdated,
      isSelected: this.isSelected,
    };
  }

  /**
   * Creates a copy of the menu
   */
  clone() {
    return new Menu({
      id: this.id,
      title: this.title,
      description: this.description,
      items: [...this.items],
      availability: this.availability ? { ...this.availability } : null,
      lastUpdated: this.lastUpdated,
      isSelected: this.isSelected,
    });
  }

  /**
   * Checks if menu is currently available based on time and day
   */
  isCurrentlyAvailable() {
    if (!this.availability) {
      return true; // Assume available if no restrictions
    }

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM format

    const { startTime, endTime, days } = this.availability;

    // Check day availability
    if (days && days.length > 0 && !days.includes(currentDay)) {
      return false;
    }

    // Check time availability
    if (startTime && endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    }

    return true;
  }

  /**
   * Gets the number of items in the menu
   */
  getItemCount() {
    return this.items.length;
  }

  /**
   * Gets all dietary categories for items in this menu
   */
  getAllDietaryCategories() {
    const categories = new Set();
    this.items.forEach(item => {
      if (item.dietary && Array.isArray(item.dietary)) {
        item.dietary.forEach(category => categories.add(category));
      }
    });
    return Array.from(categories);
  }

  /**
   * Gets all allergens for items in this menu
   */
  getAllAllergens() {
    const allergens = new Set();
    this.items.forEach(item => {
      if (item.allergens && Array.isArray(item.allergens)) {
        item.allergens.forEach(allergen => allergens.add(allergen));
      }
    });
    return Array.from(allergens);
  }

  /**
   * Validates menu data structure without creating instance
   */
  static isValidMenuData(data) {
    try {
      new Menu(data);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = Menu;
