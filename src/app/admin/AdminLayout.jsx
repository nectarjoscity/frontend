'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '../providers';
import { useGetCurrentUserQuery } from '../../services/api';
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
  IoRestaurant,
  IoPersonAddOutline,
  IoReceiptOutline,
  IoCloseOutline,
} from 'react-icons/io5';

const AVAILABLE_PAGES = [
  { id: 'dashboard', href: '/admin/dashboard', icon: IoHomeOutline, label: 'Overview' },
  { id: 'catalog', href: '/admin/catalog', icon: IoCubeOutline, label: 'Catalog' },
  { id: 'inventory', href: '/admin/inventory', icon: IoCubeOutline, label: 'Inventory' },
  { id: 'orders', href: '/admin/orders', icon: IoCartOutline, label: 'Orders' },
  { id: 'kitchen', href: '/admin/kitchen', icon: IoRestaurant, label: 'Kitchen' },
  { id: 'invoices', href: '/admin/invoices', icon: IoReceiptOutline, label: 'Invoices' },
  { id: 'waiters', href: '/admin/waiters', icon: IoPersonAddOutline, label: 'Waiters' },
  { id: 'analytics', href: '#', icon: IoBarChartOutline, label: 'Analytics' },
  { id: 'team', href: '/admin/team', icon: IoPeopleOutline, label: 'Team' },
  { id: 'settings', href: '/admin/settings', icon: IoSettingsOutline, label: 'Settings' },
  { id: 'accounting', href: '/admin/accounting', icon: IoBarChartOutline, label: 'Accounting' },
];

