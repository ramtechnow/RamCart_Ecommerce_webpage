import React, { useState, useEffect, useCallback } from "react";
import { useAppSelector } from "../store/hooks";
import { adminApi } from "../Utils/adminApi";

// Individual Tabs
import { AdminDashboardTab } from "../Components/admin/AdminDashboardTab";
import { AdminCatalogTab } from "../Components/admin/AdminCatalogTab";
import { AdminAddProductTab } from "../Components/admin/AdminAddProductTab";
import { AdminUsersTab } from "../Components/admin/AdminUsersTab";
import { AdminOrdersTab } from "../Components/admin/AdminOrdersTab";
import { AdminCouponsTab } from "../Components/admin/AdminCouponsTab";
import { AdminBannersTab } from "../Components/admin/AdminBannersTab";
import { AdminSeasonalTab } from "../Components/admin/AdminSeasonalTab";

// UI Components
import { AdminSidebar } from "../Components/admin/AdminSidebar";
import { AdminTopbar } from "../Components/admin/AdminTopbar";
import { AdminLoadingScreen } from "../Components/admin/AdminLoadingScreen";
import { AdminAccessDenied } from "../Components/admin/AdminAccessDenied";
import { ConfirmModal } from "../Components/admin/ConfirmModal";

// Styling imports
import "../Styles/adminPanel.css";
import { AlertCircle, RefreshCw } from "lucide-react";
import { addToast } from "../store/slices/toastSlice";
import { useAppDispatch } from "../store/hooks";

