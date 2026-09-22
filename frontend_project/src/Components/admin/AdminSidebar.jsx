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
    <aside className="admin-sidebar w-[230px] bg-white dark:bg-[#171622] border-r border-[#e2e4ed] dark:border-[#2e2d40] flex flex-col h-screen py-6 px-3.5 gap-2 shrink-0 transition-colors duration-200">
      {/* Brand Header */}
      <div className="sidebar-header px-2 mb-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#ff8906] text-[#fffffe] flex items-center justify-center font-black text-sm shadow-md shadow-[#ff8906]/30">
          R
        </div>
        <div>
          <h1 className="text-sm font-extrabold text-[#0f0e17] dark:text-[#fffffe] tracking-tight">RamCart Admin</h1>
          <p className="text-[10px] font-bold text-[#717388] dark:text-[#a7a9be] uppercase tracking-wider">Management Console</p>
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer border-none ${
                isActive 
                  ? "active bg-[#ff8906] text-[#fffffe] font-extrabold shadow-md shadow-[#ff8906]/30 hover:bg-[#e53170]" 
                  : "text-[#2e2f3e] dark:text-[#a7a9be] hover:bg-[#e53170] hover:text-[#fffffe]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon 
                  size={18} 
                  className={`transition-transform duration-200 group-hover:scale-105 group-hover:text-[#fffffe] ${
                    isActive ? "text-[#fffffe]" : "text-[#717388] dark:text-[#a7a9be]"
                  }`} 
                />
                <span className="text-xs font-bold tracking-wide group-hover:text-[#fffffe]">{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  isActive 
                    ? "bg-white/25 text-[#fffffe]" 
                    : "bg-[#eff0f6] dark:bg-[#212030] text-[#0f0e17] dark:text-[#a7a9be] group-hover:bg-white/20 group-hover:text-[#fffffe] border border-[#e2e4ed] dark:border-[#2e2d40]"
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile and Action Buttons */}
      <div className="sidebar-footer mt-auto pt-4 border-t border-[#e2e4ed] dark:border-[#2e2d40] flex flex-col gap-3">
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-full bg-[#fff3e6] dark:bg-[#212030] text-[#ff8906] flex items-center justify-center font-bold text-xs border border-[#e2e4ed] dark:border-[#2e2d40]">
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={16} />}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-[#0f0e17] dark:text-[#fffffe] truncate">
              {user?.name || 'Admin User'}
            </span>
            <span className="text-[9px] font-bold text-[#717388] dark:text-[#a7a9be] uppercase tracking-wider">
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
          className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-[#eff0f6] hover:bg-[#e53170] hover:text-[#fffffe] dark:bg-[#212030] dark:hover:bg-[#e53170] text-[#2e2f3e] dark:text-[#a7a9be] rounded-xl transition-all duration-200 text-xs font-semibold cursor-pointer border border-[#e2e4ed] dark:border-[#2e2d40]"
        >
          <LogOut size={12} />
          Logout
        </button>
      </div>
    </aside>
  );
};
export default AdminSidebar;
