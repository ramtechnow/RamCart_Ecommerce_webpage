import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
import { AdminCategoriesTab } from "../Components/admin/AdminCategoriesTab";
import { AdminSeasonalTab } from "../Components/admin/AdminSeasonalTab";
import { AdminMarketingCRMTab } from "../Components/admin/AdminMarketingCRMTab";

// UI Components
import { AdminSidebar } from "../Components/admin/AdminSidebar";
import { AdminTopbar } from "../Components/admin/AdminTopbar";
import { AdminLoadingScreen } from "../Components/admin/AdminLoadingScreen";
import { AdminAccessDenied } from "../Components/admin/AdminAccessDenied";
import { ConfirmModal } from "../Components/admin/ConfirmModal";
import { AdminErrorBoundary } from "../Components/admin/AdminErrorBoundary";

// Styling imports
import "../Styles/adminPanel.css";
import { AlertCircle, RefreshCw } from "lucide-react";
import { addToast } from "../store/slices/toastSlice";
import { useAppDispatch } from "../store/hooks";

export const AdminPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // 1. Secure Authentication from Redux
  const { user, loading: authLoading } = useAppSelector((state) => state.auth);
  const isSuperAdmin = user?.role === "admin" || user?.email?.toLowerCase() === "bvhss20@gmail.com";
  const isVendor = user?.role === "vendor";
  const isAuthorized = isSuperAdmin || isVendor;

  // 2. Active Tab State with query parameter support (e.g. /admin?tab=add)
  const [searchParams] = useSearchParams();
  const queryTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(queryTab || (isVendor ? "add" : "dashboard"));

  useEffect(() => {
    if (queryTab) {
      if (isVendor && !["list", "add"].includes(queryTab)) {
        setActiveTab("list");
      } else {
        setActiveTab(queryTab);
      }
    } else if (isVendor && !["list", "add"].includes(activeTab)) {
      setActiveTab("list");
    }
  }, [queryTab, isVendor, activeTab]);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // 3. Database State
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);

  // Filter vendor specific products for sidebar counter
  const vendorSpecificProducts = useMemo(() => {
    if (!isVendor) return products;
    const vName = (user?.vendorName || user?.name || "").toLowerCase().trim();
    return products.filter((p: any) => {
      const pv = (p.vendor || "").toLowerCase().trim();
      return pv && (pv.includes(vName) || vName.includes(pv));
    });
  }, [products, isVendor, user]);

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

  const getStoredReadIds = (): Set<string> => {
    try {
      const raw = localStorage.getItem("admin_read_notif_ids");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (e) {
      return new Set();
    }
  };

  const getStoredClearedIds = (): Set<string> => {
    try {
      const raw = localStorage.getItem("admin_cleared_notif_ids");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (e) {
      return new Set();
    }
  };

  const handleMarkAllNotificationsRead = () => {
    setAdminNotifications(prev => {
      const readSet = getStoredReadIds();
      prev.forEach(n => readSet.add(n.id));
      localStorage.setItem("admin_read_notif_ids", JSON.stringify(Array.from(readSet)));
      return prev.map(n => ({ ...n, unread: false }));
    });
  };

  const handleClearAllNotifications = () => {
    setAdminNotifications(prev => {
      const clearedSet = getStoredClearedIds();
      prev.forEach(n => clearedSet.add(n.id));
      localStorage.setItem("admin_cleared_notif_ids", JSON.stringify(Array.from(clearedSet)));
      return [];
    });
    dispatch(addToast({ message: "Cleared all admin notifications", type: "info" }));
  };

  const handleMarkSingleNotificationRead = (id: any) => {
    const readSet = getStoredReadIds();
    readSet.add(id);
    localStorage.setItem("admin_read_notif_ids", JSON.stringify(Array.from(readSet)));
    setAdminNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const handleProcessOrder = (orderId: string) => {
    setActiveTab("orders");
    dispatch(addToast({ message: `📦 Processing Order #${orderId ? orderId.substring(0, 8).toUpperCase() : 'RC'}`, type: "info" }));
  };

  const handleVendorRestock = async (productId: any, requestedUnits: number) => {
    try {
      const prodToUpdate = products.find((p: any) => String(p.id) === String(productId));
      if (!prodToUpdate) {
        setActiveTab("list");
        dispatch(addToast({ message: "Product located in Catalog for restock", type: "info" }));
        return;
      }
      
      const addUnits = requestedUnits || 50;
      const newStock = (prodToUpdate.stockCount || 0) + addUnits;
      await adminApi.updateProduct({
        ...prodToUpdate,
        id: String(productId),
        stockCount: newStock
      });

      // Mark request as resolved in storage
      try {
        const savedRequests = JSON.parse(localStorage.getItem('ramcart_stock_requests') || '[]');
        const updatedReqs = savedRequests.map((r: any) => 
          String(r.productId) === String(productId) ? { ...r, status: 'resolved' } : r
        );
        localStorage.setItem('ramcart_stock_requests', JSON.stringify(updatedReqs));
      } catch (e) {}

      dispatch(addToast({ message: `🎉 Restocked +${addUnits} units for "${prodToUpdate.name}"!`, type: "success" }));
      fetchAllAdminData();
    } catch (err: any) {
      dispatch(addToast({ message: err.message || "Failed to update stock", type: "error" }));
    }
  };

  // Load Admin Data from Firestore / Backend
  const fetchAllAdminData = useCallback(async () => {
    setFetchingData(true);
    setFetchError(null);
    try {
      if (isVendor) {
        // Vendors only manage their catalog products; avoid calling restricted admin-only endpoints
        try {
          const freshProds = await adminApi.fetchProducts();
          const prodsList = Array.isArray(freshProds) ? freshProds : (freshProds as any)?.products || [];
          setProducts(prodsList);

          // Build Vendor-specific notifications
          const vName = (user?.vendorName || user?.name || "").toLowerCase().trim();
          const myProds = prodsList.filter((p: any) => {
            const pv = (p.vendor || "").toLowerCase().trim();
            return pv && (pv.includes(vName) || vName.includes(pv));
          });

          // 1. Read Admin Restock Requests from localStorage
          let savedRequests: any[] = [];
          try {
            savedRequests = JSON.parse(localStorage.getItem('ramcart_stock_requests') || '[]');
          } catch (e) {}

          const vendorNotifs: any[] = [];

          // Add restock requests from Admin (high priority alerts)
          savedRequests.forEach((req: any) => {
            vendorNotifs.push({
              id: req.id,
              title: `📢 Admin Restock Request: +${req.requestedUnits} Units`,
              message: `Store Admin requested stock for "${req.productName}". Note: "${req.note}"`,
              time: req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "Pending",
              type: "alert",
              unread: req.status === "pending",
              isStockRequest: true,
              productId: req.productId,
              requestedUnits: req.requestedUnits
            });
          });

          // Add Low Stock warnings for vendor's products (< 15 units)
          myProds.filter((p: any) => (p.stockCount ?? 0) < 15).forEach((p: any) => {
            vendorNotifs.push({
              id: `stock-${p.id}`,
              title: `⚠️ Low Inventory: ${p.name}`,
              message: `Only ${p.stockCount ?? 0} units left in stock. Consider replenishing.`,
              time: "Stock Alert",
              type: "alert",
              unread: true,
              productId: p.id
            });
          });

          // Add Active listing confirmations
          myProds.slice(0, 5).forEach((p: any) => {
            vendorNotifs.push({
              id: `vprod-${p.id}`,
              title: `✅ Active Listing: ${p.name}`,
              message: `Listed in ${p.category} with ${p.stockCount ?? 0} units stock at ₹${p.newPrice || p.new_price}.`,
              time: "Live on Storefront",
              type: "product",
              unread: false,
              productId: p.id
            });
          });

          setAdminNotifications(vendorNotifs);

        } catch (err: any) {
          console.warn("Could not fetch catalog products for vendor:", err);
        }
        return;
      }

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

        // Populate rich admin notifications: Cancelled orders, Refunds, Orders, Stock
        const freshProds: any[] = prodData.status === "fulfilled" 
          ? (Array.isArray(prodData.value) ? prodData.value : (prodData.value as any)?.products || []) 
          : [];

        const readSet = getStoredReadIds();
        const clearedSet = getStoredClearedIds();

        setAdminNotifications(() => {
          const notifs: any[] = [];

          // A. Cancelled Orders & Refunds
          const cancelledOrders = freshOrders.filter((o: any) => o.status === "Cancelled" || o.paymentStatus === "Refunded");
          cancelledOrders.slice(0, 8).forEach((o: any) => {
            const oId = String(o.orderId || o.id || o._id || "");
            const isRefundDone = Boolean(o.youpiRefundUtr || o.paymentStatus === 'Refunded');
            const notifId = isRefundDone ? `refund-done-${oId}` : `cancel-pending-${oId}`;

            if (!clearedSet.has(notifId)) {
              if (isRefundDone) {
                notifs.push({
                  id: notifId,
                  title: `✅ Refund Done: #${o.orderId || oId.substring(0, 8).toUpperCase()}`,
                  message: `Refund of ₹${o.amount} sent via UPI (${o.youpiRefundUtr || 'Confirmed'}). Customer: ${o.userName || 'Customer'}`,
                  time: o.youpiRefundedAt ? new Date(o.youpiRefundedAt).toLocaleDateString() : (o.date ? new Date(o.date).toLocaleDateString() : "Refunded"),
                  type: "success",
                  unread: !readSet.has(notifId),
                  orderId: oId
                });
              } else {
                notifs.push({
                  id: notifId,
                  title: `⚠️ Refund Required: #${o.orderId || oId.substring(0, 8).toUpperCase()}`,
                  message: `Cancelled by ${o.userName || o.userEmail || "Customer"} (₹${o.amount}) • Action Required`,
                  time: o.date ? new Date(o.date).toLocaleDateString() : "Recent",
                  type: "alert",
                  unread: !readSet.has(notifId),
                  orderId: oId
                });
              }
            }
          });

          // B. Recent Orders (COD vs YouPI)
          freshOrders.slice(0, 8).forEach((o: any) => {
            const oId = String(o.orderId || o.id || o._id || "");
            if (o.status !== "Cancelled" && o.paymentStatus !== "Refunded") {
              const notifId = `order-${oId}`;
              if (!clearedSet.has(notifId)) {
                const isCod = o.paymentMethod === 'COD' || !o.payment;
                notifs.push({
                  id: notifId,
                  title: isCod ? `🚚 COD Order #${o.orderId || oId.substring(0, 8).toUpperCase()}` : `💳 UPI Order #${o.orderId || oId.substring(0, 8).toUpperCase()}`,
                  message: `${o.userName || o.userEmail || "Customer"} (₹${o.amount}) • ${isCod ? 'Cash on Delivery' : 'Paid via YouPI UPI'} • ${o.status || 'Ordered'}`,
                  time: o.date ? new Date(o.date).toLocaleDateString() : "Recent",
                  type: "order",
                  unread: !readSet.has(notifId),
                  orderId: oId
                });
              }
            }
          });

          // C. Low Stock Warnings
          const lowStockProds = freshProds.filter((p: any) => p.stockCount !== undefined && p.stockCount < 10);
          lowStockProds.slice(0, 4).forEach((p: any) => {
            const notifId = `stock-${p.id}`;
            if (!clearedSet.has(notifId)) {
              notifs.push({
                id: notifId,
                title: `⚠️ Low Stock: ${p.name}`,
                message: `Only ${p.stockCount} units remaining in stock. Please restock!`,
                time: "Stock Alert",
                type: "alert",
                unread: !readSet.has(notifId)
              });
            }
          });

          return notifs;
        });

        // Detect new incoming orders for real-time pop-up notification
        setKnownOrderIds(prev => {
          if (prev.size > 0) {
            freshOrders.forEach((o: any) => {
              const oId = String(o.orderId || o.id || o._id);
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
  }, [dispatch, isVendor]);

  // Initial fetch and polling
  useEffect(() => {
    if (isAuthorized) {
      fetchAllAdminData();
      
      // Super admins poll real-time incoming orders every 10s
      if (isSuperAdmin) {
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
    }
  }, [isAuthorized, isSuperAdmin, fetchAllAdminData, dispatch]);

  // Loader UI
  if (authLoading) {
    return <AdminLoadingScreen />;
  }

  // Verification Failure UI
  if (!isAuthorized) {
    return <AdminAccessDenied />;
  }

  return (
    <div className="admin-panel admin-shell animate-fade-in">
      
      {/* 1. Sidebar */}
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        productsCount={isVendor ? vendorSpecificProducts.length : products.length}
        usersCount={users.length}
        ordersCount={orders.length}
        couponsCount={coupons.length}
        bannersCount={banners.length}
        isVendor={isVendor}
        vendorName={user?.vendorName || user?.name || ''}
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
          onClearAll={handleClearAllNotifications}
          onProcessOrder={handleProcessOrder}
          onToggleMobileSidebar={() => setMobileSidebarOpen(prev => !prev)}
          isVendor={isVendor}
          onRestock={handleVendorRestock}
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
            <div className="admin-fetch-error" role="alert">
              <div className="admin-fetch-error-title">
                <AlertCircle size={20} />
                <strong style={{ fontSize: "0.95rem" }}>Database Fetch Error</strong>
              </div>
              <p className="admin-fetch-error-message">{fetchError}.</p>
              <button
                className="admin-fetch-error-retry"
                onClick={fetchAllAdminData}
              >
                <RefreshCw size={12} />
                Retry connection
              </button>
            </div>
          )}

          {/* Render Active Tab */}
          {activeTab === "dashboard" && !isVendor && (
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
              isVendor={isVendor}
              vendorName={user?.vendorName || user?.name || ""}
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
              isVendor={isVendor}
              vendorName={user?.vendorName || user?.name || ""}
            />
          )}

          {activeTab === "users" && !isVendor && (
            <AdminUsersTab 
              users={users as any}
              products={products as any}
              onRefreshUsers={fetchAllAdminData as any}
              addToast={triggerToast as any}
              triggerConfirm={triggerConfirm as any}
              logAction={logAction as any}
            />
          )}

          {activeTab === "orders" && !isVendor && (
            <AdminOrdersTab 
              orders={orders as any}
              products={products as any}
              onRefreshOrders={fetchAllAdminData as any}
              addToast={triggerToast as any}
              triggerConfirm={triggerConfirm as any}
              logAction={logAction as any}
            />
          )}

          {activeTab === "marketing" && !isVendor && (
            <AdminMarketingCRMTab 
              users={users as any}
              orders={orders as any}
              coupons={coupons as any}
              addToast={triggerToast as any}
              logAction={logAction as any}
            />
          )}

          {activeTab === "coupons" && !isVendor && (
            <AdminCouponsTab 
              coupons={coupons as any}
              onRefreshCoupons={fetchAllAdminData as any}
              addToast={triggerToast as any}
              triggerConfirm={triggerConfirm as any}
              logAction={logAction as any}
            />
          )}

          {activeTab === "banners" && !isVendor && (
            <AdminBannersTab 
              banners={banners as any}
              onRefreshBanners={fetchAllAdminData as any}
              addToast={triggerToast as any}
              triggerConfirm={triggerConfirm as any}
              logAction={logAction as any}
            />
          )}

          {activeTab === "categories" && !isVendor && (
            <AdminCategoriesTab
              addToast={triggerToast}
              triggerConfirm={triggerConfirm}
              logAction={logAction}
            />
          )}

          {activeTab === "seasonal" && !isVendor && (
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

const AdminPanelWrapped: React.FC = (props) => (
  <AdminErrorBoundary>
    <AdminPanel {...props} />
  </AdminErrorBoundary>
);

export default AdminPanelWrapped;
