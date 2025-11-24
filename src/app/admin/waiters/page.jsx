'use client';

import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../AdminLayout';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../providers';
import {
  useGetCategoriesQuery,
  useGetMenuItemsQuery,
  useCreateOrderMutation,
  useGetOrdersQuery,
  useUpdateOrderMutation,
} from '../../../services/api';
import {
  IoSearchOutline,
  IoAddOutline,
  IoRemoveOutline,
  IoTrashOutline,
  IoCashOutline,
  IoCardOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoPersonOutline,
  IoMailOutline,
  IoCallOutline,
  IoRestaurantOutline,
  IoTimeOutline,
  IoReceiptOutline,
  IoReloadOutline,
} from 'react-icons/io5';
import { notifyWithSound, requestNotificationPermission, playNotificationSound } from '../../../utils/notifications';

export default function WaitersPage() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'pending-cash'
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transferConfirmed, setTransferConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [confirmingPaymentId, setConfirmingPaymentId] = useState(null);
  const [previousCashOrderIds, setPreviousCashOrderIds] = useState(new Set());

  const { data: categories = [] } = useGetCategoriesQuery({ active: true });
  const { data: menuItems = [], isLoading: isLoadingItems } = useGetMenuItemsQuery(
    { category: selectedCategoryId || undefined, active: true, available: true }
  );
  const [createOrder] = useCreateOrderMutation();
  const { data: ordersData = [], isLoading: isLoadingOrders, refetch: refetchOrders } = useGetOrdersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [updateOrder] = useUpdateOrderMutation();

  // Auto-select first category on mount
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0]._id);
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nv_token') : null;
    if (!token) router.replace('/admin/login');
  }, [router]);

  // Request notification permission and initialize audio context on mount
  useEffect(() => {
    requestNotificationPermission();
    
    // Initialize audio context on user interaction (required by browsers)
    const initAudio = () => {
      if (!window.audioContext) {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          window.audioContext = new AudioContext();
          // Resume immediately if suspended
          if (window.audioContext.state === 'suspended') {
            window.audioContext.resume();
          }
        } catch (error) {
          console.error('Error initializing audio context:', error);
        }
      }
    };
    
    // Try to initialize on any user interaction
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, initAudio, { once: true });
    });
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, initAudio);
      });
    };
  }, []);

  // Filter menu items by search
  const filteredItems = useMemo(() => {
    if (!search.trim()) return menuItems;
    const q = search.toLowerCase();
    return menuItems.filter(item =>
      item.name?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q)
    );
  }, [menuItems, search]);

  // Reset transfer confirmation when payment method changes
  useEffect(() => {
    if (paymentMethod !== 'transfer') {
      setTransferConfirmed(false);
    }
  }, [paymentMethod]);

  // Add item to cart
  const addToCart = (item) => {
    const existingItem = cart.find(ci => ci._id === item._id);
    if (existingItem) {
      setCart(cart.map(ci =>
        ci._id === item._id
          ? { ...ci, quantity: ci.quantity + 1 }
          : ci
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  // Remove item from cart
  const removeFromCart = (itemId) => {
    setCart(cart.filter(ci => ci._id !== itemId));
  };

  // Update quantity in cart
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(cart.map(ci =>
      ci._id === itemId
        ? { ...ci, quantity: newQuantity }
        : ci
    ));
  };

  // Calculate total
  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
      return sum + (price * item.quantity);
    }, 0);
  }, [cart]);

  // Handle order submission
  const handleSubmitOrder = async () => {
    if (!customerName.trim()) {
      alert('Please enter customer name');
      return;
    }
    if (cart.length === 0) {
      alert('Please add items to cart');
      return;
    }

    setIsSubmitting(true);
    try {
      const preparedOrderItems = cart.map(item => ({
        menuItem: item._id,
        quantity: item.quantity || 1,
        price: parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0
      }));

      const orderData = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        totalAmount: totalAmount,
        status: 'pending',
        paymentMethod: paymentMethod === 'transfer' ? 'online' : 'cash', // Map transfer to online
        paymentConfirmed: paymentMethod === 'transfer' ? true : false, // Transfer is auto-confirmed, cash needs confirmation
        table: tableNumber.trim() || undefined,
        orderItems: preparedOrderItems
      };

      await createOrder(orderData).unwrap();
      
      // Notify other tabs/windows about order creation
      if (typeof window !== 'undefined') {
        localStorage.setItem('nectarv_order_created', Date.now().toString());
        window.dispatchEvent(new Event('nectarv_order_created'));
      }
      
      // Reset form
      setCart([]);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setTableNumber('');
      setPaymentMethod('cash');
      setTransferConfirmed(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to create order:', error);
      alert(error?.data?.message || 'Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter pending cash orders (cash payment not confirmed)
  const pendingCashOrders = useMemo(() => {
    if (!Array.isArray(ordersData)) return [];
    return ordersData
      .filter(order => 
        order.paymentMethod === 'cash' && 
        !order.paymentConfirmed &&
        (order.status === 'pending' || order.status === 'confirmed')
      )
      .map(order => {
        const items = (order.orderItems || []).map(item => {
          if (item.menuItem && typeof item.menuItem === 'object') {
            return {
              name: item.menuItem?.name || 'Unknown Item',
              emoji: item.menuItem?.emoji || '🍽️',
              imageUrl: item.menuItem?.imageUrl || null,
              quantity: item.quantity || 1,
              price: item.price || 0,
            };
          }
          return {
            name: 'Unknown Item',
            emoji: '🍽️',
            imageUrl: null,
            quantity: item.quantity || 1,
            price: item.price || 0,
          };
        });
        return {
          id: order._id || order.id,
          customer: order.customerName || 'Guest Customer',
          items: items,
          total: order.totalAmount || 0,
          status: order.status || 'pending',
          date: order.createdAt || new Date().toISOString(),
          table: order.table || 'N/A',
          customerEmail: order.customerEmail || '',
          customerPhone: order.customerPhone || '',
        };
      });
  }, [ordersData]);

  // Handle cash payment confirmation
  const handleConfirmCashPayment = async (orderId) => {
    setConfirmingPaymentId(orderId);
    try {
      await updateOrder({ id: orderId, paymentConfirmed: true }).unwrap();
      refetchOrders();
      // Notify other tabs
      if (typeof window !== 'undefined') {
        localStorage.setItem('nectarv_order_created', Date.now().toString());
        window.dispatchEvent(new Event('nectarv_order_created'));
      }
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      alert('Failed to confirm payment. Please try again.');
    } finally {
      setConfirmingPaymentId(null);
    }
  };

  // Detect new cash orders and notify
  useEffect(() => {
    if (isLoadingOrders) return;
    
    // Initialize on first load (don't notify)
    if (previousCashOrderIds.size === 0 && pendingCashOrders.length > 0) {
      console.log('[Waiters] Initializing cash order tracking with', pendingCashOrders.length, 'orders');
      const currentOrderIds = new Set(pendingCashOrders.map(order => order.id));
      setPreviousCashOrderIds(currentOrderIds);
      return;
    }

    if (pendingCashOrders.length === 0) return;

    const currentOrderIds = new Set(pendingCashOrders.map(order => order.id));
    
    // Check for new cash orders
    const newCashOrders = pendingCashOrders.filter(order => !previousCashOrderIds.has(order.id));
    
    console.log('[Waiters] Checking for new cash orders:', {
      totalOrders: pendingCashOrders.length,
      previousCount: previousCashOrderIds.size,
      newOrdersCount: newCashOrders.length,
      newOrderIds: newCashOrders.map(o => o.id)
    });
    
    if (newCashOrders.length > 0) {
      // New cash orders detected - notify
      const orderCount = newCashOrders.length;
      const totalAmount = newCashOrders.reduce((sum, order) => sum + order.total, 0);
      const message = orderCount === 1 
        ? `Cash payment needed for order #${String(newCashOrders[0].id).slice(-8).toUpperCase()} - ₦${newCashOrders[0].total.toLocaleString()}`
        : `${orderCount} cash orders need payment confirmation - Total: ₦${totalAmount.toLocaleString()}`;
      
      console.log('[Waiters] New cash orders detected! Playing sound and showing notification:', message);
      
      // Play sound immediately
      playNotificationSound().catch(err => {
        console.error('[Waiters] Error playing sound:', err);
      });
      
      // Show notification
      notifyWithSound('💰 Cash Payment Required!', {
        body: message,
        tag: 'waiter-cash-payment',
      });
    }
    
    // Update previous order IDs
    setPreviousCashOrderIds(currentOrderIds);
  }, [pendingCashOrders, isLoadingOrders]);

  return (
    <AdminLayout title="Waiters" active="waiters" requiredPermission="waiters">
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Success Message */}
        {showSuccess && (
          <div className="fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 animate-slide-in" style={{ background: colors.green500, color: '#fff' }}>
            <IoCheckmarkCircleOutline className="h-6 w-6" />
            <span className="text-lg font-semibold">Order created successfully!</span>
          </div>
        )}

        {/* Tabs */}
        <div className="rounded-2xl p-1" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-3 rounded-xl text-lg font-semibold transition-all ${
                activeTab === 'create' ? 'text-white' : ''
              }`}
              style={{
                background: activeTab === 'create'
                  ? colors.amber500
                  : 'transparent',
                color: activeTab === 'create' ? '#fff' : colors.text
              }}
            >
              Create Order
            </button>
            <button
              onClick={() => setActiveTab('pending-cash')}
              className={`px-6 py-3 rounded-xl text-lg font-semibold transition-all relative ${
                activeTab === 'pending-cash' ? 'text-white' : ''
              }`}
              style={{
                background: activeTab === 'pending-cash'
                  ? colors.amber500
                  : 'transparent',
                color: activeTab === 'pending-cash' ? '#fff' : colors.text
              }}
            >
              Pending Cash Payments
              {pendingCashOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: colors.red600 || '#DC2626', color: '#fff' }}>
                  {pendingCashOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'create' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Menu Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search and Categories */}
            <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="flex-1 relative">
                  <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6" style={{ color: colors.mutedText }} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search menu items..."
                    className="w-full rounded-lg pl-10 pr-4 py-3 text-lg font-medium"
                    style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category._id}
                    onClick={() => setSelectedCategoryId(category._id)}
                    className={`px-4 py-2 rounded-lg text-base font-semibold transition-all ${
                      selectedCategoryId === category._id
                        ? 'text-white'
                        : ''
                    }`}
                    style={{
                      background: selectedCategoryId === category._id
                        ? colors.amber500
                        : theme === 'light' ? '#F3F4F6' : '#1F2937',
                      color: selectedCategoryId === category._id
                        ? '#fff'
                        : colors.text
                    }}
                  >
                    <span className="mr-2">{category.emoji || '🍽️'}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
              {isLoadingItems ? (
                <div className="text-center py-12">
                  <div className="text-lg" style={{ color: colors.mutedText }}>Loading menu items...</div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-lg font-medium mb-1" style={{ color: colors.text }}>No items found</div>
                  <div className="text-base" style={{ color: colors.mutedText }}>Try selecting a different category or search term</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredItems.map((item) => (
                    <div
                      key={item._id}
                      className="rounded-xl p-4 transition-all hover:scale-105"
                      style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 2px 8px rgba(16,24,40,0.04)' : '0 2px 8px rgba(0,0,0,0.2)' }}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-lg flex items-center justify-center text-3xl" style={{ background: theme === 'light' ? '#F3F4F6' : '#1F2937' }}>
                            {item.emoji || '🍽️'}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="text-lg font-bold mb-1" style={{ color: colors.text }}>{item.name}</div>
                          {item.description && (
                            <div className="text-sm mb-2 line-clamp-2" style={{ color: colors.mutedText }}>{item.description}</div>
                          )}
                          <div className="text-lg font-semibold" style={{ color: colors.green600 }}>{item.price}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => addToCart(item)}
                        className="w-full px-4 py-2 rounded-lg text-base font-semibold transition-transform hover:scale-105"
                        style={{ background: colors.green500, color: '#fff' }}
                      >
                        <IoAddOutline className="inline h-5 w-5 mr-1" />
                        Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Cart and Customer Info */}
          <div className="space-y-4">
            {/* Customer Information */}
            <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: colors.text }}>Customer Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: colors.text }}>
                    <IoPersonOutline className="inline h-4 w-4 mr-1" />
                    Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className="w-full rounded-lg px-4 py-3 text-lg"
                    style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: colors.text }}>
                    <IoMailOutline className="inline h-4 w-4 mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Enter email (optional)"
                    className="w-full rounded-lg px-4 py-3 text-lg"
                    style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: colors.text }}>
                    <IoCallOutline className="inline h-4 w-4 mr-1" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone (optional)"
                    className="w-full rounded-lg px-4 py-3 text-lg"
                    style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: colors.text }}>
                    <IoRestaurantOutline className="inline h-4 w-4 mr-1" />
                    Table Number
                  </label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Enter table number (optional)"
                    className="w-full rounded-lg px-4 py-3 text-lg"
                    style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                  />
                </div>
              </div>
            </div>

            {/* Cart */}
            <div className="rounded-2xl p-4 sticky top-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: colors.text }}>Cart</h3>
              
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-base" style={{ color: colors.mutedText }}>Cart is empty</div>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                    {cart.map((item) => {
                      const price = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
                      return (
                        <div
                          key={item._id}
                          className="rounded-lg p-3"
                          style={{ background: colors.background, border: `1px solid ${colors.cardBorder}` }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <div className="text-base font-semibold" style={{ color: colors.text }}>{item.name}</div>
                              <div className="text-sm" style={{ color: colors.mutedText }}>{item.price} × {item.quantity}</div>
                            </div>
                            <button
                              onClick={() => removeFromCart(item._id)}
                              className="p-1 rounded transition-transform hover:scale-110"
                              style={{ color: '#DC2626' }}
                            >
                              <IoTrashOutline className="h-5 w-5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              className="p-1 rounded"
                              style={{ background: theme === 'light' ? '#F3F4F6' : '#1F2937', color: colors.text }}
                            >
                              <IoRemoveOutline className="h-4 w-4" />
                            </button>
                            <span className="text-base font-semibold px-3" style={{ color: colors.text }}>{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              className="p-1 rounded"
                              style={{ background: theme === 'light' ? '#F3F4F6' : '#1F2937', color: colors.text }}
                            >
                              <IoAddOutline className="h-4 w-4" />
                            </button>
                            <div className="ml-auto text-base font-bold" style={{ color: colors.green600 }}>
                              ₦{(price * item.quantity).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Payment Method */}
                  <div className="mb-4 pt-4" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                    <label className="block text-sm font-semibold mb-3" style={{ color: colors.text }}>
                      Payment Method *
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button
                        onClick={() => setPaymentMethod('cash')}
                        className={`px-4 py-3 rounded-lg text-base font-semibold transition-all flex items-center justify-center gap-2 ${
                          paymentMethod === 'cash' ? 'text-white' : ''
                        }`}
                        style={{
                          background: paymentMethod === 'cash'
                            ? colors.green500
                            : theme === 'light' ? '#F3F4F6' : '#1F2937',
                          color: paymentMethod === 'cash' ? '#fff' : colors.text
                        }}
                      >
                        <IoCashOutline className="h-5 w-5" />
                        Cash
                      </button>
                      <button
                        onClick={() => setPaymentMethod('transfer')}
                        className={`px-4 py-3 rounded-lg text-base font-semibold transition-all flex items-center justify-center gap-2 ${
                          paymentMethod === 'transfer' ? 'text-white' : ''
                        }`}
                        style={{
                          background: paymentMethod === 'transfer'
                            ? colors.blue600 || '#2563EB'
                            : theme === 'light' ? '#F3F4F6' : '#1F2937',
                          color: paymentMethod === 'transfer' ? '#fff' : colors.text
                        }}
                      >
                        <IoCardOutline className="h-5 w-5" />
                        Transfer
                      </button>
                    </div>

                    {/* Transfer Account Details */}
                    {paymentMethod === 'transfer' && (
                      <div className="rounded-lg p-4 mt-3" style={{ background: theme === 'light' ? '#F9FAFB' : '#1F2937', border: `1px solid ${colors.cardBorder}` }}>
                        <h4 className="text-base font-semibold mb-3 flex items-center" style={{ color: colors.text }}>
                          🏦 Bank Transfer Details
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium" style={{ color: colors.mutedText }}>Account Name:</span>
                            <span className="text-sm font-bold" style={{ color: colors.text }}>NectarV Restaurant Ltd</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium" style={{ color: colors.mutedText }}>Account Number:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold font-mono" style={{ color: colors.text }}>2087654321</span>
                              <button
                                className="text-green-500 hover:text-green-700 text-xs px-2 py-1 rounded transition-colors"
                                onClick={(e) => {
                                  navigator.clipboard.writeText('2087654321');
                                  // Show brief feedback
                                  const btn = e.currentTarget;
                                  const originalText = btn.textContent;
                                  btn.textContent = '✓ Copied';
                                  setTimeout(() => {
                                    btn.textContent = originalText;
                                  }, 2000);
                                }}
                              >
                                📋 Copy
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium" style={{ color: colors.mutedText }}>Bank:</span>
                            <span className="text-sm font-bold" style={{ color: colors.text }}>First Bank of Nigeria</span>
                          </div>
                          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                            <p className="text-xs mb-3" style={{ color: colors.mutedText }}>
                              💡 Transfer the exact amount of <strong style={{ color: colors.green600 }}>₦{totalAmount.toLocaleString()}</strong> to the account above.
                            </p>
                            <button
                              onClick={() => setTransferConfirmed(!transferConfirmed)}
                              className={`w-full px-4 py-3 rounded-lg text-base font-semibold transition-all flex items-center justify-center gap-2 ${
                                transferConfirmed ? 'text-white' : ''
                              }`}
                              style={{
                                background: transferConfirmed
                                  ? colors.green500
                                  : theme === 'light' ? '#F3F4F6' : '#1F2937',
                                color: transferConfirmed ? '#fff' : colors.text,
                                border: transferConfirmed ? 'none' : `1px solid ${colors.cardBorder}`
                              }}
                            >
                              {transferConfirmed ? (
                                <>
                                  <IoCheckmarkCircleOutline className="h-5 w-5" />
                                  ✓ I have made the transfer
                                </>
                              ) : (
                                <>
                                  <IoCheckmarkCircleOutline className="h-5 w-5" />
                                  I have made the transfer
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="mb-4 pt-4" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold" style={{ color: colors.text }}>Total:</span>
                      <span className="text-2xl font-extrabold" style={{ color: colors.green600 }}>
                        ₦{totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitOrder}
                    disabled={
                      isSubmitting || 
                      !customerName.trim() || 
                      cart.length === 0 || 
                      (paymentMethod === 'transfer' && !transferConfirmed)
                    }
                    className={`w-full px-4 py-3 rounded-lg text-lg font-semibold transition-transform ${
                      isSubmitting || 
                      !customerName.trim() || 
                      cart.length === 0 || 
                      (paymentMethod === 'transfer' && !transferConfirmed)
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:scale-105'
                    }`}
                    style={{
                      background: 
                        isSubmitting || 
                        !customerName.trim() || 
                        cart.length === 0 || 
                        (paymentMethod === 'transfer' && !transferConfirmed)
                          ? colors.mutedText
                          : colors.green500,
                      color: '#fff'
                    }}
                  >
                    {isSubmitting ? 'Creating Order...' : 'Create Order'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        ) : (
          /* Pending Cash Payments Tab */
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${colors.amber500}, #f59e0b)`, border: `1px solid ${colors.amber500}` }}>
                <div className="text-base font-medium mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>Pending Cash Orders</div>
                <div className="text-5xl font-extrabold" style={{ color: '#fff' }}>{pendingCashOrders.length}</div>
                <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full opacity-20" style={{ background: '#fff' }} />
              </div>
              <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
                <div className="text-base font-medium mb-1" style={{ color: colors.mutedText }}>Total Amount</div>
                <div className="text-5xl font-extrabold" style={{ color: colors.green600 }}>
                  ₦{pendingCashOrders.reduce((sum, order) => sum + order.total, 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Search and Test Sound */}
            <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6" style={{ color: colors.mutedText }} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by customer name, table, or order ID..."
                    className="w-full rounded-lg pl-10 pr-4 py-3 text-lg font-medium"
                    style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                  />
                </div>
                <button
                  onClick={async () => {
                    console.log('Testing sound...');
                    await playNotificationSound();
                    console.log('Sound test completed');
                  }}
                  className="px-4 py-3 rounded-lg text-lg font-semibold transition-all hover:scale-105"
                  style={{ background: colors.amber500, color: '#fff' }}
                >
                  🔊 Test Sound
                </button>
              </div>
            </div>

            {/* Pending Cash Orders List */}
            <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-xl font-bold" style={{ color: colors.text }}>Pending Cash Payments</div>
                <div className="text-lg" style={{ color: colors.mutedText }}>{pendingCashOrders.length} orders</div>
              </div>

              {isLoadingOrders ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-lg" style={{ color: colors.mutedText }}>Loading orders...</div>
                </div>
              ) : pendingCashOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <IoCashOutline className="h-16 w-16 mb-4" style={{ color: colors.mutedText }} />
                  <div className="text-lg font-medium mb-1" style={{ color: colors.text }}>No pending cash payments</div>
                  <div className="text-base" style={{ color: colors.mutedText }}>All cash payments have been confirmed.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingCashOrders
                    .filter(order => {
                      if (!search.trim()) return true;
                      const q = search.toLowerCase();
                      return (
                        order.customer.toLowerCase().includes(q) ||
                        order.table.toLowerCase().includes(q) ||
                        order.id.toLowerCase().includes(q)
                      );
                    })
                    .map((order) => (
                      <div
                        key={order.id}
                        className="rounded-xl p-4 transition-all"
                        style={{ background: colors.background, border: `2px solid ${colors.amber500}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="text-base font-bold mb-1" style={{ color: colors.text }}>#{String(order.id).slice(-8).toUpperCase()}</div>
                            <div className="text-lg font-bold mb-1" style={{ color: colors.text }}>{order.customer}</div>
                            {order.table && (
                              <div className="text-sm mb-1" style={{ color: colors.mutedText }}>
                                <IoRestaurantOutline className="inline h-4 w-4 mr-1" />
                                {order.table}
                              </div>
                            )}
                            {order.customerPhone && (
                              <div className="text-sm mb-1" style={{ color: colors.mutedText }}>
                                <IoCallOutline className="inline h-4 w-4 mr-1" />
                                {order.customerPhone}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-extrabold mb-1" style={{ color: colors.green600 }}>₦{order.total.toLocaleString()}</div>
                            <div className="text-xs" style={{ color: colors.mutedText }}>{order.items.length} items</div>
                          </div>
                        </div>

                        {/* Order Item Images */}
                        {order.items.some(item => item.imageUrl) && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-2">
                              {order.items
                                .filter(item => item.imageUrl)
                                .slice(0, 4)
                                .map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="relative rounded-lg overflow-hidden"
                                    style={{ width: '60px', height: '60px', border: `1px solid ${colors.cardBorder}` }}
                                  >
                                    <img
                                      src={item.imageUrl}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                    />
                                    {item.quantity > 1 && (
                                      <div className="absolute top-0 right-0 bg-black bg-opacity-70 text-white text-xs font-bold px-1 rounded-bl">
                                        ×{item.quantity}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              {order.items.filter(item => item.imageUrl).length > 4 && (
                                <div
                                  className="rounded-lg flex items-center justify-center text-xs font-bold"
                                  style={{ width: '60px', height: '60px', background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                                >
                                  +{order.items.filter(item => item.imageUrl).length - 4}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Order Items */}
                        <div className="mb-4 pt-3" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                          <div className="text-xs font-semibold mb-2" style={{ color: colors.mutedText }}>ITEMS:</div>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <span style={{ color: colors.text }}>
                                  {item.emoji} {item.name} × {item.quantity}
                                </span>
                                <span className="font-semibold" style={{ color: colors.text }}>
                                  ₦{(item.price * item.quantity).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Confirm Payment Button */}
                        <button
                          onClick={() => handleConfirmCashPayment(order.id)}
                          disabled={confirmingPaymentId === order.id}
                          className={`w-full px-4 py-3 rounded-lg text-lg font-semibold transition-transform ${
                            confirmingPaymentId === order.id
                              ? 'opacity-70 cursor-not-allowed'
                              : 'hover:scale-105'
                          }`}
                          style={{
                            background: confirmingPaymentId === order.id
                              ? colors.mutedText
                              : colors.green500,
                            color: '#fff'
                          }}
                        >
                          {confirmingPaymentId === order.id ? (
                            <span className="inline-flex items-center gap-2">
                              <IoReloadOutline className="animate-spin h-5 w-5" />
                              Confirming...
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <IoCheckmarkCircleOutline className="h-5 w-5" />
                              Confirm Cash Received
                            </span>
                          )}
                        </button>

                        {/* Order Date */}
                        <div className="text-xs mt-2 text-center" style={{ color: colors.mutedText }}>
                          {new Date(order.date).toLocaleString()}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