export default function AdminLayout({ title, active = 'dashboard', children, requiredPermission }) {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: currentUser, isLoading: isLoadingUser } = useGetCurrentUserQuery(undefined, {
    skip: !mounted || !localStorage.getItem('nv_token'),
  });

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nv_token') : null;
    if (!token) router.replace('/admin/login');
  }, [router]);

  // Determine which pages the user can access
  const accessiblePages = useMemo(() => {
    if (!currentUser) return [];

    const permissions = currentUser.permissions || [];

    // If permissions array is empty or contains all pages, user has full access
    if (permissions.length === 0 || permissions.length === AVAILABLE_PAGES.length) {
      return AVAILABLE_PAGES;
    }

    // Otherwise, only show pages in permissions array
    return AVAILABLE_PAGES.filter(page => permissions.includes(page.id));
  }, [currentUser]);

  // Check if user has access to current page
  useEffect(() => {
    if (!isLoadingUser && currentUser && requiredPermission) {
      const permissions = currentUser.permissions || [];
      const hasFullAccess = permissions.length === 0 || permissions.length === AVAILABLE_PAGES.length;
      const hasPermission = hasFullAccess || permissions.includes(requiredPermission);

      if (!hasPermission) {
        // Redirect to first accessible page or dashboard
        const firstPage = accessiblePages.length > 0 ? accessiblePages[0].href : '/admin/dashboard';
        router.replace(firstPage);
      }
    }
  }, [currentUser, isLoadingUser, requiredPermission, accessiblePages, router]);

  const handleLogout = () => {
    localStorage.removeItem('nv_token');
    router.replace('/admin/login');
  };

  const NavLink = ({ href, icon: Icon, label, isActive }) => (
    <Link
      href={href}
      className={`w-full block rounded-xl ${sidebarOpen ? 'px-3 py-3' : 'p-3'} text-base font-medium`}
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
            <div className="font-extrabold text-xl tracking-tight" style={{ color: colors.text }}>Nectar Admin</div>
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
          {!mounted || isLoadingUser ? (
            <div className="text-sm" style={{ color: colors.mutedText }}>Loading...</div>
          ) : (
            accessiblePages.map((page) => {
              const Icon = page.icon;
              return (
                <NavLink
                  key={page.id}
                  href={page.href}
                  icon={Icon}
                  label={page.label}
                  isActive={active === page.id}
                />
              );
            })
          )}
        </nav>

        <div className="mt-4">
          <button className="w-full rounded-xl flex items-center gap-3 px-3 py-3 text-base font-medium" style={{ background: theme === 'light' ? '#F3F4F6' : '#1F2937', color: colors.text }} onClick={handleLogout}>
            <IoLogOutOutline className="h-5 w-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu - Full Page App Grid */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden overflow-y-auto"
          style={{ background: colors.background }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 px-4 py-4" style={{ background: colors.background, borderBottom: `1px solid ${colors.cardBorder}` }}>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: colors.amber500, color: '#fff' }}>
                <IoRestaurantOutline className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="font-extrabold text-xl tracking-tight" style={{ color: colors.text }}>Nectar Admin</div>
                <div className="text-sm" style={{ color: colors.mutedText }}>Menu</div>
              </div>
              <button
                className="h-12 w-12 rounded-2xl flex items-center justify-center"
                style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                onClick={() => setMobileSidebarOpen(false)}
              >
                <IoCloseOutline className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* App Grid */}
          <div className="p-4">
            {!mounted || isLoadingUser ? (
              <div className="text-center py-10" style={{ color: colors.mutedText }}>Loading...</div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {accessiblePages.map((page) => {
                  const Icon = page.icon;
                  const isActive = active === page.id;
                  return (
                    <Link
                      key={page.id}
                      href={page.href}
                      onClick={() => setMobileSidebarOpen(false)}
                      className="flex flex-col items-center justify-center rounded-2xl p-4 aspect-square transition-all active:scale-95"
                      style={{
                        background: isActive
                          ? (theme === 'light' ? '#FFF7ED' : '#3A2A1A')
                          : colors.cardBg,
                        border: `1px solid ${isActive ? colors.amber500 : colors.cardBorder}`,
                        boxShadow: isActive ? `0 4px 12px ${theme === 'light' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)'}` : 'none',
                      }}
                    >
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center mb-2"
                        style={{
                          background: isActive ? colors.amber500 : (theme === 'light' ? '#F3F4F6' : '#374151'),
                          color: isActive ? '#fff' : colors.text,
                        }}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <span
                        className="text-xs font-semibold text-center leading-tight"
                        style={{ color: colors.text }}
                      >
                        {page.label}
                      </span>
                    </Link>
                  );
                })}

                {/* Logout Card */}
                <button
                  onClick={handleLogout}
                  className="flex flex-col items-center justify-center rounded-2xl p-4 aspect-square transition-all active:scale-95"
                  style={{
                    background: theme === 'light' ? '#FEE2E2' : '#3B1C1C',
                    border: `1px solid ${theme === 'light' ? '#FECACA' : '#5C2929'}`,
                  }}
                >
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center mb-2"
                    style={{
                      background: theme === 'light' ? '#EF4444' : '#DC2626',
                      color: '#fff',
                    }}
                  >
                    <IoLogOutOutline className="h-6 w-6" />
                  </div>
                  <span
                    className="text-xs font-semibold text-center leading-tight"
                    style={{ color: theme === 'light' ? '#DC2626' : '#F87171' }}
                  >
                    Logout
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0">
        <div className="px-4 py-4 sticky top-0 z-20" style={{ background: colors.background, borderBottom: `1px solid ${colors.cardBorder}` }}>
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <button
              className="md:hidden h-10 w-10 rounded-xl flex items-center justify-center mr-2"
              style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
              onClick={() => setMobileSidebarOpen(true)}
            >
              <IoMenuOutline className="h-5 w-5" />
            </button>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight truncate" style={{ color: colors.text }}>{title}</h1>
            <div className="flex-1" />
            <div className="hidden md:block relative">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: colors.mutedText }} />
              <input placeholder="Search anything..." className="rounded-full pl-10 pr-3 py-2.5 text-base w-[420px]" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }} />
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


