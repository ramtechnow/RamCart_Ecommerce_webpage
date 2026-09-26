import React, { useState, useContext } from 'react';
import { User, Eye, Bell, CheckCheck, ShoppingBag, AlertCircle, X, ArrowRight, Sun, Moon, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../Context/ThemeContext';

export const AdminTopbar = ({ 
  adminUser, 
  notifications = [], 
  onMarkAllRead, 
  onMarkSingleRead, 
  onProcessOrder,
  onToggleMobileSidebar
}) => {
  const navigate = useNavigate();
  const themeCtx = useContext(ThemeContext);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="admin-topbar sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 w-full h-16 bg-white dark:bg-[#121214] border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-200">
      {/* Left — Console Identity & Mobile Menu Toggle */}
      <div className="flex items-center gap-3 flex-1">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Open Admin Navigation Menu"
          title="Open Menu"
          className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs shrink-0"
        >
          <Menu size={18} />
        </button>

        <div>
          <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-100 tracking-wider uppercase m-0 leading-none">
            ADMIN CONSOLE
          </h2>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium hidden sm:inline-block mt-1">
            Manage Catalog, Accounts, and Real-time Orders
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Quick Dark / Light Theme Toggle Button */}
        {themeCtx && (
          <button
            type="button"
            onClick={themeCtx.toggleTheme}
            aria-label="Toggle Theme Mode"
            title={themeCtx.isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-all duration-200 cursor-pointer shadow-xs shrink-0"
          >
            {themeCtx.isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}

        {/* Storefront CTA — Classic monochrome button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold rounded-xl transition-all duration-200 shadow-xs cursor-pointer border-none"
        >
          <Eye size={14} />
          <span className="hidden sm:inline">Storefront</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            aria-label="View Admin Notifications"
            title="Notifications"
            className="relative w-9 h-9 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 transition-all duration-150 cursor-pointer shadow-xs shrink-0"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-black text-white dark:bg-white dark:text-black text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs pointer-events-none z-10 border border-white dark:border-black animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Backdrop for closing dropdown on click outside */}
          {showNotifications && (
            <div 
              className="fixed inset-0 z-40 bg-black/40 sm:bg-transparent" 
              onClick={() => setShowNotifications(false)} 
            />
          )}

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div 
              className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-auto sm:mt-3 w-[calc(100vw-24px)] sm:w-80 max-w-[360px] max-h-[80vh] sm:max-h-96 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-black bg-black text-white dark:bg-white dark:text-black px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllRead}
                      className="text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 transition-colors"
                    >
                      <CheckCheck size={12} /> Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="cursor-pointer bg-transparent border-none p-0 transition-colors text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Notification Items */}
              <div className="overflow-y-auto flex-1 divide-y divide-zinc-200 dark:divide-zinc-800">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                    No recent order notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onMarkSingleRead && onMarkSingleRead(n.id)}
                      className={`p-3.5 flex flex-col gap-2 transition-all duration-150 cursor-pointer ${
                        n.unread 
                          ? "bg-zinc-100/70 dark:bg-zinc-800/40" 
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                      }`}
                    >
                      <div className="flex gap-2.5 items-start">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                          {n.type === 'order' ? <ShoppingBag size={14} /> : <AlertCircle size={14} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="text-[12px] font-bold truncate text-zinc-900 dark:text-zinc-100">
                              {n.title}
                            </span>
                            <span className="text-[9px] text-zinc-400 dark:text-zinc-500">{n.time}</span>
                          </div>
                          <p className="text-[11px] mt-1 leading-snug text-zinc-600 dark:text-zinc-400">
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
                          className="self-end px-3 py-1 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer border-none shadow-xs transition-all"
                        >
                          Process &amp; Ship <ArrowRight size={10} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Capsule — Classic Black and White */}
        {(() => {
          const displayName = adminUser?.name || adminUser?.username || (adminUser?.email ? adminUser.email.split('@')[0] : 'Admin');
          const initial = displayName ? displayName.charAt(0).toUpperCase() : 'A';
          return (
            <div className="flex items-center gap-2 pl-1 pr-2.5 sm:pr-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <div className="w-7 h-7 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-xs font-black shadow-xs shrink-0">
                {initial}
              </div>
              <div className="hidden sm:flex flex-col min-w-0">
                <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 max-w-[110px] truncate leading-tight tracking-tight">
                  {displayName}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 leading-none mt-0.5">
                  {adminUser?.role === 'admin' ? 'Root Admin' : 'Admin'}
                </span>
              </div>
            </div>
          );
        })()}
      </div>
    </header>
  );
};

export default AdminTopbar;
