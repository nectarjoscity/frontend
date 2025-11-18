'use client';

import { memo } from 'react';
import { HiShoppingCart } from 'react-icons/hi2';

function HeaderNav({ colors, theme, setTheme, mode, setShowCart, getTotalItems }) {
  return (
    <div className="px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-50 flex-shrink-0" style={{background: colors.background}}>
      <div className="max-w-4xl mx-auto flex justify-center">
        <nav className="rounded-full shadow-md border border-green-100 px-3 sm:px-6 py-2 sm:py-3" style={{background: colors.background}}>
          <ul className="flex items-center gap-2 sm:gap-3 md:gap-5 text-xs sm:text-sm md:text-base font-medium" style={{fontFamily: 'Gebuk, Arial, sans-serif', color: colors.text}}>
            <li className="px-2 sm:px-3 md:px-4 py-1 sm:py-2 hover:text-white cursor-pointer hidden sm:block" style={{color: colors.text}}>Menu</li>
            <li className="px-2 sm:px-3 md:px-4 py-1 sm:py-2 hover:text-white cursor-pointer hidden md:block" style={{color: colors.text}}>Reservations</li>
            <li className="px-2 sm:px-3 md:px-4 py-1 sm:py-2 hover:text-white cursor-pointer hidden sm:block" style={{color: colors.text}}>Reviews</li>
            <li className="px-2 sm:px-3 md:px-4 py-1 sm:py-2 hover:text-white cursor-pointer" style={{color: colors.text}}>Contact</li>
            <li className="px-2 sm:px-3 md:px-4 py-1 sm:py-2 cursor-pointer" style={{color: colors.text}} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </li>
            {mode === 'shop' && (
              <li className="py-1 sm:py-2">
                <button
                  onClick={() => setShowCart(true)}
                  className="relative p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors flex items-center justify-center"
                  style={{ minWidth: '36px', minHeight: '36px' }}
                
                >
                  <HiShoppingCart className="w-5 h-5" />
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {getTotalItems()}
                    </span>
                  )}
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </div>
  );
}

export default memo(HeaderNav);
