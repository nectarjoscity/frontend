'use client';

import { IoClose, IoTrash } from 'react-icons/io5';

export default function CartSidebar({
  colors,
  theme,
  showCart,
  setShowCart,
  cart,
  removeFromCart,
  updateQuantity,
  getTotalPrice,
  isManualCheckout,
  setIsManualCheckout,
  manualStep,
  setManualStep,
  manualDiningPreference,
  setManualDiningPreference,
  manualDeliveryAddress,
  setManualDeliveryAddress,
  manualContact,
  setManualContact,
  resetManualCheckout,
  onOrderCreate,
  isPreOrder = false
}) {
  if (!showCart) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowCart(false)}>
      <div 
        className="fixed right-0 top-0 h-full w-full sm:max-w-md shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto" style={{background: colors.background}}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 sm:p-4" style={{borderBottom: `1px solid ${colors.cardBorder}`}}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold" style={{color: colors.text}}>Your Cart</h2>
            <button 
              onClick={() => setShowCart(false)}
              className="p-2 rounded-full transition-colors touch-manipulation"
              style={{background: theme === 'light' ? '#F3F4F6' : '#374151'}}
            >
              <IoClose className="w-5 h-5 sm:w-6 sm:h-6" style={{color: colors.text}} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-3 sm:p-4">
          {cart.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🛒</div>
              <p className="text-base sm:text-lg" style={{color: colors.mutedText}}>Your cart is empty</p>
              <p className="text-xs sm:text-sm mt-2" style={{color: colors.mutedText, opacity: 0.7}}>Add some delicious items to get started!</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {isManualCheckout && (
                <div className="rounded-lg p-3 sm:p-4" style={{background: colors.cardBg, border: `1px solid ${colors.cardBorder}`}}>
                  {manualStep === 'dining-preference' && (
                    <div className="space-y-3">
                      <p className="font-semibold" style={{color: colors.text}}>
                        {isPreOrder 
                          ? "How would you like to receive your pre-order?"
                          : "How would you like to get your order?"
                        }
                      </p>
                      <div className="grid gap-2 sm:gap-3">
                        {isPreOrder ? (
                          <>
                            <button 
                              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg text-left" 
                              onClick={() => { 
                                setManualDiningPreference('dine-in'); 
                                setManualStep('contact-info'); 
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xl">🍽️</span>
                                <div>
                                  <div className="font-bold">Dine at the restaurant</div>
                                  <div className="text-xs opacity-90">I'll come to the restaurant to enjoy my meal</div>
                                </div>
                              </div>
                            </button>
                            <button 
                              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-lg text-left" 
                              onClick={() => { 
                                setManualDiningPreference('delivery'); 
                                setManualStep('delivery-address'); 
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xl">🚚</span>
                                <div>
                                  <div className="font-bold">Home delivery</div>
                                  <div className="text-xs opacity-90">Please deliver my order to my address</div>
                                </div>
                              </div>
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-lg" onClick={() => { setManualDiningPreference('takeout'); setManualStep('delivery-address'); }}>🥡 Takeout / Delivery</button>
                            <button className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg" onClick={() => { setManualDiningPreference('dine-in'); setManualStep('contact-info'); }}>🍽️ Dine In Restaurant</button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {manualStep === 'delivery-address' && (
                    <div className="space-y-3">
                      <p className="font-semibold" style={{color: colors.text}}>
                        {isPreOrder 
                          ? "Where should we deliver your pre-order?"
                          : "Enter delivery address:"
                        }
                      </p>
                      <textarea
                        value={manualDeliveryAddress}
                        onChange={(e) => setManualDeliveryAddress(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                        style={{borderColor: colors.cardBorder, background: colors.cardBg, color: colors.text}}
                        rows={3}
                        placeholder={isPreOrder ? "Enter your complete delivery address (street, city, state)" : "123 Example Street, City"}
                      />
                      {isPreOrder && (
                        <p className="text-xs" style={{color: colors.mutedText, opacity: 0.8}}>
                          Please provide your complete address to ensure timely delivery.
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button 
                          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg" 
                          onClick={() => setManualStep('contact-info')}
                          disabled={!manualDeliveryAddress.trim()}
                        >
                          Continue
                        </button>
                        <button className="bg-gray-200 hover:bg-gray-300 font-semibold py-2 px-4 rounded-lg" style={{color: colors.text}} onClick={() => setManualStep('dining-preference')}>Back</button>
                      </div>
                    </div>
                  )}

                  {manualStep === 'contact-info' && (
                    <div className="space-y-3">
                      <p className="font-semibold" style={{color: colors.text}}>Enter contact (email or phone):</p>
                      <input
                        value={manualContact}
                        onChange={(e) => setManualContact(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                        style={{borderColor: colors.cardBorder, background: colors.cardBg, color: colors.text}}
                        placeholder="e.g. you@example.com or +234..."
                      />
                      <div className="flex gap-2">
                        <button className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg" onClick={() => setManualStep('payment')}>Continue</button>
                        <button className="bg-gray-200 hover:bg-gray-300 font-semibold py-2 px-4 rounded-lg" style={{color: colors.text}} onClick={() => setManualStep(manualDiningPreference === 'takeout' ? 'delivery-address' : 'dining-preference')}>Back</button>
                      </div>
                    </div>
                  )}

                  {manualStep === 'payment' && (
                    <div className="space-y-3">
                      <p className="font-semibold" style={{color: colors.text}}>Payment</p>
                      <div className="rounded-lg p-3" style={{background: colors.cardBg, border: `1px solid ${colors.cardBorder}`}}>
                        <p className="text-sm" style={{color: colors.mutedText}}>Transfer the exact amount of <strong className="text-green-600">₦{getTotalPrice()}</strong> to the account shown below to confirm your order.</p>
                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between" style={{color: colors.text}}><span>Account Name</span><strong>Nectar Restaurant Ltd</strong></div>
                          <div className="flex justify-between" style={{color: colors.text}}><span>Account Number</span><strong className="font-mono">2087654321</strong></div>
                          <div className="flex justify-between" style={{color: colors.text}}><span>Bank</span><strong>First Bank of Nigeria</strong></div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2.5 rounded-lg" 
                          onClick={async () => { 
                            if (onOrderCreate) {
                              try {
                                await onOrderCreate();
                                setManualStep('confirmed');
                              } catch (error) {
                                console.error('Error creating order:', error);
                                alert(error?.message || 'Failed to create order');
                              }
                            } else {
                              setManualStep('confirmed');
                            }
                          }}
                        >
                          ✅ I have completed the transfer
                        </button>
                        <button className="bg-gray-200 hover:bg-gray-300 font-semibold px-4 rounded-lg" style={{color: colors.text}} onClick={() => setManualStep('contact-info')}>Back</button>
                      </div>
                    </div>
                  )}

                  {manualStep === 'confirmed' && (
                    <div className="space-y-3">
                      <p className="font-semibold" style={{color: colors.text}}>🎉 Order confirmed!</p>
                      <p className="text-sm" style={{color: colors.mutedText}}>We will {manualDiningPreference === 'takeout' ? 'deliver your order to' : 'notify you at'} {manualDiningPreference === 'takeout' ? manualDeliveryAddress : manualContact} when your food is ready.</p>
                      <button 
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg" 
                        onClick={() => { 
                          resetManualCheckout(); 
                          setShowCart(false);
                          if (onOrderCreate && typeof window !== 'undefined') {
                            // Clear cart after successful order
                            window.dispatchEvent(new Event('order_created'));
                          }
                        }}
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              )}
              {cart.map((item, index) => (
                <div key={index} className="rounded-lg p-3 sm:p-4" style={{background: colors.cardBg, border: `1px solid ${colors.cardBorder}`}}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-1">
                        <span className="text-base sm:text-lg mr-2">{item.emoji}</span>
                        <h3 className="font-semibold text-sm sm:text-base" style={{color: colors.text}}>{item.name}</h3>
                      </div>
                      <p className="text-xs sm:text-sm mb-2 line-clamp-3" style={{color: colors.mutedText}}>{item.description}</p>
                      <p className="text-base sm:text-lg font-bold text-green-600">{item.price}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.name)}
                      className="p-2 rounded-full transition-colors text-red-500 touch-manipulation flex-shrink-0"
                      style={{background: theme === 'light' ? '#FEF2F2' : '#3A2020'}}
                    >
                      <IoTrash className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <button 
                        onClick={() => updateQuantity(item.name, item.quantity - 1)}
                        className="w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors touch-manipulation"
                        style={{background: theme === 'light' ? '#E5E7EB' : '#4B5563', color: colors.text}}
                      >
                        <span className="text-lg font-bold">-</span>
                      </button>
                      <span className="font-semibold text-base sm:text-lg px-2 sm:px-3 min-w-[2rem] text-center" style={{color: colors.text}}>{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.name, item.quantity + 1)}
                        className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors touch-manipulation"
                      >
                        <span className="text-lg font-bold">+</span>
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm" style={{color: colors.mutedText}}>Subtotal</p>
                      <p className="font-bold text-green-600 text-sm sm:text-base">₦{(parseFloat(String(item.price).replace(/[^\d.]/g, '')) * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="pt-3 sm:pt-4 mt-4 sm:mt-6" style={{borderTop: `1px solid ${colors.cardBorder}`}}>
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <span className="text-lg sm:text-xl font-bold" style={{color: colors.text}}>Total:</span>
                  <span className="text-xl sm:text-2xl font-bold text-green-600">₦{getTotalPrice()}</span>
                </div>
                
                {!isManualCheckout && (
                  <button 
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 sm:py-3 px-4 rounded-lg transition-colors touch-manipulation text-sm sm:text-base"
                    onClick={() => {
                      setIsManualCheckout(true);
                      setManualStep('dining-preference');
                    }}
                  >
                    Proceed to Checkout ({cart.reduce((t, i) => t + i.quantity, 0)} items)
                  </button>
                )}
                
                <button 
                  onClick={() => setShowCart(false)}
                  className="w-full mt-2 font-medium py-2 sm:py-2 px-4 rounded-lg transition-colors touch-manipulation text-sm sm:text-base"
                  style={{background: theme === 'light' ? '#E5E7EB' : '#4B5563', color: colors.text}}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


