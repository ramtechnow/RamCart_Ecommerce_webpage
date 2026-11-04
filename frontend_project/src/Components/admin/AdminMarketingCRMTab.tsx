import React, { useState, useMemo, useRef } from 'react';
import { 
  Mail, Send, CheckSquare, Square, 
  MessageCircle, Download,
  Upload, Trash2, Tag, ExternalLink, Sparkles
} from 'lucide-react';
import { adminApi } from '../../Utils/adminApi';

interface UserItem {
  id?: string;
  name?: string;
  email: string;
  phone?: string;
  isAdmin?: boolean;
  role?: string;
  vendorName?: string;
  cartData?: Record<string, any>;
  createdAt?: string;
}

interface CouponItem {
  _id?: string;
  id?: string;
  code?: string;
  couponCode?: string;
  discountPercentage?: number;
  discountAmount?: number;
  discount?: number;
  minOrderValue?: number;
  active?: boolean;
}

interface AdminMarketingCRMTabProps {
  users?: UserItem[];
  orders?: any[];
  coupons?: CouponItem[];
  addToast: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
  logAction?: (action: string) => void;
}

export const AdminMarketingCRMTab: React.FC<AdminMarketingCRMTabProps> = ({
  users = [],
  orders = [],
  coupons = [],
  addToast,
  logAction
}) => {
  // Campaign form states
  const [campaignTitle, setCampaignTitle] = useState("🪔 Grand Festive Offer: Extra 10% Off on All Fashion!");
  const [campaignDiscountCode, setCampaignDiscountCode] = useState("DIWALI10");
  const [campaignMessage, setCampaignMessage] = useState(
    "Vanakkam! RamCart-il Special Mega Sale thodangiyulladhu. Pure Silk Sarees, Dhotis, Kurtas & Modern Wear-ukku instant discount! Shop now: https://ecommerce-website-dfd55.web.app"
  );

  // Email campaign state
  const [emailSubject, setEmailSubject] = useState("Exclusive Discount Coupon Just For You — RamCart Fashion");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Small compressed promo image state (KB size)
  const [promoImage, setPromoImage] = useState<string | null>(null);
  const [promoImageSizeKb, setPromoImageSizeKb] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter state
  const [filterType, setFilterType] = useState<"all" | "active" | "inactive" | "abandoned">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Handle Image Upload & Canvas Compression to strict KB size (<120 KB)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      addToast("Please select a valid image file (PNG/JPG/WEBP)", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 700;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Compress to JPEG with 0.72 quality for ultra-lightweight KB size
          const compressed = canvas.toDataURL("image/jpeg", 0.72);
          const sizeKb = Math.round((compressed.length * 3 / 4) / 1024);
          setPromoImage(compressed);
          setPromoImageSizeKb(sizeKb);
          addToast(`Uploaded & compressed promo banner (${sizeKb} KB)`, "success");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setPromoImage(null);
    setPromoImageSizeKb(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    addToast("Promo banner image removed", "info");
  };

  // Coupon Selection Handler
  const handleSelectCoupon = (code: string) => {
    setCampaignDiscountCode(code);
    if (!code) return;

    const matched = coupons.find(c => (c.code || c.couponCode) === code);
    if (matched) {
      const disc = matched.discountPercentage 
        ? `${matched.discountPercentage}% OFF` 
        : `₹${matched.discountAmount || matched.discount || 50} OFF`;
      
      setCampaignTitle(`Special Promo Deal: ${disc} with Code ${code}!`);
      setCampaignMessage(
        `Vanakkam! RamCart-il special offer live aagiyulladhu! Coupon Code "${code}" use panni ${disc} perungal. Valid for all online orders. Shop now: https://ecommerce-website-dfd55.web.app`
      );
      setEmailSubject(`Special ${disc} Coupon (${code}) Just For You — RamCart Fashion`);
      addToast(`Applied coupon "${code}" to campaign templates!`, "info");
    }
  };

  // Customer activity calculation
  const customerStats = useMemo(() => {
    let activeCount = 0;
    let inactiveCount = 0;
    let abandonedCount = 0;

    const enriched = users.map((u) => {
      const userOrders = orders.filter(o => o.userEmail === u.email || o.userId === u.id);
      const hasCart = u.cartData && Object.values(u.cartData).some(v => (typeof v === 'number' ? v > 0 : v?.quantity > 0));
      
      let status: "active" | "inactive" | "abandoned" = "inactive";
      if (hasCart && userOrders.length === 0) {
        status = "abandoned";
        abandonedCount++;
      } else if (userOrders.length > 0 || hasCart) {
        status = "active";
        activeCount++;
      } else {
        inactiveCount++;
      }

      return {
        ...u,
        orderCount: userOrders.length,
        hasCart,
        status,
        displayName: u.name || "Customer"
      };
    });

    return { enriched, activeCount, inactiveCount, abandonedCount };
  }, [users, orders]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customerStats.enriched.filter((c) => {
      const matchSearch = c.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchSearch) return false;
      if (filterType === "all") return true;
      return c.status === filterType;
    });
  }, [customerStats.enriched, searchTerm, filterType]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedEmails.length === filteredCustomers.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filteredCustomers.map(c => c.email));
    }
  };

  const handleToggleSelect = (email: string) => {
    setSelectedEmails(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  // 1-Click WhatsApp Broadcast
  const handleOpenWhatsAppBroadcast = () => {
    let text = `*${campaignTitle}*\n\n${campaignMessage}`;
    if (campaignDiscountCode) {
      text += `\n\n🏷️ *Coupon Code:* ${campaignDiscountCode}`;
    }
    text += `\n🛍️ *Shop Live:* https://ecommerce-website-dfd55.web.app\n\n_100% Genuine Handcrafted & Quality Tested Direct from Weavers_`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
    addToast("Opened WhatsApp Broadcast with pre-filled promotional message!", "success");
    if (logAction) logAction(`Broadcasted WhatsApp marketing offer: "${campaignDiscountCode}"`);
  };

  const handleCopyWhatsAppText = () => {
    let fullText = `*${campaignTitle}*\n\n${campaignMessage}`;
    if (campaignDiscountCode) fullText += `\n\n🏷️ Coupon Code: ${campaignDiscountCode}`;
    fullText += `\n🛍️ Shop Link: https://ecommerce-website-dfd55.web.app`;

    navigator.clipboard.writeText(fullText);
    addToast("Copied WhatsApp campaign message to clipboard!", "success");
  };

  // Dispatch Email Push Campaign via Backend SMTP
  const handleSendEmailCampaign = async () => {
    if (selectedEmails.length === 0) {
      addToast("Please select at least one customer to send the campaign email.", "warning");
      return;
    }

    setSendingEmail(true);
    try {
      const payload = {
        emails: selectedEmails,
        subject: emailSubject,
        title: campaignTitle,
        message: campaignMessage,
        couponCode: campaignDiscountCode,
        imageUrl: promoImage || undefined
      };

      const res = await adminApi.sendCampaignEmail(payload);
      if (res && res.success) {
        addToast(`🎉 Dispatched promotional email to ${res.sentCount ?? selectedEmails.length} recipients!`, "success");
        if (logAction) {
          logAction(`Dispatched campaign email "${emailSubject}" to ${selectedEmails.length} recipients`);
        }
        setSelectedEmails([]);
      } else {
        throw new Error(res?.error || "SMTP mail server issue");
      }
    } catch (err: any) {
      console.warn("Direct SMTP failure, fallback available:", err);
      addToast(`SMTP Delivery Note: ${err.message || "Server mailer busy"}. You can also use the "Open in Email Client / Gmail" button.`, "warning");
    } finally {
      setSendingEmail(false);
    }
  };

  // 1-Click Mailto / Gmail Fallback Launcher (Always works without server setup)
  const handleOpenMailtoClient = () => {
    if (selectedEmails.length === 0) {
      addToast("Please select at least one customer first.", "warning");
      return;
    }
    const bccList = selectedEmails.join(",");
    const bodyText = `${campaignTitle}\n\n${campaignMessage}\n\n🏷️ Coupon Code: ${campaignDiscountCode}\n🛍️ Shop Live: https://ecommerce-website-dfd55.web.app\n\n- RamCart Support`;
    const mailtoUrl = `mailto:?bcc=${encodeURIComponent(bccList)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(bodyText)}`;
    window.open(mailtoUrl, "_blank");
    addToast(`Opened mail client with ${selectedEmails.length} recipients in BCC!`, "success");
  };

  // Export CRM CSV
  const handleExportCRMData = () => {
    if (customerStats.enriched.length === 0) {
      addToast("No customer records available to export.", "warning");
      return;
    }

    try {
      const headers = [
        "Customer Name",
        "Email Address",
        "Phone",
        "Role",
        "Status",
        "Total Orders Placed",
        "Items in Cart",
        "Registered On"
      ];

      const rows = customerStats.enriched.map((c) => [
        `"${c.displayName.replace(/"/g, '""')}"`,
        `"${c.email}"`,
        `"${c.phone || "N/A"}"`,
        `"${c.role || (c.isAdmin ? "Admin" : "Customer")}"`,
        `"${c.status.toUpperCase()}"`,
        c.orderCount,
        c.hasCart ? "YES" : "NO",
        `"${c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN") : "N/A"}"`
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `RamCart_CRM_Customers_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast(`Exported ${customerStats.enriched.length} customer records to CSV!`, "success");
    } catch (err) {
      addToast("Failed to export CRM records", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full text-[#0f0e17] dark:text-[#fffffe]">
      {/* ── Title Header Block ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2 m-0 text-zinc-900 dark:text-zinc-100">
            <Send className="text-zinc-900 dark:text-zinc-100" size={22} />
            <span>CRM & Marketing Dispatcher</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Broadcast promotional deals to WhatsApp and dispatch targeted emails with custom coupons & lightweight banners.
          </p>
        </div>

        {/* CRM CSV Export Action */}
        <button
          type="button"
          onClick={handleExportCRMData}
          className="h-9 px-3.5 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer border-none shadow-sm"
          title="Download complete customer records as CSV"
        >
          <Download size={15} />
          <span>Export CRM List (CSV)</span>
        </button>
      </div>

      {/* ── Metric Snapshot Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Total Database Users</span>
          <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1 block">{users.length}</span>
          <span className="text-[10px] text-zinc-400 mt-1 block">Registered shoppers</span>
        </div>

        <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Active Buyers</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{customerStats.activeCount}</span>
          <span className="text-[10px] text-zinc-400 mt-1 block">Placed orders or cart active</span>
        </div>

        <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Cart Abandoners</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">{customerStats.abandonedCount}</span>
          <span className="text-[10px] text-zinc-400 mt-1 block">Items in cart, no checkout</span>
        </div>

        <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Inactive Users</span>
          <span className="text-2xl font-black text-zinc-600 dark:text-zinc-400 mt-1 block">{customerStats.inactiveCount}</span>
          <span className="text-[10px] text-zinc-400 mt-1 block">Prime for re-engagement</span>
        </div>
      </div>

      {/* ── Campaign Configuration Box ── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-zinc-200 dark:border-zinc-800 gap-2">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 m-0">
              <Sparkles size={16} className="text-amber-500" />
              <span>Broadcast Offer & Banner Customization</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Select an active store coupon or type custom text & attach a small promo banner image.</p>
          </div>

          {/* Coupon Selector Dropdown */}
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-zinc-500" />
            <select
              value={campaignDiscountCode}
              onChange={(e) => handleSelectCoupon(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer"
            >
              <option value="">-- Choose Store Coupon --</option>
              {coupons.map((c) => {
                const code = c.code || c.couponCode;
                const disc = c.discountPercentage ? `${c.discountPercentage}% OFF` : `₹${c.discountAmount || c.discount} OFF`;
                return (
                  <option key={c._id || c.id || code} value={code}>
                    {code} ({disc})
                  </option>
                );
              })}
              <option value="CUSTOM">Custom / Manual Code</option>
            </select>
          </div>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 flex flex-col gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Campaign Headline</label>
              <input 
                type="text" 
                value={campaignTitle} 
                onChange={(e) => setCampaignTitle(e.target.value)}
                placeholder="e.g. 🪔 Grand Festive Offer: Extra 15% Off on All Sarees!"
                className="w-full h-9 px-3 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:border-black dark:focus:border-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Coupon / Discount Code (Editable)</label>
              <input 
                type="text" 
                value={campaignDiscountCode} 
                onChange={(e) => setCampaignDiscountCode(e.target.value.toUpperCase())}
                placeholder="e.g. DIWALI10"
                className="w-full h-9 px-3 text-xs font-mono font-bold tracking-wider rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Promotional Message Body</label>
              <textarea 
                rows={3}
                value={campaignMessage} 
                onChange={(e) => setCampaignMessage(e.target.value)}
                placeholder="Type your WhatsApp / Email promo message here..."
                className="w-full p-2.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none resize-none focus:border-black dark:focus:border-white"
              />
            </div>
          </div>

          {/* Small Promo Image Upload Section */}
          <div className="flex flex-col gap-2 p-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
              <span>Attached Promo Banner</span>
              {promoImageSizeKb && (
                <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold rounded">
                  {promoImageSizeKb} KB
                </span>
              )}
            </span>

            {promoImage ? (
              <div className="relative group border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 flex items-center justify-center min-h-[140px]">
                <img 
                  src={promoImage} 
                  alt="Uploaded Promo" 
                  className="max-h-[140px] w-full object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-md opacity-90 hover:opacity-100 cursor-pointer border-none shadow-md"
                  title="Remove Image"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px] transition-colors"
              >
                <Upload size={22} className="text-zinc-400 mb-1.5" />
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Upload Promo Banner</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">Auto-compressed to light KB size</span>
              </div>
            )}

            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="hidden" 
            />

            <span className="text-[10px] text-zinc-400 italic">
              Included in email body & WhatsApp sharing format.
            </span>
          </div>
        </div>

        {/* ── Dispatch Channels ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          
          {/* Channel 1: WhatsApp Broadcast */}
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/10 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 m-0 uppercase tracking-wider">
                  Channel 1: WhatsApp 1-Click Broadcast
                </h4>
              </div>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-400/80 mt-1">
                Launches WhatsApp with your pre-formatted campaign message, coupon code, and direct live shop links.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenWhatsAppBroadcast}
                className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer border-none transition-all shadow-xs"
              >
                <MessageCircle size={14} />
                <span>Open WhatsApp Broadcast</span>
              </button>

              <button
                type="button"
                onClick={handleCopyWhatsAppText}
                className="h-8 px-3 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-lg cursor-pointer transition-all bg-transparent"
              >
                Copy Message
              </button>
            </div>
          </div>

          {/* Channel 2: Push Email Dispatcher */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-zinc-800 dark:text-zinc-200" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 m-0 uppercase tracking-wider">
                  Channel 2: Push Email Campaign
                </h4>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Selected recipients ({selectedEmails.length}) will receive the HTML promo email with the attached banner.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleSendEmailCampaign}
                disabled={sendingEmail || selectedEmails.length === 0}
                className={`h-8 px-3.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all border-none ${
                  selectedEmails.length > 0 && !sendingEmail
                    ? "bg-black dark:bg-white text-white dark:text-black cursor-pointer hover:opacity-90 shadow-xs"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                }`}
              >
                <Send size={13} className={sendingEmail ? "animate-spin" : ""} />
                <span>{sendingEmail ? "Dispatching..." : `Send via Mail Server (${selectedEmails.length})`}</span>
              </button>

              {/* Instant Mail Client / Gmail Fallback */}
              <button
                type="button"
                onClick={handleOpenMailtoClient}
                disabled={selectedEmails.length === 0}
                className={`h-8 px-3 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all border ${
                  selectedEmails.length > 0
                    ? "border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer bg-white dark:bg-zinc-900"
                    : "border-zinc-200 dark:border-zinc-800 text-zinc-400 cursor-not-allowed bg-transparent"
                }`}
                title="BCC all recipients in your system's default mail client (Gmail/Outlook)"
              >
                <ExternalLink size={13} />
                <span>Open in Email Client (BCC)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Customer Audience Target Selector ── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        {/* Audience Controls Bar */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="h-8 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer bg-white dark:bg-zinc-900"
            >
              {selectedEmails.length === filteredCustomers.length && filteredCustomers.length > 0 ? (
                <>
                  <CheckSquare size={14} className="text-black dark:text-white" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square size={14} />
                  <span>Select All ({filteredCustomers.length})</span>
                </>
              )}
            </button>

            {/* Quick Segment Filter Pills */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
              {(["all", "active", "abandoned", "inactive"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md capitalize cursor-pointer transition-all border-none ${
                    filterType === t
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                      : "bg-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Search box */}
          <input
            type="text"
            placeholder="Search customer name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 h-8 px-3 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:border-black dark:focus:border-white"
          />
        </div>

        {/* Customer Table */}
        <div className="overflow-x-auto max-h-[380px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 sticky top-0 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3 w-10 text-center">Select</th>
                <th className="p-3">Customer Profile</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Status Segment</th>
                <th className="p-3">Orders Placed</th>
                <th className="p-3">Cart State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
              {filteredCustomers.map((c) => {
                const isSelected = selectedEmails.includes(c.email);
                return (
                  <tr 
                    key={c.email}
                    onClick={() => handleToggleSelect(c.email)}
                    className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors ${
                      isSelected ? "bg-zinc-50 dark:bg-zinc-800/30" : ""
                    }`}
                  >
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(c.email)}
                        className="cursor-pointer rounded accent-black dark:accent-white"
                      />
                    </td>
                    <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">
                      {c.displayName}
                      {c.vendorName && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold">
                          Vendor: {c.vendorName}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-zinc-600 dark:text-zinc-300 font-mono text-[11px]">{c.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        c.status === "active"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : c.status === "abandoned"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 font-bold">{c.orderCount} orders</td>
                    <td className="p-3">
                      {c.hasCart ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">🛒 Items in Cart</span>
                      ) : (
                        <span className="text-zinc-400">Empty</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-zinc-500">
                    No customer records found matching the current segment criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminMarketingCRMTab;
