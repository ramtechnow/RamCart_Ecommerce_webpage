import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import {
  LayoutDashboard,
  ShoppingBag,
  PlusCircle,
  Users,
  ShoppingCart,
  Tag,
  User as UserIcon,
  LogOut,
  Image as ImageIcon,
  Sparkles,
  Zap,
  ShieldCheck,
  X
} from 'lucide-react';

export const AdminSidebar = ({
  activeTab,
  setActiveTab,
  productsCount = 0,
  usersCount = 0,
  ordersCount = 0,
  couponsCount = 0,
  bannersCount = 0,
  isMobileOpen = false,
  onCloseMobile = () => {}
}) => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // ─── Theme Sync ────────────────────────────────────────────────
  const syncTheme = useCallback(() => {
    if (typeof document === 'undefined') return;

    try {
      const storedTheme = localStorage.getItem('theme');
      const rootIsDark = document.documentElement.classList.contains('dark');
      const bodyIsDark = document.body.classList.contains('dark');
      const prefersDark =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;

      setIsDarkTheme(rootIsDark || bodyIsDark || storedTheme === 'dark' || prefersDark);
    } catch {
      setIsDarkTheme(false);
    }
  }, []);

  useEffect(() => {
    syncTheme();

    if (typeof document === 'undefined') return;

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    window.addEventListener('storage', syncTheme);
    window.addEventListener('themechange', syncTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', syncTheme);
      window.removeEventListener('themechange', syncTheme);
    };
  }, [syncTheme]);

  // ─── Logout ────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      navigate('/');
    }
  };

  const handleQuickAction = () => {
    setActiveTab('add');
    onCloseMobile();
  };

  // ─── Menu Items ────────────────────────────────────────────────
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'list', label: 'Catalog', icon: ShoppingBag, count: productsCount },
    { id: 'add', label: 'Add Product', icon: PlusCircle },
    { id: 'users', label: 'Users List', icon: Users, count: usersCount },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, count: ordersCount },
    { id: 'coupons', label: 'Coupons', icon: Tag, count: couponsCount },
    { id: 'banners', label: 'Hero Banners', icon: ImageIcon, count: bannersCount },
    { id: 'seasonal', label: 'Seasonal Offers', icon: Sparkles }
  ];

  return (
    <>
      {/* ─── Mobile Backdrop Overlay ───────────────────────────── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-fade-in"
          onClick={onCloseMobile}
          aria-label="Close navigation overlay"
        />
      )}

      {/* ─── Admin Sidebar ─────────────────────────────────────── */}
      <aside 
        className={`admin-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
        aria-label="Admin navigation"
      >
        {/* ─── Brand Header ─────────────────────────────────────── */}
        <div className="sidebar-header px-1 mb-4 pb-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black text-lg shadow-sm shrink-0">
              R
            </div>
            <div className="flex flex-col min-w-0 justify-center">
              <h1 className="text-[15px] font-black tracking-tight leading-snug whitespace-nowrap block m-0 p-0 text-zinc-900 dark:text-zinc-100">
                RamCart Admin
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider block mt-0.5 text-zinc-500 dark:text-zinc-400">
                Management Console
              </span>
            </div>
          </div>

          {/* Mobile Drawer Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 cursor-pointer border-none transition-colors"
            aria-label="Close Sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── Navigation Menu ──────────────────────────────────── */}
        <nav className="sidebar-menu flex-1 flex flex-col gap-1.5 overflow-y-auto pr-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  onCloseMobile();
                }}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${item.label}${item.count ? `, ${item.count}` : ''}`}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 group cursor-pointer border-none ${
                  isActive
                    ? 'active bg-black text-white dark:bg-white dark:text-black font-extrabold shadow-sm'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-black dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className={`transition-transform duration-150 group-hover:scale-105 ${
                      isActive
                        ? 'text-white dark:text-black'
                        : 'text-zinc-500 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white'
                    }`}
                  />
                  <span className={`text-xs tracking-wide ${isActive ? 'font-black' : 'font-bold'}`}>
                    {item.label}
                  </span>
                </div>

                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                      isActive
                        ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-black'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ─── Bottom Profile & Actions ─────────────────────────── */}
        <div className="sidebar-footer mt-auto pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-2.5">
          {/* User Profile Capsule */}
          <div className="flex items-center gap-3 px-2.5 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
              {user?.name ? (
                user.name.charAt(0).toUpperCase()
              ) : (
                <UserIcon size={14} />
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-black truncate text-zinc-900 dark:text-zinc-100">
                {user?.name || 'Admin'}
              </span>
              <div className="flex items-center gap-1">
                <ShieldCheck
                  size={12}
                  className="text-zinc-500 dark:text-zinc-400 shrink-0"
                />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
                  {user?.role === 'admin' ? 'Root Admin' : 'Admin'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          <button
            type="button"
            onClick={handleQuickAction}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 rounded-xl transition-all duration-150 text-xs font-bold cursor-pointer border-none shadow-xs"
          >
            <Zap size={13} className="fill-current" />
            Add product
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl transition-all duration-150 text-xs font-bold cursor-pointer border border-zinc-200 dark:border-zinc-800"
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;