import { BACKEND_URL } from "../../../config";

export interface YoupiConfig {
  success: boolean;
  merchantVpa: string;
  merchantName: string;
  isConfigured: boolean;
  currency: string;
}

export interface YoupiInitiateResponse {
  success: boolean;
  orderId: string;
  amount: number;
  merchantVpa: string;
  merchantName: string;
  upiUri: string;
  expiresInSeconds: number;
}

export interface YoupiSubmitUtrResponse {
  success: boolean;
  message: string;
  orderId: string;
  rawId?: string;
  utr: string;
}

// ── 1. Fetch Merchant YouPI Configuration ─────────────────────────────────────
export const fetchYoupiConfig = async (): Promise<YoupiConfig> => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/youpi/config`);
    if (!res.ok) throw new Error("Could not reach YouPI gateway");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback YouPI configuration:", err);
    return {
      success: true,
      merchantVpa: "ramtechnow@okaxis",
      merchantName: "RamCart",
      isConfigured: true,
      currency: "INR"
    };
  }
};

// ── 2. Initiate YouPI Dynamic Payment Session ────────────────────────────────
export const initiateYoupiPayment = async (payload: {
  amount: number;
  items: any[];
  address: any;
  couponCode?: string | null;
}): Promise<YoupiInitiateResponse> => {
  const token = localStorage.getItem("auth-token");
  const res = await fetch(`${BACKEND_URL}/api/youpi/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "auth-token": token || ""
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to initialize YouPI payment session");
  }
  return data;
};

// ── 3. Submit Customer 12-Digit UTR for Verification ────────────────────────
export const submitYoupiUtr = async (payload: {
  orderId: string;
  utr: string;
  customerVpa?: string;
  items?: any[];
  address?: any;
  amount?: number;
  couponCode?: string | null;
}): Promise<YoupiSubmitUtrResponse> => {
  const token = localStorage.getItem("auth-token");
  const res = await fetch(`${BACKEND_URL}/api/youpi/submit-utr`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "auth-token": token || ""
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to verify transaction reference");
  }
  return data;
};

// ── 4. Poll Payment Status ───────────────────────────────────────────────────
export const pollYoupiStatus = async (orderId: string): Promise<any> => {
  const token = localStorage.getItem("auth-token");
  const res = await fetch(`${BACKEND_URL}/api/youpi/status/${orderId}`, {
    headers: {
      "auth-token": token || ""
    }
  });
  return await res.json();
};

// ── 5. Admin Verification ────────────────────────────────────────────────────
export const adminVerifyYoupiOrder = async (orderId: string): Promise<any> => {
  const token = localStorage.getItem("auth-token");
  const res = await fetch(`${BACKEND_URL}/api/youpi/admin/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "auth-token": token || ""
    },
    body: JSON.stringify({ orderId })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to verify payment");
  }
  return data;
};

// ── 6. Admin 1-Click Safe UPI Refund ─────────────────────────────────────────
export const adminRefundYoupiOrder = async (
  orderId: string,
  refundUtr: string,
  refundReason?: string
): Promise<any> => {
  const token = localStorage.getItem("auth-token");
  const res = await fetch(`${BACKEND_URL}/api/youpi/admin/refund`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "auth-token": token || ""
    },
    body: JSON.stringify({ orderId, refundUtr, refundReason })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to process refund");
  }
  return data;
};
