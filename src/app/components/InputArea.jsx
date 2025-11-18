'use client';

import { HiShoppingCart } from 'react-icons/hi2';
import { IoSend } from 'react-icons/io5';

export default function InputArea({
  colors,
  isMobile,
  inputMessage,
  setInputMessage,
  handleKeyPress,
  handleSendMessage,
  setShowCart,
  getTotalItems
}) {
  return (
    <div className="px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0" style={{background: colors.background}}>
      <div className="max-w-4xl mx-auto flex justify-center">
        <div className="rounded-full shadow-md border border-green-100 px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 w-full max-w-3xl" style={{background: colors.background}}>
          <button
            onClick={() => setShowCart(true)}
            className="flex-shrink-0 p-2 sm:p-2.5 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors touch-manipulation relative flex items-center justify-center"
            style={{ 
              minWidth: isMobile ? '40px' : '44px',
              minHeight: isMobile ? '40px' : '44px',
              width: isMobile ? '40px' : '44px',
              height: isMobile ? '40px' : '44px'
            }}
          >
            <HiShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
            {getTotalItems() > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {getTotalItems()}
              </span>
            )}
          </button>
          
          <div className="flex-1 relative flex items-center">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about our menu, specials, or anything else..."
              className="w-full resize-none border-0 bg-transparent rounded-full px-3 sm:px-4 py-2 pr-12 sm:pr-14 focus:outline-none max-h-24 sm:max-h-32 font-medium text-sm sm:text-base"
              rows={1}
              style={{
                height: 'auto',
                minHeight: isMobile ? '40px' : '44px',
                maxHeight: isMobile ? '96px' : '128px',
                fontFamily: 'Gebuk, Arial, sans-serif',
                color: colors.text
              }}
              onInput={(e) => {
                const maxHeight = isMobile ? 96 : 128;
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, maxHeight) + 'px';
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="absolute right-1 sm:right-2 p-2 sm:p-2.5 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center touch-manipulation"
              style={{
                minWidth: isMobile ? '36px' : '40px',
                minHeight: isMobile ? '36px' : '40px',
                width: isMobile ? '36px' : '40px',
                height: isMobile ? '36px' : '40px'
              }}
            >
              <IoSend className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


