import QRCode from 'qrcode';
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  Trash2, 
  Mail, 
  User, 
  ShieldAlert, 
  ShoppingBag, 
  Eye, 
  Calendar, 
  AlertTriangle, 
  HelpCircle, 
  Search, 
  ShoppingCart, 
  Download, 
  Plus, 
  AlertCircle,
  Copy,
  Check,
  Zap,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  QrCode,
  Smartphone,
  CheckCircle2,
  Truck
} from 'lucide-react';
import { adminApi } from '../../Utils/adminApi';
import { adminVerifyYoupiOrder, adminRefundYoupiOrder } from '../../features/checkout/services/youpiService';

export const AdminOrdersTab = ({ 
  orders = [], 
  products = [], 
  onRefreshOrders, 
  addToast,
  triggerConfirm,
  logAction
}) => {
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // "All" | "Pending" | "Processing" | "Shipped" | "Delivered"

  // YouPI Refund Modal & Verify States
  const [refundModalOrder, setRefundModalOrder] = useState(null);
  const [refundModalVpa, setRefundModalVpa] = useState("");
  const [refundUtrInput, setRefundUtrInput] = useState("");
  const [refundReasonInput, setRefundReasonInput] = useState("Customer requested cancellation");
  const [isRefunding, setIsRefunding] = useState(false);
  const [verifyingOrderId, setVerifyingOrderId] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [refundQrUrl, setRefundQrUrl] = useState("");

  const handleOpenRefundModal = (o) => {
    setRefundModalOrder(o);
    const initialVpa = (o.youpiCustomerVpa || o.customerVpa || "").trim();
    setRefundModalVpa(initialVpa);
    setRefundUtrInput("");
    setRefundReasonInput("Customer requested cancellation");
  };

  // Compute dynamic UPI URI for refunding customer
  const refundAmountNum = Number(refundModalOrder?.amount || 0);
  const activeRefundVpa = refundModalVpa.trim();
  // Clean P2P intent URI (without commercial tn parameter that causes bank limit filters)
  const refundUpiUri = (refundModalOrder && activeRefundVpa)
    ? `upi://pay?pa=${encodeURIComponent(activeRefundVpa)}&pn=${encodeURIComponent(refundModalOrder.userName || refundModalOrder.address?.fullName || "Customer")}&am=${encodeURIComponent(refundAmountNum.toFixed(2))}&cu=INR`
    : "";

  useEffect(() => {
    if (refundUpiUri) {
      QRCode.toDataURL(refundUpiUri, {
        width: 220,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' }
      })
        .then(url => setRefundQrUrl(url))
        .catch(() => setRefundQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(refundUpiUri)}`));
    } else {
      setRefundQrUrl("");
    }
  }, [refundUpiUri]);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addToast(`Copied: ${text}`, "success");
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleVerifyYoupi = async (orderId) => {
    setVerifyingOrderId(orderId);
    try {
      await adminVerifyYoupiOrder(orderId);
      addToast(`Order #${orderId} payment verified & marked Paid!`, "success");
      if (logAction) logAction(`Admin verified YouPI bank credit for order #${orderId}`);
      if (onRefreshOrders) onRefreshOrders();
    } catch (err) {
      console.error("Verification error:", err);
      addToast(err.message || "Failed to verify payment", "error");
    } finally {
      setVerifyingOrderId(null);
    }
  };

  const handleConfirmRefund = async () => {
    if (!refundModalOrder) return;
    const cleanUtr = refundUtrInput.trim() || `UPI_REF_${Date.now()}`;

    setIsRefunding(true);
    try {
      const orderTargetId = refundModalOrder._id || refundModalOrder.orderId;
      await adminRefundYoupiOrder(orderTargetId, cleanUtr, refundReasonInput, activeRefundVpa);
      addToast(`Refund of ₹${refundModalOrder.amount} completed! Money sent to ${activeRefundVpa || "Customer"} and confirmation emails dispatched.`, "success");
      if (logAction) logAction(`Processed UPI refund for order #${orderTargetId} (UTR: ${cleanUtr}, VPA: ${activeRefundVpa})`);
      setRefundModalOrder(null);
      setRefundUtrInput("");
      setRefundModalVpa("");
      if (onRefreshOrders) onRefreshOrders();
    } catch (err) {
      console.error("Refund error:", err);
      addToast(err.message || "Failed to record refund.", "error");
    } finally {
      setIsRefunding(false);
    }
  };

  // ── Real Excel (CSV) Orders Exporter ─────────────────────────────────────────
  const handleExportOrdersToExcel = () => {
    if (!orders || orders.length === 0) {
      addToast("No order records available to export.", "warning");
      return;
    }

    try {
      const headers = [
        "Order ID",
        "Order Date",
        "Customer Name",
        "Customer Email",
        "Customer Phone",
        "Shipping Address",
        "City",
        "State",
        "Pincode",
        "Total Items Count",
        "Purchased Items Breakdown",
        "Total Order Amount (INR)",
        "Payment Method",
        "Payment Status",
        "Fulfillment Status",
        "Razorpay Payment ID"
      ];

      const rows = orders.map((ord) => {
        const orderId = ord.orderId || ord._id;
        const dateStr = ord.date ? new Date(ord.date).toLocaleString("en-IN") : "N/A";
        const name = (ord.userName || ord.address?.fullName || "Valued Customer").replace(/"/g, '""');
        const email = ord.userEmail || ord.address?.email || "N/A";
        const phone = ord.address?.phone || "N/A";
        const address = (ord.address?.addressLine || ord.address?.street || "").replace(/"/g, '""');
        const city = ord.address?.city || "";
        const state = ord.address?.state || "";
        const pin = ord.address?.postalCode || ord.address?.pinCode || "";
        const itemsCount = Array.isArray(ord.items) ? ord.items.reduce((s, it) => s + (it.quantity || 1), 0) : 0;
        const itemsSummary = Array.isArray(ord.items)
          ? ord.items.map((it) => `${it.name || "Item"} (x${it.quantity || 1})`).join(" | ").replace(/"/g, '""')
          : "";
        const amount = Number(ord.amount) || 0;
        const payMethod = ord.paymentMethod || (ord.payment ? "Razorpay / Online" : "Cash on Delivery");
        const payStatus = ord.paymentStatus || (ord.payment ? "Paid" : "Pending");
        const orderStatus = ord.status || "Pending";
        const rzpId = ord.razorpayPaymentId || "N/A";

        return [
          `"${orderId}"`,
          `"${dateStr}"`,
          `"${name}"`,
          `"${email}"`,
          `"${phone}"`,
          `"${address}"`,
          `"${city}"`,
          `"${state}"`,
          `"${pin}"`,
          itemsCount,
          `"${itemsSummary}"`,
          amount,
          `"${payMethod}"`,
          `"${payStatus}"`,
          `"${orderStatus}"`,
          `"${rzpId}"`
        ].join(",");
      });

      const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `RamCart_Orders_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast(`Exported ${orders.length} order records to Excel (.csv) successfully!`, "success");
      if (logAction) logAction(`Exported ${orders.length} orders report to Excel`);
    } catch (err) {
      console.error("Order export error:", err);
      addToast("Failed to generate orders export file.", "error");
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await adminApi.updateOrderStatus(orderId, newStatus);
      addToast(`🎉 Order status updated to ${newStatus}`, "success");
      logAction(`Updated order ${orderId} shipping status to "${newStatus}"`);
      onRefreshOrders();
    } catch (err) {
      console.error(err);
      addToast(err.message || "Failed to update order status", "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDeleteOrder = (orderId) => {
    triggerConfirm({
      title: 'Delete Order Record?',
      message: `Are you sure you want to permanently delete order #${orderId}? This record will be removed.`,
      isDestructive: true,
      confirmText: 'Delete Order',
      onConfirm: async () => {
        try {
          await adminApi.deleteOrder(orderId);
          addToast('🎉 Order record deleted successfully!', 'success');
          logAction(`Deleted order record ${orderId}`);
          onRefreshOrders();
        } catch (err) {
          console.error(err);
          addToast(err.message || 'Failed to delete order record', 'error');
        }
      }
    });
  };

  // 1. Dynamic Stepper Counts from database (Fully Safe wrapper)
  const pipelineStats = useMemo(() => {
    let pending = 0;
    let processing = 0;
    let shipped = 0;
    let delivered = 0;
    let cancelled = 0;

    if (Array.isArray(orders)) {
      orders.forEach((o) => {
        if (!o) return;
        const status = o.status || 'Pending';
        if (status === 'Pending') pending++;
        else if (status === 'Processing') processing++;
        else if (status === 'Shipped') shipped++;
        else if (status === 'Delivered') delivered++;
        else if (status === 'Cancelled') cancelled++;
      });
    }

    return { pending, processing, shipped, delivered, cancelled };
  }, [orders]);

  // 2. Anomaly Alert detection (e.g. orders pending/processing for more than 48 hours)
  const delayedOrders = useMemo(() => {
    const threshold = 48 * 60 * 60 * 1000; // 48 hours
    const now = Date.now();
    
    if (!Array.isArray(orders)) return [];
    
    return orders.filter(o => {
      if (!o) return false;
      const isPending = o.status === 'Pending' || o.status === 'Processing';
      const isOld = o.date ? (now - new Date(o.date).getTime()) > threshold : false;
      return isPending && isOld;
    });
  }, [orders]);

  // 3. Filter orders based on status & search
  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    
    return orders.filter((o) => {
      if (!o) return false;
      const idStr = String(o._id || o.id || '').toLowerCase();
      const nameStr = String(o.userName || o.address?.fullName || '').toLowerCase();
      const emailStr = String(o.userEmail || o.address?.email || '').toLowerCase();
      
      const searchMatch = idStr.includes(searchQuery.toLowerCase()) || 
                          nameStr.includes(searchQuery.toLowerCase()) || 
                          emailStr.includes(searchQuery.toLowerCase());
      
      let statusMatch = true;
      if (statusFilter !== 'All') {
        const orderStatus = o.status || 'Pending';
        if (statusFilter === 'Pending') statusMatch = orderStatus === 'Pending';
        else if (statusFilter === 'Processing') statusMatch = orderStatus === 'Processing';
        else if (statusFilter === 'Shipped') statusMatch = orderStatus === 'Shipped' || orderStatus === 'Delivered';
        else if (statusFilter === 'Cancelled') statusMatch = orderStatus === 'Cancelled';
      }

      return searchMatch && statusMatch;
    });
  }, [orders, searchQuery, statusFilter]);

  // Helper to format date safely without throwing RangeError
  const formatOrderDate = (dateVal) => {
    if (!dateVal) return 'N/A';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full text-[#0f0e17] dark:text-[#fffffe]">
      {/* Title Header Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#0f0e17] dark:text-[#fffffe]">
            Order Tracking &amp; Management
          </h2>
          <p className="text-xs text-[#717388] mt-0.5">
            Monitor, process, and manage active customer orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={handleExportOrdersToExcel}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#e2e4ed] dark:border-white/10 hover:bg-[#eff0f6] dark:hover:bg-white/5 text-[#2e2f3e] dark:text-[#a7a9be] text-xs font-bold rounded-xl transition-all cursor-pointer bg-[#ffffff] dark:bg-[#171622]"
          >
            <Download size={14} />
            <span>Export</span>
          </button>
          <button 
            type="button"
            onClick={() => addToast("Manual order generation mode", "info")}
            className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs border-none"
          >
            <Plus size={14} />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* Action Required: Delayed Shipments Banner */}
      {delayedOrders.length > 0 && (
        <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl p-4 flex items-start gap-3 shadow-xs">
          <AlertCircle className="text-zinc-900 dark:text-zinc-100 shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <h3 className="text-xs font-black uppercase tracking-wider">Action Required: Delayed Shipments</h3>
            <p className="text-xs mt-0.5 font-semibold text-zinc-600 dark:text-zinc-400">
              {delayedOrders.length} orders are currently delayed beyond the 48h SLA window. Please review and notify customers.
            </p>
          </div>
          <button 
            onClick={() => { setStatusFilter("Pending"); setSearchQuery(""); }}
            className="text-xs font-black text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer bg-transparent border-none p-0"
          >
            View Delayed ({delayedOrders.length})
          </button>
        </div>
      )}

      {/* Stepper and Performance Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Fulfillment Pipeline */}
        <div className="lg:col-span-3 bg-[#ffffff] dark:bg-[#171622] rounded-2xl border border-[#e2e4ed]/40 dark:border-white/10 p-5 shadow-sm transition-colors duration-200">
          <h3 className="text-xs font-black text-[#0f0e17] dark:text-[#fffffe] uppercase tracking-wider mb-4">
            Active Fulfillment Pipeline
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
            {/* Step 1: Ordered */}
            <div className="flex flex-col items-center text-center p-3 bg-[#eff0f6]/30 dark:bg-white/5 rounded-2xl border border-[#e2e4ed]/20 dark:border-white/5">
              <div className="w-10 h-10 rounded-full bg-[#eff0f6] text-[#ff8906] flex items-center justify-center font-black mb-2 shadow-sm">
                <ShoppingBag size={18} />
              </div>
              <p className="text-xs font-bold text-[#0f0e17] dark:text-[#fffffe]">Ordered</p>
              <p className="text-[10px] text-[#717388] font-bold mt-0.5">{pipelineStats.pending} pending</p>
            </div>

            {/* Step 2: Packed */}
            <div className="flex flex-col items-center text-center p-3 bg-[#eff0f6]/30 dark:bg-white/5 rounded-2xl border border-[#e2e4ed]/20 dark:border-white/5">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/20 text-amber-600 flex items-center justify-center font-black mb-2 shadow-sm">
                <Loader2 size={18} className="animate-spin" />
              </div>
              <p className="text-xs font-bold text-[#0f0e17] dark:text-[#fffffe]">Packed</p>
              <p className="text-[10px] text-[#717388] font-bold mt-0.5">{pipelineStats.processing} ready</p>
            </div>

            {/* Step 3: Shipped */}
            <div className="flex flex-col items-center text-center p-3 bg-[#eff0f6]/30 dark:bg-white/5 rounded-2xl border border-[#e2e4ed]/20 dark:border-white/5">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/20 text-blue-600 flex items-center justify-center font-black mb-2 shadow-sm">
                <Calendar size={18} />
              </div>
              <p className="text-xs font-bold text-[#0f0e17] dark:text-[#fffffe]">Shipped</p>
              <p className="text-[10px] text-[#717388] font-bold mt-0.5">{pipelineStats.shipped} in transit</p>
            </div>

            {/* Step 4: Delivering */}
            <div className="flex flex-col items-center text-center p-3 bg-[#eff0f6]/30 dark:bg-white/5 rounded-2xl border border-[#e2e4ed]/20 dark:border-white/5">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center font-black mb-2 shadow-sm">
                <ShoppingCart size={18} />
              </div>
              <p className="text-xs font-bold text-[#0f0e17] dark:text-[#fffffe]">Delivering</p>
              <p className="text-[10px] text-[#717388] font-bold mt-0.5">{pipelineStats.delivered} today</p>
            </div>
          </div>
        </div>

        {/* Today's Performance Card */}
        <div className="bg-[#ffffff] dark:bg-[#171622] rounded-2xl border border-[#e2e4ed]/40 dark:border-white/10 p-5 shadow-sm transition-colors duration-200 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-[#0f0e17] dark:text-[#fffffe] uppercase tracking-wider mb-1">
              Store Performance
            </h3>
            <p className="text-[11px] text-[#717388] font-semibold leading-relaxed">
              Order processing and fulfillment summary.
            </p>
          </div>
          <div className="mt-4">
            <span className="text-[9px] font-black text-[#717388] uppercase tracking-wider">
              Total Recorded Orders
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{orders.length}</span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                Active Store
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Filter strip & search */}
      <div className="bg-[#ffffff] dark:bg-[#171622] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col transition-colors duration-200">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-50 dark:bg-zinc-900/40">
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1.5 sm:pb-0">
            {["All", "Pending", "Processing", "Shipped", "Cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                  statusFilter === status 
                    ? "bg-black text-white dark:bg-white dark:text-black border-transparent shadow-xs" 
                    : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                }`}
              >
                {status === "All" ? "All Orders" : `${status} Orders`}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search ID, Name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium outline-none focus:border-black dark:focus:border-white"
            />
          </div>
        </div>

        {/* High Density Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#eff0f6] dark:bg-[#212030] text-xs font-bold text-[#2e2f3e] dark:text-[#a7a9be] border-b border-[#e2e4ed]/40 dark:border-white/10 uppercase tracking-wider">
                <th className="p-4 w-32">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4 w-40">Date</th>
                <th className="p-4 w-32 text-right">Amount</th>
                <th className="p-4 w-32">Payment</th>
                <th className="p-4 w-44">Status</th>
                <th className="p-4 w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredOrders.map((o) => {
                const isExpanded = expandedOrderId === o._id;
                const orderDateString = formatOrderDate(o.date);
                
                // Anomaly alert triggers
                const threshold = 48 * 60 * 60 * 1000;
                const isDelayedRow = o.date ? ((Date.now() - new Date(o.date).getTime()) > threshold && (o.status === 'Pending' || o.status === 'Processing')) : false;

                const rowBg = isExpanded 
                  ? "bg-[#eff0f6]/5" 
                  : isDelayedRow 
                    ? "bg-red-500/5" 
                    : "";

                return (
                  <React.Fragment key={o._id}>
                    <tr 
                      onClick={() => setExpandedOrderId(isExpanded ? null : o._id)}
                      className={`cursor-pointer transition-colors duration-150 hover:bg-[#eff0f6]/30 dark:hover:bg-[#212030]/30 ${rowBg}`}
                    >
                      {/* Order ID */}
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full bg-black dark:bg-white ${isDelayedRow ? 'animate-ping' : ''}`}></span>
                          <span className="text-xs font-bold font-mono text-[#0f0e17] dark:text-[#fffffe]">
                            {o.orderId || (o._id ? `#RC-${o._id.slice(-6).toUpperCase()}` : 'N/A')}
                          </span>
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td className="p-4 align-middle">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[#0f0e17] dark:text-[#fffffe]">
                            {o.userName || o.address?.fullName || (o.userId ? `User #${o.userId.slice(-6)}` : "Customer")}
                          </span>
                          <span className="text-[10px] text-[#717388] font-semibold">
                            {o.userEmail || o.address?.email || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-4 align-middle text-xs font-medium text-[#2e2f3e] dark:text-[#a7a9be] whitespace-nowrap">
                        {orderDateString}
                      </td>

                      {/* Amount */}
                      <td className="p-4 align-middle font-bold text-right text-xs text-[#0f0e17] dark:text-[#fffffe]">
                        ₹{Number(o.amount || 0).toFixed(2)}
                      </td>

                      {/* Payment Status badge */}
                      <td className="p-4 align-middle">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            o.payment 
                              ? "bg-emerald-50 dark:bg-emerald-950/20 text-[#388E3C] border-emerald-100 dark:border-emerald-800" 
                              : "bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-100 dark:border-amber-800"
                          }`}>
                            {o.payment ? "Paid" : "Pending"}
                          </span>

                          {o.paymentMethod === "YouPI" || o.youpiUtr ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              <Zap size={10} /> YouPI UPI
                            </span>
                          ) : (
                            <span className="text-[9px] text-[#717388] font-medium">
                              {o.paymentMethod || "Standard"}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Fulfillment Status badge */}
                      <td className="p-4 align-middle">
                        <div className="flex flex-col gap-0.5">
                          <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${
                            o.status === "Delivered"
                              ? "bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100 border-emerald-500" 
                              : o.status === "Shipped"
                                ? "bg-purple-100 text-purple-950 dark:bg-purple-950 dark:text-purple-100 border-purple-500"
                                : o.status === "Processing"
                                  ? "bg-blue-100 text-blue-950 dark:bg-blue-950 dark:text-blue-100 border-blue-500"
                                  : o.status === "Cancelled"
                                    ? "bg-red-100 text-red-950 dark:bg-red-950 dark:text-red-100 border-red-500"
                                    : "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100 border-amber-500"
                          }`}>
                            {o.status || "Ordered"}
                          </span>
                          {o.status === "Cancelled" && (
                            <span className="text-[9px] text-red-600 dark:text-red-400 font-bold tracking-tight">
                              Refund in progress
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td onClick={(e) => e.stopPropagation()} className="p-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedOrderId(isExpanded ? null : o._id)}
                            className="p-1.5 rounded-lg bg-[#eff0f6] hover:bg-[#e2e4ed] dark:bg-white/5 dark:hover:bg-white/10 text-[#717388] dark:text-[#7C6FAA] cursor-pointer border-none"
                            title="View Order Details"
                          >
                            <Eye size={12} />
                          </button>

                          {o.status === "Cancelled" ? (
                            <span 
                              className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-black bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 whitespace-nowrap"
                              title="Order is cancelled. Refund process is active (3-5 business days). Status cannot be altered."
                            >
                              Refund Process Initiated
                            </span>
                          ) : (
                            <select
                              value={o.status}
                              disabled={o.status === "Delivered" || updatingOrderId === o._id}
                              onChange={(e) => handleUpdateStatus(o._id, e.target.value)}
                              className="h-8 px-2 rounded-lg border border-[#e2e4ed] dark:border-white/10 bg-[#ffffff] dark:bg-[#212030] text-[10px] font-bold outline-none cursor-pointer text-[#0f0e17] dark:text-[#fffffe]"
                            >
                              <option value="Pending">Ordered</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                          )}

                          {updatingOrderId === o._id ? (
                            <Loader2 size={12} className="animate-spin text-black dark:text-white" />
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(o._id)}
                              title="Delete Order Record"
                              className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 cursor-pointer border-none"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable address detail & itemized card drawer */}
                    {isExpanded && (
                      <tr className="bg-gray-50/50 dark:bg-[#212030]/20">
                        <td colSpan="7" className="p-5">
                          <div className="bg-[#ffffff] dark:bg-[#171622] border border-[#e2e4ed]/30 dark:border-white/10 rounded-2xl p-4 shadow-sm animate-slide-down flex flex-col gap-4">
                            {o.status === "Cancelled" && (
                              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
                                <div>
                                  <span className="font-extrabold">🛑 Order Cancelled:</span> Customer refund process is active (typically 3–5 business days to original payment method).
                                  {o.cancellationReason && (
                                    <div className="text-[11px] mt-1 text-red-600 dark:text-red-400 font-semibold">
                                      Cancellation Reason: {o.cancellationReason}
                                    </div>
                                  )}
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 uppercase">
                                  Status Locked
                                </span>
                              </div>
                            )}
                            <div className="flex flex-col md:flex-row gap-5">
                            
                            {/* Shipping address details */}
                            <div className="flex-1">
                              <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-2.5">📍 Shipping Destination</h4>
                              <div className="p-3.5 border border-[#e2e4ed]/20 dark:border-white/5 bg-[#eff0f6] dark:bg-[#212030]/40 rounded-xl text-xs space-y-1.5 text-[#2e2f3e] dark:text-[#a7a9be]">
                                <p><strong className="text-[#2e2f3e] dark:text-[#a7a9be] dark:text-white font-bold">Email:</strong> {o.userEmail || o.address?.email || o.email || "Registered Email"}</p>
                                <p><strong className="text-[#2e2f3e] dark:text-[#a7a9be] dark:text-white font-bold">Contact:</strong> {o.address?.fullName || o.userName || "Customer"}</p>
                                <p><strong className="text-[#2e2f3e] dark:text-[#a7a9be] dark:text-white font-bold">Street:</strong> {o.address?.addressLine}</p>
                                <p><strong className="text-[#2e2f3e] dark:text-[#a7a9be] dark:text-white font-bold">City / Zip:</strong> {o.address?.city}, {o.address?.state} - {o.address?.postalCode}</p>
                                <p><strong className="text-[#2e2f3e] dark:text-[#a7a9be] dark:text-white font-bold">Phone:</strong> {o.address?.phone}</p>
                              </div>
                            </div>

                            {/* Itemized purchased list */}
                            <div className="flex-1">
                              <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-2.5">📦 Purchased Items</h4>
                              <div className="flex flex-col gap-2">
                                {(o.items || []).map((item, idx) => {
                                  const prodDetails = products.find(p => p.id === item.productId);
                                  return (
                                    <div key={idx} className="p-2.5 border border-gray-100 dark:border-white/5 bg-[#eff0f6] dark:bg-[#212030]/40 rounded-xl flex items-center justify-between gap-3 text-xs">
                                      <div className="flex items-center gap-3">
                                        <img 
                                          src={prodDetails?.image || item.image || ""} 
                                          alt={item.name} 
                                          className="w-9 h-11 object-cover rounded border border-gray-200 dark:border-white/5"
                                          onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling && (e.target.nextElementSibling.style.display = 'flex'); }}
                                        />
                                        <div className="hidden w-9 h-11 rounded border border-gray-200 bg-[#ffffff] font-bold items-center justify-center">
                                          {item.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                          <span className="font-bold text-[#0f0e17] dark:text-[#fffffe] dark:text-white truncate w-36">{item.name}</span>
                                          <span className="text-[10px] text-[#717388] mt-0.5">Size: {item.size || "M"} &bull; Color: {item.color || "Standard"} &bull; Qty: {item.quantity}</span>
                                        </div>
                                      </div>
                                      <span className="font-bold text-[#0f0e17] dark:text-[#fffffe] dark:text-white">₹{Number(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* YouPI Payment & Refund Management */}
                          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-600 text-white flex items-center gap-1">
                                  <Zap size={10} /> YouPI Direct UPI
                                </span>
                                {o.payment ? (
                                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <ShieldCheck size={14} /> Paid &amp; Credited to Bank
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                    Awaiting Credit Confirmation
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-zinc-700 dark:text-zinc-300 flex flex-wrap gap-x-4 gap-y-1 pt-1 font-mono">
                                {o.youpiUtr && (
                                  <span>
                                    <strong>Payment UTR:</strong> {o.youpiUtr}{" "}
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(o.youpiUtr, `utr-${o._id}`)}
                                      className="text-emerald-600 hover:text-emerald-500 font-sans cursor-pointer underline text-[10px] ml-1"
                                    >
                                      {copiedKey === `utr-${o._id}` ? "Copied!" : "Copy"}
                                    </button>
                                  </span>
                                )}
                                {o.youpiCustomerVpa && (
                                  <span>
                                    <strong>Customer UPI ID:</strong> {o.youpiCustomerVpa}{" "}
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(o.youpiCustomerVpa, `vpa-${o._id}`)}
                                      className="text-emerald-600 hover:text-emerald-500 font-sans cursor-pointer underline text-[10px] ml-1"
                                    >
                                      {copiedKey === `vpa-${o._id}` ? "Copied!" : "Copy"}
                                    </button>
                                  </span>
                                )}
                                {o.youpiRefundUtr && (
                                  <span className="text-purple-600 dark:text-purple-400 font-bold">
                                    <strong>Refund UTR:</strong> {o.youpiRefundUtr}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {!o.payment && (
                                <button
                                  type="button"
                                  disabled={verifyingOrderId === (o._id || o.orderId)}
                                  onClick={() => handleVerifyYoupi(o._id || o.orderId)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                                >
                                  {verifyingOrderId === (o._id || o.orderId) ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <Check size={12} />
                                  )}
                                  Verify Bank Credit
                                </button>
                              )}

                              {o.status === "Cancelled" && (
                                (o.youpiRefundUtr || o.paymentStatus === "Refunded") ? (
                                  <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 text-xs font-extrabold flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-800">
                                    <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                                    <span>UPI Refund Complete ({o.youpiRefundUtr || "Paid"})</span>
                                  </span>
                                ) : (o.paymentMethod === "COD" || !o.payment) ? (
                                  <span className="px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700">
                                    <Truck size={13} />
                                    <span>COD Cancelled (No Refund Needed)</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRefundModal(o)}
                                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer"
                                  >
                                    <RotateCcw size={12} /> Issue UPI Refund (₹{Number(o.amount || 0).toFixed(2)})
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-sm font-medium text-[#717388]">
                    No customer orders found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Interactive UPI Refund Modal (Real Money Transfer to Customer) ── */}
      {refundModalOrder && (() => {
        const cleanPhone = String(refundModalOrder.address?.phone || "").replace(/\D/g, "").slice(-10);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in overflow-y-auto">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                    <RotateCcw size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                      Issue UPI Refund (Transfer Money to Customer)
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      Order #{refundModalOrder.orderId || refundModalOrder._id?.slice(-8)} &bull; ₹{refundAmountNum.toFixed(2)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRefundModalOrder(null)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xl font-bold p-1 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Order Info & Destination Summary */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-[11px]">Customer:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {refundModalOrder.userName || refundModalOrder.address?.fullName || "Customer"} ({refundModalOrder.address?.phone || "N/A"})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-[11px]">Refund Amount:</span>
                  <span className="text-base font-black text-rose-600 dark:text-rose-400">
                    ₹{refundAmountNum.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Step 1: Customer UPI Destination (Editable) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Step 1: Customer Destination UPI ID (VPA) <span className="text-rose-500">*</span>
                  </label>
                  {activeRefundVpa && (
                    <button
                      type="button"
                      onClick={() => handleCopy(activeRefundVpa, "modal-vpa")}
                      className="text-[10px] text-emerald-600 font-bold hover:underline cursor-pointer"
                    >
                      {copiedKey === "modal-vpa" ? "Copied!" : "Copy VPA"}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. customer@okhdfcbank or 9876543210@paytm"
                  value={refundModalVpa}
                  onChange={(e) => setRefundModalVpa(e.target.value.trim().toLowerCase())}
                  className="w-full h-10 px-3 text-xs font-mono font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-rose-500 transition-colors"
                />
                
                {/* Phone-based quick fill suggestions */}
                {cleanPhone.length === 10 && (
                  <div className="pt-1">
                    <span className="text-[10px] text-zinc-400 block mb-1">Quick Fill using Customer Phone ({cleanPhone}):</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRefundModalVpa(`${cleanPhone}@okhdfcbank`)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-mono font-bold cursor-pointer"
                      >
                        GPay (@okhdfcbank)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRefundModalVpa(`${cleanPhone}@ybl`)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 font-mono font-bold cursor-pointer"
                      >
                        PhonePe (@ybl)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRefundModalVpa(`${cleanPhone}@paytm`)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 font-mono font-bold cursor-pointer"
                      >
                        Paytm (@paytm)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRefundModalVpa(`${cleanPhone}@apl`)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-mono font-bold cursor-pointer"
                      >
                        Amazon Pay (@apl)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: 100% Guaranteed Bank Transfer Method (Zero Limit Block) */}
              <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-amber-800 dark:text-amber-200">
                  <ShieldCheck size={16} className="text-amber-600" />
                  <span>Step 2: Transfer ₹{refundAmountNum.toFixed(2)} to Customer (Guaranteed 100% Success)</span>
                </div>

                <div className="text-[11px] text-amber-900/90 dark:text-amber-200/90 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800 leading-relaxed">
                  ⚠️ <strong>Why direct links show "Exceeded limit" / "Suspended":</strong><br/>
                  NPCI and Banks (Google Pay / PhonePe) automatically block external website links to personal UPI accounts.
                  <strong>To pay without any bank limit or blocking:</strong>
                </div>

                {/* 2 Big Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={!activeRefundVpa}
                    onClick={() => handleCopy(activeRefundVpa, "modal-vpa-btn")}
                    className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex flex-col items-center justify-center gap-1 shadow-md cursor-pointer transition-transform active:scale-95 disabled:opacity-40"
                  >
                    <span className="flex items-center gap-1.5 text-xs">
                      <Copy size={14} />
                      {copiedKey === "modal-vpa-btn" ? "✅ Copied UPI ID!" : "1. Copy Customer UPI ID"}
                    </span>
                    <span className="font-mono text-[10px] opacity-90 truncate max-w-full">
                      {activeRefundVpa || "Enter UPI ID above"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy(String(refundAmountNum.toFixed(2)), "modal-amt-btn")}
                    className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs flex flex-col items-center justify-center gap-1 shadow-md cursor-pointer transition-transform active:scale-95"
                  >
                    <span className="flex items-center gap-1.5 text-xs">
                      <Copy size={14} />
                      {copiedKey === "modal-amt-btn" ? "✅ Copied Amount!" : "2. Copy Amount"}
                    </span>
                    <span className="font-mono text-xs text-amber-300 font-bold">
                      ₹{refundAmountNum.toFixed(2)}
                    </span>
                  </button>
                </div>

                <div className="bg-white/80 dark:bg-zinc-900/80 p-3 rounded-xl border border-amber-200/60 dark:border-amber-800/60 text-xs text-zinc-800 dark:text-zinc-200 space-y-1">
                  <p className="font-bold text-[11px] text-emerald-700 dark:text-emerald-400 m-0">
                    ⚡ 3-Step Guaranteed Payment in Google Pay / PhonePe:
                  </p>
                  <ol className="list-decimal pl-4 text-[11px] space-y-1 m-0 pt-1">
                    <li>Tap <strong>Copy Customer UPI ID</strong> above.</li>
                    <li>Open <strong>Google Pay</strong> or <strong>PhonePe</strong> &rarr; Tap <strong>"Pay UPI ID or number"</strong> &rarr; Paste &amp; Send <strong>₹{refundAmountNum.toFixed(2)}</strong>.</li>
                    <li>Enter your UPI PIN &bull; The money is transferred immediately from your bank account to the customer!</li>
                  </ol>
                </div>

                {/* Optional App Launch / QR code */}
                {activeRefundVpa && (
                  <details className="pt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                    <summary className="cursor-pointer font-bold text-zinc-700 dark:text-zinc-300 hover:underline">
                      Optional: Or scan QR code / open app directly &darr;
                    </summary>
                    <div className="flex flex-col items-center justify-center p-3 mt-2 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2">
                      {refundQrUrl && (
                        <img 
                          src={refundQrUrl} 
                          alt="Scan to Refund via UPI" 
                          className="w-36 h-36 object-contain block"
                        />
                      )}
                      <a
                        href={refundUpiUri}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 text-center"
                      >
                        <ExternalLink size={13} /> Open UPI App Directly
                      </a>
                      <span className="text-[10px] text-zinc-400">
                        (Note: If your bank app says "Bank limit reached", please use the 1-Tap Copy method above).
                      </span>
                    </div>
                  </details>
                )}
              </div>

              {/* Step 3: Confirmation & Closing Ticket */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Bank Refund Ref / UTR <span className="text-zinc-400 font-normal">(Optional &bull; Generated from debited bank screen)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 512345678901 (Leave blank to auto-generate)"
                    value={refundUtrInput}
                    onChange={(e) => setRefundUtrInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setRefundModalOrder(null)}
                    className="px-4 py-2 text-xs font-bold rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isRefunding || !activeRefundVpa}
                    onClick={handleConfirmRefund}
                    className="px-5 py-2.5 text-xs font-extrabold rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {isRefunding ? (
                      <>
                        <Loader2 size={13} className="animate-spin" /> Finalizing Refund...
                      </>
                    ) : (
                      <>
                        <Check size={14} /> Money Sent &bull; Confirm &amp; Close Conversation
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};
export default AdminOrdersTab;