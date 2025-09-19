/**
 * MenuItem Model
 * Represents an individual food item within a menu
 */

class MenuItem {
  constructor({
    id,
    name,
    description = '',
    price = '',
    dietary = [],
    allergens = [],
    availability = '',
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.price = price;
    this.dietary = dietary;
    this.allergens = allergens;
    this.availability = availability;

    this.validate();
  }

  /**
   * Validates the menu item data according to business rules
   */
  validate() {
    if (!this.id || typeof this.id !== 'string' || this.id.trim().length === 0) {
      throw new Error('MenuItem ID is required and must be a non-empty string');
    }

    if (!this.name || typeof this.name !== 'string' || this.name.trim().length === 0) {
      throw new Error('MenuItem name is required and must be a non-empty string');
    }

    if (typeof this.description !== 'string') {
      throw new Error('MenuItem description must be a string');
    }

    if (typeof this.price !== 'string') {
      throw new Error('MenuItem price must be a string');
    }

    if (!Array.isArray(this.dietary)) {
      throw new Error('MenuItem dietary must be an array');
    }

    if (!Array.isArray(this.allergens)) {
      throw new Error('MenuItem allergens must be an array');
    }

    if (typeof this.availability !== 'string') {
      throw new Error('MenuItem availability must be a string');
    }
  }

  /**
   * Generates a menu item ID from name
   */
  static generateId(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Creates a MenuItem instance from scraped data
   */
  static fromScrapedData(data) {
    const id = data.id || MenuItem.generateId(data.name);
    
    return new MenuItem({
      id,
      name: data.name,
      description: data.description || '',
      price: data.price || '',
      dietary: Array.isArray(data.dietary) ? data.dietary : [],
      allergens: Array.isArray(data.allergens) ? data.allergens : [],
      availability: data.availability || '',
    });
  }

  /**
   * Returns a plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      dietary: this.dietary,
      allergens: this.allergens,
      availability: this.availability,
    };
  }

  /**
   * Creates a copy of the menu item
   */
  clone() {
    return new MenuItem({
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      dietary: [...this.dietary],
      allergens: [...this.allergens],
      availability: this.availability,
    });
  }

  /**
   * Parses price string to numeric value
   */
  getPriceNumeric() {
    if (!this.price) return 0;
    
    // Extract numeric value from price string (e.g., "€8.90" -> 8.90)
    const match = this.price.match(/(\d+(?:\.\d{2})?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Formats price for display
   */
  getFormattedPrice() {
    if (!this.price) return '';
    
    // If price already has currency symbol, return as is
    if (this.price.includes('€') || this.price.includes('$')) {
      return this.price;
    }
    
    // Otherwise, add euro symbol
    const numeric = this.getPriceNumeric();
    return numeric > 0 ? `€${numeric.toFixed(2)}` : this.price;
  }

  /**
   * Checks if item is vegetarian
   */
  isVegetarian() {
    return this.dietary.some(diet => 
      diet.toLowerCase().includes('vegetarian') || 
      diet.toLowerCase().includes('veggie')
    );
  }

  /**
   * Checks if item is vegan
   */
  isVegan() {
    return this.dietary.some(diet => diet.toLowerCase().includes('vegan'));
  }

  /**
   * Checks if item is gluten-free
   */
  isGlutenFree() {
    return this.dietary.some(diet => 
      diet.toLowerCase().includes('gluten-free') || 
      diet.toLowerCase().includes('gluten free')
    );
  }

  /**
   * Checks if item contains specific allergen
   */
  containsAllergen(allergen) {
    return this.allergens.some(item => 
      item.toLowerCase().includes(allergen.toLowerCase())
    );
  }

  /**
   * Gets all dietary restrictions as a formatted string
   */
  getDietaryString() {
    return this.dietary.join(', ');
  }

  /**
   * Gets all allergens as a formatted string
   */
  getAllergensString() {
    return this.allergens.join(', ');
  }

  /**
   * Sanitizes and cleans scraped data
   */
  static sanitizeScrapedData(data) {
    return {
      name: data.name ? data.name.trim() : '',
      description: data.description ? data.description.trim() : '',
      price: data.price ? data.price.trim() : '',
      dietary: Array.isArray(data.dietary) 
        ? data.dietary.map(item => item.trim()).filter(item => item.length > 0)
        : [],
      allergens: Array.isArray(data.allergens)
        ? data.allergens.map(item => item.trim()).filter(item => item.length > 0)
        : [],
      availability: data.availability ? data.availability.trim() : '',
    };
  }

  /**
   * Validates menu item data structure without creating instance
   */
  static isValidMenuItemData(data) {
    try {
      new MenuItem(data);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Creates multiple menu items from an array of data
   */
  static createMultiple(dataArray) {
    if (!Array.isArray(dataArray)) {
      return [];
    }

    return dataArray
      .map(data => {
        try {
          const sanitized = MenuItem.sanitizeScrapedData(data);
          return MenuItem.fromScrapedData(sanitized);
        } catch (error) {
          console.warn('Failed to create menu item:', error.message, data);
          return null;
        }
      })
      .filter(item => item !== null);
  }

  /**
   * Filters items by dietary restrictions
   */
  static filterByDietary(items, dietaryFilter) {
    if (!dietaryFilter || !Array.isArray(items)) {
      return items;
    }

    return items.filter(item => {
      return item.dietary.some(diet => 
        diet.toLowerCase().includes(dietaryFilter.toLowerCase())
      );
    });
  }

  /**
   * Filters items by price range
   */
  static filterByPriceRange(items, minPrice = 0, maxPrice = Infinity) {
    if (!Array.isArray(items)) {
      return items;
    }

    return items.filter(item => {
      const price = item.getPriceNumeric();
      return price >= minPrice && price <= maxPrice;
    });
  }

  /**
   * Sorts items by price
   */
  static sortByPrice(items, ascending = true) {
    if (!Array.isArray(items)) {
      return items;
    }

    return [...items].sort((a, b) => {
      const priceA = a.getPriceNumeric();
      const priceB = b.getPriceNumeric();
      return ascending ? priceA - priceB : priceB - priceA;
    });
  }
}

module.exports = MenuItem;
