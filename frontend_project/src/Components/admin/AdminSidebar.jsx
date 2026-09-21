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
    <aside className="admin-sidebar w-[230px] bg-[#f8fafc] dark:bg-[#12141c] border-r border-[#e2bec2]/40 dark:border-white/10 flex flex-col h-screen py-6 px-4 gap-2 shrink-0 transition-colors duration-200">
      {/* Brand Header */}
      <div className="sidebar-header px-3 mb-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#db2b60] text-white flex items-center justify-center font-bold text-sm shadow-sm">
          R
        </div>
        <div>
          <h1 className="text-sm font-extrabold text-[#191c1e] dark:text-white tracking-tight">RamCart Admin</h1>
          <p className="text-[10px] font-bold text-[#878787] uppercase tracking-wider">Management Console</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-menu flex-1 flex flex-col gap-1.5 overflow-y-auto pr-1">
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
                  ? "active bg-[#db2b60] text-white font-bold shadow-md shadow-[#db2b60]/20" 
                  : "text-gray-700 dark:text-[#a3b0cc] hover:bg-gray-100 dark:hover:bg-[#1e2029]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-white" : "text-[#8e6f73] dark:text-[#8090a6]"}`} />
                <span className="text-xs font-bold tracking-wide">{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  isActive 
                    ? "bg-white/20 text-white" 
                    : "bg-[#e6e8eb] dark:bg-[#1e2029] text-[#5a4044] dark:text-[#a3b0cc] border border-[#e2bec2]/30 dark:border-white/5"
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile and Action Buttons */}
      <div className="sidebar-footer mt-auto pt-4 border-t border-[#e2bec2]/40 dark:border-white/10 flex flex-col gap-3">
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-full bg-[#ffd9de] dark:bg-[#ffd9de]/10 text-[#b80149] dark:text-[#ff3366] flex items-center justify-center font-bold text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={16} />}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-[#191c1e] dark:text-[#ebf1ff] truncate">
              {user?.name || 'Admin User'}
            </span>
            <span className="text-[9px] font-bold text-[#878787] uppercase tracking-wider">
              {user?.role === 'admin' ? 'System Root' : 'Administrator'}
            </span>
          </div>
        </div>

        {/* Quick Action button matching template mockup */}
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
          className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl transition-all duration-200 text-xs font-semibold cursor-pointer border-none"
        >
          <LogOut size={12} />
          Logout
        </button>
      </div>
    </aside>
  );
};
export default AdminSidebar;
