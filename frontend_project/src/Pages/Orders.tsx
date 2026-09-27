import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  MapPin, 
  Package, 
  RefreshCw, 
  CheckCircle2, 
  Truck, 
  Clock3, 
  Circle,
  AlertTriangle,
  XCircle
} from "lucide-react";

import { useAuth } from "../features/auth/hooks/useAuth";
import { fetchUserOrders, cancelUserOrder } from "../features/checkout/services/orderService";
import { Order } from "../features/checkout/types/orderTypes";
import { addToast } from "../store/slices/toastSlice";
import { useAppDispatch } from "../store/hooks";

import "../Styles/orders.css";

const STATUS_STEPS = ["Pending", "Processing", "Shipped", "Delivered"];

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Pending: <Circle size={16} />,
  Processing: <Clock3 size={16} />,
  Shipped: <Truck size={16} />,
  Delivered: <CheckCircle2 size={16} />,
  Cancelled: <XCircle size={16} />
};

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeSection, setActiveSection] = useState<"active" | "completed">("active");

  // Cancellation Modal State
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    order: Order | null;
    reason: string;
    loading: boolean;
  }>({
    isOpen: false,
    order: null,
    reason: "Changed mind / Placed by mistake",
    loading: false
  });
  
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const loadOrders = useCallback(async (isRefresh = false) => {
    if (!user) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const fetchedOrders = await fetchUserOrders(user.uid);
      setOrders(fetchedOrders);
      setLastUpdated(new Date());
      if (isRefresh) {
        dispatch(addToast({ message: "Orders synchronized successfully!", type: "success" }));
      }
    } catch (err: any) {
      console.error("Failed to load user orders:", err);
      dispatch(addToast({ message: err.message || "Failed to sync orders.", type: "error" }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login", { state: { from: { pathname: "/orders" } } });
      } else {
        loadOrders(false);
      }
    }
  }, [user, authLoading, loadOrders, navigate]);

  const toggleExpand = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const isCancellable = (status?: string) => {
    const s = (status || "").toLowerCase();
    return s === "pending" || s === "processing" || s === "ordered";
  };

  const handleInitiateCancel = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    setCancelModal({
      isOpen: true,
      order,
      reason: "Changed mind / Placed by mistake",
      loading: false
    });
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal.order?.id) return;
    const orderId = cancelModal.order.id;
    setCancelModal(prev => ({ ...prev, loading: true }));

    try {
      const res = await cancelUserOrder(orderId, cancelModal.reason);
      if (res.success) {
        dispatch(addToast({ 
          message: `Order #${orderId.substring(0, 8).toUpperCase()} cancelled successfully!`, 
          type: "success" 
        }));
        // Update local order list immediately
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "Cancelled" } : o));
        setCancelModal({ isOpen: false, order: null, reason: "", loading: false });
      } else {
        dispatch(addToast({ message: res.error || "Failed to cancel order", type: "error" }));
        setCancelModal(prev => ({ ...prev, loading: false }));
      }
    } catch (err: any) {
      dispatch(addToast({ message: err.message || "Failed to cancel order", type: "error" }));
      setCancelModal(prev => ({ ...prev, loading: false }));
    }
  };

  const getStepIndex = (status: string) => STATUS_STEPS.indexOf(status);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const isCompleted = order.status === "Delivered" || order.status === "Cancelled";
      return activeSection === "active" ? !isCompleted : isCompleted;
    });
  }, [orders, activeSection]);

  const formatOrderDate = (createdAt: any) => {
    if (!createdAt) return "N/A";
    if (createdAt.toDate && typeof createdAt.toDate === "function") {
      return createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <main className="orders-page-container">
      {/* Header Panel */}
      <div className="orders-header-row">
        <div className="orders-title-block">
          <h2>
            <ShoppingBag className="orders-title-icon" size={28} />
            My Orders
          </h2>
          <p>
            Track shipments, manage receipts, and check active purchase statuses.
          </p>
        </div>

        <div className="orders-header-actions">
          {lastUpdated && (
            <div className="orders-last-updated text-[11px] md:text-xs">
              <span className="live-dot" />
              Last sync: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <button
            onClick={() => loadOrders(true)}
            className="refresh-btn flex items-center gap-1.5"
            disabled={refreshing || loading}
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Syncing..." : "Sync Orders"}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "8px 0" }}>
          {[1, 2, 3].map((id) => (
            <div key={id} style={{ background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="shimmer-line" style={{ width: "40%", height: "14px", borderRadius: 4, background: "rgba(120,120,120,0.12)" }} />
                <div className="shimmer-line" style={{ width: "80px", height: "22px", borderRadius: 20, background: "rgba(120,120,120,0.1)" }} />
              </div>
              <div className="shimmer-line" style={{ width: "60%", height: "11px", borderRadius: 4, background: "rgba(120,120,120,0.08)" }} />
              <div className="shimmer-line" style={{ width: "30%", height: "11px", borderRadius: 4, background: "rgba(120,120,120,0.07)" }} />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="orders-empty-state max-w-md mx-auto text-center py-16 px-6 bg-bg-secondary border border-border rounded-2xl shadow-sm">
          <div className="empty-icon-wrapper mx-auto mb-4 w-16 h-16 bg-bg-tertiary flex items-center justify-center rounded-full text-text-muted">
            <Package size={30} />
          </div>
          <h3>No Purchases Logged</h3>
          <p className="text-xs text-text-muted mb-6">
            You haven't checked out any orders yet. Start adding items to your cart!
          </p>
          <Link to="/catalog">
            <button className="shop-now-btn px-6 py-2.5 bg-accent-pink hover:bg-accent-pink/90 text-white font-bold text-xs rounded-full shadow-md transition-all">
              Browse Collections
            </button>
          </Link>
        </div>
      ) : (
        <>
          {/* Tabs Selector */}
          <div className="orders-tabs flex gap-3 border-b border-border pb-3 mb-5">
            <button
              onClick={() => setActiveSection("active")}
              className={`px-4 py-2 text-xs font-extrabold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                activeSection === "active"
                  ? "border-accent-pink text-accent-pink"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              Active Orders ({orders.filter(o => o.status !== "Delivered").length})
            </button>
            <button
              onClick={() => setActiveSection("completed")}
              className={`px-4 py-2 text-xs font-extrabold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                activeSection === "completed"
                  ? "border-accent-pink text-accent-pink"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              Completed Orders ({orders.filter(o => o.status === "Delivered").length})
            </button>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-bg-secondary border border-border border-dashed rounded-2xl text-text-muted">
              <Package size={36} className="mx-auto mb-3 text-text-muted/40 animate-pulse" />
              <p className="text-xs font-extrabold uppercase tracking-wider">No {activeSection === "active" ? "active" : "completed"} orders logged.</p>
            </div>
          ) : (
            <div className="orders-list flex flex-col gap-4">
              {filteredOrders.map((order) => {
                const orderId = order.id || "";
                const isExpanded = expandedOrderId === orderId;
                const currentStep = getStepIndex(order.status);
                const totalItemsCount = (order.items || []).reduce((acc, it) => acc + (it.quantity || 0), 0);

                return (
              <div 
                key={orderId} 
                className={`order-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all duration-200 ${
                  isExpanded ? "border-accent-pink ring-1 ring-accent-pink/20" : ""
                }`}
              >
                {/* Collapsed summary bar */}
                <div 
                  className="order-summary-bar flex items-center justify-between p-4 bg-bg-secondary cursor-pointer hover:bg-bg-tertiary transition-colors" 
                  onClick={() => toggleExpand(orderId)}
                >
                  <div className="order-meta flex items-center gap-4 flex-wrap">
                    <span className="order-id text-xs md:text-sm font-extrabold text-accent-pink font-mono">{orderId}</span>
                    <span className="order-date text-xs text-text-muted flex items-center gap-1.5">
                      <Calendar size={12} />
                      {formatOrderDate(order.createdAt)}
                    </span>
                    <span className="order-items-count text-[10px] md:text-xs bg-bg-tertiary py-0.5 px-2.5 rounded-full font-bold">
                      {totalItemsCount} {totalItemsCount === 1 ? "Item" : "Items"}
                    </span>
                  </div>

                  <div className="order-status-amount flex items-center gap-2.5 flex-wrap">
                    {isCancellable(order.status) && (
                      <button
                        type="button"
                        onClick={(e) => handleInitiateCancel(order, e)}
                        className="px-2.5 py-1 text-[11px] font-bold text-red-600 dark:text-red-400 hover:text-white hover:bg-red-600 border border-red-300 dark:border-red-900/60 rounded-lg transition-colors cursor-pointer bg-red-50/50 dark:bg-red-950/20"
                        title="Cancel this order before shipment"
                      >
                        Cancel Order
                      </button>
                    )}
                    <span className="order-amount text-sm md:text-base font-extrabold text-text-primary font-mono">
                      ₹{(order.amount || 0).toFixed(2)}
                    </span>
                    <span className={`status-badge text-[10px] py-1 px-2.5 rounded-full font-extrabold flex items-center gap-1 uppercase tracking-wide status-${(order.status || "Pending").toLowerCase()}`}>
                      {STATUS_ICONS[order.status || "Pending"] || <Circle size={12} />}
                      {order.status || "Pending"}
                    </span>
                    <button className="expand-btn text-text-muted hover:text-text-primary" aria-label="Expand details">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded details container */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      className="order-details-panel border-t border-border"
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                    >
                      {/* Timeline status tracker or Cancelled Banner */}
                      {order.status === "Cancelled" ? (
                        <div className="status-tracker p-4 bg-red-500/10 border-b border-red-500/20 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center flex-shrink-0">
                            <XCircle size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                                Order Cancelled
                              </p>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold border border-red-200 dark:border-red-800">
                                Refund Process Initiated
                              </span>
                            </div>
                            <p className="text-[11px] text-text-muted mt-0.5">
                              {order.cancellationReason ? `Reason: ${order.cancellationReason} • ` : ""}
                              {order.cancelledAt ? new Date(order.cancelledAt).toLocaleString() : "This order has been cancelled."}
                              {" • Refund of ₹" + order.amount + " will reflect in 3–5 business days."}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="status-tracker flex items-center p-4 bg-bg-primary overflow-x-auto gap-1">
                          {STATUS_STEPS.map((step, idx) => {
                            const isDone = idx <= currentStep;
                            const isCurrent = idx === currentStep;
                            return (
                              <React.Fragment key={step}>
                                <div className={`tracker-step flex flex-col items-center gap-1.5 ${isDone ? "done" : ""} ${isCurrent ? "current animate-pulse" : ""}`}>
                                  <div className="tracker-dot w-8 h-8 rounded-full border border-border bg-bg-secondary flex items-center justify-center text-text-muted transition-all">
                                    {STATUS_ICONS[step]}
                                  </div>
                                  <span className="tracker-label text-[9px] font-bold text-text-muted uppercase tracking-wider">{step}</span>
                                </div>
                                {idx < STATUS_STEPS.length - 1 && (
                                  <div className={`tracker-line flex-1 h-0.5 bg-border min-w-[20px] max-w-[80px] self-center -mt-4 ${idx < currentStep ? "done" : ""}`} />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      )}

                      {/* Detail information panel */}
                      <div className="order-detail-grid grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border-t border-border bg-bg-secondary/40">
                        {/* Left side items table */}
                        <div className="md:col-span-2">
                          <h4 className="detail-section-title text-xs md:text-sm font-extrabold text-text-primary mb-3">Purchased Items</h4>
                          <div className="items-stack flex flex-col gap-2.5">
                            {(order.items || []).map((item, idx) => (
                              <div key={idx} className="item-row flex items-center gap-3 bg-bg-secondary border border-border rounded-xl p-3 hover:border-accent-pink/40 transition-colors">
                                <div className="item-img-wrap w-10 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-bg-tertiary border border-border">
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="item-img-placeholder flex items-center justify-center text-text-muted h-full w-full">
                                      <Package size={16} />
                                    </div>
                                  )}
                                </div>

                                <div className="item-info flex-1 min-w-0">
                                  <Link to={`/product/${item.productId}`} className="item-title-link text-xs font-bold text-text-primary truncate block hover:text-accent-pink">
                                    {item.name}
                                  </Link>
                                  <div className="item-tags flex flex-wrap gap-1.5 mt-1">
                                    <span className="item-tag text-[9px] bg-bg-tertiary px-2 py-0.5 rounded-full font-bold">Size: {item.size}</span>
                                    <span className="item-tag text-[9px] bg-bg-tertiary px-2 py-0.5 rounded-full font-bold">Color: {item.color}</span>
                                    <span className="item-tag text-[9px] bg-bg-tertiary px-2 py-0.5 rounded-full font-bold">Qty: {item.quantity}</span>
                                  </div>
                                </div>

                                <div className="item-price-col text-right flex-shrink-0">
                                  <span className="item-unit-price text-[10px] text-text-muted block">₹{(item.price || 0).toFixed(2)} each</span>
                                  <span className="item-total text-xs font-extrabold text-text-primary font-mono">
                                    ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right side shipping/payments detail panel */}
                        <div className="detail-info-col flex flex-col gap-4">
                          <div className="info-card bg-bg-secondary border border-border rounded-xl p-4">
                            <h4 className="text-xs font-extrabold text-text-primary flex items-center gap-1.5 mb-2.5">
                              <MapPin size={14} className="text-accent-pink" />
                              Shipping Address
                            </h4>
                            <p className="addr-name text-xs font-bold text-text-primary">{order.address?.fullName || "N/A"}</p>
                            <p className="text-xs text-text-muted leading-relaxed mt-1">{order.address?.addressLine || ""}</p>
                            <p className="text-xs text-text-muted leading-relaxed">
                              {order.address ? `${order.address.city || ""}, ${order.address.state || ""} ${order.address.postalCode || ""}` : ""}
                            </p>
                            <p className="addr-phone text-[10px] text-text-muted mt-2 border-t border-border pt-1.5">
                              Phone: {order.address?.phone || "N/A"}
                            </p>
                          </div>

                          <div className="info-card bg-bg-secondary border border-border rounded-xl p-4">
                            <h4 className="text-xs font-extrabold text-text-primary mb-2.5">Order Invoice &amp; Receipt</h4>
                            <div className="payment-row flex justify-between text-xs py-1.5 border-b border-border">
                              <span>Payment Status:</span>
                              <span className={`pay-badge text-[9px] font-bold py-0.5 px-2 rounded-full ${order.payment ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300" : "bg-amber-100 text-amber-800"}`}>
                                {order.payment ? "PAID" : "PENDING"}
                              </span>
                            </div>
                            <div className="payment-row flex justify-between text-xs py-1.5 border-b border-border">
                              <span>Shipping Method:</span>
                              <span className="font-semibold text-text-muted">Standard Free Ground</span>
                            </div>
                            <div className="payment-row flex justify-between text-xs py-1.5 border-b-0">
                              <span>Promo Applied:</span>
                              <span className="font-semibold text-text-muted">{order.couponCode || "None"}</span>
                            </div>
                            {order.status === "Cancelled" && (
                              <div className="payment-row flex justify-between text-xs py-1.5 border-t border-border mt-1 text-red-500 font-medium">
                                <span>Refund Info:</span>
                                <span>3–5 business days</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
      </>
    )}

    {/* Order Cancellation Confirmation Modal */}
    <AnimatePresence>
      {cancelModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-bg-primary border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-text-primary">Cancel Order</h3>
                <p className="text-xs text-text-muted font-mono">
                  ID: #{cancelModal.order?.id?.substring(0, 10).toUpperCase()}
                </p>
              </div>
            </div>

            <p className="text-xs text-text-muted leading-relaxed">
              Are you sure you want to cancel this order? Once cancelled, reserved items will be safely restocked and cannot be undone.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary block">Reason for Cancellation</label>
              <select
                value={cancelModal.reason}
                onChange={(e) => setCancelModal(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full text-xs bg-bg-secondary border border-border rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-accent-pink"
              >
                <option value="Changed mind / Placed by mistake">Changed mind / Placed by mistake</option>
                <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                <option value="Delivery time is too long">Delivery time is too long</option>
                <option value="Incorrect shipping address or size">Incorrect shipping address or size</option>
                <option value="Decided to purchase different items">Decided to purchase different items</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                disabled={cancelModal.loading}
                onClick={() => setCancelModal({ isOpen: false, order: null, reason: "", loading: false })}
                className="px-4 py-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={cancelModal.loading}
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all shadow-md hover:shadow-red-500/25 flex items-center gap-1.5 disabled:opacity-50"
              >
                {cancelModal.loading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Yes, Cancel Order"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </main>
  );
};

export default Orders;
