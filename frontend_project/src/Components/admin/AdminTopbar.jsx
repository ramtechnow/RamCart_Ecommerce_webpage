import React, { useState } from 'react';
import { User, Eye, Bell, CheckCheck, ShoppingBag, AlertCircle, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminTopbar = ({ 
  adminUser, 
  notifications = [], 
  onMarkAllRead, 
  onMarkSingleRead, 
  onProcessOrder 
}) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="admin-topbar sticky top-0 z-50 flex items-center justify-between px-6 w-full h-16 bg-white dark:bg-[#141428] border-b border-[#DDD6FE] dark:border-[#2A2A50] shadow-sm shadow-[#7C3AED]/5 transition-colors duration-200">
      {/* Left — Console Identity */}
      <div className="flex items-center gap-4 flex-1">
        <div>
          <h2 className="text-sm font-extrabold text-[#7C3AED] dark:text-[#A78BFA] tracking-wider uppercase">
            ADMIN CONSOLE
          </h2>
          <span className="text-[11px] text-[#9CA3AF] font-medium hidden sm:inline">
            Manage Catalog, Accounts, and Real-time Orders
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Storefront CTA — Teal */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#0D9488] to-[#0F766E] hover:from-[#0F766E] hover:to-[#115E59] text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-sm shadow-[#0D9488]/25 cursor-pointer border-none"
        >
          <Eye size={14} />
          <span>Storefront</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            aria-label="View Admin Notifications"
            title="Notifications"
            className="relative w-9 h-9 rounded-full bg-[#EEF0F8] dark:bg-[#1A1A35] border border-[#DDD6FE] dark:border-[#2A2A50] flex items-center justify-center text-[#7C3AED] dark:text-[#A78BFA] hover:bg-[#EDE9FE] dark:hover:bg-[#2A2A50] transition-all duration-150 cursor-pointer"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-[#141428] animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 max-h-96 bg-white dark:bg-[#1A1A35] border border-[#DDD6FE] dark:border-[#2A2A50] rounded-2xl shadow-xl shadow-[#7C3AED]/10 z-50 flex flex-col overflow-hidden animate-fade-in">
              {/* Header */}
              <div className="flex items-center justify-between p-3.5 border-b border-[#DDD6FE] dark:border-[#2A2A50] bg-[#EEF0F8] dark:bg-[#141428]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-[#1E1B4B] dark:text-[#F5F3FF]">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllRead}
                      className="text-[#7C3AED] hover:text-[#6D28D9] text-[10px] font-bold flex items-center gap-1 cursor-pointer bg-none border-none p-0"
                    >
                      <CheckCheck size={12} /> Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-[#9CA3AF] hover:text-[#4B5563] cursor-pointer bg-none border-none p-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Notification Items */}
              <div className="overflow-y-auto flex-1 divide-y divide-[#DDD6FE]/40 dark:divide-[#2A2A50]/60">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#9CA3AF] font-medium">
                    No recent order notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onMarkSingleRead && onMarkSingleRead(n.id)}
                      className={`p-3.5 flex flex-col gap-2 transition-all duration-150 cursor-pointer ${
                        n.unread 
                          ? "bg-[#EDE9FE]/30 dark:bg-[#EDE9FE]/5" 
                          : "hover:bg-[#F6F7FB] dark:hover:bg-[#141428]"
                      }`}
                    >
                      <div className="flex gap-2.5 items-start">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          n.type === 'order' 
                            ? "bg-[#CCFBF1] dark:bg-[#0D9488]/20 text-[#0D9488]" 
                            : "bg-red-50 dark:bg-red-950/20 text-red-500"
                        }`}>
                          {n.type === 'order' ? <ShoppingBag size={14} /> : <AlertCircle size={14} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="text-[12px] font-bold text-[#1E1B4B] dark:text-[#F5F3FF] truncate">
                              {n.title}
                            </span>
                            <span className="text-[9px] text-[#9CA3AF]">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-[#4B5563] dark:text-[#C4B5FD] mt-1 leading-snug">
                            {n.message}
                          </p>
                        </div>
                      </div>

                      {n.orderId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkSingleRead && onMarkSingleRead(n.id);
                            setShowNotifications(false);
                            onProcessOrder && onProcessOrder(n.orderId);
                          }}
                          className="self-end px-3 py-1 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer border-none shadow-sm transition-all"
                        >
                          Process & Ship <ArrowRight size={10} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Capsule */}
        <div className="flex items-center gap-2 pl-1 pr-3 py-1 bg-[#EEF0F8] dark:bg-[#1A1A35] rounded-full border border-[#DDD6FE] dark:border-[#2A2A50]">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white flex items-center justify-center text-xs font-bold shadow-sm">
            {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : <User size={14} />}
          </div>
          <span className="text-xs font-bold text-[#1E1B4B] dark:text-[#F5F3FF] hidden sm:inline max-w-[100px] truncate">
            {adminUser?.name || 'Administrator'}
          </span>
        </div>
      </div>
    </header>
  );
};
export default AdminTopbar;
