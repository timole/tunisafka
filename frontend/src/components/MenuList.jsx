/**
 * MenuList Component
 * Displays a list of menu cards with selection indication
 */

import React from 'react';
import MenuCard from './MenuCard';
import './MenuList.css';

const MenuList = ({ menus }) => {
  // Handle null/undefined menus
  if (!menus || !Array.isArray(menus)) {
    return (
      <div className='menu-list empty' data-testid='menu-list'>
        <p className='no-menus-message'>No menus available at this time.</p>
      </div>
    );
  }

  // Handle empty menus array
  if (menus.length === 0) {
    return (
      <div className='menu-list empty' data-testid='menu-list'>
        <p className='no-menus-message'>No menus available at this time.</p>
      </div>
    );
  }

  return (
    <div
      className='menu-list responsive'
      data-testid='menu-list'
      role='list'
      aria-label='Available menu list'
    >
      <h2 className='menu-list-title'>Available Menus</h2>

      {menus.map((menu) => (
        <div
          key={menu.id}
          role='listitem'
          data-testid={`menu-${menu.id}`}
          className={`menu-list-item ${menu.isSelected ? 'selected' : ''}`}
          aria-label={menu.isSelected ? 'Selected menu' : undefined}
        >
          <MenuCard menu={menu} />
        </div>
      ))}
    </div>
  );
};

export default MenuList;
