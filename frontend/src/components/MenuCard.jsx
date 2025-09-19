/**
 * MenuCard Component
 * Displays individual menu information with items and details
 */

import React from 'react';
import './MenuCard.css';

const MenuCard = ({ menu }) => {
  if (!menu) {
    return null;
  }

  const {
    id,
    title,
    description,
    items = [],
    availability,
    isSelected,
    lastUpdated,
  } = menu;

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString;
  };

  const formatDays = (days) => {
    if (!days || !Array.isArray(days) || days.length === 0) {
      return 'Daily';
    }

    if (days.length === 7) {
      return 'Daily';
    }

    if (
      days.length === 5 &&
      days.includes('monday') &&
      days.includes('friday') &&
      !days.includes('saturday') &&
      !days.includes('sunday')
    ) {
      return 'Weekdays';
    }

    const capitalizedDays = days.map(
      (day) => day.charAt(0).toUpperCase() + day.slice(1)
    );

    return capitalizedDays.join(', ');
  };

  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return '';

    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return '';
    }
  };

  return (
    <article
      className={`menu-card responsive ${isSelected ? 'selected' : ''}`}
      data-testid={`menu-card-${id}`}
      aria-label={`Menu: ${title}${isSelected ? ' (selected)' : ''}`}
      aria-describedby={`menu-description-${id}`}
      tabIndex='0'
    >
      {/* Menu Header */}
      <header className='menu-header' data-testid='menu-header'>
        <h3 className='menu-title'>
          {title}
          {isSelected && (
            <span className='selected-badge' aria-label='Selected'>
              ✓ Selected
            </span>
          )}
        </h3>

        {description && (
          <p className='menu-description' id={`menu-description-${id}`}>
            {description}
          </p>
        )}
      </header>

      {/* Menu Body */}
      <div className='menu-body' data-testid='menu-body'>
        {items.length === 0 ? (
          <p className='no-items-message'>No items available in this menu.</p>
        ) : (
          <div className='menu-items'>
            <h4 className='items-title'>Menu Items ({items.length})</h4>

            <ul className='items-list'>
              {items.map((item, index) => (
                <li key={item.id || index} className='menu-item'>
                  <div className='item-main'>
                    <span className='item-name'>{item.name}</span>
                    {item.price && (
                      <span className='item-price'>{item.price}</span>
                    )}
                  </div>

                  {item.description && (
                    <p className='item-description'>{item.description}</p>
                  )}

                  <div className='item-tags'>
                    {(item.dietary || item.dietaryInfo) &&
                      (item.dietary || item.dietaryInfo).length > 0 && (
                        <div
                          className='dietary-tags'
                          aria-label='Dietary information'
                        >
                          {(item.dietary || item.dietaryInfo).map(
                            (diet, idx) => (
                              <span key={idx} className='tag dietary-tag'>
                                {diet}
                              </span>
                            )
                          )}
                        </div>
                      )}

                    {item.allergens && item.allergens.length > 0 && (
                      <div
                        className='allergen-tags'
                        aria-label='Allergen information'
                      >
                        {item.allergens.map((allergen, idx) => (
                          <span key={idx} className='tag allergen-tag'>
                            ⚠️ {allergen}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Menu Footer */}
      <footer className='menu-footer' data-testid='menu-footer'>
        {availability && (
          <div className='availability-info'>
            <h5 className='availability-title'>Availability</h5>

            <div className='availability-details'>
              {availability.startTime && availability.endTime && (
                <span className='time-range'>
                  {formatTime(availability.startTime)} -{' '}
                  {formatTime(availability.endTime)}
                </span>
              )}

              <span className='days-available'>
                {formatDays(availability.days)}
              </span>
            </div>
          </div>
        )}

        {lastUpdated && (
          <div className='last-updated'>
            <small>Updated: {formatLastUpdated(lastUpdated)}</small>
          </div>
        )}
      </footer>

      {/* Selection indicator for screen readers */}
      {isSelected && (
        <div className='sr-only' aria-live='polite'>
          This menu is currently selected
        </div>
      )}
    </article>
  );
};

export default MenuCard;
