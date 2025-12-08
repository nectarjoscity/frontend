'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGetCategoriesQuery, useLazyGetMenuItemsQuery, useCreateOrderMutation } from '../../services/api';
import { useTheme } from '../providers';
import { IoClose } from 'react-icons/io5';
import { HiShoppingCart } from 'react-icons/hi2';
import HeaderNav from '../components/HeaderNav';
import ManualShop from '../components/ManualShop';
import CartSidebar from '../components/CartSidebar';
import RecommendationList from '../components/RecommendationList';

export default function PreOrderPage() {
  const { colors, theme, setTheme } = useTheme();
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [mode, setMode] = useState('shop');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [manualItems, setManualItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isManualCheckout, setIsManualCheckout] = useState(false);
  const [manualStep, setManualStep] = useState(null);
  const [manualDiningPreference, setManualDiningPreference] = useState(null);
  const [manualDeliveryAddress, setManualDeliveryAddress] = useState('');
  const [manualContact, setManualContact] = useState('');
  const [manualPaymentMethod, setManualPaymentMethod] = useState('cash');
  const [manualTransferConfirmed, setManualTransferConfirmed] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('nectarv_preorder_cart');
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          if (Array.isArray(parsedCart) && parsedCart.length > 0) {
            setCart(parsedCart);
          }
        } catch (e) {
          console.error('Error loading cart from localStorage:', e);
        }
      }
      setCartLoaded(true);
    }
  }, []);

  // Save cart to localStorage whenever it changes (after initial load)
  useEffect(() => {
    if (cartLoaded && typeof window !== 'undefined') {
      if (cart.length > 0) {
        localStorage.setItem('nectarv_preorder_cart', JSON.stringify(cart));
      } else {
        localStorage.removeItem('nectarv_preorder_cart');
      }
    }
  }, [cart, cartLoaded]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (detailsItem) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore scroll position
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [detailsItem]);

  const { data: categories = [], isLoading: isLoadingCategories } = useGetCategoriesQuery({ active: true });
  const [triggerGetMenuItems] = useLazyGetMenuItemsQuery();
  const [createOrder] = useCreateOrderMutation();

  // Default load first category items (oldest first)
  useEffect(() => {
    const preloadFirstCategory = async () => {
      if (isLoadingCategories) return;
      if (!categories || !categories.length) return;
      if (selectedCategoryId) return;
      // Get the last category (oldest) since we'll reverse the array for display
      const reversedCategories = [...categories].reverse();
      const first = reversedCategories[0];
      setSelectedCategoryId(first._id);
      setIsLoadingItems(true);
      try {
        const { data: itemsData } = await triggerGetMenuItems({ category: first._id, active: true });
        const mapped = Array.isArray(itemsData) ? itemsData.map(it => ({
          _id: it._id,
          name: it.name,
          price: `₦${Number(it.price).toFixed(2)}`,
          description: it.description,
          emoji: it.emoji || first.emoji,
          imageUrl: it.imageUrl || null,
          isAvailable: it.isAvailable !== false
        })) : [];
        setManualItems(mapped);
      } catch (error) {
        console.error('Error loading items:', error);
      } finally {
        setIsLoadingItems(false);
      }
    };
    preloadFirstCategory();
  }, [isLoadingCategories, categories, selectedCategoryId, triggerGetMenuItems]);

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => {
      const price = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
      return sum + (price * (item.quantity || 1));
    }, 0);
  };

  const addToCart = (item, skipRecommendation = false) => {
    const existingItem = cart.find(cartItem => cartItem._id === item._id);
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem._id === item._id
          ? { ...cartItem, quantity: (cartItem.quantity || 1) + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    // Show recommendations after adding item (unless skipped)
    if (!skipRecommendation) {
      setShowRecommendations(true);
    }
  };

  const removeFromCart = (itemName) => {
    setCart(cart.filter(item => item.name !== itemName));
  };

  const updateCartQuantity = (itemName, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemName);
    } else {
      setCart(cart.map(item =>
        item.name === itemName ? { ...item, quantity } : item
      ));
    }
  };

  const resetManualCheckout = () => {
    setIsManualCheckout(false);
    setManualStep(null);
    setManualDiningPreference(null);
    setManualDeliveryAddress('');
    setManualContact('');
    setManualPaymentMethod('cash');
    setManualTransferConfirmed(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: colors.background }}>
      <HeaderNav
        colors={colors}
        theme={theme}
        setTheme={setTheme}
        mode={mode}
        setShowCart={setShowCart}
        getTotalItems={getTotalItems}
      />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero Section */}
        <div className="relative overflow-hidden" style={{ background: colors.background }}>
          <div className="absolute top-4 left-4 text-green-400 opacity-30">
            <img src="/file.svg" alt="decorative" width="24" height="24" className="text-green-400" />
          </div>
          <div className="absolute top-8 right-8 text-emerald-400 opacity-25">
            <img src="/globe.svg" alt="decorative" width="32" height="32" className="text-emerald-400" />
          </div>
          <div className="absolute bottom-4 left-8 text-green-300 opacity-20">
            <img src="/window.svg" alt="decorative" width="28" height="28" className="text-green-300" />
          </div>
          <div className="max-w-8xl mx-auto px-4 sm:px-6 text-center relative z-10 flex flex-col justify-center items-center py-12 sm:py-16 md:py-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-center leading-tight" style={{ fontFamily: 'Gebuk, Arial, sans-serif', fontWeight: '700', color: theme === 'light' ? colors.black : colors.text }}>
              <span className="block">Your First Sip of Nectar Starts Now</span>
            </h2>
            <p className="mt-3 sm:mt-4 text-lg sm:text-xl md:text-2xl font-medium px-4 sm:px-0 max-w-2xl" style={{ color: colors.mutedText }}>
              Pre-order your favorites today, and we'll deliver them fresh on launch day.
            </p>

            {/* Noticeable Pre-Order Deadline Banner */}
            <style>{`
              @keyframes slowPulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.9; transform: scale(1.02); }
              }
            `}</style>
            <div
              className="mt-8"
              style={{ animation: 'slowPulse 4s ease-in-out infinite' }}
            >
              <div
                className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl shadow-lg border-2"
                style={{
                  background: 'linear-gradient(135deg, #73BE00 0%, #4B7F00 100%)',
                  borderColor: '#9AE62B',
                  boxShadow: '0 4px 20px rgba(115, 190, 0, 0.4)'
                }}
              >
                <span className="text-3xl">🌿</span>
                <div className="text-left">
                  <p className="text-white text-base font-medium opacity-90">Pre-Order Window Closes on:</p>
                  <p className="text-white text-xl sm:text-2xl font-bold">December 14th, 2025</p>
                </div>
                <span className="text-3xl">✨</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">

          {isLoadingCategories ? (
            <div className="text-center py-10" style={{ color: colors.mutedText }}>
              Loading menu...
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-10" style={{ color: colors.mutedText }}>
              No categories available
            </div>
          ) : (
            <ManualShop
              colors={colors}
              categories={[...categories].reverse()}
              selectedCategoryId={selectedCategoryId}
              setSelectedCategoryId={setSelectedCategoryId}
              manualItems={manualItems}
              setManualItems={setManualItems}
              isLoadingItems={isLoadingItems}
              triggerGetMenuItems={triggerGetMenuItems}
              setIsLoadingItems={setIsLoadingItems}
              setDetailsItem={setDetailsItem}
              cart={cart}
              addToCart={addToCart}
            />
          )}
        </div>

      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <CartSidebar
          colors={colors}
          theme={theme}
          showCart={showCart}
          setShowCart={setShowCart}
          cart={cart}
          removeFromCart={removeFromCart}
          updateQuantity={updateCartQuantity}
          getTotalPrice={getTotalPrice}
          isManualCheckout={isManualCheckout}
          setIsManualCheckout={setIsManualCheckout}
          manualStep={manualStep}
          setManualStep={setManualStep}
          manualDiningPreference={manualDiningPreference}
          setManualDiningPreference={setManualDiningPreference}
          manualDeliveryAddress={manualDeliveryAddress}
          setManualDeliveryAddress={setManualDeliveryAddress}
          manualContact={manualContact}
          setManualContact={setManualContact}
          resetManualCheckout={resetManualCheckout}
          isPreOrder={true}
          onOrderCreate={async (paymentDetails) => {
            if (cart.length === 0) return;
            if (!manualContact.trim()) {
              throw new Error('Please enter contact information');
            }
            if (manualDiningPreference === 'delivery' && !manualDeliveryAddress.trim()) {
              throw new Error('Please enter your delivery address');
            }

            // Payment verification is handled in CartSidebar before calling onOrderCreate
            // So if we reach here, payment should be verified
            // But we'll still create the order with the payment details

            const preparedOrderItems = cart.map(item => {
              const menuItemId = item._id;
              if (!menuItemId) {
                throw new Error(`Item "${item.name}" is missing _id. Please refresh and add items again.`);
              }
              return {
                menuItem: menuItemId,
                quantity: item.quantity || 1,
                price: parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0
              };
            });

            // Parse email and phone from contact (for delivery, they're separated by '|||')
            let customerEmail = '';
            let customerPhone = '';
            let customerName = 'Guest Customer';

            if (manualContact.includes('|||')) {
              // Delivery order - has both email and phone
              const [email, phone] = manualContact.split('|||');
              customerEmail = email?.trim() || '';
              customerPhone = phone?.trim() || '';
              customerName = customerEmail || customerPhone || 'Guest Customer';
            } else {
              // Dine-in order - single contact
              if (manualContact.includes('@')) {
                customerEmail = manualContact;
              } else {
                customerPhone = manualContact;
              }
              customerName = manualContact || 'Guest Customer';
            }

            const orderData = {
              customerName,
              customerEmail,
              customerPhone,
              totalAmount: manualDiningPreference === 'delivery' ? getTotalPrice() + 1000 : getTotalPrice(),
              deliveryFee: manualDiningPreference === 'delivery' ? 1000 : 0,
              status: 'pending',
              paymentMethod: 'online', // CartSidebar only supports transfer
              paymentConfirmed: paymentDetails?.verified || false, // Set to true if payment was verified
              isPreOrder: true,
              table: manualDiningPreference === 'dine-in'
                ? `Pre-Order Dine-In`
                : `Pre-Order Delivery: ${manualDeliveryAddress}`,
              orderItems: preparedOrderItems,
              // Store payment details
              paymentReference: paymentDetails?.externalReference || paymentDetails?.id,
              virtualAccountNumber: paymentDetails?.accountNumber,
              virtualAccountName: paymentDetails?.accountName,
              virtualAccountBank: paymentDetails?.bankName,
            };

            await createOrder(orderData).unwrap();
            setCart([]);
          }}
        />
      )}

      {/* Floating Cart Button */}
      {!showCart && cart.length > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 p-4 rounded-full shadow-lg text-white z-40 transition-all hover:scale-110"
          style={{ background: colors.amber500 }}
        >
          <HiShoppingCart className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {getTotalItems()}
          </span>
        </button>
      )}

      {/* Item Details Modal */}
      {detailsItem && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto"
          style={{
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(4px)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3px',
            minWidth: '100vw',
            minHeight: '100vh'
          }}
          onClick={() => setDetailsItem(null)}
        >
          <div
            className="relative w-full h-full flex flex-col md:h-auto md:my-auto overflow-y-auto"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              minWidth: 'calc(100vw - 6px)',
              minHeight: 'calc(100vh - 6px)',
              ...(typeof window !== 'undefined' && window.innerWidth >= 768 && {
                minWidth: 'auto',
                minHeight: 'auto',
                width: 'calc(100vw / 3)',
                maxWidth: 'calc(100vw / 3)',
                maxHeight: '90vh'
              })
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 z-10 p-3 rounded-full transition-all hover:scale-110"
              style={{
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                backdropFilter: 'blur(4px)'
              }}
              onClick={() => setDetailsItem(null)}
            >
              <IoClose className="w-6 h-6" />
            </button>

            {/* Image Container */}
            <div
              className="flex items-center justify-center"
              style={{
                width: '100%',
                minHeight: '300px',
                maxHeight: typeof window !== 'undefined' && window.innerWidth >= 768 ? '60vh' : '60vh'
              }}
            >
              {/* Image */}
              {detailsItem.imageUrl ? (
                <img
                  src={detailsItem.imageUrl}
                  alt={detailsItem.name}
                  className="w-full h-auto rounded-t-2xl shadow-2xl"
                  style={{
                    objectFit: 'contain',
                    display: 'block',
                    maxWidth: '100%',
                    maxHeight: typeof window !== 'undefined' && window.innerWidth >= 768 ? '60vh' : '60vh'
                  }}
                />
              ) : (
                <div
                  className="w-full rounded-t-2xl shadow-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                    minHeight: '300px'
                  }}
                >
                  <div className="text-9xl">{detailsItem.emoji || '🍽️'}</div>
                </div>
              )}
            </div>

            {/* Item Info - Below image on all screen sizes */}
            <div
              className="p-6 rounded-b-2xl"
              style={{
                background: colors.cardBg,
                color: colors.text
              }}
            >
              <h3 className="text-2xl font-bold mb-2">{detailsItem.name}</h3>
              <div className="text-green-400 font-semibold text-xl mb-3">{detailsItem.price}</div>
              {detailsItem.description && (
                <p className="text-lg mb-4 leading-relaxed opacity-90">{detailsItem.description}</p>
              )}

              {/* Action Button */}
              <button
                className={`w-full font-semibold py-3 rounded-lg transition-all hover:scale-105 text-base ${detailsItem.isAvailable === false || cart.some(ci => ci.name === detailsItem.name)
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                onClick={() => {
                  if (detailsItem.isAvailable !== false && !cart.some(ci => ci.name === detailsItem.name)) {
                    addToCart(detailsItem);
                    setDetailsItem(null);
                  }
                }}
                disabled={detailsItem.isAvailable === false || cart.some(ci => ci.name === detailsItem.name)}
              >
                {detailsItem.isAvailable === false
                  ? 'Out of Stock'
                  : cart.some(ci => ci.name === detailsItem.name)
                    ? '✓ Added to Pre-Order'
                    : 'Add to Pre-Order'
                }
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* AI Meal Recommendation Modal */}
      {showRecommendations && cart.length > 0 && (
        <RecommendationList
          selectedItems={cart}
          onAddToCart={(item) => addToCart(item, true)}
          onClose={() => setShowRecommendations(false)}
          colors={colors}
          theme={theme}
        />
      )}
    </div>
  );
}

