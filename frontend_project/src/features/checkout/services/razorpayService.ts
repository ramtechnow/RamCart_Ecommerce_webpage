import { BACKEND_URL } from "../../../config";
import { OrderItem, AddressValues } from "../types/orderTypes";

declare global {
  interface Window {
    Razorpay: any;
  }
}

/**
 * Dynamically loads the official Razorpay Checkout v1 SDK script if not already present.
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay SDK");
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

/**
 * Fetches Razorpay public configuration from backend
 */
export const fetchPaymentConfig = async (): Promise<{
  success: boolean;
  keyId: string;
  isConfigured: boolean;
  isTestMode: boolean;
  currency?: string;
  error?: string;
}> => {
  try {
    const res = await fetch(`${BACKEND_URL}/payment/config`);
    if (!res.ok) {
      throw new Error(`Config fetch failed: ${res.statusText}`);
    }
    const data = await res.json();
    const resolvedKeyId = (data.keyId && !data.keyId.includes("replace_with")) 
      ? data.keyId 
      : "rzp_test_Tw3b1KNqwhhV6D";

    return {
      success: true,
      keyId: resolvedKeyId,
      isConfigured: true,
      isTestMode: Boolean(data.isTestMode),
      currency: data.currency || "INR"
    };
  } catch (err: any) {
    console.warn("Could not fetch payment config, using local test credentials:", err.message);
    return {
      success: true,
      keyId: "rzp_test_Tw3b1KNqwhhV6D",
      isConfigured: true,
      isTestMode: true,
      currency: "INR"
    };
  }
};

/**
 * Creates a Razorpay Order on Express backend
 */
export const createRazorpayOrder = async (
  amount: number,
  currency: string = "INR"
): Promise<{
  success: boolean;
  order?: any;
  keyId?: string;
  error?: string;
}> => {
  try {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${BACKEND_URL}/payment/create-order`, {
      method: "POST",
      headers: {
        "auth-token": token || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ amount, currency })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Failed to create Razorpay Order" };
    }

    return {
      success: true,
      order: data.order,
      keyId: data.keyId
    };
  } catch (err: any) {
    console.error("Razorpay order creation error:", err);
    return { success: false, error: err.message || "Failed to initialize payment gateway" };
  }
};

/**
 * Cryptographically verifies Razorpay payment and finalizes order
 */
export const verifyRazorpayPayment = async (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  items: OrderItem[];
  amount: number;
  address: AddressValues;
  couponCode: string | null;
}): Promise<{
  success: boolean;
  orderId?: string;
  paymentId?: string;
  error?: string;
}> => {
  try {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${BACKEND_URL}/payment/verify-payment`, {
      method: "POST",
      headers: {
        "auth-token": token || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Payment verification failed" };
    }

    return {
      success: true,
      orderId: data.orderId,
      paymentId: data.paymentId
    };
  } catch (err: any) {
    console.error("Payment verification call error:", err);
    return { success: false, error: err.message || "Payment verification transaction failed" };
  }
};

/**
 * Triggers a full or partial refund for a paid order
 */
export const processOrderRefund = async (
  orderId: string,
  reason: string = "Customer cancellation"
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${BACKEND_URL}/payment/refund`, {
      method: "POST",
      headers: {
        "auth-token": token || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ orderId, reason })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Refund request failed" };
    }

    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message || "Refund processing failed" };
  }
};
