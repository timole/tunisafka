# Data Model: Tunisafka Food Menu App

**Feature**: Menu display and random selection  
**Date**: 2025-09-18  
**Status**: Complete

## Core Entities

### Menu
Represents a complete food menu offering from the university cafeteria.

**Fields**:
- `id`: String - Unique identifier for the menu (generated from title)
- `title`: String - Display name of the menu (e.g., "Lunch Menu", "Vegetarian Options")
- `description`: String - Brief description of the menu category
- `items`: Array<MenuItem> - List of food items in this menu
- `availability`: Object - When this menu is available
  - `startTime`: String - Start time (e.g., "11:00")
  - `endTime`: String - End time (e.g., "14:00")
  - `days`: Array<String> - Days of week available
- `lastUpdated`: Date - When this menu data was last scraped
- `isSelected`: Boolean - Whether this menu is currently randomly selected (UI state)

**Validation Rules**:
- `title` is required and must be non-empty string
- `items` array must contain at least one MenuItem
- `availability.startTime` and `endTime` must be valid time strings (HH:MM format)
- `availability.days` must contain valid day names or be empty

**Example**:
```json
{
  "id": "lunch-menu",
  "title": "Lunch Menu",
  "description": "Daily hot lunch offerings",
  "items": [
    {
      "id": "chicken-curry",
      "name": "Chicken Curry",
      "description": "Spicy chicken curry with rice",
      "price": "€8.90",
      "dietary": ["gluten-free"],
      "allergens": ["contains dairy"]
    }
  ],
  "availability": {
    "startTime": "11:00",
    "endTime": "14:00",
    "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
  },
  "lastUpdated": "2025-09-18T10:30:00Z",
  "isSelected": false
}
```

### MenuItem
Individual food item within a menu.

**Fields**:
- `id`: String - Unique identifier for the menu item (generated from name)
- `name`: String - Display name of the food item
- `description`: String - Detailed description of the dish
- `price`: String - Price as displayed on source website (includes currency symbol)
- `dietary`: Array<String> - Dietary categories (e.g., "vegetarian", "vegan", "gluten-free")
- `allergens`: Array<String> - Allergen information
- `availability`: String - Additional availability notes if different from menu

**Validation Rules**:
- `name` is required and must be non-empty string
- `price` should follow format "€X.XX" but accepts any string (source format may vary)
- `dietary` and `allergens` arrays may be empty
- `description` may be empty if not available from source

**Example**:
```json
{
  "id": "salmon-pasta",
  "name": "Salmon Pasta",
  "description": "Creamy pasta with fresh salmon and dill",
  "price": "€9.50",
  "dietary": ["pescatarian"],
  "allergens": ["contains gluten", "contains dairy", "contains fish"],
  "availability": ""
}
```

### ScrapingResult
Represents the result of a scraping operation from the source website.

**Fields**:
- `timestamp`: Date - When the scraping was performed
- `success`: Boolean - Whether scraping was successful
- `menusFound`: Number - Number of menus successfully parsed
- `source`: String - Source URL that was scraped
- `error`: String - Error message if scraping failed (null if successful)
- `duration`: Number - How long scraping took in milliseconds

**Validation Rules**:
- `timestamp` is required and must be valid Date
- `success` is required boolean
- If `success` is false, `error` must be non-empty string
- If `success` is true, `menusFound` must be greater than 0
- `duration` must be positive number

**Example Success**:
```json
{
  "timestamp": "2025-09-18T10:30:00Z",
  "success": true,
  "menusFound": 3,
  "source": "https://unisafka.fi/tty/",
  "error": null,
  "duration": 1250
}
```

**Example Failure**:
```json
{
  "timestamp": "2025-09-18T10:30:00Z",
  "success": false,
  "menusFound": 0,
  "source": "https://unisafka.fi/tty/",
  "error": "Website timeout after 5000ms",
  "duration": 5000
}
```

## State Management

### Frontend State Structure
```javascript
{
  menus: Array<Menu>,           // All available menus
  selectedMenuId: String|null,  // Currently selected menu ID
  loading: Boolean,             // Whether data is being fetched
  error: String|null,          // Current error message
  lastUpdated: Date|null       // When data was last refreshed
}
```

### State Transitions
1. **Initial Load**: `loading: true` → Fetch menus → `loading: false, menus: [...], error: null`
2. **Refresh Data**: `loading: true` → Fetch menus → Update menus or set error
3. **Random Selection**: Update `selectedMenuId` + update `isSelected` flags on menu objects
4. **Error State**: Set `error` message, clear `loading`, maintain existing `menus`

## Data Flow

### Scraping to Display Flow
1. **Backend**: Scrape unisafka.fi/tty/ using Cheerio
2. **Backend**: Parse HTML into Menu and MenuItem objects
3. **Backend**: Validate data structure and handle parsing errors
4. **API**: Return Menu array with ScrapingResult metadata
5. **Frontend**: Update state with new menu data
6. **Frontend**: Render menu list with current selection state

### Random Selection Flow
1. **Frontend**: User clicks "Select Random Menu" button
2. **Frontend**: Filter available menus (exclude already selected if desired)
3. **Frontend**: Generate random index within valid menu array
4. **Frontend**: Update state with new selectedMenuId
5. **Frontend**: Update UI to highlight selected menu

## Error Handling

### Data Validation
- Invalid menu data is filtered out during parsing
- Partial menu data is accepted (missing descriptions, etc.)
- Complete parsing failure results in empty menu array with error message

### Network Errors
- Scraping timeouts result in cached data (if available) with error notice
- Network failures show appropriate user message
- Retry logic attempts to recover from temporary failures

### UI Error States
- Loading state shows spinner with descriptive text
- Error state shows user-friendly message with retry option
- Empty state (no menus) shows appropriate message

## Performance Considerations

### Data Size
- Typical menu data: ~5-10 menus, ~5-20 items each
- JSON payload: < 50KB typical, < 100KB maximum
- No pagination needed for current scale

### Caching Strategy
- No persistent caching (per requirements)
- In-memory caching during user session only
- Fresh scraping on each server restart

### Update Frequency
- Real-time updates on user request
- No automatic polling (user-initiated only)
- Debounced refresh requests (2-second minimum interval)
