'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../providers';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetMenuItemsQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
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
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { data: categories = [] } = useGetCategoriesQuery({});
  const { data: items = [] } = useGetMenuItemsQuery({ category: selectedCategory?._id });

  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [createMenuItem] = useCreateMenuItemMutation();
  const [updateMenuItem] = useUpdateMenuItemMutation();
  const [deleteMenuItem] = useDeleteMenuItemMutation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nv_token') : null;
    if (!token) router.replace('/admin/login');
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('nv_token');
    router.replace('/admin/login');
  };

  const promptCategory = async (existing) => {
    const name = window.prompt('Category name', existing?.name || '');
    if (!name) return;
    const description = window.prompt('Description', existing?.description || '') || '';
    const emoji = window.prompt('Emoji', existing?.emoji || '🥗') || '🥗';
    if (existing) await updateCategory({ id: existing._id, name, description, emoji }).unwrap();
    else await createCategory({ name, description, emoji }).unwrap();
  };

  const promptItem = async (existing) => {
    if (!selectedCategory) {
      alert('Select a category first');
      return;
    }
    const name = window.prompt('Item name', existing?.name || '');
    if (!name) return;
    const description = window.prompt('Description', existing?.description || '') || '';
    const priceStr = window.prompt('Price (number)', existing?.price || '0') || '0';
    const emoji = window.prompt('Emoji', existing?.emoji || '🍲') || '🍲';
    const price = parseFloat(priceStr);
    if (Number.isNaN(price)) return alert('Invalid price');
    if (existing) await updateMenuItem({ id: existing._id, name, description, emoji, price, category: selectedCategory._id }).unwrap();
    else await createMenuItem({ name, description, emoji, price, category: selectedCategory._id }).unwrap();
  };

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
              <div className="text-4xl font-extrabold" style={{ color: '#fff' }}>1250</div>
              <div className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.9)' }}>+10% Since last month</div>
              <div className="absolute -right-10 -bottom-10 h-24 w-24 rounded-full opacity-25" style={{ background: '#fff' }} />
            </div>
            <Card>
              <div className="flex items-center gap-2 text-base font-medium mb-2" style={{ color: colors.mutedText }}>
                <IoCubeOutline className="h-5 w-5" />
                <span>Total Delivered</span>
              </div>
              <div className="text-3xl font-bold" style={{ color: colors.text }}>1070</div>
              <div className="text-sm mt-1" style={{ color: colors.green600 }}>+7.5% Since last month</div>
            </Card>
            <Card>
              <div className="flex items-center gap-2 text-base font-medium mb-2" style={{ color: colors.mutedText }}>
                <IoCartOutline className="h-5 w-5" />
                <span>Canceled Order</span>
              </div>
              <div className="text-3xl font-bold" style={{ color: colors.text }}>180</div>
              <div className="text-sm mt-1" style={{ color: colors.red600 }}>-3.5% Since last month</div>
            </Card>
            <Card>
              <div className="flex items-center gap-2 text-base font-medium mb-2" style={{ color: colors.mutedText }}>
                <IoBarChartOutline className="h-5 w-5" />
                <span>Total Revenue</span>
              </div>
              <div className="text-3xl font-bold" style={{ color: colors.text }}>$15750</div>
              <div className="text-sm mt-1" style={{ color: colors.green600 }}>+7.5% Since last month</div>
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
                <div className="absolute inset-x-4 bottom-6 flex items-end gap-3">
                  {[40,20,100,60,30,75,55,35].map((h,i)=> (
                    <div key={i} className="flex-1 h-40 relative">
                      <div className="absolute bottom-0 left-0 right-0 rounded-md" style={{ height: `${h}%`, background: 'linear-gradient(180deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) 100%)', border: `1px solid ${colors.green200 || '#A7F3D0'}` }} />
                      <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: colors.amber500, opacity: 0.7, transform: `translateY(-${Math.max(6, h*0.6)}px)` }} />
                    </div>
                  ))}
                </div>
                <div className="absolute top-2 left-2 text-sm" style={{ color: colors.mutedText }}>$3500 Revenue</div>
              </div>
            </Card>
            <Card>
              <div className="text-base font-semibold mb-3" style={{ color: colors.text }}>Top Categories Item</div>
              <div className="grid grid-cols-4 gap-3">
                {categories.slice(0,4).map((c, idx) => (
                  <div key={c._id} className="rounded-xl overflow-hidden" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}` }}>
                    <div className="h-24" style={{ background: ['#FEE2E2','#E0F2FE','#DCFCE7','#F3E8FF'][idx % 4] }} />
                    <div className="p-2">
                      <div className="text-base font-semibold" style={{ color: colors.text }}>{c.name}</div>
                      <div className="text-sm" style={{ color: colors.mutedText }}>{[65,45,81,38][idx % 4]}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Trending + POS */}
          <div className="lg:col-span-5 grid gap-4">
            <Card>
              <div className="text-base font-semibold mb-2" style={{ color: colors.text }}>Trending Menu Item</div>
              <div className="rounded-xl overflow-hidden mb-3 h-40" style={{ background: theme === 'light' ? '#FFE4E6' : '#3F1D1D' }} />
              <div className="text-base font-semibold" style={{ color: colors.text }}>Fish & Chips (British classic)</div>
              <div className="flex items-center gap-4 text-sm mt-1" style={{ color: colors.mutedText }}>
                <span className="inline-flex items-center gap-1"><IoStar className="h-4 w-4" /> 4.6</span>
                <span className="inline-flex items-center gap-1"><IoEyeOutline className="h-4 w-4" /> 420</span>
                <span className="ml-auto text-lg font-bold" style={{ color: colors.text }}>$12</span>
              </div>
            </Card>
            <Card>
              <div className="text-base font-semibold mb-2" style={{ color: colors.text }}>POS Activities</div>
              <div className="text-3xl font-bold mb-2" style={{ color: colors.text }}>$1550</div>
              <div className="grid grid-cols-3 gap-2 text-sm" style={{ color: colors.mutedText }}>
                <div className="p-2 rounded-lg flex flex-col gap-1" style={{ background: theme === 'light' ? '#F3F4F6' : '#1F2937' }}>
                  <div className="inline-flex items-center gap-1"><IoReceiptOutline className="h-4 w-4" /> Total Bills</div>
                  <div className="font-semibold text-base" style={{ color: colors.text }}>147</div>
                </div>
                <div className="p-2 rounded-lg flex flex-col gap-1" style={{ background: theme === 'light' ? '#F3F4F6' : '#1F2937' }}>
                  <div className="inline-flex items-center gap-1"><IoCardOutline className="h-4 w-4" /> AVG Value</div>
                  <div className="font-semibold text-base" style={{ color: colors.text }}>$12</div>
                </div>
                <div className="p-2 rounded-lg flex flex-col gap-1" style={{ background: theme === 'light' ? '#F3F4F6' : '#1F2937' }}>
                  <div className="inline-flex items-center gap-1"><IoTimeOutline className="h-4 w-4" /> Peak Hour</div>
                  <div className="font-semibold text-base" style={{ color: colors.text }}>5.00 PM</div>
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
                {[0,1,2].map((i) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}` }}>
                    <div className="h-24 rounded-lg mb-2" style={{ background: ['#FFE4E6','#FFEDD5','#E0F2FE'][i] }} />
                    <div className="text-base font-semibold mb-1" style={{ color: colors.text }}>{['Beef Steak','Beef Burger','Special Pizza'][i]}</div>
                    <div className="text-sm mb-2" style={{ color: colors.mutedText }}>Order ID: #ORD-103{i}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm px-2 py-1 rounded" style={{ background: colors.green100, color: colors.green700 }}>Completed</span>
                      <span className="text-base font-semibold" style={{ color: colors.text }}>${[15,35,50][i]}</span>
                    </div>
                  </div>
                ))}
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
                {[
                  { label: 'Dine-in', value: 40, color: colors.green500 },
                  { label: 'Delivery', value: 35, color: colors.amber500 },
                  { label: 'Pick-up', value: 25, color: colors.blue500 || '#3B82F6' },
                ].map((b) => (
                  <div key={b.label}>
                    <div className="flex items-center justify-between mb-1" style={{ color: colors.text }}>
                      <span>{b.label}</span><span>{b.value}%</span>
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


