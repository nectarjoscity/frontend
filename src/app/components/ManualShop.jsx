'use client';

import { memo, useCallback } from 'react';

function ManualShop({
  colors,
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  isLoadingItems,
  triggerGetMenuItems,
  setIsLoadingItems,
  setManualItems,
  manualItems,
  setDetailsItem,
  cart,
  addToCart
}) {
  const handleCategoryClick = useCallback(async (c) => {
    // Prevent re-clicking the same category
    if (selectedCategoryId === c._id) return;
    
    // Immediately update the selected category for instant visual feedback
    setSelectedCategoryId(c._id);
    setIsLoadingItems(true);
    
    try {
      const { data: itemsData } = await triggerGetMenuItems({ category: c._id, active: true, available: true });
      const mapped = Array.isArray(itemsData) ? itemsData.map(it => ({
        _id: it._id,
        name: it.name,
        price: `₦${Number(it.price).toFixed(2)}`,
        description: it.description,
        emoji: it.emoji || c.emoji
      })) : [];
      
      setManualItems(mapped);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setIsLoadingItems(false);
    }
  }, [selectedCategoryId, triggerGetMenuItems, setSelectedCategoryId, setIsLoadingItems, setManualItems]);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 pb-24" data-shop-area>
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
        {categories.map((c) => (
          <button
            key={c._id}
            onClick={() => handleCategoryClick(c)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${selectedCategoryId === c._id ? 'text-white' : ''}`}
            style={{ background: selectedCategoryId === c._id ? colors.green500 : colors.cardBg, color: selectedCategoryId === c._id ? '#FFFFFF' : colors.text, border: `1px solid ${colors.cardBorder}` }}
          >
            <span className="mr-1">{c.emoji}</span>{c.name}
          </button>
        ))}
      </div>

      {isLoadingItems ? (
        <div className="text-center py-10" style={{color: colors.mutedText}}>Loading items…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {manualItems.map((item, idx) => (
            <div key={`${item.name}-${idx}`} className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group flex flex-col h-full" style={{background: colors.cardBg, border: `1px solid ${colors.cardBorder}`}}>
              <div className="relative text-center overflow-hidden h-44">
                <img
                  src={(item.emoji === '🥗' || item.emoji === '🌱' || item.emoji === '🥬') ? '/images/salad.jpg' :
                       (item.emoji === '🍲' || item.emoji === '💪' || item.emoji === '🌿') ? '/images/b.jpg' :
                       '/images/c.jpg'}
                  alt={item.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
              </div>
              <div className="p-3 flex flex-col grow">
                <h4 className="font-bold text-lg mb-1" style={{color: colors.text}}>{item.name}</h4>
                <span className="inline-block text-green-600 font-semibold text-lg mb-2">{item.price}</span>
                <p className="text-sm mb-4" style={{color: colors.mutedText, minHeight: '64px'}}>{item.description}</p>
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => setDetailsItem(item)}
                    className="w-1/2 font-semibold py-2.5 rounded-lg transition-colors text-white hover:opacity-90"
                    style={{ background: colors.amber500 }}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => { if (!cart.some(ci => ci.name === item.name)) { addToCart(item); } }}
                    disabled={cart.some(ci => ci.name === item.name)}
                    aria-disabled={cart.some(ci => ci.name === item.name)}
                    className={`w-1/2 font-semibold py-2.5 rounded-lg transition-colors ${cart.some(ci => ci.name === item.name) ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                  >
                    {cart.some(ci => ci.name === item.name) ? '✓ Added to Cart' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(ManualShop);
