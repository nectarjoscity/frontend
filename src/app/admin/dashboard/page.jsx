'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../providers';
import {
  useGetCategoriesQuery,
  useGetMenuItemsQuery,
  useGetOrdersQuery,
  useGetInventoryAnalyticsQuery,
} from '../../../services/api';
import {
  IoHomeOutline,
  IoCartOutline,
  IoCubeOutline,
  IoBarChartOutline,
  IoPeopleOutline,
  IoSettingsOutline,
  IoLogOutOutline,
  IoStar,
  IoEyeOutline,
  IoCardOutline,
  IoTimeOutline,
  IoReceiptOutline,
  IoMenuOutline,
  IoChevronBackOutline,
  IoRestaurantOutline,
} from 'react-icons/io5';
import AdminLayout from '../AdminLayout';

export default function AdminDashboardPage() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  
  // Fetch real data
  const { data: categories = [] } = useGetCategoriesQuery({ active: true });
  const { data: allMenuItems = [] } = useGetMenuItemsQuery({ active: true });
  const { data: ordersData = [] } = useGetOrdersQuery(undefined, {
    pollingInterval: 30000, // Refresh every 30 seconds
  });
  const { data: inventoryAnalytics } = useGetInventoryAnalyticsQuery();
  
  // Transform orders data
  const orders = useMemo(() => {
    if (!ordersData || !Array.isArray(ordersData)) return [];
    return ordersData.map(order => ({
      id: order._id || order.id,
      customer: order.customerName || 'Guest',
      total: order.totalAmount || order.total || 0,
      status: order.status || 'pending',
      createdAt: order.createdAt || order.timestamp,
      paymentMethod: order.paymentMethod || 'cash',
      paymentConfirmed: order.paymentConfirmed || false,
      table: order.table || '',
      orderItems: order.orderItems || [],
      isPreOrder: order.isPreOrder || false,
    })).filter(order => {
      // Filter out unconfirmed cash orders
      if (order.paymentMethod === 'cash' && !order.paymentConfirmed) {
        return false;
      }
      return true;
    });
  }, [ordersData]);
  
  // Calculate stats
  const stats = useMemo(() => {
    const total = orders.length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const preparing = orders.filter(o => o.status === 'preparing').length;
    const revenue = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    
    // Calculate previous period (last 30 days vs previous 30 days)
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previous30Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    const recentOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= last30Days;
    });
    
    const previousOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= previous30Days && orderDate < last30Days;
    });
    
    const recentCompleted = recentOrders.filter(o => o.status === 'completed').length;
    const previousCompleted = previousOrders.filter(o => o.status === 'completed').length;
    const completedDelta = previousCompleted > 0 
      ? (((recentCompleted - previousCompleted) / previousCompleted) * 100).toFixed(1)
      : '0';
    
    const recentRevenue = recentOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const previousRevenue = previousOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const revenueDelta = previousRevenue > 0
      ? (((recentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)
      : '0';
    
    return {
      total,
      completed,
      cancelled,
      pending,
      preparing,
      revenue,
      completedDelta: completedDelta >= 0 ? `+${completedDelta}%` : `${completedDelta}%`,
      revenueDelta: revenueDelta >= 0 ? `+${revenueDelta}%` : `${revenueDelta}%`,
    };
  }, [orders]);
  
  // Get recent orders (last 3)
  const recentOrders = useMemo(() => {
    return orders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3)
      .map(order => {
        // Get first menu item from order for display
        const firstItem = order.orderItems?.[0]?.menuItem || {};
        return {
          ...order,
          itemName: firstItem.name || 'Order',
          itemImage: firstItem.imageUrl || null,
          itemEmoji: firstItem.emoji || '🍽️',
        };
      });
  }, [orders]);
  
  // Calculate trending menu items (most ordered)
  const trendingItems = useMemo(() => {
    const itemCounts = {};
    orders.forEach(order => {
      order.orderItems?.forEach(orderItem => {
        const menuItem = orderItem.menuItem || {};
        const itemId = menuItem._id || menuItem.id;
        if (itemId) {
          itemCounts[itemId] = (itemCounts[itemId] || 0) + (orderItem.quantity || 1);
        }
      });
    });
    
    const sorted = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 1)
      .map(([itemId, count]) => {
        const item = allMenuItems.find(mi => (mi._id || mi.id) === itemId);
        return item ? { ...item, orderCount: count } : null;
      })
      .filter(Boolean);
    
    return sorted[0] || null;
  }, [orders, allMenuItems]);
  
  // Calculate sales by type
  const salesByType = useMemo(() => {
    const dineIn = orders.filter(o => o.table && o.table !== 'Delivery' && !o.table.includes('Delivery')).length;
    const delivery = orders.filter(o => o.table === 'Delivery' || o.table.includes('Delivery')).length;
    const takeout = orders.filter(o => !o.table || (o.table !== 'Delivery' && !o.table.includes('Table'))).length;
    
    const total = dineIn + delivery + takeout;
    if (total === 0) {
      return [
        { label: 'Dine-in', value: 0, count: 0 },
        { label: 'Delivery', value: 0, count: 0 },
        { label: 'Takeout', value: 0, count: 0 },
      ];
    }
    
    return [
      { label: 'Dine-in', value: Math.round((dineIn / total) * 100), count: dineIn, color: colors.green500 },
      { label: 'Delivery', value: Math.round((delivery / total) * 100), count: delivery, color: colors.amber500 },
      { label: 'Takeout', value: Math.round((takeout / total) * 100), count: takeout, color: colors.blue500 || '#3B82F6' },
    ];
  }, [orders, colors]);
  
  // Calculate top categories by order count
  const topCategories = useMemo(() => {
    const categoryCounts = {};
    orders.forEach(order => {
      order.orderItems?.forEach(orderItem => {
        const menuItem = orderItem.menuItem || {};
        const category = menuItem.category;
        if (category) {
          const catId = category._id || category.id || category;
          categoryCounts[catId] = (categoryCounts[catId] || 0) + (orderItem.quantity || 1);
        }
      });
    });
    
    const total = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
    
    return categories
      .map(cat => {
        const count = categoryCounts[cat._id] || 0;
        return {
          ...cat,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [orders, categories]);
  
  // Calculate revenue chart data (last 7 days)
  const revenueChartData = useMemo(() => {
    const days = 7;
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayRevenue = orders
        .filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= date && orderDate < nextDate && o.status === 'completed';
        })
        .reduce((sum, o) => sum + (o.total || 0), 0);
      
      data.push({
        date,
        revenue: dayRevenue,
        height: Math.max(10, Math.min(100, (dayRevenue / (stats.revenue / days)) * 100)),
      });
    }
    
    return data;
  }, [orders, stats.revenue]);
  
  // Calculate POS activities
  const posStats = useMemo(() => {
    const totalBills = orders.filter(o => o.status === 'completed').length;
    const avgValue = totalBills > 0 ? stats.revenue / totalBills : 0;
    
    // Calculate peak hour
    const hourCounts = {};
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const hour = orderDate.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const peakHour = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 17; // Default to 5 PM
    
    const peakHourFormatted = `${peakHour}:00 ${peakHour >= 12 ? 'PM' : 'AM'}`;
    
    return {
      totalBills,
      avgValue,
      peakHour: peakHourFormatted,
    };
  }, [orders, stats.revenue]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nv_token') : null;
    if (!token) router.replace('/admin/login');
  }, [router]);

  const Card = ({ children }) => (
    <div className="rounded-2xl p-4 shadow-sm" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>{children}</div>
  );

  const Stat = ({ title, value, delta, accent }) => (
    <Card>
      <div className="text-base font-medium mb-2" style={{ color: colors.mutedText }}>{title}</div>
      <div className="text-3xl font-bold" style={{ color: colors.text }}>{value}</div>
      {delta && <div className="text-sm mt-1" style={{ color: accent || colors.green600 }}>{delta}</div>}
    </Card>
  );

  return (
    <AdminLayout title="Overview" active="dashboard" requiredPermission="dashboard">
        <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:col-span-12">
            <div className="relative overflow-hidden rounded-2xl p-4" style={{ background: colors.amber500, border: `1px solid ${colors.amber500}` }}>
              <div className="flex items-center gap-2 text-base font-medium mb-1" style={{ color: '#fff' }}>
                <IoReceiptOutline className="h-5 w-5" />
                <span>Total Orders</span>
              </div>
              <div className="text-4xl font-extrabold" style={{ color: '#fff' }}>{stats.total}</div>
              <div className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.9)' }}>All time orders</div>
              <div className="absolute -right-10 -bottom-10 h-24 w-24 rounded-full opacity-25" style={{ background: '#fff' }} />
            </div>
            <Card>
              <div className="flex items-center gap-2 text-base font-medium mb-2" style={{ color: colors.mutedText }}>
                <IoCubeOutline className="h-5 w-5" />
                <span>Total Delivered</span>
              </div>
              <div className="text-3xl font-bold" style={{ color: colors.text }}>{stats.completed}</div>
              <div className="text-sm mt-1" style={{ color: colors.green600 }}>{stats.completedDelta} Since last month</div>
            </Card>
            <Card>
              <div className="flex items-center gap-2 text-base font-medium mb-2" style={{ color: colors.mutedText }}>
                <IoCartOutline className="h-5 w-5" />
                <span>Canceled Order</span>
              </div>
              <div className="text-3xl font-bold" style={{ color: colors.text }}>{stats.cancelled}</div>
              <div className="text-sm mt-1" style={{ color: colors.red600 }}>Cancelled orders</div>
            </Card>
            <Card>
              <div className="flex items-center gap-2 text-base font-medium mb-2" style={{ color: colors.mutedText }}>
                <IoBarChartOutline className="h-5 w-5" />
                <span>Total Revenue</span>
              </div>
              <div className="text-3xl font-bold" style={{ color: colors.text }}>₦{stats.revenue.toLocaleString()}</div>
              <div className="text-sm mt-1" style={{ color: colors.green600 }}>{stats.revenueDelta} Since last month</div>
            </Card>
          </div>

          {/* Revenue Chart + Top Categories */}
          <div className="lg:col-span-7 grid gap-4">
            <Card>
              <div className="flex items-center justify-between mb-2">
                <div className="text-base font-semibold" style={{ color: colors.text }}>Outlets Operational Cost Vs Revenue</div>
                <div className="text-sm" style={{ color: colors.mutedText }}>Weekly</div>
              </div>
              <div className="h-56 relative rounded-lg overflow-hidden" style={{ background: theme === 'light' ? '#F9FAFB' : '#0B1220', border: `1px dashed ${colors.cardBorder}` }}>
                {revenueChartData.length > 0 ? (
                  <>
                    <div className="absolute inset-x-4 bottom-6 flex items-end gap-3">
                      {revenueChartData.map((day, i) => (
                        <div key={i} className="flex-1 h-40 relative">
                          <div 
                            className="absolute bottom-0 left-0 right-0 rounded-md" 
                            style={{ 
                              height: `${day.height}%`, 
                              background: 'linear-gradient(180deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) 100%)', 
                              border: `1px solid ${colors.green200 || '#A7F3D0'}` 
                            }} 
                          />
                          <div 
                            className="absolute bottom-0 left-0 right-0 h-[2px]" 
                            style={{ 
                              background: colors.amber500, 
                              opacity: 0.7, 
                              transform: `translateY(-${Math.max(6, day.height * 0.6)}px)` 
                            }} 
                          />
                        </div>
                      ))}
                    </div>
                    <div className="absolute top-2 left-2 text-sm" style={{ color: colors.mutedText }}>
                      ₦{revenueChartData.reduce((sum, day) => sum + day.revenue, 0).toLocaleString()} Revenue (7 days)
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm" style={{ color: colors.mutedText }}>
                    No revenue data yet
                  </div>
                )}
              </div>
            </Card>
            <Card>
              <div className="text-base font-semibold mb-3" style={{ color: colors.text }}>Top Categories Item</div>
              <div className="grid grid-cols-4 gap-3">
                {topCategories.length > 0 ? (
                  topCategories.map((c, idx) => (
                    <div key={c._id} className="rounded-xl overflow-hidden" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}` }}>
                      <div className="h-24 flex items-center justify-center text-4xl" style={{ background: ['#FEE2E2','#E0F2FE','#DCFCE7','#F3E8FF'][idx % 4] }}>
                        {c.emoji || '🥗'}
                      </div>
                      <div className="p-2">
                        <div className="text-base font-semibold" style={{ color: colors.text }}>{c.name}</div>
                        <div className="text-sm" style={{ color: colors.mutedText }}>{c.percentage}%</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 text-center py-4 text-sm" style={{ color: colors.mutedText }}>
                    No category data yet
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Trending + POS */}
          <div className="lg:col-span-5 grid gap-4">
            <Card>
              <div className="text-base font-semibold mb-2" style={{ color: colors.text }}>Trending Menu Item</div>
              {trendingItems ? (
                <>
                  <div className="rounded-xl overflow-hidden mb-3 h-40 flex items-center justify-center text-6xl" style={{ background: theme === 'light' ? '#FFE4E6' : '#3F1D1D' }}>
                    {trendingItems.imageUrl ? (
                      <img src={trendingItems.imageUrl} alt={trendingItems.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{trendingItems.emoji || '🍽️'}</span>
                    )}
                  </div>
                  <div className="text-base font-semibold" style={{ color: colors.text }}>{trendingItems.name}</div>
                  {trendingItems.description && (
                    <div className="text-sm mt-1" style={{ color: colors.mutedText }}>{trendingItems.description}</div>
                  )}
                  <div className="flex items-center gap-4 text-sm mt-1" style={{ color: colors.mutedText }}>
                    <span className="inline-flex items-center gap-1"><IoCartOutline className="h-4 w-4" /> {trendingItems.orderCount || 0} orders</span>
                    <span className="ml-auto text-lg font-bold" style={{ color: colors.text }}>₦{trendingItems.price?.toLocaleString() || '0'}</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-sm" style={{ color: colors.mutedText }}>
                  No trending items yet
                </div>
              )}
            </Card>
            <Card>
              <div className="text-base font-semibold mb-2" style={{ color: colors.text }}>POS Activities</div>
              <div className="text-3xl font-bold mb-2" style={{ color: colors.text }}>₦{posStats.avgValue.toFixed(0)}</div>
              <div className="grid grid-cols-3 gap-2 text-sm" style={{ color: colors.mutedText }}>
                <div className="p-2 rounded-lg flex flex-col gap-1" style={{ background: theme === 'light' ? '#F3F4F6' : '#1F2937' }}>
                  <div className="inline-flex items-center gap-1"><IoReceiptOutline className="h-4 w-4" /> Total Bills</div>
                  <div className="font-semibold text-base" style={{ color: colors.text }}>{posStats.totalBills}</div>
                </div>
                <div className="p-2 rounded-lg flex flex-col gap-1" style={{ background: theme === 'light' ? '#F3F4F6' : '#1F2937' }}>
                  <div className="inline-flex items-center gap-1"><IoCardOutline className="h-4 w-4" /> AVG Value</div>
                  <div className="font-semibold text-base" style={{ color: colors.text }}>₦{posStats.avgValue.toFixed(0)}</div>
                </div>
                <div className="p-2 rounded-lg flex flex-col gap-1" style={{ background: theme === 'light' ? '#F3F4F6' : '#1F2937' }}>
                  <div className="inline-flex items-center gap-1"><IoTimeOutline className="h-4 w-4" /> Peak Hour</div>
                  <div className="font-semibold text-base" style={{ color: colors.text }}>{posStats.peakHour}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-7">
            <Card>
              <div className="flex items-center justify-between mb-3">
                <div className="text-base font-semibold" style={{ color: colors.text }}>Recent Orders</div>
                <input placeholder="eg: search here..." className="rounded-full px-3 py-2 text-base"
                  style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order, i) => (
                    <div key={order.id} className="rounded-xl p-3" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}` }}>
                      <div className="h-24 rounded-lg mb-2 flex items-center justify-center text-4xl" style={{ background: ['#FFE4E6','#FFEDD5','#E0F2FE'][i % 3] }}>
                        {order.itemImage ? (
                          <img src={order.itemImage} alt={order.itemName} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <span>{order.itemEmoji}</span>
                        )}
                      </div>
                      <div className="text-base font-semibold mb-1" style={{ color: colors.text }}>{order.itemName}</div>
                      <div className="text-sm mb-2" style={{ color: colors.mutedText }}>Order ID: #{order.id.slice(-6)}</div>
                      <div className="flex items-center justify-between">
                        <span 
                          className="text-sm px-2 py-1 rounded" 
                          style={{ 
                            background: order.status === 'completed' ? colors.green100 : order.status === 'pending' ? colors.amber100 : colors.red100, 
                            color: order.status === 'completed' ? colors.green700 : order.status === 'pending' ? colors.amber700 : colors.red700 
                          }}
                        >
                          {order.status}
                        </span>
                        <span className="text-base font-semibold" style={{ color: colors.text }}>₦{order.total.toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8 text-sm" style={{ color: colors.mutedText }}>
                    No recent orders
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Employee status & Sales types */}
          <div className="lg:col-span-5 grid gap-4">
            <Card>
              <div className="text-base font-semibold mb-2" style={{ color: colors.text }}>Employee status</div>
              <div className="h-36 flex items-center justify-center text-base rounded-lg" style={{ background: theme === 'light' ? '#F5F7FA' : '#111827', color: colors.mutedText }}>Gauge placeholder</div>
            </Card>
            <Card>
              <div className="text-base font-semibold mb-2" style={{ color: colors.text }}>Sales & Order Types</div>
              <div className="space-y-2 text-base">
                {salesByType.map((b) => (
                  <div key={b.label}>
                    <div className="flex items-center justify-between mb-1" style={{ color: colors.text }}>
                      <span>{b.label}</span><span>{b.value}% ({b.count})</span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: theme === 'light' ? '#E5E7EB' : '#1F2937' }}>
                      <div className="h-2 rounded-full" style={{ width: `${b.value}%`, background: b.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
    </AdminLayout>
  );
}


