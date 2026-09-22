import React from 'react';
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
  Zap
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

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

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
    <aside className="admin-sidebar w-[230px] bg-white dark:bg-[#141428] border-r border-[#DDD6FE] dark:border-[#2A2A50] flex flex-col h-screen py-6 px-3.5 gap-2 shrink-0 transition-colors duration-200">
      {/* Brand Header */}
      <div className="sidebar-header px-2 mb-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-[#7C3AED]/30">
          R
        </div>
        <div>
          <h1 className="text-sm font-extrabold text-[#1E1B4B] dark:text-white tracking-tight">RamCart Admin</h1>
          <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Management Console</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-menu flex-1 flex flex-col gap-1 overflow-y-auto pr-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer ${
                isActive 
                  ? "active bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white font-bold shadow-md shadow-[#7C3AED]/30" 
                  : "text-[#4B5563] dark:text-[#C4B5FD] hover:bg-[#EDE9FE] dark:hover:bg-[#1A1A35] hover:text-[#7C3AED]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon 
                  size={17} 
                  className={`transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? "text-white" : "text-[#7C3AED] dark:text-[#A78BFA] opacity-70"
                  }`} 
                />
                <span className="text-xs font-bold tracking-wide">{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  isActive 
                    ? "bg-white/25 text-white" 
                    : "bg-[#EDE9FE] dark:bg-[#1A1A35] text-[#7C3AED] dark:text-[#A78BFA] border border-[#DDD6FE] dark:border-[#2A2A50]"
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile and Action Buttons */}
      <div className="sidebar-footer mt-auto pt-4 border-t border-[#DDD6FE] dark:border-[#2A2A50] flex flex-col gap-3">
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-full bg-[#EDE9FE] dark:bg-[#EDE9FE]/10 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center font-bold text-xs border border-[#DDD6FE] dark:border-[#2A2A50]">
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={16} />}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-[#1E1B4B] dark:text-[#F5F3FF] truncate">
              {user?.name || 'Admin User'}
            </span>
            <span className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider">
              {user?.role === 'admin' ? 'System Root' : 'Administrator'}
            </span>
          </div>
        </div>

        {/* Quick Action Button */}
        <button 
          type="button"
          onClick={() => alert("⚡ Quick Admin console drawer coming soon!")}
          className="quick-action-btn w-full flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-black cursor-pointer border-none"
        >
          <Zap size={12} className="fill-current" />
          Quick Action
        </button>

        <button 
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-[#F6F7FB] hover:bg-[#EEF0F8] dark:bg-white/5 dark:hover:bg-white/10 text-[#4B5563] dark:text-[#C4B5FD] rounded-xl transition-all duration-200 text-xs font-semibold cursor-pointer border border-[#DDD6FE] dark:border-[#2A2A50]"
        >
          <LogOut size={12} />
          Logout
        </button>
      </div>
    </aside>
  );
};
export default AdminSidebar;
