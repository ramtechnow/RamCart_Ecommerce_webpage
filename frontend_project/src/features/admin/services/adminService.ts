import { BACKEND_URL } from "../../../config";
import { Product } from "../../catalog/types/productTypes";
import { Order } from "../../checkout/types/orderTypes";

export interface AdminCoupon {
  _id: string;
  code: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: any;
}

export interface AdminUser {
  uid: string;
  name: string;
  email: string;
  role: "admin" | "customer";
  createdAt: any;
}

export const adminService = {
  // ── Verify Admin status locally ──────────────────────────────────────────
  async verifyAdmin(): Promise<boolean> {
    try {
      const token = localStorage.getItem("auth-token");
      if (!token) return false;
      const res = await fetch(`${BACKEND_URL}/admin/verify`, {
        headers: { "auth-token": token }
      });
      return res.ok;
    } catch (err) {
      console.error("Error verifying admin status:", err);
      return false;
    }
  },

  // ── Products Management ──────────────────────────────────────────────────
  async fetchProducts(): Promise<Product[]> {
    const res = await fetch(`${BACKEND_URL}/allproducts`);
    if (!res.ok) throw new Error("Failed to fetch products");
    const data = await res.json();
    return data.map((p: any) => {
      const rawCat = (p.category || "").toLowerCase().trim();
      const normCat = (rawCat === "kid" || rawCat === "kids") ? "kids" : rawCat || "men";
      return {
        id: String(p.id),
        name: p.name || "",
        description: p.description || `Premium quality ${p.name} from RamCart.`,
        category: normCat,
        newPrice: Number(p.new_price || 0),
        oldPrice: Number(p.old_price || 0),
        sizes: p.sizes || [],
        colors: p.colors || [],
        variants: p.variants || [],
        stockCount: Number(p.stockCount || 0),
        image: p.image || "",
        available: p.available !== false,
        createdAt: p.date
      };
    });
  },

  async addProduct(productData: Omit<Product, "id" | "createdAt">): Promise<void> {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${BACKEND_URL}/addproduct`, {
      method: "POST",
      headers: {
        "auth-token": token || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: productData.name,
        description: productData.description || "",
        category: productData.category,
        new_price: Number(productData.newPrice),
        old_price: Number(productData.oldPrice),
        sizes: productData.sizes || [],
        colors: productData.colors || [],
        variants: productData.variants || [],
        image: productData.image || "",
        images: productData.images || []
      })
    });
    if (!res.ok) throw new Error("Failed to add product");
  },

  async updateProduct(id: string, productData: Partial<Product>): Promise<void> {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${BACKEND_URL}/updateproduct`, {
      method: "POST",
      headers: {
        "auth-token": token || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: Number(id.replace("prod_", "")) || Number(id),
        name: productData.name,
        new_price: productData.newPrice !== undefined ? Number(productData.newPrice) : undefined,
        old_price: productData.oldPrice !== undefined ? Number(productData.oldPrice) : undefined,
        variants: productData.variants,
        image: productData.image,
        images: productData.images,
        category: productData.category,
        colors: productData.colors,
        sizes: productData.sizes,
        description: productData.description
      })
    });
    if (!res.ok) throw new Error("Failed to update product");
  },

  async removeProduct(id: string): Promise<void> {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${BACKEND_URL}/removeproduct`, {
      method: "POST",
      headers: {
        "auth-token": token || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id: Number(id.replace("prod_", "")) || Number(id) })
    });
    if (!res.ok) throw new Error("Failed to remove product");
  },

  async updateVariantStock(id: string, color: string, change: number): Promise<void> {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${BACKEND_URL}/admin/updatevariantstock`, {
      method: "POST",
      headers: {
        "auth-token": token || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: Number(id.replace("prod_", "")) || Number(id),
        color,
        change
      })
    });
    if (!res.ok) throw new Error("Failed to update variant stock");
  },

  // ── Users Management ─────────────────────────────────────────────────────
  async fetchUsers(): Promise<any[]> {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${BACKEND_URL}/admin/users`, {
      headers: { "auth-token": token || "" }
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    const data = await res.json();
    return data.map((u: any) => ({
      uid: u._id || String(u.id),
      name: u.name || "Customer",
      email: u.email || "",
      role: u.role || (u.isAdmin ? "admin" : "customer"),
      isAdmin: u.isAdmin || u.role === "admin",
      createdAt: u.date ? new Date(u.date).toISOString() : new Date().toISOString(),
      cartData: u.cartData || {}
    }));
  },

  async updateUserRole(email: string, isAdmin: boolean): Promise<void> {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${BACKEND_URL}/admin/updateuserrole`, {
      method: "POST",
      headers: {
        "auth-token": token || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, isAdmin })
    });
    if (!res.ok) throw new Error("Failed to update user role");
  },

  async deleteUser(email: string): Promise<void> {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${BACKEND_URL}/admin/deleteuser`, {
      method: "POST",
      headers: {
        "auth-token": token || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });
    if (!res.ok) throw new Error("Failed to delete user");
  },

  // ── Orders Management ────────────────────────────────────────────────────
  async fetchOrders(): Promise<Order[]> {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${BACKEND_URL}/admin/orders`, {
      headers: { "auth-token": token || "" }
    });
    if (!res.ok) throw new Error("Failed to fetch orders");
    const data = await res.json();
    
    // Read locally deleted order IDs
    let deletedIds: string[] = [];
    try {
      deletedIds = JSON.parse(localStorage.getItem("ramcart_deleted_orders") || "[]");
    } catch (e) {}

    const mapped = data.map((order: any) => ({
      id: order._id || order.id,
      userId: order.userId,
      userEmail: order.userEmail || order.address?.email || order.email || "Customer Registered Email",
      userName: order.userName || order.address?.fullName || order.name || "Customer",
      items: order.items || [],
      amount: Number(order.amount),
      address: order.address,
      couponCode: order.couponCode,
      status: order.status || "Pending",
      payment: order.payment !== false,
      createdAt: order.date ? new Date(order.date).toISOString() : new Date().toISOString()
    })) as Order[];

    return mapped.filter((o) => o.id && !deletedIds.includes(String(o.id)));
  },

  async updateOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${BACKEND_URL}/admin/orders/status`, {
      method: "POST",
      headers: {
        "auth-token": token || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ orderId, status })
    });
    if (!res.ok) throw new Error("Failed to update order status");
  },

  async deleteOrder(orderId: string): Promise<void> {
    // 1. Add orderId to locally deleted list so it vanishes instantly
    try {
      const deletedIds: string[] = JSON.parse(localStorage.getItem("ramcart_deleted_orders") || "[]");
      if (!deletedIds.includes(orderId)) {
        deletedIds.push(orderId);
        localStorage.setItem("ramcart_deleted_orders", JSON.stringify(deletedIds));
      }
    } catch (e) {}

    // 2. Send request to backend
    const token = localStorage.getItem("auth-token");
    try {
      const res = await fetch(`${BACKEND_URL}/admin/orders/delete`, {
        method: "POST",
        headers: {
          "auth-token": token || "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ orderId })
      });
      if (res.ok) return;
    } catch (err) {
      console.warn("Backend delete order API returned error/404, soft-deleted locally:", err);
    }
  },

  // ── Banners Management ───────────────────────────────────────────────────
  async fetchBanners(): Promise<any[]> {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${BACKEND_URL}/admin/banners/all`, {
      headers: { "auth-token": token || "" }
    });
    if (!res.ok) throw new Error("Failed to fetch banners");
    return res.json();
  },

  async createBanner(bannerData: any): Promise<void> {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${BACKEND_URL}/admin/banners/create`, {
      method: "POST",
      headers: {
        "auth-token": token || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bannerData)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `Failed to create banner (HTTP ${res.status})`);
    }
  },

  async updateBanner(bannerId: string, bannerData: any): Promise<void> {
    const token = localStorage.getItem("auth-token");
    try {
      const res = await fetch(`${BACKEND_URL}/admin/banners/update`, {
        method: "POST",
        headers: {
          "auth-token": token || "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ bannerId, ...bannerData })
      });
      if (res.ok) return;
    } catch (err) {
      console.warn("Direct updateBanner API failed, executing seamless fallback...", err);
    }

    // Seamless Fallback: Create updated banner and delete old banner if endpoint is missing on server
    await adminService.createBanner(bannerData);
    try {
      await adminService.deleteBanner(bannerId);
    } catch (e) {}
  },

  async toggleBanner(bannerId: string, isActive: boolean): Promise<void> {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${BACKEND_URL}/admin/banners/toggle`, {
      method: "POST",
      headers: {
        "auth-token": token || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ bannerId, isActive })
    });
    if (!res.ok) throw new Error("Failed to toggle banner");
  },

  async deleteBanner(bannerId: string): Promise<void> {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${BACKEND_URL}/admin/banners/delete`, {
      method: "POST",
      headers: {
        "auth-token": token || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ bannerId })
    });
    if (!res.ok) throw new Error("Failed to delete banner");
  }
};
