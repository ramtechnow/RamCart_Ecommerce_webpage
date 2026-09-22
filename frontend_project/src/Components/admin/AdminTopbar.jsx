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
    <header className="admin-topbar sticky top-0 z-50 flex items-center justify-between px-6 w-full h-16 bg-white dark:bg-[#171622] border-b border-[#e2e4ed] dark:border-[#2e2d40] shadow-sm transition-colors duration-200">
      {/* Left — Console Identity */}
      <div className="flex items-center gap-4 flex-1">
        <div>
          <h2 className="text-sm font-extrabold text-[#ff8906] tracking-wider uppercase">
            ADMIN CONSOLE
          </h2>
          <span className="text-[11px] text-[#717388] dark:text-[#a7a9be] font-medium hidden sm:inline">
            Manage Catalog, Accounts, and Real-time Orders
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Storefront CTA — Orange button with white text, red hover */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#ff8906] hover:bg-[#e53170] text-[#fffffe] text-xs font-bold rounded-xl transition-all duration-200 shadow-sm shadow-[#ff8906]/25 cursor-pointer border-none"
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
            className="relative w-9 h-9 rounded-full bg-[#eff0f6] dark:bg-[#212030] border border-[#e2e4ed] dark:border-[#2e2d40] flex items-center justify-center text-[#2e2f3e] dark:text-[#a7a9be] hover:bg-[#e53170] hover:text-[#fffffe] transition-all duration-150 cursor-pointer"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#e53170] text-[#fffffe] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-[#171622] animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 max-h-96 bg-white dark:bg-[#171622] border border-[#e2e4ed] dark:border-[#2e2d40] rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden animate-fade-in">
              {/* Header */}
              <div className="flex items-center justify-between p-3.5 border-b border-[#e2e4ed] dark:border-[#2e2d40] bg-[#eff0f6] dark:bg-[#212030]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-[#0f0e17] dark:text-[#fffffe]">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold bg-[#ff8906] text-[#fffffe] px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllRead}
                      className="text-[#ff8906] hover:text-[#e53170] text-[10px] font-bold flex items-center gap-1 cursor-pointer bg-none border-none p-0"
                    >
                      <CheckCheck size={12} /> Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-[#717388] hover:text-[#0f0e17] dark:hover:text-[#fffffe] cursor-pointer bg-none border-none p-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Notification Items */}
              <div className="overflow-y-auto flex-1 divide-y divide-[#e2e4ed] dark:divide-[#2e2d40]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#717388] dark:text-[#a7a9be] font-medium">
                    No recent order notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onMarkSingleRead && onMarkSingleRead(n.id)}
                      className={`p-3.5 flex flex-col gap-2 transition-all duration-150 cursor-pointer ${
                        n.unread 
                          ? "bg-[#fff3e6] dark:bg-[#ff8906]/10" 
                          : "hover:bg-[#eff0f6] dark:hover:bg-[#212030]"
                      }`}
                    >
                      <div className="flex gap-2.5 items-start">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          n.type === 'order' 
                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600" 
                            : "bg-red-50 dark:bg-red-950/30 text-[#e53170]"
                        }`}>
                          {n.type === 'order' ? <ShoppingBag size={14} /> : <AlertCircle size={14} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="text-[12px] font-bold text-[#0f0e17] dark:text-[#fffffe] truncate">
                              {n.title}
                            </span>
                            <span className="text-[9px] text-[#717388] dark:text-[#a7a9be]">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-[#2e2f3e] dark:text-[#a7a9be] mt-1 leading-snug">
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
                          className="self-end px-3 py-1 bg-[#ff8906] hover:bg-[#e53170] text-[#fffffe] text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer border-none shadow-sm transition-all"
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
        <div className="flex items-center gap-2 pl-1 pr-3 py-1 bg-[#eff0f6] dark:bg-[#212030] rounded-full border border-[#e2e4ed] dark:border-[#2e2d40]">
          <div className="w-7 h-7 rounded-full bg-[#ff8906] text-[#fffffe] flex items-center justify-center text-xs font-bold shadow-sm">
            {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : <User size={14} />}
          </div>
          <span className="text-xs font-bold text-[#0f0e17] dark:text-[#fffffe] hidden sm:inline max-w-[100px] truncate">
            {adminUser?.name || 'Administrator'}
          </span>
        </div>
      </div>
    </header>
  );
};
export default AdminTopbar;
