'use client';

import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../AdminLayout';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../providers';
import {
  useGetOrdersQuery,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
} from '../../../services/api';
import {
  IoSearchOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoReceiptOutline,
  IoPersonOutline,
  IoCalendarOutline,
  IoClose,
  IoRestaurantOutline,
  IoReloadOutline,
  IoPersonAddOutline,
  IoCashOutline,
  IoCardOutline,
  IoTrashOutline,
  IoCloseCircleOutline,
} from 'react-icons/io5';
import { notifyWithSound, requestNotificationPermission, playNotificationSound } from '../../../utils/notifications';

export default function KitchenPage() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [previousOrderIds, setPreviousOrderIds] = useState(new Set());

  const { data: ordersData = [], isLoading, error, refetch } = useGetOrdersQuery(undefined, {
    refetchOnMountOrArgChange: true,
    skip: false,
  });
  const [updateOrder] = useUpdateOrderMutation();
  const [deleteOrder] = useDeleteOrderMutation();

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

  // Listen for order creation events from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'nectarv_order_created' && e.newValue) {
        console.log('[Kitchen Page] Order created in another tab, refetching...');
        refetch();
        localStorage.removeItem('nectarv_order_created');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const handleCustomEvent = () => {
      console.log('[Kitchen Page] Order created event received, refetching...');
      refetch();
    };
    window.addEventListener('nectarv_order_created', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('nectarv_order_created', handleCustomEvent);
    };
  }, [refetch]);

  // Transform backend data to match frontend format
  const orders = useMemo(() => {
    if (!Array.isArray(ordersData)) {
      return [];
    }

    return ordersData.map(order => {
      // Handle orderItems - they might be populated or just IDs
      const items = (order.orderItems || []).map(item => {
        // If item is populated (has menuItem object)
        if (item.menuItem && typeof item.menuItem === 'object') {
          return {
            name: item.menuItem?.name || 'Unknown Item',
            emoji: item.menuItem?.emoji || '🍽️',
            imageUrl: item.menuItem?.imageUrl || null,
            description: item.menuItem?.description || '',
            quantity: item.quantity || 1,
            price: item.price || 0,
            notes: item.notes || '',
          };
        }
        // If item is just an ID or not populated, use fallback
        return {
          name: 'Unknown Item',
          emoji: '🍽️',
          imageUrl: null,
          description: '',
          quantity: item.quantity || 1,
          price: item.price || 0,
          notes: item.notes || '',
        };
      });

      return {
        id: order._id || order.id,
        orderId: order._id || order.id,
        customer: order.customerName || 'Guest Customer',
        items: items,
        total: order.totalAmount || 0,
        status: order.status || 'pending',
        paymentMethod: order.paymentMethod || 'cash',
        paymentConfirmed: order.paymentConfirmed || false,
        date: order.createdAt || order.date || new Date().toISOString(),
        table: order.table || 'N/A',
        customerEmail: order.customerEmail || null,
        notes: order.notes || '',
        waiter: order.waiter ? {
          name: order.waiter.name || 'Unknown Waiter',
          email: order.waiter.email || ''
        } : null,
      };
    });
  }, [ordersData]);

  // Filter orders to show only pending and preparing (not completed or cancelled)
  // Also filter out cash orders that haven't been payment confirmed
  const kitchenOrders = useMemo(() => {
    return orders.filter(order => {
      const isActiveStatus = order.status === 'pending' || order.status === 'preparing';
      // If it's a cash order, payment must be confirmed
      if (order.paymentMethod === 'cash') {
        return isActiveStatus && order.paymentConfirmed === true;
      }
      // For non-cash orders (transfer/online), show if active status
      return isActiveStatus;
    });
  }, [orders]);

  // Detect new orders and notify
  useEffect(() => {
    if (isLoading) return;

    // Initialize on first load (don't notify)
    if (previousOrderIds.size === 0 && kitchenOrders.length > 0) {
      console.log('[Kitchen] Initializing order tracking with', kitchenOrders.length, 'orders');
      const currentOrderIds = new Set(kitchenOrders.map(order => order.id));
      setPreviousOrderIds(currentOrderIds);
      return;
    }

    if (kitchenOrders.length === 0) return;

    const currentOrderIds = new Set(kitchenOrders.map(order => order.id));

    // Check for new orders
    const newOrders = kitchenOrders.filter(order => !previousOrderIds.has(order.id));

    console.log('[Kitchen] Checking for new orders:', {
      totalOrders: kitchenOrders.length,
      previousCount: previousOrderIds.size,
      newOrdersCount: newOrders.length,
      newOrderIds: newOrders.map(o => o.id)
    });

    if (newOrders.length > 0) {
      // New orders detected - notify
      const orderCount = newOrders.length;
      const message = orderCount === 1
        ? `New order #${String(newOrders[0].id).slice(-8).toUpperCase()} from ${newOrders[0].customer}`
        : `${orderCount} new orders received`;

      console.log('[Kitchen] New orders detected! Playing sound and showing notification:', message);

      // Play sound immediately
      playNotificationSound().catch(err => {
        console.error('[Kitchen] Error playing sound:', err);
      });

      // Show notification
      notifyWithSound('🍽️ New Order Received!', {
        body: message,
        tag: 'kitchen-new-order',
      });
    }

    // Update previous order IDs
    setPreviousOrderIds(currentOrderIds);
  }, [kitchenOrders, isLoading]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await updateOrder({ id: orderId, status: newStatus }).unwrap();
      // Refetch to update the list (completed orders will disappear)
      refetch();
    } catch (error) {
      console.error('Failed to update order:', error);
      alert('Failed to update order status. Please try again.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }
    setUpdatingOrderId(orderId);
    try {
      await updateOrder({ id: orderId, status: 'cancelled' }).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }
    setDeletingOrderId(orderId);
    try {
      await deleteOrder({ id: orderId }).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to delete order:', error);
      alert('Failed to delete order. Please try again.');
    } finally {
      setDeletingOrderId(null);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nv_token') : null;
    if (!token) router.replace('/admin/login');
  }, [router]);

  const filteredOrders = useMemo(() => {
    let filtered = kitchenOrders;

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.table.toLowerCase().includes(q) ||
        o.items.some(item => item.name.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [kitchenOrders, search]);

  const stats = useMemo(() => {
    const pending = kitchenOrders.filter(o => o.status === 'pending').length;
    const preparing = kitchenOrders.filter(o => o.status === 'preparing').length;

    return { pending, preparing, total: kitchenOrders.length };
  }, [kitchenOrders]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return { bg: theme === 'light' ? '#FEF3C7' : '#3A2F1A', text: colors.amber700 || '#B45309' };
      case 'preparing': return { bg: theme === 'light' ? '#DBEAFE' : '#1E3A5F', text: colors.blue700 || '#1D4ED8' };
      default: return { bg: colors.cardBg, text: colors.text };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <IoTimeOutline className="h-4 w-4" />;
      case 'preparing': return <IoReceiptOutline className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <AdminLayout title="Kitchen" active="kitchen" requiredPermission="kitchen">
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${colors.amber500}, #f59e0b)`, border: `1px solid ${colors.amber500}` }}>
            <div className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>Pending Orders</div>
            <div className="text-4xl font-extrabold" style={{ color: '#fff' }}>{stats.pending}</div>
            <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full opacity-20" style={{ background: '#fff' }} />
          </div>
          <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
            <div className="text-sm font-medium mb-1" style={{ color: colors.mutedText }}>Preparing</div>
            <div className="text-4xl font-extrabold" style={{ color: colors.blue600 || '#2563EB' }}>{stats.preparing}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
            <div className="text-sm font-medium mb-1" style={{ color: colors.mutedText }}>Total Active</div>
            <div className="text-4xl font-extrabold" style={{ color: colors.text }}>{stats.total}</div>
          </div>
        </div>

        {/* Search and Test Sound */}
        <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: colors.mutedText }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order ID, customer, table, or item name..."
                className="w-full rounded-lg pl-10 pr-4 py-3 text-base font-medium"
                style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
              />
            </div>
            <button
              onClick={async () => {
                console.log('Testing sound...');
                await playNotificationSound();
                console.log('Sound test completed');
              }}
              className="px-4 py-3 rounded-lg text-base font-semibold transition-all hover:scale-105"
              style={{ background: colors.amber500, color: '#fff' }}
            >
              🔊 Test Sound
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-bold" style={{ color: colors.text }}>Active Orders</div>
            <div className="text-base" style={{ color: colors.mutedText }}>{filteredOrders.length} orders</div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-base" style={{ color: colors.mutedText }}>Loading orders...</div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <IoRestaurantOutline className="h-16 w-16 mb-4" style={{ color: colors.mutedText }} />
              <div className="text-base font-medium mb-1" style={{ color: colors.text }}>No active orders</div>
              <div className="text-sm" style={{ color: colors.mutedText }}>All orders are completed or there are no pending orders.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredOrders.map((order) => {
                const statusStyle = getStatusColor(order.status);

                return (
                  <div
                    key={order.id}
                    className="rounded-xl overflow-hidden transition-all"
                    style={{ background: colors.background, border: `2px solid ${statusStyle.bg}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}
                  >
                    {/* Order Header */}
                    <div className="p-4" style={{ background: statusStyle.bg, borderBottom: `1px solid ${colors.cardBorder}` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-base font-bold" style={{ color: statusStyle.text }}>#{String(order.id).slice(-8).toUpperCase()}</div>
                        <span className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-full font-semibold" style={{ background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.text}` }}>
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: statusStyle.text }}>
                        <span className="inline-flex items-center gap-1">
                          <IoPersonOutline className="h-4 w-4" />
                          {order.customer}
                        </span>
                        {order.waiter && (
                          <span className="inline-flex items-center gap-1">
                            <IoPersonAddOutline className="h-4 w-4" />
                            Waiter: {order.waiter.name}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <IoReceiptOutline className="h-4 w-4" />
                          <span className="font-bold">Table: {order.table}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          {order.paymentMethod === 'cash' ? (
                            <IoCashOutline className="h-4 w-4" />
                          ) : order.paymentMethod === 'online' ? (
                            <IoCardOutline className="h-4 w-4" />
                          ) : (
                            <IoCardOutline className="h-4 w-4" />
                          )}
                          {order.paymentMethod === 'online' ? 'Transfer' : order.paymentMethod === 'cash' ? 'Cash' : order.paymentMethod?.charAt(0).toUpperCase() + order.paymentMethod?.slice(1) || 'Cash'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <IoCalendarOutline className="h-4 w-4" />
                          {new Date(order.date).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-4 space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="rounded-lg overflow-hidden" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                          {/* Mobile: Stack vertically | Tablet+: Horizontal layout */}
                          <div className="flex flex-col sm:flex-row gap-3 p-3">
                            {/* Item Image - Full width on mobile, fixed size on desktop */}
                            <div
                              className="flex-shrink-0 w-full sm:w-24 h-40 sm:h-24 rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] sm:hover:scale-105"
                              style={{ background: theme === 'light' ? '#F3F4F6' : '#1F2937' }}
                              onClick={() => item.imageUrl && setSelectedImage(item.imageUrl)}
                            >
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-5xl sm:text-4xl">
                                  {item.emoji || '🍽️'}
                                </div>
                              )}
                            </div>

                            {/* Item Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="text-lg sm:text-base font-bold flex-1" style={{ color: colors.text }}>{item.name}</div>
                                <span className="text-sm px-3 py-1.5 sm:px-2 sm:py-1 rounded-lg sm:rounded font-semibold whitespace-nowrap" style={{ background: theme === 'light' ? '#F3F4F6' : '#1F2937', color: colors.text }}>x{item.quantity}</span>
                              </div>
                              {item.description && (
                                <div className="text-sm mb-2" style={{ color: colors.mutedText }}>
                                  <div className="font-semibold mb-1">Description:</div>
                                  <div>{item.description}</div>
                                </div>
                              )}
                              {item.notes && (
                                <div className="text-sm mb-2 p-2 rounded-lg" style={{ background: theme === 'light' ? '#FEF3C7' : '#3A2F1A', color: colors.amber600 }}>
                                  <div className="font-semibold mb-1">⚠️ Special Notes:</div>
                                  <div>{item.notes}</div>
                                </div>
                              )}
                              <div className="text-lg sm:text-base font-bold" style={{ color: colors.amber600 }}>₦{(item.price * item.quantity).toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Order Total */}
                      <div className="flex items-center justify-between pt-3 mt-3" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                        <div className="text-base font-bold" style={{ color: colors.text }}>Total</div>
                        <div className="text-xl font-extrabold" style={{ color: colors.text }}>₦{order.total.toLocaleString()}</div>
                      </div>

                      {/* Order Notes */}
                      {order.notes && (
                        <div className="p-3 rounded-lg" style={{ background: theme === 'light' ? '#FEF3C7' : '#3A2F1A' }}>
                          <div className="text-sm font-semibold mb-1" style={{ color: colors.amber700 }}>Order Notes:</div>
                          <div className="text-sm" style={{ color: colors.amber700 }}>{order.notes}</div>
                        </div>
                      )}

                      {/* Status Update Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-3">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(order.id, 'preparing')}
                              disabled={updatingOrderId === order.id || deletingOrderId === order.id}
                              className={`flex-1 min-w-[100px] px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${updatingOrderId === order.id || deletingOrderId === order.id
                                  ? 'opacity-70 cursor-not-allowed'
                                  : 'hover:scale-105 active:scale-95'
                                }`}
                              style={{ background: colors.blue500 || '#3B82F6', color: '#fff' }}
                            >
                              {updatingOrderId === order.id ? (
                                <span className="inline-flex items-center justify-center gap-1.5">
                                  <IoReloadOutline className="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
                                  <span className="hidden sm:inline">Updating...</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center gap-1.5">
                                  <IoReceiptOutline className="h-4 w-4 sm:hidden" />
                                  <span>Start</span>
                                  <span className="hidden sm:inline"> Preparing</span>
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={updatingOrderId === order.id || deletingOrderId === order.id}
                              className={`px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${updatingOrderId === order.id || deletingOrderId === order.id
                                  ? 'opacity-70 cursor-not-allowed'
                                  : 'hover:scale-105 active:scale-95'
                                }`}
                              style={{ background: colors.amber500 || '#F59E0B', color: '#fff' }}
                            >
                              {updatingOrderId === order.id ? (
                                <IoReloadOutline className="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
                              ) : (
                                <span className="inline-flex items-center justify-center gap-1.5">
                                  <IoCloseCircleOutline className="h-4 w-4 sm:h-5 sm:w-5" />
                                  <span className="hidden sm:inline">Cancel</span>
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              disabled={updatingOrderId === order.id || deletingOrderId === order.id}
                              className={`px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${updatingOrderId === order.id || deletingOrderId === order.id
                                  ? 'opacity-70 cursor-not-allowed'
                                  : 'hover:scale-105 active:scale-95'
                                }`}
                              style={{ background: colors.red600 || '#DC2626', color: '#fff' }}
                            >
                              {deletingOrderId === order.id ? (
                                <IoReloadOutline className="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
                              ) : (
                                <span className="inline-flex items-center justify-center gap-1.5">
                                  <IoTrashOutline className="h-4 w-4 sm:h-5 sm:w-5" />
                                  <span className="hidden sm:inline">Delete</span>
                                </span>
                              )}
                            </button>
                          </>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'ready')}
                            disabled={updatingOrderId === order.id}
                            className={`flex-1 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${updatingOrderId === order.id
                                ? 'opacity-70 cursor-not-allowed'
                                : 'hover:scale-105 active:scale-95'
                              }`}
                            style={{ background: colors.green500, color: '#fff' }}
                          >
                            {updatingOrderId === order.id ? (
                              <span className="inline-flex items-center justify-center gap-1.5">
                                <IoReloadOutline className="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
                                <span className="hidden sm:inline">Updating...</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center gap-1.5">
                                <IoCheckmarkCircleOutline className="h-4 w-4 sm:h-5 sm:w-5" />
                                <span>Ready</span>
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 z-10 p-3 rounded-full transition-all hover:scale-110"
              style={{
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                backdropFilter: 'blur(4px)'
              }}
              onClick={() => setSelectedImage(null)}
            >
              <IoClose className="w-6 h-6" />
            </button>

            <img
              src={selectedImage}
              alt="Full size"
              className="w-full h-auto rounded-2xl shadow-2xl"
              style={{ maxHeight: '90vh', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