export const AdminPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // 1. Secure Authentication from Redux
  const { user, loading: authLoading } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === "admin";

  // 2. Active Tab State
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // 3. Database State
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);

  // Fetch Loaders and Error triggers
  const [fetchingData, setFetchingData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // 4. Toast helper via Redux
  const triggerToast = (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    dispatch(addToast({ message, type }));
  };

  // 5. Custom Modal dialog State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    isDestructive: false,
    onConfirm: () => {},
    onCancel: () => {}
  });

  const triggerConfirm = ({ 
    title, 
    message, 
    confirmText = "Confirm", 
    cancelText = "Cancel", 
    isDestructive = false, 
    onConfirm 
  }: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      isDestructive,
      onConfirm: () => {
        onConfirm();
        closeConfirm();
      },
      onCancel: closeConfirm
    });
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  // 6. Administrative actions log
  const [recentActions, setRecentActions] = useState<Array<{ message: string; time: string }>>([
    { message: "Administrative Session Established", time: new Date().toLocaleTimeString() }
  ]);
  
  const logAction = (message: string) => {
    setRecentActions(prev => [
      { message, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 9) // Limit to last 10 logs
    ]);
  };

  // Real-time admin notifications state — starts empty, populated only from real backend orders
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);


  const [knownOrderIds, setKnownOrderIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (knownOrderIds.size > 0) {
      console.log(`📡 Tracking ${knownOrderIds.size} active orders for real-time alerts.`);
    }
  }, [knownOrderIds]);

  const handleMarkAllNotificationsRead = () => {
    setAdminNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleMarkSingleNotificationRead = (id: any) => {
    setAdminNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const handleProcessOrder = (orderId: string) => {
    setActiveTab("orders");
    dispatch(addToast({ message: `📦 Processing Order #${orderId ? orderId.substring(0, 8).toUpperCase() : 'RC'}`, type: "info" }));
  };

  // Load Admin Data from Firestore
  const fetchAllAdminData = useCallback(async () => {
    setFetchingData(true);
    setFetchError(null);
    try {
      const [prodData, usersData, ordersData, couponsData, bannersData] = await Promise.allSettled([
        adminApi.fetchProducts(),
        adminApi.fetchUsers(),
        adminApi.fetchOrders(),
        adminApi.fetchCoupons(),
        adminApi.fetchBanners()
      ]);

      if (prodData.status === "fulfilled") {
        setProducts(prodData.value);
      }

      if (usersData.status === "fulfilled") {
        setUsers(usersData.value);
      }

      if (ordersData.status === "fulfilled") {
        const freshOrders = ordersData.value;
        setOrders(freshOrders);

        // Detect new incoming orders for real-time pop-up notification
        setKnownOrderIds(prev => {
          if (prev.size > 0) {
            freshOrders.forEach((o: any) => {
              const oId = String(o.id || o._id);
              if (oId && !prev.has(oId)) {
                // New order detected!
                dispatch(addToast({
                  message: `🛒 REAL-TIME ALERT: New Order Placed! #${oId.substring(0, 8).toUpperCase()} (₹${o.amount})`,
                  type: "success"
                }));

                setAdminNotifications(nPrev => [
                  {
                    id: `notif-${Date.now()}`,
                    title: "🎉 New Order Placed!",
                    message: `Order #${oId.substring(0, 8).toUpperCase()} placed by ${o.userName || o.userEmail || "Customer"} (₹${o.amount})`,
                    time: "Just now",
                    type: "order",
                    unread: true,
                    orderId: oId
                  },
                  ...nPrev
                ]);
              }
            });
          }
          return new Set(freshOrders.map((o: any) => String(o.id || o._id)));
        });
      }

      if (couponsData.status === "fulfilled") {
        setCoupons(couponsData.value.coupons || couponsData.value);
      }

      if (bannersData.status === "fulfilled") {
        setBanners(bannersData.value);
      }

    } catch (err: any) {
      console.error("Critical database fetch failure:", err);
      setFetchError(err.message || "Failed to establish active connection with database API.");
      triggerToast("Failed to fetch administrative data lists", "error");
    } finally {
      setFetchingData(false);
    }
  }, [dispatch]);

  // Initial fetch and 10-second polling for real-time orders
  useEffect(() => {
    if (isAdmin) {
      fetchAllAdminData();
      const interval = setInterval(() => {
        adminApi.fetchOrders().then((freshOrders) => {
          setOrders(freshOrders);
          setKnownOrderIds(prev => {
            if (prev.size > 0) {
              freshOrders.forEach((o: any) => {
                const oId = String(o.id || o._id);
                if (oId && !prev.has(oId)) {
                  dispatch(addToast({
                    message: `🛒 REAL-TIME ALERT: New Order #${oId.substring(0, 8).toUpperCase()} (₹${o.amount})`,
                    type: "success"
                  }));
                  setAdminNotifications(nPrev => [
                    {
                      id: `notif-${Date.now()}`,
                      title: "🎉 New Order Placed!",
                      message: `Order #${oId.substring(0, 8).toUpperCase()} placed by ${o.userName || o.userEmail || "Customer"} (₹${o.amount})`,
                      time: "Just now",
                      type: "order",
                      unread: true,
                      orderId: oId
                    },
                    ...nPrev
                  ]);
                }
              });
            }
            return new Set(freshOrders.map((o: any) => String(o.id || o._id)));
          });
        }).catch(() => {});
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, fetchAllAdminData, dispatch]);

  // Loader UI
  if (authLoading) {
    return <AdminLoadingScreen />;
  }

  // Verification Failure UI
  if (!isAdmin) {
    return <AdminAccessDenied />;
  }

  return (
    <div className="admin-panel admin-shell animate-fade-in">
      
      {/* 1. Sidebar */}
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        productsCount={products.length}
        usersCount={users.length}
        ordersCount={orders.length}
        couponsCount={coupons.length}
        bannersCount={banners.length}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Primary Content Viewport */}
      <div className="admin-main">
        
        {/* 2. Topbar */}
        <AdminTopbar 
          adminUser={user} 
          notifications={adminNotifications as any}
          onMarkAllRead={handleMarkAllNotificationsRead}
          onMarkSingleRead={handleMarkSingleNotificationRead}
          onProcessOrder={handleProcessOrder}
          onToggleMobileSidebar={() => setMobileSidebarOpen(prev => !prev)}
        />

        {/* 3. Tab Body Panel */}
        <main className="admin-content">
          
          {fetchingData && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 18px",
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              marginBottom: "24px",
              fontSize: "0.85rem",
              color: "var(--text-secondary)"
            }}>
              <span className="admin-spinner" style={{ borderLeftColor: "var(--accent-color)", width: "16px", height: "16px" }}></span>
              <span>Syncing database collections...</span>
            </div>
          )}

          {fetchError && !fetchingData && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              padding: "24px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "16px",
              marginBottom: "24px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#ef4444" }}>
                <AlertCircle size={20} />
                <strong style={{ fontSize: "0.95rem" }}>Database Fetch Error</strong>
              </div>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#7f1d1d", lineHeight: "1.5" }}>
                {fetchError}.
              </p>
              <button
                onClick={fetchAllAdminData}
                style={{
                  alignSelf: "flex-start",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--border-radius-full)",
                  fontSize: "0.8rem",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                <RefreshCw size={12} />
                Retry connection
              </button>
            </div>
          )}

          {/* Render Active Tab */}
          {activeTab === "dashboard" && (
            <AdminDashboardTab 
              products={products as any}
              users={users as any}
              orders={orders as any}
              setActiveTab={setActiveTab as any}
              recentActions={recentActions as any}
            />
          )}

          {activeTab === "list" && (
            <AdminCatalogTab 
              products={products as any}
              onRefreshProducts={fetchAllAdminData as any}
              addToast={triggerToast as any}
              triggerConfirm={triggerConfirm as any}
              logAction={logAction as any}
            />
          )}

          {activeTab === "add" && (
            <AdminAddProductTab 
              onProductAdded={(() => {
                fetchAllAdminData();
                setActiveTab("list");
              }) as any}
              addToast={triggerToast as any}
              logAction={logAction as any}
            />
          )}

          {activeTab === "users" && (
            <AdminUsersTab 
              users={users as any}
              products={products as any}
              onRefreshUsers={fetchAllAdminData as any}
              addToast={triggerToast as any}
              triggerConfirm={triggerConfirm as any}
              logAction={logAction as any}
            />
          )}

          {activeTab === "orders" && (
            <AdminOrdersTab 
              orders={orders as any}
              products={products as any}
              onRefreshOrders={fetchAllAdminData as any}
              addToast={triggerToast as any}
              triggerConfirm={triggerConfirm as any}
              logAction={logAction as any}
            />
          )}

          {activeTab === "coupons" && (
            <AdminCouponsTab 
              coupons={coupons as any}
              onRefreshCoupons={fetchAllAdminData as any}
              addToast={triggerToast as any}
              triggerConfirm={triggerConfirm as any}
              logAction={logAction as any}
            />
          )}

          {activeTab === "banners" && (
            <AdminBannersTab 
              banners={banners as any}
              onRefreshBanners={fetchAllAdminData as any}
              addToast={triggerToast as any}
              triggerConfirm={triggerConfirm as any}
              logAction={logAction as any}
            />
          )}

          {activeTab === "seasonal" && (
            <AdminSeasonalTab 
              addToast={triggerToast}
              logAction={logAction}
            />
          )}
        </main>
      </div>

      {/* Confirmation Modal overlay */}
      <ConfirmModal {...confirmModal} />
    </div>
  );
};

export default AdminPanel;
