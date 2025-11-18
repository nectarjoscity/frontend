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
} from 'react-icons/io5';

export default function OrdersPage() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);

  const { data: ordersData = [], isLoading } = useGetOrdersQuery();
  const [updateOrder] = useUpdateOrderMutation();
  const [deleteOrder] = useDeleteOrderMutation();

  // Transform backend data to match frontend format
  const orders = useMemo(() => ordersData.map(order => ({
    id: order._id,
    orderId: order._id,
    customer: order.customerName,
    items: order.orderItems?.map(item => ({
      name: `${item.menuItem?.emoji || '🍽️'} ${item.menuItem?.name || 'Unknown Item'}`,
      quantity: item.quantity,
      price: item.price,
    })) || [],
    total: order.totalAmount,
    status: order.status,
    paymentMethod: order.paymentMethod || 'cash',
    date: order.createdAt,
    table: order.table || 'N/A',
  })), [ordersData]);

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

  // Keep the mock data as fallback for demo
  const mockOrders = useMemo(() => [
    {
      id: 'ORD-1001',
      customer: 'John Doe',
      items: [
        { name: '🍔 Beef Burger', quantity: 2, price: 1500 },
        { name: '🍟 French Fries', quantity: 1, price: 800 },
      ],
      total: 3800,
      status: 'completed',
      paymentMethod: 'card',
      date: '2024-01-15T10:30:00',
      table: 'Table 5',
    },
    {
      id: 'ORD-1002',
      customer: 'Jane Smith',
      items: [
        { name: '🍕 Margherita Pizza', quantity: 1, price: 2500 },
        { name: '🥤 Coke', quantity: 2, price: 400 },
      ],
      total: 3300,
      status: 'pending',
      paymentMethod: 'cash',
      date: '2024-01-15T11:15:00',
      table: 'Table 2',
    },
    {
      id: 'ORD-1003',
      customer: 'Mike Johnson',
      items: [
        { name: '🥗 Caesar Salad', quantity: 1, price: 1200 },
        { name: '🍰 Cheesecake', quantity: 1, price: 900 },
      ],
      total: 2100,
      status: 'preparing',
      paymentMethod: 'card',
      date: '2024-01-15T11:45:00',
      table: 'Table 8',
    },
    {
      id: 'ORD-1004',
      customer: 'Sarah Williams',
      items: [
        { name: '🍝 Spaghetti Carbonara', quantity: 1, price: 1800 },
      ],
      total: 1800,
      status: 'cancelled',
      paymentMethod: 'cash',
      date: '2024-01-15T09:20:00',
      table: 'Table 3',
    },
    {
      id: 'ORD-1005',
      customer: 'David Brown',
      items: [
        { name: '🍗 Fried Chicken', quantity: 3, price: 1200 },
        { name: '🥤 Sprite', quantity: 3, price: 400 },
      ],
      total: 4800,
      status: 'completed',
      paymentMethod: 'card',
      date: '2024-01-15T12:00:00',
      table: 'Table 1',
    },
  ], []);

  // Use real orders if available, otherwise use mock data
  const displayOrders = orders.length > 0 ? orders : mockOrders;

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
      case 'cancelled': return { bg: theme === 'light' ? '#FEF2F2' : '#3A2020', text: '#DC2626' };
      default: return { bg: colors.cardBg, text: colors.text };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <IoCheckmarkCircleOutline className="h-4 w-4" />;
      case 'pending': return <IoTimeOutline className="h-4 w-4" />;
      case 'preparing': return <IoReceiptOutline className="h-4 w-4" />;
      case 'cancelled': return <IoCloseCircleOutline className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <AdminLayout title="Orders" active="orders">
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${colors.amber500}, #f59e0b)`, border: `1px solid ${colors.amber500}` }}>
            <div className="text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>Total Orders</div>
            <div className="text-3xl font-extrabold" style={{ color: '#fff' }}>{stats.total}</div>
            <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full opacity-20" style={{ background: '#fff' }} />
          </div>
          <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
            <div className="text-xs font-medium mb-1" style={{ color: colors.mutedText }}>Completed</div>
            <div className="text-3xl font-extrabold" style={{ color: colors.green600 }}>{stats.completed}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
            <div className="text-xs font-medium mb-1" style={{ color: colors.mutedText }}>Pending</div>
            <div className="text-3xl font-extrabold" style={{ color: colors.amber600 }}>{stats.pending}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
            <div className="text-xs font-medium mb-1" style={{ color: colors.mutedText }}>Preparing</div>
            <div className="text-3xl font-extrabold" style={{ color: colors.blue600 || '#2563EB' }}>{stats.preparing}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
            <div className="text-xs font-medium mb-1" style={{ color: colors.mutedText }}>Cancelled</div>
            <div className="text-3xl font-extrabold" style={{ color: '#DC2626' }}>{stats.cancelled}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
            <div className="text-xs font-medium mb-1" style={{ color: colors.mutedText }}>Revenue</div>
            <div className="text-2xl font-extrabold" style={{ color: colors.text }}>₦{stats.revenue.toLocaleString()}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: colors.mutedText }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order ID, customer, or table..."
                className="w-full rounded-lg pl-10 pr-4 py-3 text-sm font-medium"
                style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
              />
            </div>
            <div className="flex items-center gap-2">
              <IoFilterOutline className="h-4 w-4" style={{ color: colors.mutedText }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg px-4 py-3 text-sm font-medium"
                style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-base font-bold" style={{ color: colors.text }}>Orders List</div>
            <div className="text-sm" style={{ color: colors.mutedText }}>{filteredOrders.length} orders</div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm" style={{ color: colors.mutedText }}>Loading orders...</div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <IoReceiptOutline className="h-16 w-16 mb-4" style={{ color: colors.mutedText }} />
              <div className="text-sm font-medium mb-1" style={{ color: colors.text }}>No orders found</div>
              <div className="text-xs" style={{ color: colors.mutedText }}>Orders will appear here once customers place them.</div>
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
                          <div className="text-sm font-bold" style={{ color: colors.text }}>{order.id}</div>
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-semibold" style={{ background: statusStyle.bg, color: statusStyle.text }}>
                            {getStatusIcon(order.status)}
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: colors.mutedText }}>
                          <span className="inline-flex items-center gap-1">
                            <IoPersonOutline className="h-3 w-3" />
                            {order.customer}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <IoReceiptOutline className="h-3 w-3" />
                            {order.table}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <IoCalendarOutline className="h-3 w-3" />
                            {new Date(order.date).toLocaleString()}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            {order.paymentMethod === 'cash' ? <IoCashOutline className="h-3 w-3" /> : <IoCardOutline className="h-3 w-3" />}
                            {order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-lg font-extrabold" style={{ color: colors.text }}>₦{order.total.toLocaleString()}</div>
                          <div className="text-xs" style={{ color: colors.mutedText }}>{order.items.length} items</div>
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
                        <div className="text-xs font-semibold mb-2" style={{ color: colors.mutedText }}>ORDER ITEMS</div>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg" style={{ background: colors.cardBg }}>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium" style={{ color: colors.text }}>{item.name}</span>
                                <span className="text-xs px-2 py-1 rounded" style={{ background: theme === 'light' ? '#F3F4F6' : '#1F2937', color: colors.mutedText }}>x{item.quantity}</span>
                              </div>
                              <div className="text-sm font-semibold" style={{ color: colors.text }}>₦{(item.price * item.quantity).toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center justify-end gap-2">
                          {order.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleStatusUpdate(order.id, 'preparing')}
                                className="px-4 py-2 rounded-lg text-sm font-semibold transition-transform hover:scale-105" 
                                style={{ background: colors.blue500 || '#3B82F6', color: '#fff' }}
                              >
                                Start Preparing
                              </button>
                              <button 
                                onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                                className="px-4 py-2 rounded-lg text-sm font-semibold transition-transform hover:scale-105" 
                                style={{ background: theme === 'light' ? '#FEF2F2' : '#3A2020', color: '#DC2626' }}
                              >
                                Cancel Order
                              </button>
                            </>
                          )}
                          {order.status === 'preparing' && (
                            <button 
                              onClick={() => handleStatusUpdate(order.id, 'completed')}
                              className="px-4 py-2 rounded-lg text-sm font-semibold transition-transform hover:scale-105" 
                              style={{ background: colors.green500, color: '#fff' }}
                            >
                              Mark as Completed
                            </button>
                          )}
                          {(order.status === 'completed' || order.status === 'cancelled') && (
                            <button 
                              onClick={() => handleDeleteOrder(order.id)}
                              className="px-4 py-2 rounded-lg text-sm font-semibold transition-transform hover:scale-105" 
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
    </AdminLayout>
  );
}

