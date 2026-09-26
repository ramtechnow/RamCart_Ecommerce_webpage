import React, { useState, useContext } from 'react';
import { User, Eye, Bell, CheckCheck, ShoppingBag, AlertCircle, X, ArrowRight, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../Context/ThemeContext';

export const AdminTopbar = ({ 
  adminUser, 
  notifications = [], 
  onMarkAllRead, 
  onMarkSingleRead, 
  onProcessOrder 
}) => {
  const navigate = useNavigate();
  const themeCtx = useContext(ThemeContext);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="admin-topbar sticky top-0 z-50 flex items-center justify-between px-6 w-full h-16 bg-white dark:bg-[#171622] border-b border-[#e2e4ed] dark:border-[#2e2d40] shadow-sm transition-colors duration-200">
      {/* Left — Console Identity */}
      <div className="flex items-center gap-4 flex-1">
        <div>
          <h2 className="text-sm font-black text-[#ff8906] tracking-wider uppercase">
            ADMIN CONSOLE
          </h2>
          <span className="text-[11px] text-[#717388] dark:text-[#a7a9be] font-semibold hidden sm:inline">
            Manage Catalog, Accounts, and Real-time Orders
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Dark / Light Theme Toggle Button */}
        {themeCtx && (
          <button
            type="button"
            onClick={themeCtx.toggleTheme}
            aria-label="Toggle Theme Mode"
            title={themeCtx.isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#ff8906] hover:bg-[#ff8906] hover:text-[#fffffe] transition-all duration-200 cursor-pointer shadow-sm"
            style={{
              backgroundColor: 'var(--bg-tertiary, #eff0f6)',
              border: '1px solid var(--border-color, #dbe3ee)'
            }}
          >
            {themeCtx.isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        )}

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
            className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer shadow-sm"
            style={{
              backgroundColor: 'var(--bg-tertiary, #eff0f6)',
              border: '1px solid var(--border-color, #dbe3ee)',
              color: 'var(--text-primary, #0f0e17)'
            }}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#e53170] text-[#fffffe] text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm pointer-events-none z-10 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Backdrop for closing dropdown on click outside */}
          {showNotifications && (
            <div 
              className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent" 
              onClick={() => setShowNotifications(false)} 
            />
          )}

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div 
              className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-auto sm:mt-3 w-[calc(100vw-24px)] sm:w-80 max-w-[360px] max-h-[80vh] sm:max-h-96 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in"
              style={{
                backgroundColor: 'var(--bg-secondary, #ffffff)',
                border: '1px solid var(--border-color, #dbe3ee)'
              }}
            >
              {/* Header */}
              <div 
                className="flex items-center justify-between p-3.5 border-b"
                style={{
                  backgroundColor: 'var(--bg-tertiary, #eff0f6)',
                  borderColor: 'var(--border-color, #dbe3ee)'
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold" style={{ color: 'var(--text-primary, #0f0e17)' }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold bg-[#ff8906] text-[#fffffe] px-2 py-0.5 rounded-full shadow-xs">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllRead}
                      className="text-[#ff8906] hover:text-[#e53170] text-[10px] font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                    >
                      <CheckCheck size={12} /> Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="cursor-pointer bg-transparent border-none p-0 transition-colors"
                    style={{ color: 'var(--text-muted, #717388)' }}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Notification Items */}
              <div 
                className="overflow-y-auto flex-1 divide-y"
                style={{ borderColor: 'var(--border-color, #dbe3ee)' }}
              >
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs font-medium" style={{ color: 'var(--text-muted, #717388)' }}>
                    No recent order notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onMarkSingleRead && onMarkSingleRead(n.id)}
                      className="p-3.5 flex flex-col gap-2 transition-all duration-150 cursor-pointer"
                      style={{
                        backgroundColor: n.unread ? 'var(--accent-light, rgba(255, 137, 6, 0.08))' : 'transparent',
                        borderBottom: '1px solid var(--border-color, #dbe3ee)'
                      }}
                    >
                      <div className="flex gap-2.5 items-start">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          n.type === 'order' 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                            : "bg-red-500/10 text-[#e53170]"
                        }`}>
                          {n.type === 'order' ? <ShoppingBag size={14} /> : <AlertCircle size={14} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="text-[12px] font-bold truncate" style={{ color: 'var(--text-primary, #0f0e17)' }}>
                              {n.title}
                            </span>
                            <span className="text-[9px]" style={{ color: 'var(--text-muted, #717388)' }}>{n.time}</span>
                          </div>
                          <p className="text-[11px] mt-1 leading-snug" style={{ color: 'var(--text-secondary, #4b5870)' }}>
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

        {/* Profile Capsule — Crisp high-contrast surface, bold username & distinct role badge */}
        {(() => {
          const displayName = adminUser?.name || adminUser?.username || (adminUser?.email ? adminUser.email.split('@')[0] : 'Admin');
          const initial = displayName ? displayName.charAt(0).toUpperCase() : 'A';
          return (
            <div 
              className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full shadow-sm"
              style={{
                backgroundColor: 'var(--bg-tertiary, #eff0f6)',
                border: '1px solid var(--border-color, #dbe3ee)'
              }}
            >
              <div 
                className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-black shadow-sm shrink-0"
                style={{ background: 'linear-gradient(135deg, #ff8906 0%, #e53170 100%)' }}
              >
                {initial}
              </div>
              <div className="flex flex-col min-w-0">
                <span 
                  className="text-xs font-black max-w-[120px] truncate leading-tight tracking-tight"
                  style={{ color: 'var(--text-primary, #0f0e17)' }}
                >
                  {displayName}
                </span>
                <span 
                  className="text-[9px] font-extrabold uppercase tracking-wider leading-none mt-0.5"
                  style={{ color: 'var(--accent-color, #ff8906)' }}
                >
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
