import React, { useState, useMemo } from 'react';
import { User, ShoppingCart, Shield, Trash2, ChevronDown, ChevronUp, UserCheck, AlertTriangle, Store, X } from 'lucide-react';
import { adminApi } from '../../Utils/adminApi';

export const AdminUsersTab = ({ 
  users = [], 
  products = [], 
  onRefreshUsers, 
  addToast, 
  triggerConfirm,
  logAction
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all"); // "all" | "admin" | "customer"
  const [cartFilter, setCartFilter] = useState("all"); // "all" | "active" | "empty"
  
  const [expandedUserEmail, setExpandedUserEmail] = useState(null);
  const [vendorModal, setVendorModal] = useState({
    isOpen: false,
    user: null,
    vendorName: "",
    vendorAddress: ""
  });

  const handleOpenVendorModal = (user) => {
    setVendorModal({
      isOpen: true,
      user,
      vendorName: user.vendorName || user.name || "",
      vendorAddress: user.vendorAddress || ""
    });
  };

  const handleSaveVendorPromotion = async () => {
    if (!vendorModal.vendorName.trim()) {
      addToast("Please enter an official Vendor / Business Name", "warning");
      return;
    }

    try {
      await adminApi.updateUserRole(
        vendorModal.user.email, 
        false, 
        'vendor', 
        vendorModal.vendorName.trim(),
        vendorModal.vendorAddress.trim()
      );
      // Instant local state update for 0ms latency in UI!
      if (vendorModal.user) {
        vendorModal.user.role = 'vendor';
        vendorModal.user.vendorName = vendorModal.vendorName.trim();
        vendorModal.user.vendorAddress = vendorModal.vendorAddress.trim();
        vendorModal.user.isAdmin = false;
      }
      addToast(`🎉 Successfully updated Vendor "${vendorModal.vendorName.trim()}"!`, "success");
      if (logAction) logAction(`Updated user ${vendorModal.user.email} to Vendor: "${vendorModal.vendorName.trim()}"`);
      setVendorModal({ isOpen: false, user: null, vendorName: "", vendorAddress: "" });
      if (onRefreshUsers) onRefreshUsers();
    } catch (err) {
      console.error(err);
      addToast(err.message || "Failed to promote to vendor", "error");
    }
  };

  const handleRevokeVendor = (user) => {
    triggerConfirm({
      title: "Revoke Vendor Privileges?",
      message: `Are you sure you want to revoke vendor privileges for "${user.name}" (${user.vendorName || user.email})? They will become a standard customer.`,
      confirmText: "Revoke Vendor",
      onConfirm: async () => {
        try {
          await adminApi.updateUserRole(user.email, false, 'customer', '', '');
          if (user) {
            user.role = 'customer';
            user.vendorName = '';
            user.vendorAddress = '';
          }
          addToast(`Revoked vendor rights for ${user.email}`, "success");
          if (logAction) logAction(`Revoked vendor rights for ${user.email}`);
          if (onRefreshUsers) onRefreshUsers();
        } catch (err) {
          console.error(err);
          addToast(err.message || "Failed to revoke vendor rights", "error");
        }
      }
    });
  };

  // Cart normalization helpers
  const getNormalizedCartItems = (cartData) => {
    if (!cartData || typeof cartData !== "object") return [];
    const normalized = [];
    Object.keys(cartData).forEach((key) => {
      const value = cartData[key];
      if (value === undefined || value === null) return;
      
      const parts = key.split("-");
      const keyId = Number(parts[0]);
      if (isNaN(keyId)) return;
      
      let size = parts[1] || "M";
      let color = parts[2] || "White";
      let quantity = 0;
      let id = keyId;

      if (typeof value === "object") {
        quantity = Number(value.quantity) || 0;
        if (value.id !== undefined) id = Number(value.id);
        if (value.size !== undefined) size = value.size;
        if (value.color !== undefined) color = value.color;
      } else {
        quantity = Number(value) || 0;
      }

      if (quantity > 0) {
        normalized.push({ id, size, color, quantity });
      }
    });
    return normalized;
  };

  const calculateCartItemsCount = (cartData) => {
    const items = getNormalizedCartItems(cartData);
    return items.reduce((acc, curr) => acc + curr.quantity, 0);
  };

  // Filter users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const nameMatch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        u.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      let roleMatch = true;
      if (roleFilter === 'admin') {
        roleMatch = u.isAdmin === true;
      } else if (roleFilter === 'vendor') {
        roleMatch = u.role === 'vendor';
      } else if (roleFilter === 'customer') {
        roleMatch = !u.isAdmin && u.role !== 'vendor';
      }

      let cartMatch = true;
      const cartCount = calculateCartItemsCount(u.cartData);
      if (cartFilter === 'active') {
        cartMatch = cartCount > 0;
      } else if (cartFilter === 'empty') {
        cartMatch = cartCount === 0;
      }

      return nameMatch && roleMatch && cartMatch;
    });
  }, [users, searchQuery, roleFilter, cartFilter]);

  const handleToggleRole = (user) => {
    const nextRole = !user.isAdmin;
    const confirmMsg = nextRole 
      ? `Are you sure you want to promote "${user.name}" (${user.email}) to an Administrative Manager?`
      : `Are you sure you want to revoke Administrative privileges for "${user.name}" (${user.email})?`;

    triggerConfirm({
      title: nextRole ? "Promote User to Admin?" : "Revoke Admin Privileges?",
      message: confirmMsg,
      confirmText: nextRole ? "Promote" : "Revoke Privileges",
      onConfirm: async () => {
        try {
          await adminApi.updateUserRole(user.email, nextRole);
          addToast(`Successfully updated user role for ${user.email}`, "success");
          logAction(`${nextRole ? 'Promoted' : 'Demoted'} user role: ${user.email}`);
          onRefreshUsers();
        } catch (err) {
          console.error(err);
          addToast(err.message || "Failed to update user role", "error");
        }
      }
    });
  };

  const handleToggleVendor = (user) => {
    const isCurrentlyVendor = user.role === 'vendor';
    const nextRole = isCurrentlyVendor ? 'customer' : 'vendor';
    triggerConfirm({
      title: isCurrentlyVendor ? "Revoke Vendor Privileges?" : "Designate as Store Vendor?",
      message: isCurrentlyVendor
        ? `Revoke vendor access for "${user.name}" (${user.email})? They will become a standard customer.`
        : `Designate "${user.name}" (${user.email}) as an Authorized Vendor? They will receive vendor rights to add their products, but cannot edit or delete store catalog items.`,
      confirmText: isCurrentlyVendor ? "Revoke Vendor" : "Authorize Vendor",
      onConfirm: async () => {
        try {
          await adminApi.updateUserRole(user.email, nextRole);
          addToast(`Updated vendor access for ${user.email}`, "success");
          if (logAction) logAction(`${isCurrentlyVendor ? 'Revoked vendor' : 'Authorized vendor'} role: ${user.email}`);
          onRefreshUsers();
        } catch (err) {
          console.error(err);
          addToast(err.message || "Failed to update vendor status", "error");
        }
      }
    });
  };

  const handleDeleteUser = (user) => {
    triggerConfirm({
      title: "Terminate User Account?",
      message: `⚠️ WARNING: Are you sure you want to permanently delete the account of "${user.name}" (${user.email})? This will delete their profile and cart data forever.`,
      isDestructive: true,
      confirmText: "Delete Account",
      onConfirm: async () => {
        try {
          await adminApi.deleteUser(user.email);
          addToast("🎉 Account successfully terminated!", "success");
          logAction(`Deleted user account: ${user.email}`);
          onRefreshUsers();
        } catch (err) {
          console.error(err);
          addToast(err.message || "Failed to delete user account", "error");
        }
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full text-[#0f0e17] dark:text-[#fffffe]">
      {/* Title Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">Users List</h2>
        <p className="text-sm text-[#717388] mt-0.5">Manage user accounts, roles, and impersonate baskets for support.</p>
      </div>

      {/* Filters Strip */}
      <div className="bg-[#ffffff] dark:bg-[#171622] rounded-2xl p-4 shadow-sm border border-[#e2e4ed]/40 dark:border-white/10 flex flex-wrap items-center gap-4 transition-colors duration-200">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input 
            type="text" 
            placeholder="Search users by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-black dark:focus:border-white outline-none text-xs"
          />
        </div>

        {/* Role Select */}
        <select 
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 px-3 pr-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer"
        >
          <option value="all">All Roles</option>
          <option value="admin">Super Admin</option>
          <option value="vendor">Store Vendors</option>
          <option value="customer">Standard Customer</option>
        </select>

        {/* Status Select */}
        <select 
          value={cartFilter}
          onChange={(e) => setCartFilter(e.target.value)}
          className="h-10 px-3 pr-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer"
        >
          <option value="all">All Cart Status</option>
          <option value="active">Active Cart</option>
          <option value="empty">Empty Cart</option>
        </select>

        {/* Clear */}
        {(searchQuery || roleFilter !== 'all' || cartFilter !== 'all') && (
          <button 
            type="button"
            onClick={() => { setSearchQuery(""); setRoleFilter("all"); setCartFilter("all"); }}
            className="text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer bg-transparent border-none p-0"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Users Card Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredUsers.map((u, idx) => {
          const isExpanded = expandedUserEmail === u.email;
          const normalizedItems = getNormalizedCartItems(u.cartData);
          const totalQty = calculateCartItemsCount(u.cartData);
          const hasActiveCart = totalQty > 0;

          return (
            <div 
              key={idx} 
              className="bg-[#ffffff] dark:bg-[#171622] rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex gap-4 items-center bg-zinc-50 dark:bg-zinc-900/40">
                <div className="w-11 h-11 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black text-sm shadow-xs">
                  {u.name ? u.name.charAt(0).toUpperCase() : <User size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-extrabold text-[#0f0e17] dark:text-[#fffffe] truncate">
                    {u.name || 'Anonymous User'}
                  </h3>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold truncate mt-0.5">
                    {u.email}
                  </p>
                </div>
              </div>

              {/* Card Details Info */}
              <div className="p-4 flex-1 flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#717388]">Role Profile</span>
                  {u.role === 'vendor' ? (
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <Store size={10} /> Vendor: {u.vendorName || u.name}
                      </span>
                      {u.vendorAddress && (
                        <span className="text-[10px] text-zinc-500 font-medium">📍 {u.vendorAddress}</span>
                      )}
                    </div>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      u.isAdmin 
                        ? "bg-black text-white dark:bg-white dark:text-black border border-transparent" 
                        : "bg-[#eff0f6] dark:bg-[#212030] text-[#2e2f3e] dark:text-[#a7a9be] border border-gray-200 dark:border-gray-700"
                    }`}>
                      {u.isAdmin ? "Super Admin" : "Customer"}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#717388]">Cart Status</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    {hasActiveCart ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-[#388E3C] animate-pulse"></span>
                        <span className="text-[#388E3C] text-[11px]">{totalQty} {totalQty === 1 ? 'item' : 'items'} inside</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-[#717388]"></span>
                        <span className="text-[#717388] text-[11px]">Empty Basket</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded active cart checklist drawer inline inside the Card */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 animate-slide-down flex flex-col gap-2.5">
                    <h4 className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <ShoppingCart size={12} /> Active Cart Audit
                    </h4>
                    {normalizedItems.length === 0 ? (
                      <p className="text-[11px] text-[#717388] font-medium italic">No items stored in cart</p>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                        {normalizedItems.map((cartItem, cIdx) => {
                          const prodDetails = products.find(p => p.id === cartItem.id);
                          return (
                            <div key={cIdx} className="p-2 border border-[#e2e4ed]/30 dark:border-white/5 bg-[#eff0f6]/30 dark:bg-[#212030]/30 rounded-xl flex items-center justify-between gap-2 text-[11px]">
                              {prodDetails ? (
                                <>
                                  <div className="flex items-center gap-2">
                                    <img src={prodDetails.image} alt={prodDetails.name} className="w-8 h-10 object-cover rounded border border-[#e2e4ed]/40" />
                                    <div className="flex flex-col">
                                      <span className="font-bold text-[#0f0e17] dark:text-[#fffffe] truncate w-28">{prodDetails.name}</span>
                                      <span className="text-[10px] text-[#717388] mt-0.5">{cartItem.size} / {cartItem.color} &bull; Qty: {cartItem.quantity}</span>
                                    </div>
                                  </div>
                                  <div className="font-extrabold text-[#0f0e17] dark:text-[#fffffe]">
                                    ₹{prodDetails.newPrice * cartItem.quantity}
                                  </div>
                                </>
                              ) : (
                                <div className="text-[10px] text-[#717388] flex items-center gap-1">
                                  <AlertTriangle size={12} className="text-red-500" />
                                  <span>Deleted Item #{cartItem.id} ({cartItem.quantity} qty)</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-1.5 justify-end">
                <button 
                  type="button"
                  onClick={() => setExpandedUserEmail(isExpanded ? null : u.email)}
                  className="px-2 py-1 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer bg-white dark:bg-zinc-900"
                >
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  <span>Cart</span>
                </button>
                {u.role === 'vendor' ? (
                  <>
                    <button 
                      type="button"
                      onClick={() => handleOpenVendorModal(u)}
                      className="px-2 py-1 border border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      title="Edit Vendor Brand Name"
                    >
                      <Store size={12} />
                      <span>Edit Vendor Name</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleRevokeVendor(u)}
                      className="px-2 py-1 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer bg-white dark:bg-zinc-900"
                      title="Revoke vendor status"
                    >
                      <AlertTriangle size={12} />
                      <span>Revoke Vendor</span>
                    </button>
                  </>
                ) : !u.isAdmin ? (
                  <button 
                    type="button"
                    onClick={() => handleOpenVendorModal(u)}
                    className="px-2 py-1 border border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                    title="Promote customer to Vendor"
                  >
                    <Store size={12} />
                    <span>Make Vendor</span>
                  </button>
                ) : null}
                <button 
                  type="button"
                  onClick={() => handleToggleRole(u)}
                  className="px-2 py-1 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer bg-white dark:bg-zinc-900"
                >
                  <UserCheck size={12} />
                  <span>{u.isAdmin ? "Demote" : "Admin"}</span>
                </button>
                <button 
                  type="button"
                  onClick={() => handleDeleteUser(u)}
                  className="px-2 py-1 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer border-none"
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
        {filteredUsers.length === 0 && (
          <div className="col-span-full p-12 text-center text-sm font-medium text-[#717388]">
            No user profiles matching filters in database collections.
          </div>
        )}
      </div>

      {/* Vendor Promotion / Edit Modal */}
      {vendorModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#171622] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Store size={18} className="text-amber-500" />
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  {vendorModal.user?.role === 'vendor' ? 'Edit Vendor Business Details' : 'Promote User to Vendor'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVendorModal({ isOpen: false, user: null, vendorName: "" })}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 bg-transparent border-none cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Official Vendor / Brand Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Silks & Handlooms, Elite Trends"
                value={vendorModal.vendorName}
                onChange={(e) => setVendorModal(prev => ({ ...prev, vendorName: e.target.value }))}
                className="h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 outline-none"
              />
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                This brand name will be stamped on products uploaded by this vendor account.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Vendor Business Address / Location (City, State)
              </label>
              <input
                type="text"
                placeholder="e.g. Salem, Tamil Nadu or Surat, Gujarat"
                value={vendorModal.vendorAddress}
                onChange={(e) => setVendorModal(prev => ({ ...prev, vendorAddress: e.target.value }))}
                className="h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setVendorModal({ isOpen: false, user: null, vendorName: "" })}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVendorPromotion}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-black text-white dark:bg-white dark:text-black cursor-pointer shadow-xs border-none"
              >
                Save Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersTab;
