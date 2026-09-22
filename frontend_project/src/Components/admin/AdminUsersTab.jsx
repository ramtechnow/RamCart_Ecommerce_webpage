import React, { useState, useMemo } from 'react';
import { User, ShoppingCart, Shield, Trash2, ChevronDown, ChevronUp, UserCheck, AlertTriangle } from 'lucide-react';
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
      } else if (roleFilter === 'customer') {
        roleMatch = !u.isAdmin;
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
            className="w-full h-10 px-4 rounded-xl border border-[#e2e4ed]/40 dark:border-white/10 bg-[#ffffff] dark:bg-[#212030] focus:border-[#ff8906] focus:ring-1 focus:ring-[#ff8906] outline-none text-xs"
          />
        </div>

        {/* Role Select */}
        <select 
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 px-3 pr-8 rounded-xl border border-[#e2e4ed]/40 dark:border-white/10 bg-[#ffffff] dark:bg-[#212030] text-xs font-semibold text-[#2e2f3e] dark:text-[#a7a9be] outline-none cursor-pointer"
        >
          <option value="all">All Roles</option>
          <option value="admin">Super Admin</option>
          <option value="customer">Standard Customer</option>
        </select>

        {/* Status Select */}
        <select 
          value={cartFilter}
          onChange={(e) => setCartFilter(e.target.value)}
          className="h-10 px-3 pr-8 rounded-xl border border-[#e2e4ed]/40 dark:border-white/10 bg-[#ffffff] dark:bg-[#212030] text-xs font-semibold text-[#2e2f3e] dark:text-[#a7a9be] outline-none cursor-pointer"
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
            className="text-xs font-bold text-[#e53170] dark:text-[#ff8906] hover:underline cursor-pointer bg-transparent border-none p-0"
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
              className="bg-[#ffffff] dark:bg-[#171622] rounded-2xl shadow-sm border border-[#e2e4ed]/30 dark:border-white/5 overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md hover:border-[#e2e4ed]/60"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-[#e2e4ed]/20 dark:border-white/5 flex gap-4 items-center bg-[#eff0f6]/30 dark:bg-[#212030]/30">
                <div className="w-11 h-11 rounded-full bg-[#eff0f6] dark:bg-[#eff0f6]/10 text-[#e53170] dark:text-[#ff8906] flex items-center justify-center font-bold text-sm">
                  {u.name ? u.name.charAt(0).toUpperCase() : <User size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-extrabold text-[#0f0e17] dark:text-[#fffffe] truncate">
                    {u.name || 'Anonymous User'}
                  </h3>
                  <p className="text-[10px] text-[#717388] font-semibold truncate mt-0.5">
                    {u.email}
                  </p>
                </div>
              </div>

              {/* Card Details Info */}
              <div className="p-4 flex-1 flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#717388]">Role Profile</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    u.isAdmin 
                      ? "bg-purple-50 dark:bg-purple-950/20 text-purple-600 border border-purple-100" 
                      : "bg-[#eff0f6] dark:bg-[#212030] text-[#2e2f3e] dark:text-[#a7a9be] border border-gray-200 dark:border-gray-700"
                  }`}>
                    {u.isAdmin ? "Super Admin" : "Customer"}
                  </span>
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
                  <div className="mt-4 pt-4 border-t border-[#e2e4ed]/20 dark:border-white/5 animate-slide-down flex flex-col gap-2.5">
                    <h4 className="text-[10px] font-black text-[#e53170] dark:text-[#ff8906] uppercase tracking-wider mb-1 flex items-center gap-1">
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
              <div className="p-3 bg-[#eff0f6]/30 dark:bg-[#212030]/30 border-t border-[#e2e4ed]/20 dark:border-white/5 flex gap-1.5 justify-end">
                <button 
                  type="button"
                  onClick={() => setExpandedUserEmail(isExpanded ? null : u.email)}
                  className="px-2.5 py-1.5 border border-[#e2e4ed]/60 dark:border-white/10 hover:bg-[#e6e8eb] dark:hover:bg-[#363636] text-[#2e2f3e] dark:text-[#a7a9be] text-[11px] font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer bg-[#ffffff] dark:bg-[#171622]"
                >
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  <span>Inspect Cart</span>
                </button>
                <button 
                  type="button"
                  onClick={() => handleToggleRole(u)}
                  className="px-2.5 py-1.5 border border-[#ff8906]/50 hover:bg-[#ff8906]/10 text-[#ff8906] text-[11px] font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer bg-[#ffffff] dark:bg-[#171622]"
                >
                  <UserCheck size={12} />
                  <span>{u.isAdmin ? "Demote" : "Promote"}</span>
                </button>
                <button 
                  type="button"
                  onClick={() => handleDeleteUser(u)}
                  className="px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 text-[11px] font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer border-none"
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
    </div>
  );
};
