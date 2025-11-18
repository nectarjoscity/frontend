'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '../providers';
import {
  IoHomeOutline,
  IoCubeOutline,
  IoCartOutline,
  IoBarChartOutline,
  IoPeopleOutline,
  IoSettingsOutline,
  IoLogOutOutline,
  IoRestaurantOutline,
  IoChevronBackOutline,
  IoMenuOutline,
  IoSearchOutline,
} from 'react-icons/io5';

export default function AdminLayout({ title, active = 'dashboard', children }) {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nv_token') : null;
    if (!token) router.replace('/admin/login');
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('nv_token');
    router.replace('/admin/login');
  };

  const NavLink = ({ href, icon: Icon, label, isActive }) => (
    <Link
      href={href}
      className={`w-full block rounded-xl ${sidebarOpen ? 'px-3 py-3' : 'p-3'} text-sm font-medium`}
      style={{
        background: isActive ? (theme === 'light' ? '#FFF7ED' : '#3A2A1A') : colors.cardBg,
        color: colors.text,
      }}
    >
      <span className="inline-flex items-center gap-3">
        <Icon className="h-5 w-5" />
        {sidebarOpen && label}
      </span>
    </Link>
  );

  return (
    <div className="min-h-screen flex" style={{ background: colors.background }}>
      {/* Sidebar */}
      <aside className={`hidden md:flex md:flex-col sticky top-0 h-screen transition-all ${sidebarOpen ? 'md:w-64' : 'md:w-16 lg:w-20'} p-3`} style={{ borderRight: `1px solid ${colors.cardBorder}` }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: colors.amber500, color: '#fff' }}>
            <IoRestaurantOutline className="h-5 w-5" />
          </div>
          {sidebarOpen && (
            <div className="font-extrabold text-lg tracking-tight" style={{ color: colors.text }}>NectarV Admin</div>
          )}
          <button
            className={`ml-auto h-10 ${sidebarOpen ? 'w-10' : 'w-12'} rounded-xl flex items-center justify-center`}
            style={{ background: colors.cardBg, border: sidebarOpen ? 'none' : `1px solid ${colors.cardBorder}`, color: colors.text }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <IoChevronBackOutline className="h-5 w-5" /> : <IoMenuOutline className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          <NavLink href="/admin/dashboard" icon={IoHomeOutline} label="Overview" isActive={active === 'dashboard'} />
          <NavLink href="/admin/catalog" icon={IoCubeOutline} label="Catalog" isActive={active === 'catalog'} />
          <NavLink href="/admin/orders" icon={IoCartOutline} label="Orders" isActive={active === 'orders'} />
          <NavLink href="#" icon={IoBarChartOutline} label="Analytics" isActive={false} />
          <NavLink href="#" icon={IoPeopleOutline} label="Team" isActive={false} />
          <NavLink href="#" icon={IoSettingsOutline} label="Settings" isActive={false} />
        </nav>

        <div className="mt-4">
          <button className="w-full rounded-xl flex items-center gap-3 px-3 py-3 text-sm font-medium" style={{ background: theme === 'light' ? '#F3F4F6' : '#1F2937', color: colors.text }} onClick={handleLogout}>
            <IoLogOutOutline className="h-5 w-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <div className="px-4 py-4 sticky top-0 z-20" style={{ background: colors.background, borderBottom: `1px solid ${colors.cardBorder}` }}>
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: colors.text }}>{title}</h1>
            <div className="flex-1" />
            <div className="hidden md:block relative">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: colors.mutedText }} />
              <input placeholder="Search anything..." className="rounded-full pl-9 pr-3 py-2 text-sm w-[420px]" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }} />
            </div>
            <div className="h-10 w-10 rounded-full overflow-hidden border" style={{ borderColor: colors.cardBorder }}>
              <div className="h-full w-full" style={{ background: theme === 'light' ? '#E5E7EB' : '#1F2937' }} />
            </div>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}


