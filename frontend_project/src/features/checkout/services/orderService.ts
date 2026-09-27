import { BACKEND_URL } from "../../../config";
import { Order, OrderItem, AddressValues } from "../types/orderTypes";

// Fetch coupon details and validate eligibility
export const validateCoupon = async (code: string, cartTotal: number): Promise<{
  success: boolean;
  discountAmount?: number;
  finalTotal?: number;
  message?: string;
  error?: string;
}> => {
  try {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${BACKEND_URL}/applycoupon`, {
      method: "POST",
      headers: {
        "auth-token": token || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code: code.toUpperCase().trim(), cartTotal })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Failed to validate coupon." };
    }

    return {
      success: true,
      discountAmount: Number(data.discountAmount || 0),
      finalTotal: Number(data.finalTotal || cartTotal),
      message: data.message || `Coupon applied successfully!`
    };
  } catch (err: any) {
    console.error("Coupon validation error:", err);
    return { success: false, error: err.message || "Failed to validate coupon." };
  }
};

// Place Order via Express Backend API
export const placeOrderTransaction = async (
  _userId: string,
  items: OrderItem[],
  address: AddressValues,
  couponCode: string | null,
  totalAmount: number
): Promise<{ success: boolean; orderId?: string; error?: string }> => {
  try {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${BACKEND_URL}/placeorder`, {
      method: "POST",
      headers: {
        "auth-token": token || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        items,
        amount: totalAmount,
        address,
        couponCode: couponCode || null
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || data.errors || "Checkout transaction failed." };
    }

    return { success: true, orderId: String(data.orderId) };
  } catch (err: any) {
    console.error("Order placement failed:", err);
    return { success: false, error: err.message || "Checkout transaction failed." };
  }
};

// Retrieve order history for a user
export const fetchUserOrders = async (_userId: string): Promise<Order[]> => {
  try {
    const token = localStorage.getItem("auth-token");
    if (!token) return [];

    const res = await fetch(`${BACKEND_URL}/userorders`, {
      method: "GET",
      headers: {
        "auth-token": token,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      throw new Error("Failed to fetch order history.");
    }

    const data = await res.json();
    return data.map((order: any) => ({
      id: order._id || order.id,
      userId: order.userId,
      items: order.items || [],
      amount: Number(order.amount),
      address: order.address,
      couponCode: order.couponCode,
      status: order.status || "Pending",
      payment: order.payment !== false,
      createdAt: order.date ? new Date(order.date).toISOString() : new Date().toISOString()
    })) as Order[];
  } catch (err: any) {
    console.error("Failed to fetch user orders:", err);
    throw new Error(err.message || "Failed to retrieve purchase history.");
  }
};

// Fetch unseen order notifications for user
export const fetchUnseenOrders = async (): Promise<Order[]> => {
  try {
    const token = localStorage.getItem("auth-token");
    if (!token) return [];

    const res = await fetch(`${BACKEND_URL}/userorders/unseen`, {
      method: "GET",
      headers: {
        "auth-token": token,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      throw new Error("Failed to fetch unseen order notifications.");
    }

    const data = await res.json();
    return data.map((order: any) => ({
      id: order._id || order.id,
      userId: order.userId,
      items: order.items || [],
      amount: Number(order.amount),
      address: order.address,
      couponCode: order.couponCode,
      status: order.status || "Pending",
      payment: order.payment !== false,
      createdAt: order.date ? new Date(order.date).toISOString() : new Date().toISOString()
    })) as Order[];
  } catch (err: any) {
    console.error("Failed to fetch unseen orders:", err);
    return [];
  }
};

// Mark order notification as seen
export const markOrderAsSeen = async (orderId: string): Promise<boolean> => {
  try {
    const token = localStorage.getItem("auth-token");
    if (!token) return false;

    const res = await fetch(`${BACKEND_URL}/userorders/mark-seen`, {
      method: "POST",
      headers: {
        "auth-token": token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ orderId })
    });

    const data = await res.json();
    return res.ok && data.success;
  } catch (err: any) {
    console.error("Failed to mark order as seen:", err);
    return false;
  }
};

// Cancel an active order by customer
export const cancelUserOrder = async (
  orderId: string,
  reason?: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const token = localStorage.getItem("auth-token");
    if (!token) return { success: false, error: "Please sign in to cancel this order." };

    const res = await fetch(`${BACKEND_URL}/userorders/cancel`, {
      method: "POST",
      headers: {
        "auth-token": token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ orderId, reason: reason || "Cancelled by customer" })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Failed to cancel order." };
    }

    return { success: true, message: data.message || "Order cancelled successfully." };
  } catch (err: any) {
    console.error("Order cancellation failed:", err);
    return { success: false, error: err.message || "Failed to cancel order." };
  }
};

