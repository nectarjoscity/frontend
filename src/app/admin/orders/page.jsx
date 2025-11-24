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
  IoFilterOutline,
  IoEllipsisVerticalOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoTimeOutline,
  IoReceiptOutline,
  IoPersonOutline,
  IoCalendarOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoCashOutline,
  IoCardOutline,
  IoClose,
  IoPersonAddOutline,
} from 'react-icons/io5';

export default function OrdersPage() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const { data: ordersData = [], isLoading, error, refetch } = useGetOrdersQuery(undefined, {
    // Refetch when component mounts or args change
    refetchOnMountOrArgChange: true,
    // Keep subscription active so cache invalidation works
    skip: false,
  });
  const [updateOrder] = useUpdateOrderMutation();
  const [deleteOrder] = useDeleteOrderMutation();

  // Listen for order creation events from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'nectarv_order_created' && e.newValue) {
        console.log('[Orders Page] Order created in another tab, refetching...');
        refetch();
        // Clear the flag
        localStorage.removeItem('nectarv_order_created');
      }
    };

    // Listen for storage events (cross-tab communication)
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (same-tab communication)
    const handleCustomEvent = () => {
      console.log('[Orders Page] Order created event received, refetching...');
      refetch();
    };
    window.addEventListener('nectarv_order_created', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('nectarv_order_created', handleCustomEvent);
    };
  }, [refetch]);

  // Debug logging
  useEffect(() => {
    console.log('Orders data from API:', ordersData);
    console.log('Orders error:', error);
    console.log('Is loading:', isLoading);
  }, [ordersData, error, isLoading]);

  // Transform backend data to match frontend format
  const orders = useMemo(() => {
    if (!Array.isArray(ordersData)) {
      console.warn('Orders data is not an array:', ordersData);
      return [];
    }
    
    console.log('Transforming orders:', ordersData.length);
    
    return ordersData.map(order => {
      // Handle orderItems - they might be populated or just IDs
      const items = (order.orderItems || []).map(item => {
        // If item is populated (has menuItem object)
        if (item.menuItem && typeof item.menuItem === 'object') {
          return {
            name: item.menuItem?.name || 'Unknown Item',
            emoji: item.menuItem?.emoji || '🍽️',
            imageUrl: item.menuItem?.imageUrl || null,
            quantity: item.quantity || 1,
            price: item.price || 0,
          };
        }
        // If item is just an ID or not populated, use fallback
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
        orderId: order._id || order.id,
        customer: order.customerName || 'Guest Customer',
        items: items,
        total: order.totalAmount || 0,
        status: order.status || 'pending',
        paymentMethod: order.paymentMethod || 'cash',
        paymentConfirmed: order.paymentConfirmed || false,
        date: order.createdAt || order.date || new Date().toISOString(),
        table: order.table || 'N/A',
        waiter: order.waiter ? {
          name: order.waiter.name || 'Unknown Waiter',
          email: order.waiter.email || ''
        } : null,
      };
    });
  }, [ordersData]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrder({ id: orderId, status: newStatus }).unwrap();
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await deleteOrder({ id: orderId }).unwrap();
      } catch (error) {
        console.error('Failed to delete order:', error);
      }
    }
  };

  // Filter out cash orders that haven't been payment confirmed
  const displayOrders = useMemo(() => {
    return orders.filter(order => {
      // If it's a cash order, payment must be confirmed
      if (order.paymentMethod === 'cash') {
        return order.paymentConfirmed === true;
      }
      // For non-cash orders (transfer/online), show all
      return true;
    });
  }, [orders]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nv_token') : null;
    if (!token) router.replace('/admin/login');
  }, [router]);

  const filteredOrders = useMemo(() => {
    let filtered = displayOrders;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === statusFilter);
    }
    
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(o => 
        o.id.toLowerCase().includes(q) || 
        o.customer.toLowerCase().includes(q) ||
        o.table.toLowerCase().includes(q)
      );
    }
    
    return filtered;
  }, [displayOrders, statusFilter, search]);

  const stats = useMemo(() => {
    const total = displayOrders.length;
    const completed = displayOrders.filter(o => o.status === 'completed').length;
    const pending = displayOrders.filter(o => o.status === 'pending').length;
    const preparing = displayOrders.filter(o => o.status === 'preparing').length;
    const cancelled = displayOrders.filter(o => o.status === 'cancelled').length;
    const revenue = displayOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0);
    
    return { total, completed, pending, preparing, cancelled, revenue };
  }, [displayOrders]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return { bg: theme === 'light' ? '#ECFDF5' : '#052e21', text: colors.green700 || '#047857' };
      case 'pending': return { bg: theme === 'light' ? '#FEF3C7' : '#3A2F1A', text: colors.amber700 || '#B45309' };
      case 'preparing': return { bg: theme === 'light' ? '#DBEAFE' : '#1E3A5F', text: colors.blue700 || '#1D4ED8' };
      case 'ready': return { bg: theme === 'light' ? '#FEF3C7' : '#78350F', text: colors.amber700 || '#B45309' };
      case 'on-the-way': return { bg: theme === 'light' ? '#EDE9FE' : '#4C1D95', text: '#7C3AED' };
      case 'cancelled': return { bg: theme === 'light' ? '#FEF2F2' : '#3A2020', text: '#DC2626' };
      default: return { bg: colors.cardBg, text: colors.text };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <IoCheckmarkCircleOutline className="h-4 w-4" />;
      case 'pending': return <IoTimeOutline className="h-4 w-4" />;
      case 'preparing': return <IoReceiptOutline className="h-4 w-4" />;
      case 'ready': return <IoCheckmarkCircleOutline className="h-4 w-4" />;
      case 'on-the-way': return <IoTimeOutline className="h-4 w-4" />;
      case 'cancelled': return <IoCloseCircleOutline className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <AdminLayout title="Orders" active="orders" requiredPermission="orders">
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${colors.amber500}, #f59e0b)`, border: `1px solid ${colors.amber500}` }}>
            <div className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>Total Orders</div>
            <div className="text-4xl font-extrabold" style={{ color: '#fff' }}>{stats.total}</div>
            <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full opacity-20" style={{ background: '#fff' }} />
          </div>
          <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
            <div className="text-sm font-medium mb-1" style={{ color: colors.mutedText }}>Completed</div>
            <div className="text-4xl font-extrabold" style={{ color: colors.green600 }}>{stats.completed}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
            <div className="text-sm font-medium mb-1" style={{ color: colors.mutedText }}>Pending</div>
            <div className="text-4xl font-extrabold" style={{ color: colors.amber600 }}>{stats.pending}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
            <div className="text-sm font-medium mb-1" style={{ color: colors.mutedText }}>Preparing</div>
            <div className="text-4xl font-extrabold" style={{ color: colors.blue600 || '#2563EB' }}>{stats.preparing}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
            <div className="text-sm font-medium mb-1" style={{ color: colors.mutedText }}>Cancelled</div>
            <div className="text-4xl font-extrabold" style={{ color: '#DC2626' }}>{stats.cancelled}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
            <div className="text-sm font-medium mb-1" style={{ color: colors.mutedText }}>Revenue</div>
            <div className="text-3xl font-extrabold" style={{ color: colors.text }}>₦{stats.revenue.toLocaleString()}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: colors.mutedText }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order ID, customer, or table..."
                className="w-full rounded-lg pl-10 pr-4 py-3 text-base font-medium"
                style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
              />
            </div>
            <div className="flex items-center gap-2">
              <IoFilterOutline className="h-5 w-5" style={{ color: colors.mutedText }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg px-4 py-3 text-base font-medium"
                style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="on-the-way">On The Way</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-bold" style={{ color: colors.text }}>Orders List</div>
            <div className="text-base" style={{ color: colors.mutedText }}>{filteredOrders.length} orders</div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-base" style={{ color: colors.mutedText }}>Loading orders...</div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <IoReceiptOutline className="h-16 w-16 mb-4" style={{ color: colors.mutedText }} />
              <div className="text-base font-medium mb-1" style={{ color: colors.text }}>No orders found</div>
              <div className="text-sm" style={{ color: colors.mutedText }}>Orders will appear here once customers place them.</div>
            </div>
          ) : (
            <div className="space-y-3">
            {filteredOrders.map((order) => {
              const statusStyle = getStatusColor(order.status);
              const isExpanded = expandedOrder === order.id;

              return (
                <div
                  key={order.id}
                  className="rounded-xl overflow-hidden transition-all"
                  style={{ background: colors.background, border: `1px solid ${colors.cardBorder}` }}
                >
                  {/* Order Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-base font-bold" style={{ color: colors.text }}>#{String(order.id).slice(-8).toUpperCase()}</div>
                          <span className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-full font-semibold" style={{ background: statusStyle.bg, color: statusStyle.text }}>
                            {getStatusIcon(order.status)}
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: colors.mutedText }}>
                          <span className="inline-flex items-center gap-1">
                            <IoPersonOutline className="h-4 w-4" />
                            {order.customer}
                          </span>
                          {order.waiter && (
                            <span className="inline-flex items-center gap-1" style={{ color: colors.blue600 || '#2563EB' }}>
                              <IoPersonAddOutline className="h-4 w-4" />
                              Waiter: {order.waiter.name}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <IoReceiptOutline className="h-4 w-4" />
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🪑</span>
                              <span className="font-bold" style={{color: colors.text}}>
                                {order.table || 'N/A'}
                              </span>
                            </div>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <IoCalendarOutline className="h-4 w-4" />
                            {new Date(order.date).toLocaleString()}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            {order.paymentMethod === 'cash' ? (
                              <IoCashOutline className="h-4 w-4" />
                            ) : order.paymentMethod === 'online' ? (
                              <IoCardOutline className="h-4 w-4" />
                            ) : (
                              <IoCardOutline className="h-4 w-4" />
                            )}
                            {order.paymentMethod === 'online' ? 'Transfer' : order.paymentMethod === 'cash' ? 'Cash' : order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-xl font-extrabold" style={{ color: colors.text }}>₦{order.total.toLocaleString()}</div>
                          <div className="text-sm" style={{ color: colors.mutedText }}>{order.items.length} items</div>
                        </div>
                        <button
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          className="p-2 rounded-lg transition-transform hover:scale-110"
                          style={{ background: theme === 'light' ? '#F3F4F6' : '#1F2937', color: colors.text }}
                        >
                          {isExpanded ? <IoChevronUpOutline className="h-4 w-4" /> : <IoChevronDownOutline className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                        <div className="grid grid-cols-2 gap-4 mb-4 pb-4" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                          <div>
                            <div className="text-xs font-semibold mb-1" style={{ color: colors.mutedText }}>PAYMENT METHOD</div>
                            <div className="inline-flex items-center gap-2 text-base font-semibold" style={{ color: colors.text }}>
                              {order.paymentMethod === 'cash' ? (
                                <>
                                  <IoCashOutline className="h-5 w-5" style={{ color: colors.green600 }} />
                                  <span>Cash</span>
                                </>
                              ) : order.paymentMethod === 'online' ? (
                                <>
                                  <IoCardOutline className="h-5 w-5" style={{ color: colors.blue600 || '#2563EB' }} />
                                  <span>Transfer</span>
                                </>
                              ) : (
                                <>
                                  <IoCardOutline className="h-5 w-5" />
                                  <span>{order.paymentMethod?.charAt(0).toUpperCase() + order.paymentMethod?.slice(1) || 'Cash'}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {order.waiter && (
                            <div>
                              <div className="text-xs font-semibold mb-1" style={{ color: colors.mutedText }}>WAITER</div>
                              <div className="inline-flex items-center gap-2 text-base font-semibold" style={{ color: colors.blue600 || '#2563EB' }}>
                                <IoPersonAddOutline className="h-5 w-5" />
                                <span>{order.waiter.name}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-semibold mb-2" style={{ color: colors.mutedText }}>ORDER ITEMS</div>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg gap-3" style={{ background: colors.cardBg }}>
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {/* Item Image */}
                                <div 
                                  className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105" 
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
                                    <div className="w-full h-full flex items-center justify-center text-2xl">
                                      {item.emoji || '🍽️'}
                                    </div>
                                  )}
                                </div>
                                {/* Item Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="text-base font-medium mb-1" style={{ color: colors.text }}>{item.name}</div>
                                  <span className="text-sm px-2 py-1 rounded inline-block" style={{ background: theme === 'light' ? '#F3F4F6' : '#1F2937', color: colors.mutedText }}>x{item.quantity}</span>
                                </div>
                              </div>
                              <div className="text-base font-semibold flex-shrink-0" style={{ color: colors.text }}>₦{(item.price * item.quantity).toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center justify-end gap-2">
                          {order.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleStatusUpdate(order.id, 'preparing')}
                                className="px-4 py-2 rounded-lg text-base font-semibold transition-transform hover:scale-105" 
                                style={{ background: colors.blue500 || '#3B82F6', color: '#fff' }}
                              >
                                Start Preparing
                              </button>
                              <button 
                                onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                                className="px-4 py-2 rounded-lg text-base font-semibold transition-transform hover:scale-105" 
                                style={{ background: theme === 'light' ? '#FEF2F2' : '#3A2020', color: '#DC2626' }}
                              >
                                Cancel Order
                              </button>
                            </>
                          )}
                          {order.status === 'preparing' && (
                            <button 
                              onClick={() => handleStatusUpdate(order.id, 'ready')}
                              className="px-4 py-2 rounded-lg text-base font-semibold transition-transform hover:scale-105" 
                              style={{ background: colors.amber500, color: '#fff' }}
                            >
                              Mark as Ready
                            </button>
                          )}
                          {order.status === 'ready' && !order.table && (
                            <button 
                              onClick={() => handleStatusUpdate(order.id, 'on-the-way')}
                              className="px-4 py-2 rounded-lg text-base font-semibold transition-transform hover:scale-105" 
                              style={{ background: '#8b5cf6', color: '#fff' }}
                            >
                              Dispatch Started
                            </button>
                          )}
                          {order.status === 'ready' && order.table && (
                            <button 
                              onClick={() => handleStatusUpdate(order.id, 'completed')}
                              className="px-4 py-2 rounded-lg text-base font-semibold transition-transform hover:scale-105" 
                              style={{ background: colors.green500, color: '#fff' }}
                            >
                              Mark as Completed
                            </button>
                          )}
                          {order.status === 'on-the-way' && (
                            <button 
                              onClick={() => handleStatusUpdate(order.id, 'completed')}
                              className="px-4 py-2 rounded-lg text-base font-semibold transition-transform hover:scale-105" 
                              style={{ background: colors.green500, color: '#fff' }}
                            >
                              Mark as Delivered
                            </button>
                          )}
                          {(order.status === 'completed' || order.status === 'cancelled') && (
                            <button 
                              onClick={() => handleDeleteOrder(order.id)}
                              className="px-4 py-2 rounded-lg text-base font-semibold transition-transform hover:scale-105" 
                              style={{ background: theme === 'light' ? '#FEF2F2' : '#3A2020', color: '#DC2626' }}
                            >
                              Delete Order
                            </button>
                          )}
                        </div>
                      </div>
                    )}
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
            {/* Close Button */}
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
            
            {/* Image */}
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

