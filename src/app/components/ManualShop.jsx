'use client';

import { memo, useCallback, useEffect, useState, useRef } from 'react';

// Add masonry grid styles - true Pinterest-style masonry layout
const masonryStyles = `
  .masonry-grid {
    column-count: 1;
    column-gap: 24px;
    column-fill: balance;
  }
  @media (min-width: 640px) {
    .masonry-grid {
      column-count: 2;
    }
  }
  @media (min-width: 1024px) {
    .masonry-grid {
      column-count: 3;
    }
  }
  .masonry-item {
    break-inside: avoid;
    page-break-inside: avoid;
    display: inline-block;
    width: 100%;
    margin-bottom: 24px;
    vertical-align: top;
  }
`;

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
  const [imageColors, setImageColors] = useState({}); // Store dominant colors for each item
  const [imageHeights, setImageHeights] = useState({}); // Store dynamic heights for portrait images
  const processingRef = useRef(new Set()); // Track items currently being processed

  // Generate a color from a string (hash-based fallback)
  const generateColorFromString = useCallback((str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Generate pastel colors (light, vibrant)
    const r = Math.floor((hash & 0xFF0000) >> 16);
    const g = Math.floor((hash & 0x00FF00) >> 8);
    const b = Math.floor(hash & 0x0000FF);
    
    // Convert to pastel (lighten and saturate)
    const pastelR = Math.min(255, Math.floor(r * 0.6 + 200 * 0.4));
    const pastelG = Math.min(255, Math.floor(g * 0.6 + 200 * 0.4));
    const pastelB = Math.min(255, Math.floor(b * 0.6 + 200 * 0.4));
    
    return `rgb(${pastelR}, ${pastelG}, ${pastelB})`;
  }, []);

  // Extract dominant color from image
  const extractDominantColor = useCallback((imageElement, itemId, imageUrl) => {
    if (!imageElement || processingRef.current.has(itemId)) return;
    if (!imageElement.complete || imageElement.naturalWidth === 0) {
      console.warn('Image not fully loaded:', itemId);
      return;
    }
    
    processingRef.current.add(itemId);
    
    // Try to extract color from canvas
    const tryExtractColor = () => {
      try {
        const canvas = document.createElement('canvas');
        // Use smaller canvas for performance
        const maxSize = 150;
        const scale = Math.min(maxSize / imageElement.naturalWidth, maxSize / imageElement.naturalHeight, 1);
        canvas.width = Math.max(1, Math.floor(imageElement.naturalWidth * scale));
        canvas.height = Math.max(1, Math.floor(imageElement.naturalHeight * scale));
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
        
        // Sample pixels from the image
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const colorCounts = {};
        
        // Sample pixels to get dominant color (every 4th pixel for performance)
        for (let i = 0; i < pixels.length; i += 16) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];
          
          // Skip transparent or very dark pixels
          if (a < 128) continue;
          
          // Quantize colors to reduce variations
          const quantizedR = Math.floor(r / 16) * 16;
          const quantizedG = Math.floor(g / 16) * 16;
          const quantizedB = Math.floor(b / 16) * 16;
          const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
          
          colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
        }
        
        // Find the most common color
        let maxCount = 0;
        let dominantColor = null;
        for (const [color, count] of Object.entries(colorCounts)) {
          if (count > maxCount) {
            maxCount = count;
            dominantColor = color;
          }
        }
        
        if (dominantColor) {
          const [r, g, b] = dominantColor.split(',').map(Number);
          // Lighten the color for better contrast (make it pastel-like)
          const lightenedR = Math.min(255, Math.floor(r * 0.7 + 255 * 0.3));
          const lightenedG = Math.min(255, Math.floor(g * 0.7 + 255 * 0.3));
          const lightenedB = Math.min(255, Math.floor(b * 0.7 + 255 * 0.3));
          const color = `rgb(${lightenedR}, ${lightenedG}, ${lightenedB})`;
          
          setImageColors(prev => {
            if (prev[itemId]) return prev; // Already set
            return { ...prev, [itemId]: color };
          });
          processingRef.current.delete(itemId);
          return true;
        }
      } catch (error) {
        // CORS or other canvas error
        return false;
      }
      return false;
    };

    // Try extraction
    if (!tryExtractColor()) {
      // If canvas extraction fails (CORS), use hash-based color from image URL or item ID
      console.log('Canvas extraction failed (likely CORS), using hash-based color for', itemId);
      const fallbackColor = generateColorFromString(imageUrl || itemId);
      setImageColors(prev => {
        if (prev[itemId]) return prev;
        return { ...prev, [itemId]: fallbackColor };
      });
      processingRef.current.delete(itemId);
    }
  }, [generateColorFromString]);

  const handleCategoryClick = useCallback(async (c) => {
    // Prevent re-clicking the same category
    if (selectedCategoryId === c._id) return;
    
    // Immediately update the selected category for instant visual feedback
    setSelectedCategoryId(c._id);
    setIsLoadingItems(true);
    
    try {
      const { data: itemsData } = await triggerGetMenuItems({ category: c._id, active: true });
      const mapped = Array.isArray(itemsData) ? itemsData.map(it => ({
        _id: it._id,
        name: it.name,
        price: `₦${Number(it.price).toFixed(2)}`,
        description: it.description,
        emoji: it.emoji || c.emoji,
        imageUrl: it.imageUrl || null,
        isAvailable: it.isAvailable !== false
      })) : [];
      
      setManualItems(mapped);
      // Clear image colors and heights when category changes
      setImageColors({});
      setImageHeights({});
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
      ) : manualItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-semibold mb-2" style={{color: colors.text}}>No items available</h3>
          <p className="text-base" style={{color: colors.mutedText}}>
            This category is currently empty. Check back soon or explore other categories!
          </p>
        </div>
      ) : (
        <>
          <style>{masonryStyles}</style>
          <div className="masonry-grid">
          {manualItems.map((item, idx) => {
            const itemId = item._id || item.name;
            const extractedColor = imageColors[itemId];
            // Use extracted color if available, otherwise use gradient
            const backgroundColor = extractedColor 
              ? extractedColor 
              : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)';
            
            const imageHeight = imageHeights[itemId] || 176; // Default h-44 = 176px
            
            return (
              <div 
                key={`${item.name}-${idx}`} 
                className="masonry-item rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group flex flex-col" 
                style={{
                  background: colors.cardBg, 
                  border: `1px solid ${colors.cardBorder}`
                }}
              >
                <div 
                  className="relative overflow-hidden transition-all duration-500" 
                  style={{ 
                    height: `${imageHeight}px`,
                    minHeight: '176px', // Minimum h-44
                    backgroundColor: extractedColor || undefined,
                    background: extractedColor ? extractedColor : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                    display: 'flex',
                    alignItems: 'stretch',
                    justifyContent: 'stretch'
                  }}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      style={{ 
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block',
                        objectPosition: 'center'
                      }}
                      onLoad={(e) => {
                        const imgElement = e.target;
                        const currentItemId = item._id || item.name;
                        
                        // Small delay to ensure image is fully rendered
                        setTimeout(() => {
                          if (imgElement.complete && imgElement.naturalWidth > 0 && imgElement.naturalHeight > 0) {
                            // Get the actual container/parent width
                            const parentContainer = imgElement.parentElement;
                            const containerWidth = parentContainer ? parentContainer.offsetWidth : imgElement.offsetWidth || 300;
                            
                            // Calculate aspect ratio
                            const aspectRatio = imgElement.naturalWidth / imgElement.naturalHeight;
                            
                            // Calculate exact height needed when image is scaled to 100% width
                            // This ensures no empty space above or below
                            const exactHeight = containerWidth / aspectRatio;
                            
                            // Set reasonable bounds: min 200px, max 500px for very tall images
                            const optimalHeight = Math.min(500, Math.max(200, exactHeight));
                            
                            setImageHeights(prev => {
                              // Only update if different to avoid unnecessary re-renders
                              if (prev[currentItemId] !== optimalHeight) {
                                return { ...prev, [currentItemId]: optimalHeight };
                              }
                              return prev;
                            });
                            
                            if (!imageColors[currentItemId] && !processingRef.current.has(currentItemId)) {
                              extractDominantColor(imgElement, currentItemId, item.imageUrl);
                            }
                          }
                        }, 150);
                      }}
                      onError={(e) => {
                        console.error('Image failed to load:', item.imageUrl);
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-6xl">
                      {item.emoji || '🍽️'}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
                </div>
              <div className="p-3 flex flex-col grow">
                <h4 className="font-bold text-lg mb-1" style={{color: colors.text}}>{item.name}</h4>
                <span className="inline-block text-green-600 font-semibold text-lg mb-2">{item.price}</span>
                <p className="text-sm mb-4 line-clamp-3" style={{color: colors.mutedText}}>{item.description}</p>
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => setDetailsItem(item)}
                    className="w-1/2 font-semibold py-2.5 rounded-lg transition-colors text-white hover:opacity-90"
                    style={{ background: colors.amber500 }}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => { if (!cart.some(ci => ci.name === item.name) && item.isAvailable !== false) { addToCart(item); } }}
                    disabled={cart.some(ci => ci.name === item.name) || item.isAvailable === false}
                    aria-disabled={cart.some(ci => ci.name === item.name) || item.isAvailable === false}
                    className={`w-1/2 font-semibold py-2.5 rounded-lg transition-colors ${
                      item.isAvailable === false 
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                        : cart.some(ci => ci.name === item.name) 
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                          : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {item.isAvailable === false 
                      ? 'Out of Stock' 
                      : cart.some(ci => ci.name === item.name) 
                        ? '✓ Added to Cart' 
                        : 'Add to Cart'
                    }
                  </button>
                </div>
              </div>
            </div>
            );
          })}
          </div>
        </>
      )}
    </div>
  );
}

export default memo(ManualShop);
