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
  ShieldCheck
} from 'lucide-react';

export const AdminSidebar = ({
  activeTab,
  setActiveTab,
  productsCount = 0,
  usersCount = 0,
  ordersCount = 0,
  couponsCount = 0,
  bannersCount = 0
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
    <aside className="admin-sidebar" aria-label="Admin navigation">
      {/* ─── Brand Header ─────────────────────────────────────── */}
      <div className="sidebar-header px-2 mb-4 pb-3 flex items-center gap-3 border-b border-[#e2e4ed] dark:border-[#2e2d40]">
        <div className="w-10 h-10 rounded-xl bg-[#ff8906] text-[#fffffe] flex items-center justify-center font-black text-lg shadow-md shadow-[#ff8906]/35 shrink-0">
          R
        </div>
        <div className="flex flex-col min-w-0 justify-center">
          <h1 
            className="text-[15px] font-black tracking-tight leading-snug whitespace-nowrap block m-0 p-0"
            style={{ 
              color: isDarkTheme ? '#fffffe' : '#0f0e17',
              backgroundColor: 'transparent',
              textShadow: isDarkTheme ? '0 1px 2px rgba(0,0,0,0.5)' : 'none'
            }}
          >
            RamCart Admin
          </h1>
          <span 
            className="text-[10px] font-black uppercase tracking-wider block mt-0.5"
            style={{ color: '#ff8906' }}
          >
            Management Console
          </span>
        </div>
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
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`${item.label}${item.count ? `, ${item.count}` : ''}`}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer border-none ${
                isActive
                  ? 'active bg-[#ff8906] text-[#fffffe] font-extrabold shadow-md shadow-[#ff8906]/30 hover:bg-[#e53170]'
                  : 'text-[#2e2f3e] dark:text-[#a7a9be] hover:bg-[#e53170] hover:text-[#fffffe]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={18}
                  className={`transition-transform duration-200 group-hover:scale-105 group-hover:text-[#fffffe] ${
                    isActive
                      ? 'text-[#fffffe]'
                      : 'text-[#717388] dark:text-[#a7a9be]'
                  }`}
                />
                <span className="text-xs font-bold tracking-wide group-hover:text-[#fffffe]">
                  {item.label}
                </span>
              </div>

              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/25 text-[#fffffe]'
                      : 'bg-[#eff0f6] dark:bg-[#212030] text-[#0f0e17] dark:text-[#a7a9be] group-hover:bg-white/20 group-hover:text-[#fffffe] border border-[#e2e4ed] dark:border-[#2e2d40]'
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
      <div className="sidebar-footer mt-auto pt-3 border-t border-[#e2e4ed] dark:border-[#2e2d40] flex flex-col gap-2.5">
        {/* User Profile Capsule */}
        <div className="flex items-center gap-3 px-2 py-2 bg-[#f7f7fa] dark:bg-[#212030] rounded-xl border border-[#e2e4ed] dark:border-[#2e2d40]">
          <div className="w-8 h-8 rounded-full bg-[#ff8906] text-[#fffffe] flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
            {user?.name ? (
              user.name.charAt(0).toUpperCase()
            ) : (
              <UserIcon size={15} />
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span 
              className="text-xs font-extrabold truncate"
              style={{ color: isDarkTheme ? '#fffffe' : '#0f0e17' }}
            >
              {user?.name || 'Admin'}
            </span>
            <div className="flex items-center gap-1">
              <ShieldCheck
                size={11}
                className="text-[#e53170] dark:text-[#ff8906] shrink-0"
              />
              <span className="text-[10px] font-black text-[#e53170] dark:text-[#ff8906] uppercase tracking-wider truncate">
                {user?.role === 'admin' ? 'System Root' : 'Administrator'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        <button
          type="button"
          onClick={handleQuickAction}
          className="quick-action-btn w-full flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-black cursor-pointer border-none"
        >
          <Zap size={12} className="fill-current" />
          Add product
        </button>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-[#eff0f6] hover:bg-[#e53170] hover:text-[#fffffe] dark:bg-[#212030] dark:hover:bg-[#e53170] text-[#2e2f3e] dark:text-[#a7a9be] rounded-xl transition-all duration-200 text-xs font-bold cursor-pointer border border-[#e2e4ed] dark:border-[#2e2d40]"
        >
          <LogOut size={12} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;