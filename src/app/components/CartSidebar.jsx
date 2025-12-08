'use client';

import { useState, useEffect } from 'react';
import { IoClose, IoTrash } from 'react-icons/io5';
import { useCreateVirtualAccountMutation, useVerifyPaymentMutation } from '../../services/api';

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
  const [createVirtualAccount, { isLoading: isCreatingAccount }] = useCreateVirtualAccountMutation();
  const [verifyPayment, { isLoading: isVerifyingPayment }] = useVerifyPaymentMutation();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Delivery fee constant
  const DELIVERY_FEE = 1000;

  // Calculate total including delivery fee if applicable
  const getGrandTotal = () => {
    const subtotal = parseFloat(String(getTotalPrice()).replace(/[^0-9.]/g, '')) || 0;
    const isDelivery = manualDiningPreference === 'delivery' || manualDiningPreference === 'takeout';
    return isDelivery ? subtotal + DELIVERY_FEE : subtotal;
  };

  // Create virtual account when user reaches payment step
  useEffect(() => {
    if (manualStep === 'payment' && !paymentDetails && !paymentError && !isCreatingAccount) {
      const createAccount = async () => {
        try {
          setPaymentError(null);
          const totalPrice = getGrandTotal();
          if (totalPrice <= 0) {
            setPaymentError('Invalid amount');
            return;
          }

          // Parse customer info for transaction record
          let customerEmail = '';
          let customerPhone = '';
          if (manualContact.includes('|||')) {
            const [email, phone] = manualContact.split('|||');
            customerEmail = email?.trim() || '';
            customerPhone = phone?.trim() || '';
          } else if (manualContact.includes('@')) {
            customerEmail = manualContact;
          } else {
            customerPhone = manualContact;
          }

          const result = await createVirtualAccount({
            amount: totalPrice,
            deliveryFee: (manualDiningPreference === 'delivery' || manualDiningPreference === 'takeout') ? DELIVERY_FEE : 0,
            customerEmail,
            customerPhone,
            customerName: customerEmail || customerPhone || 'Guest',
            description: isPreOrder ? 'Pre-order payment' : 'Order payment',
          }).unwrap();
          setPaymentDetails(result);
        } catch (error) {
          console.error('Error creating virtual account:', error);
          setPaymentError(error?.data?.message || error?.message || 'Failed to create payment account');
        }
      };
      createAccount();
    }
  }, [manualStep, paymentDetails, paymentError, isCreatingAccount, manualDiningPreference, manualContact, isPreOrder, getTotalPrice, createVirtualAccount]);

  // Reset payment details when cart is closed or checkout is reset
  useEffect(() => {
    if (!showCart || !isManualCheckout) {
      setPaymentDetails(null);
      setPaymentError(null);
    }
  }, [showCart, isManualCheckout]);

  if (!showCart) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowCart(false)}>
      <div
        className="fixed right-0 top-0 h-full w-full sm:max-w-md shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto" style={{ background: colors.background }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 sm:p-4" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold" style={{ color: colors.text }}>Your Cart</h2>
            <button
              onClick={() => setShowCart(false)}
              className="p-2 rounded-full transition-colors touch-manipulation"
              style={{ background: theme === 'light' ? '#F3F4F6' : '#374151' }}
            >
              <IoClose className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: colors.text }} />
            </button>
          </div>
        </div>

        <div className="flex-1 p-3 sm:p-4">
          {cart.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🛒</div>
              <p className="text-base sm:text-lg" style={{ color: colors.mutedText }}>Your cart is empty</p>
              <p className="text-xs sm:text-sm mt-2" style={{ color: colors.mutedText, opacity: 0.7 }}>Add some delicious items to get started!</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {isManualCheckout && (
                <div className="rounded-lg p-3 sm:p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                  {manualStep === 'dining-preference' && (
                    <div className="space-y-3">
                      <p className="font-semibold" style={{ color: colors.text }}>
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
                      <p className="font-semibold" style={{ color: colors.text }}>
                        {isPreOrder
                          ? "Where should we deliver your pre-order?"
                          : "Enter delivery address:"
                        }
                      </p>
                      <textarea
                        value={manualDeliveryAddress}
                        onChange={(e) => setManualDeliveryAddress(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                        style={{ borderColor: colors.cardBorder, background: colors.cardBg, color: colors.text }}
                        rows={3}
                        placeholder={isPreOrder ? "Enter your complete delivery address (street, city, state)" : "123 Example Street, City"}
                      />
                      {isPreOrder && (
                        <p className="text-xs" style={{ color: colors.mutedText, opacity: 0.8 }}>
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
                        <button className="bg-gray-200 hover:bg-gray-300 font-semibold py-2 px-4 rounded-lg" style={{ color: colors.text }} onClick={() => setManualStep('dining-preference')}>Back</button>
                      </div>
                    </div>
                  )}

                  {manualStep === 'contact-info' && (
                    <div className="space-y-3">
                      {(manualDiningPreference === 'delivery' || manualDiningPreference === 'takeout') ? (
                        <>
                          <p className="font-semibold" style={{ color: colors.text }}>Enter your contact details:</p>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs mb-1" style={{ color: colors.mutedText }}>
                                📧 Email (for order updates)
                              </label>
                              <input
                                value={manualContact.split('|||')[0] || ''}
                                onChange={(e) => {
                                  const phone = manualContact.split('|||')[1] || '';
                                  setManualContact(`${e.target.value}|||${phone}`);
                                }}
                                className="w-full border rounded-lg px-3 py-2"
                                style={{ borderColor: colors.cardBorder, background: colors.cardBg, color: colors.text }}
                                placeholder="you@example.com"
                                type="email"
                              />
                            </div>
                            <div>
                              <label className="block text-xs mb-1" style={{ color: colors.mutedText }}>
                                📱 Phone (for delivery driver)
                              </label>
                              <input
                                value={manualContact.split('|||')[1] || ''}
                                onChange={(e) => {
                                  const email = manualContact.split('|||')[0] || '';
                                  setManualContact(`${email}|||${e.target.value}`);
                                }}
                                className="w-full border rounded-lg px-3 py-2"
                                style={{ borderColor: colors.cardBorder, background: colors.cardBg, color: colors.text }}
                                placeholder="+234 800 000 0000"
                                type="tel"
                              />
                            </div>
                          </div>
                          <p className="text-xs" style={{ color: colors.mutedText, opacity: 0.8 }}>
                            We'll email you order updates and share your phone with the delivery driver.
                          </p>
                          <div className="flex gap-2">
                            <button
                              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => setManualStep('payment')}
                              disabled={!manualContact.split('|||')[0]?.trim() || !manualContact.split('|||')[1]?.trim()}
                            >
                              Continue
                            </button>
                            <button className="bg-gray-200 hover:bg-gray-300 font-semibold py-2 px-4 rounded-lg" style={{ color: colors.text }} onClick={() => setManualStep('delivery-address')}>Back</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold" style={{ color: colors.text }}>Enter contact (email or phone):</p>
                          <input
                            value={manualContact}
                            onChange={(e) => setManualContact(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                            style={{ borderColor: colors.cardBorder, background: colors.cardBg, color: colors.text }}
                            placeholder="e.g. you@example.com or +234..."
                          />
                          <div className="flex gap-2">
                            <button className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg" onClick={() => setManualStep('payment')}>Continue</button>
                            <button className="bg-gray-200 hover:bg-gray-300 font-semibold py-2 px-4 rounded-lg" style={{ color: colors.text }} onClick={() => setManualStep('dining-preference')}>Back</button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {manualStep === 'payment' && (
                    <div className="space-y-3">
                      <p className="font-semibold" style={{ color: colors.text }}>Payment</p>
                      {isCreatingAccount && !paymentDetails && !paymentError && (
                        <div className="rounded-lg p-3 text-center" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                          <p className="text-sm" style={{ color: colors.mutedText }}>Creating payment account...</p>
                        </div>
                      )}
                      {paymentError && (
                        <div className="rounded-lg p-3" style={{ background: '#FEF2F2', border: `1px solid #DC2626` }}>
                          <p className="text-sm text-red-600">{paymentError}</p>
                          <button
                            className="mt-2 text-sm text-red-600 underline"
                            onClick={() => {
                              setPaymentError(null);
                              setPaymentDetails(null);
                            }}
                          >
                            Try again
                          </button>
                        </div>
                      )}
                      {paymentDetails && (
                        <>
                          <div className="rounded-lg p-3" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                            <p className="text-sm mb-2" style={{ color: colors.mutedText }}>
                              Transfer the exact amount of <strong className="text-green-600">₦{getGrandTotal().toLocaleString()}</strong> to the account shown below to confirm your order.
                            </p>
                            {paymentDetails.validFor && (
                              <p className="text-xs mb-3 p-2 rounded" style={{ background: '#FEF3C7', color: '#92400E' }}>
                                ⏰ This account will be active for {Math.floor(paymentDetails.validFor / 60)} minutes
                              </p>
                            )}
                            <div className="mt-3 space-y-2">
                              {paymentDetails.accountName && (
                                <div className="flex justify-between" style={{ color: colors.text }}>
                                  <span>Account Name</span>
                                  <strong className="text-right">{paymentDetails.accountName}</strong>
                                </div>
                              )}
                              {paymentDetails.accountNumber && (
                                <div className="flex justify-between" style={{ color: colors.text }}>
                                  <span>Account Number</span>
                                  <strong className="font-mono">{paymentDetails.accountNumber}</strong>
                                </div>
                              )}
                              {paymentDetails.bankName && (
                                <div className="flex justify-between" style={{ color: colors.text }}>
                                  <span>Bank</span>
                                  <strong>{paymentDetails.bankName}</strong>
                                </div>
                              )}
                              {paymentDetails.externalReference && (
                                <div className="flex justify-between text-xs pt-2 border-t" style={{ borderColor: colors.cardBorder, color: colors.mutedText }}>
                                  <span>Reference</span>
                                  <strong className="font-mono break-all text-right">{paymentDetails.externalReference}</strong>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isVerifying || isVerifyingPayment}
                              onClick={async () => {
                                if (!paymentDetails?.externalReference) {
                                  alert('Payment account details are missing. Please refresh and try again.');
                                  return;
                                }

                                setIsVerifying(true);
                                try {
                                  // Verify payment before creating order
                                  const verificationResult = await verifyPayment({
                                    externalReference: paymentDetails.externalReference
                                  }).unwrap();

                                  // Check if payment was successful
                                  if (verificationResult?.status === 'success' || verificationResult?.status === 'completed') {
                                    // Payment confirmed, create order
                                    if (onOrderCreate) {
                                      await onOrderCreate({ ...paymentDetails, verified: true });
                                      // Success message will be shown in the confirmed step
                                      setManualStep('confirmed');
                                    } else {
                                      setManualStep('confirmed');
                                    }
                                  } else {
                                    // Payment not confirmed
                                    alert('Payment verification failed. Please ensure you have completed the transfer and try again. If you have already made the payment, please wait a few moments and try again.');
                                  }
                                } catch (error) {
                                  console.error('Error verifying payment:', error);
                                  const errorMessage = error?.data?.message || error?.message || 'Failed to verify payment';

                                  // If verification fails, still allow order creation but with paymentConfirmed: false
                                  // The webhook will update it later when payment is received
                                  if (errorMessage.includes('not found') || errorMessage.includes('pending')) {
                                    const proceed = confirm('Payment verification is pending. Your order will be created but will only be processed after payment is confirmed. Do you want to proceed?');
                                    if (proceed) {
                                      if (onOrderCreate) {
                                        await onOrderCreate({ ...paymentDetails, verified: false });
                                        alert('📋 Your order has been created and is pending payment confirmation. We will process your order once payment is verified. You will receive a confirmation once payment is received.');
                                        setManualStep('confirmed');
                                      } else {
                                        setManualStep('confirmed');
                                      }
                                    }
                                  } else {
                                    alert(`Payment verification error: ${errorMessage}\n\nPlease ensure you have completed the transfer and try again.`);
                                  }
                                } finally {
                                  setIsVerifying(false);
                                }
                              }}
                            >
                              {isVerifying || isVerifyingPayment ? '⏳ Verifying payment...' : '✅ I have completed the transfer'}
                            </button>
                            <button className="bg-gray-200 hover:bg-gray-300 font-semibold px-4 rounded-lg" style={{ color: colors.text }} onClick={() => setManualStep('contact-info')}>Back</button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {manualStep === 'confirmed' && (
                    <div className="space-y-3">
                      <div className="rounded-lg p-4" style={{ background: theme === 'light' ? '#ECFDF5' : '#052e21', border: `1px solid ${colors.green500 || '#10B981'}` }}>
                        <p className="font-bold text-lg mb-2 flex items-center gap-2" style={{ color: colors.green700 || '#047857' }}>
                          ✅ Payment Verified & Order Confirmed!
                        </p>
                        <p className="text-sm mb-2" style={{ color: colors.green700 || '#047857' }}>
                          Your payment has been successfully verified and your order has been placed.
                        </p>
                        <p className="text-sm" style={{ color: colors.green700 || '#047857' }}>
                          {isPreOrder
                            ? `We will ${manualDiningPreference === 'delivery' ? 'deliver your pre-order to' : 'notify you at'} ${manualDiningPreference === 'delivery' ? manualDeliveryAddress : manualContact} on the scheduled date.`
                            : `We will ${manualDiningPreference === 'takeout' ? 'deliver your order to' : 'notify you at'} ${manualDiningPreference === 'takeout' ? manualDeliveryAddress : manualContact} when your food is ready.`
                          }
                        </p>
                      </div>
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg w-full"
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
                <div key={index} className="rounded-lg p-3 sm:p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-1">
                        <span className="text-base sm:text-lg mr-2">{item.emoji}</span>
                        <h3 className="font-semibold text-sm sm:text-base" style={{ color: colors.text }}>{item.name}</h3>
                      </div>
                      <p className="text-xs sm:text-sm mb-2 line-clamp-3" style={{ color: colors.mutedText }}>{item.description}</p>
                      <p className="text-base sm:text-lg font-bold text-green-600">{item.price}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.name)}
                      className="p-2 rounded-full transition-colors text-red-500 touch-manipulation flex-shrink-0"
                      style={{ background: theme === 'light' ? '#FEF2F2' : '#3A2020' }}
                    >
                      <IoTrash className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <button
                        onClick={() => updateQuantity(item.name, item.quantity - 1)}
                        className="w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors touch-manipulation"
                        style={{ background: theme === 'light' ? '#E5E7EB' : '#4B5563', color: colors.text }}
                      >
                        <span className="text-lg font-bold">-</span>
                      </button>
                      <span className="font-semibold text-base sm:text-lg px-2 sm:px-3 min-w-[2rem] text-center" style={{ color: colors.text }}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.name, item.quantity + 1)}
                        className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors touch-manipulation"
                      >
                        <span className="text-lg font-bold">+</span>
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm" style={{ color: colors.mutedText }}>Subtotal</p>
                      <p className="font-bold text-green-600 text-sm sm:text-base">₦{(parseFloat(String(item.price).replace(/[^\d.]/g, '')) * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-3 sm:pt-4 mt-4 sm:mt-6" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                <div className="space-y-2 mb-3 sm:mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: colors.mutedText }}>Subtotal:</span>
                    <span className="text-sm" style={{ color: colors.text }}>₦{getTotalPrice()}</span>
                  </div>
                  {(manualDiningPreference === 'delivery' || manualDiningPreference === 'takeout') && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: colors.mutedText }}>🚚 Delivery Fee:</span>
                      <span className="text-sm" style={{ color: colors.text }}>₦{DELIVERY_FEE.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2" style={{ borderTop: `1px dashed ${colors.cardBorder}` }}>
                    <span className="text-lg sm:text-xl font-bold" style={{ color: colors.text }}>Total:</span>
                    <span className="text-xl sm:text-2xl font-bold text-green-600">₦{getGrandTotal().toLocaleString()}</span>
                  </div>
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
                  style={{ background: theme === 'light' ? '#E5E7EB' : '#4B5563', color: colors.text }}
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


