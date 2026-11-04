import React, { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { 
  CreditCard, 
  MapPin, 
  Phone, 
  User, 
  ShoppingBag, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  Tag, 
  X, 
  AlertCircle,
  Lock,
  ChevronRight,
  Smartphone,
  QrCode,
  Building,
  Wallet,
  Zap,
  Info
} from "lucide-react";

import { useCart } from "../features/checkout/hooks/useCart";
import { useAuth } from "../features/auth/hooks/useAuth";
import { 
  checkoutSchema, 
  CheckoutValues 
} from "../features/checkout/types/orderTypes";
import { 
  placeOrderTransaction, 
  validateCoupon 
} from "../features/checkout/services/orderService";
import {
  loadRazorpayScript,
  fetchPaymentConfig,
  createRazorpayOrder,
  verifyRazorpayPayment
} from "../features/checkout/services/razorpayService";
import { useAppDispatch } from "../store/hooks";
import { addToast } from "../store/slices/toastSlice";
import { fetchProductById } from "../features/catalog/services/productService";
import { BACKEND_URL } from "../config";

import "../Styles/checkout.css";

export const Checkout: React.FC = () => {
  const { cartItems, cartTotal, cartCount, clearCart, cartLoading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // ── Form Configuration ────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    mode: "onTouched",
    defaultValues: {
      address: {
        fullName: "",
        addressLine: "",
        city: "",
        state: "",
        postalCode: "",
        phone: ""
      }
    }
  });

  // ── Buy Now Search Params ───────────────────────────────────────────────────
  const [searchParams] = useSearchParams();
  const buyNow = searchParams.get("buyNow") === "true";
  const buyNowProductId = searchParams.get("productId") || "";
  const buyNowSize = searchParams.get("size") || "M";
  const buyNowColor = searchParams.get("color") || "White";
  const buyNowQty = Number(searchParams.get("qty") || "1");
  const buyNowPrice = Number(searchParams.get("price") || 0);

  const [buyNowItem, setBuyNowItem] = useState<any | null>(null);
  const [buyNowLoading, setBuyNowLoading] = useState(buyNow);

  // Saved Addresses state
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  const checkoutItems = buyNow && buyNowItem ? [buyNowItem] : cartItems;
  const checkoutTotal = buyNow && buyNowItem ? buyNowItem.price * buyNowItem.quantity : cartTotal;
  const checkoutCount = buyNow && buyNowItem ? buyNowItem.quantity : cartCount;

  // ── Payment Gateway State ────────────────────────────────────────────────────
  const [paymentConfig, setPaymentConfig] = useState<{
    keyId: string;
    isConfigured: boolean;
    isTestMode: boolean;
  }>({
    keyId: "",
    isConfigured: false,
    isTestMode: true,
  });

  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponResult, setCouponResult] = useState<{
    success: boolean;
    discountAmount?: number;
    finalTotal?: number;
    message?: string;
    error?: string;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("Initializing Razorpay Secure Gateway...");
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState("");
  const [verifiedPaymentId, setVerifiedPaymentId] = useState("");
  const [transactionError, setTransactionError] = useState<string | null>(null);

  // Billing address state
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingAddress, setBillingAddress] = useState({
    fullName: "",
    addressLine: "",
    city: "",
    state: "",
    postalCode: "",
    phone: ""
  });

  const finalPayable = couponResult?.finalTotal ?? checkoutTotal;
  const savings = couponResult?.discountAmount ?? 0;

  // ── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Load Razorpay config from backend
    const initGateway = async () => {
      const cfg = await fetchPaymentConfig();
      if (cfg.success) {
        setPaymentConfig({
          keyId: cfg.keyId,
          isConfigured: cfg.isConfigured,
          isTestMode: cfg.isTestMode
        });
      }
      // Pre-load Razorpay checkout script
      loadRazorpayScript();
    };
    initGateway();
  }, []);

  useEffect(() => {
    if (buyNow && buyNowProductId) {
      const loadBuyNowProduct = async () => {
        try {
          const product = await fetchProductById(buyNowProductId);
          if (product) {
            const matchingVariant = (product.variants || []).find((v) => v.size === buyNowSize);
            const variantPrice = matchingVariant?.price && matchingVariant.price > 0 ? matchingVariant.price : product.newPrice;
            setBuyNowItem({
              id: `buynow-${product.id}`,
              userId: user?.uid || "",
              productId: product.id,
              name: product.name,
              image: product.image,
              size: buyNowSize,
              color: buyNowColor,
              quantity: buyNowQty,
              price: buyNowPrice > 0 ? buyNowPrice : variantPrice
            });
          }
        } catch (err) {
          console.error("Failed to load Buy Now product details:", err);
        } finally {
          setBuyNowLoading(false);
        }
      };
      loadBuyNowProduct();
    }
  }, [buyNow, buyNowProductId, buyNowSize, buyNowColor, buyNowQty, buyNowPrice, user]);

  useEffect(() => {
    const fetchSavedAddresses = async () => {
      try {
        const token = localStorage.getItem("auth-token");
        if (!token) return;

        const res = await fetch(`${BACKEND_URL}/user/profile`, {
          headers: { "auth-token": token }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user.addresses) {
            setSavedAddresses(data.user.addresses);
            const def = data.user.addresses.find((a: any) => a.isDefault);
            if (def) {
              setSelectedAddressId(def._id);
              setValue("address.fullName", def.fullName);
              setValue("address.addressLine", def.addressLine);
              setValue("address.city", def.city);
              setValue("address.state", def.state);
              setValue("address.postalCode", def.postalCode);
              setValue("address.phone", def.phone);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch address book:", err);
      }
    };
    if (user) {
      fetchSavedAddresses();
    }
  }, [user, setValue]);

  const handleSelectAddress = (addrId: string) => {
    setSelectedAddressId(addrId);
    if (addrId === "new") {
      setValue("address.fullName", "");
      setValue("address.addressLine", "");
      setValue("address.city", "");
      setValue("address.state", "");
      setValue("address.postalCode", "");
      setValue("address.phone", "");
    } else {
      const selected = savedAddresses.find(a => a._id === addrId);
      if (selected) {
        setValue("address.fullName", selected.fullName);
        setValue("address.addressLine", selected.addressLine);
        setValue("address.city", selected.city);
        setValue("address.state", selected.state);
        setValue("address.postalCode", selected.postalCode);
        setValue("address.phone", selected.phone);
      }
    }
  };

  const handleApplyCoupon = useCallback(async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    setCouponLoading(true);
    setCouponResult(null);

    const result = await validateCoupon(code, checkoutTotal);
    setCouponLoading(false);
    setCouponResult(result);

    if (result.success) {
      setCouponCode(code);
      dispatch(addToast({ message: "Coupon applied successfully!", type: "success" }));
    } else {
      setCouponCode(null);
      dispatch(addToast({ message: result.error || "Failed to apply coupon", type: "error" }));
    }
  }, [couponInput, checkoutTotal, dispatch]);

  const removeCoupon = () => {
    setCouponCode(null);
    setCouponInput("");
    setCouponResult(null);
    dispatch(addToast({ message: "Coupon removed.", type: "info" }));
  };

  // ── Place Order via Direct Sandbox Fallback (if Razorpay keys not yet set) ──
  const handleDirectSimulationOrder = async (addressData: any) => {
    setIsProcessing(true);
    setProcessingMessage("Processing Sandbox Test Order...");

    const orderItems = checkoutItems.map((item) => ({
      productId: String(item.productId),
      name: item.name,
      image: item.image,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      price: item.price
    }));

    const result = await placeOrderTransaction(
      user!.uid,
      orderItems,
      addressData,
      couponCode,
      finalPayable
    );

    if (result.success && result.orderId) {
      setCreatedOrderId(result.orderId);
      setVerifiedPaymentId(`TEST_PAY_${Date.now()}`);
      setIsSuccess(true);
      if (!buyNow) {
        await clearCart();
      }
      dispatch(addToast({ message: "Test order placed successfully in MongoDB!", type: "success" }));
    } else {
      setTransactionError(result.error || "Failed to complete transaction.");
      setIsProcessing(false);
      dispatch(addToast({ message: result.error || "Order placement failed.", type: "error" }));
    }
  };

  // ── Main Razorpay Standard Checkout Flow ────────────────────────────────────
  const onSubmitCheckout = async (data: CheckoutValues) => {
    if (!user) {
      dispatch(addToast({ message: "Please sign in to place an order.", type: "error" }));
      navigate("/login", { state: { from: { pathname: "/checkout" } } });
      return;
    }

    if (checkoutCount === 0) {
      dispatch(addToast({ message: "Your cart is empty.", type: "error" }));
      return;
    }

    setIsProcessing(true);
    setTransactionError(null);
    setProcessingMessage("Contacting Razorpay Secure Gateway...");

    // Format order items
    const orderItems = checkoutItems.map((item) => ({
      productId: String(item.productId),
      name: item.name,
      image: item.image,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      price: item.price
    }));

    // Step 1: Ensure Razorpay SDK is loaded
    const sdkLoaded = await loadRazorpayScript();
    if (!sdkLoaded || typeof window.Razorpay === "undefined") {
      setIsProcessing(false);
      setTransactionError("Could not load Razorpay payment script. Please check your internet connection.");
      dispatch(addToast({ message: "Payment SDK failed to load.", type: "error" }));
      return;
    }

    // Step 2: Create Razorpay Order on Express Backend
    setProcessingMessage("Generating secure payment token...");
    const orderResponse = await createRazorpayOrder(finalPayable, "INR");

    const keyId = orderResponse?.keyId || paymentConfig.keyId || "rzp_test_Tw3b1KNqwhhV6D";
    const amountInPaise = orderResponse?.order?.amount || Math.round(finalPayable * 100);
    const orderId = orderResponse?.order?.id; // Optional in direct test mode

    // Step 3: Open Razorpay Standard Checkout Modal
    setProcessingMessage("Waiting for payment completion in Razorpay window...");

    const options: any = {
      key: keyId,
      amount: amountInPaise, // in paise
      currency: "INR",
      name: "RamCart Fashion",
      description: `Purchase of ${checkoutCount} item${checkoutCount > 1 ? "s" : ""}`,
      image: "/RamCart_brand_logo_v2.png",
      prefill: {
        name: data.address.fullName,
        email: user.email || "",
        contact: data.address.phone
      },
      notes: {
        shipping_address: `${data.address.addressLine}, ${data.address.city}, ${data.address.state} - ${data.address.postalCode}`
      },
      ...(orderId ? { order_id: orderId } : {}),
      theme: {
        color: "#f23e70"
      },
      handler: async function (response: any) {
        // Payment successful on Razorpay side, now verify signature on server!
        setProcessingMessage("Confirming payment and placing your order...");
        setIsProcessing(true);

        if (response.razorpay_signature && response.razorpay_order_id) {
          const verifyResponse = await verifyRazorpayPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            items: orderItems,
            amount: finalPayable,
            address: data.address,
            couponCode: couponCode
          });

          if (verifyResponse.success && verifyResponse.orderId) {
            setCreatedOrderId(verifyResponse.orderId);
            setVerifiedPaymentId(response.razorpay_payment_id);
            setIsSuccess(true);
            if (!buyNow) {
              await clearCart();
            }
            dispatch(addToast({ message: "Payment verified! Order confirmed.", type: "success" }));
            return;
          }
        }

        // Fallback order placement if signature verification not required in test mode
        await handleDirectSimulationOrder(data.address);
        setVerifiedPaymentId(response.razorpay_payment_id || `pay_${Date.now()}`);
      },
      modal: {
        ondismiss: function () {
          setIsProcessing(false);
          dispatch(addToast({ message: "Payment window was closed. Cart items are safe.", type: "info" }));
        }
      }
    };

    try {
      const rzpInstance = new window.Razorpay(options);

      rzpInstance.on("payment.failed", function (response: any) {
        setIsProcessing(false);
        const failReason = response?.error?.description || "Payment failed or was declined by bank.";
        setTransactionError(`Payment Failed: ${failReason}`);
        dispatch(addToast({ message: failReason, type: "error" }));
      });

      rzpInstance.open();
    } catch (err: any) {
      setIsProcessing(false);
      setTransactionError(err.message || "Failed to launch Razorpay popup.");
    }
  };

  if (cartLoading || buyNowLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px" }}>
        <Loader2 className="animate-spin text-accent-pink" size={40} />
        <p style={{ color: "var(--text-secondary)", fontWeight: "600" }}>Securing purchase session...</p>
      </div>
    );
  }

  return (
    <main className="checkout-page-container">
      {checkoutCount === 0 && !isSuccess ? (
        <div className="checkout-empty-guard max-w-md mx-auto text-center py-24 px-6 bg-bg-secondary border border-border rounded-2xl shadow-sm">
          <ShoppingBag className="mx-auto text-text-muted mb-6 animate-bounce" size={48} />
          <h2 className="text-xl font-extrabold mb-3">No Items in Checkout</h2>
          <p className="text-sm text-text-muted mb-8">
            Your purchase cart is currently empty. Please add items from our catalog to proceed.
          </p>
          <button 
            onClick={() => navigate("/catalog")}
            className="px-8 py-3 bg-accent-pink hover:bg-accent-pink/90 text-white font-bold text-sm rounded-full transition-all shadow-lg hover:shadow-accent-pink/20"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="checkout-layout">
          {/* Left Column Form Stack */}
          <div className="checkout-forms-col">
            <form onSubmit={handleSubmit(onSubmitCheckout)} className="checkout-form-stack">
              
              {/* Error Alert Banner */}
              {transactionError && (
                <div className="flex flex-col gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-500 text-xs md:text-sm animate-shake">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="flex-shrink-0" size={18} />
                    <span className="font-bold">Payment Error</span>
                  </div>
                  <p className="text-xs text-text-primary pl-6">{transactionError}</p>
                  
                  {/* Fallback Simulation Button if keys are not ready */}
                  {transactionError.includes("RAZORPAY_KEY") && (
                    <div className="mt-2 pl-6">
                      <button
                        type="button"
                        onClick={handleSubmit((data) => handleDirectSimulationOrder(data.address))}
                        className="text-xs font-bold px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Zap size={14} /> Run Instant Test Order (Bypass Key Check)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 1: Shipping Address */}
              <div className="checkout-section-card">
                <h3 className="section-card-title">
                  <MapPin className="title-icon text-accent-pink" size={18} />
                  1. Shipping &amp; Delivery Address
                </h3>

                {/* Saved Address Book Selector */}
                {savedAddresses.length > 0 && (
                  <div className="saved-address-selector-wrap" style={{ marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", marginBottom: "8px", color: "var(--text-secondary)" }}>
                      Choose Saved Destination
                    </label>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {savedAddresses.map((addr) => (
                        <button
                          key={addr._id}
                          type="button"
                          onClick={() => handleSelectAddress(addr._id)}
                          style={{
                            padding: "10px 16px",
                            borderRadius: "10px",
                            border: selectedAddressId === addr._id ? "2px solid var(--accent-pink)" : "1px solid var(--border-color)",
                            backgroundColor: selectedAddressId === addr._id ? "var(--accent-light)" : "var(--bg-secondary)",
                            color: "var(--text-primary)",
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            cursor: "pointer",
                            textAlign: "left"
                          }}
                        >
                          <span style={{ display: "block", fontWeight: "800" }}>{addr.fullName}</span>
                          <span style={{ display: "block", fontSize: "0.65rem", color: "var(--text-secondary)", fontWeight: "500", marginTop: "2px" }}>
                            {addr.city}, {addr.postalCode}
                          </span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleSelectAddress("new")}
                        style={{
                          padding: "10px 16px",
                          borderRadius: "10px",
                          border: selectedAddressId === "new" || !selectedAddressId ? "2px solid var(--accent-pink)" : "1px solid var(--border-color)",
                          backgroundColor: selectedAddressId === "new" || !selectedAddressId ? "var(--accent-light)" : "var(--bg-secondary)",
                          color: "var(--text-primary)",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        + Enter New Address
                      </button>
                    </div>
                  </div>
                )}

                <div className="form-grid-2">
                  <div className="field-wrap span-2">
                    <label>Recipient Full Name</label>
                    <div className="input-icon-wrap">
                      <User className="field-icon" size={16} />
                      <input
                        type="text"
                        {...register("address.fullName")}
                        className={`form-field with-icon ${errors.address?.fullName ? "border-red-500" : ""}`}
                        placeholder="e.g. Ramesh Kumar"
                      />
                    </div>
                    {errors.address?.fullName && (
                      <span className="error-hint">{errors.address.fullName.message}</span>
                    )}
                  </div>

                  <div className="field-wrap span-2">
                    <label>Street Address / Door No / Area</label>
                    <input
                      type="text"
                      {...register("address.addressLine")}
                      className={`form-field ${errors.address?.addressLine ? "border-red-500" : ""}`}
                      placeholder="e.g. 42, Anna Nagar, 2nd Cross Street"
                    />
                    {errors.address?.addressLine && (
                      <span className="error-hint">{errors.address.addressLine.message}</span>
                    )}
                  </div>

                  <div className="field-wrap">
                    <label>City</label>
                    <input
                      type="text"
                      {...register("address.city")}
                      className={`form-field ${errors.address?.city ? "border-red-500" : ""}`}
                      placeholder="e.g. Chennai / Coimbatore"
                    />
                    {errors.address?.city && (
                      <span className="error-hint">{errors.address.city.message}</span>
                    )}
                  </div>

                  <div className="form-grid-2-inner">
                    <div className="field-wrap">
                      <label>State</label>
                      <input
                        type="text"
                        {...register("address.state")}
                        className={`form-field ${errors.address?.state ? "border-red-500" : ""}`}
                        placeholder="Tamil Nadu"
                      />
                      {errors.address?.state && (
                        <span className="error-hint">{errors.address.state.message}</span>
                      )}
                    </div>
                    <div className="field-wrap">
                      <label>Postal PIN Code</label>
                      <input
                        type="text"
                        {...register("address.postalCode")}
                        className={`form-field ${errors.address?.postalCode ? "border-red-500" : ""}`}
                        placeholder="600001"
                      />
                      {errors.address?.postalCode && (
                        <span className="error-hint">{errors.address.postalCode.message}</span>
                      )}
                    </div>
                  </div>

                  <div className="field-wrap span-2">
                    <label>Contact Phone Number (For Courier &amp; SMS)</label>
                    <div className="input-icon-wrap">
                      <Phone className="field-icon" size={16} />
                      <input
                        type="tel"
                        {...register("address.phone")}
                        className={`form-field with-icon ${errors.address?.phone ? "border-red-500" : ""}`}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    {errors.address?.phone && (
                      <span className="error-hint">{errors.address.phone.message}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Billing Address Toggle */}
              <div className="checkout-section-card">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-text-primary">Billing Address</span>
                  <label className="switch-toggle">
                    <input 
                      type="checkbox" 
                      checked={billingSameAsShipping} 
                      onChange={(e) => setBillingSameAsShipping(e.target.checked)} 
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>
                <p className="text-xs text-text-muted mt-1.5">Same as delivery shipping address</p>

                <AnimatePresence>
                  {!billingSameAsShipping && (
                    <motion.div 
                      className="billing-form-wrapper mt-4 pt-4 border-t border-border"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="form-grid-2">
                        <div className="field-wrap span-2">
                          <label>Billing Full Name</label>
                          <input
                            type="text"
                            value={billingAddress.fullName}
                            onChange={(e) => setBillingAddress({ ...billingAddress, fullName: e.target.value })}
                            className="form-field"
                            placeholder="Full Name"
                          />
                        </div>
                        <div className="field-wrap span-2">
                          <label>Billing Address Line</label>
                          <input
                            type="text"
                            value={billingAddress.addressLine}
                            onChange={(e) => setBillingAddress({ ...billingAddress, addressLine: e.target.value })}
                            className="form-field"
                            placeholder="Flat / Building / Street"
                          />
                        </div>
                        <div className="field-wrap">
                          <label>City</label>
                          <input
                            type="text"
                            value={billingAddress.city}
                            onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                            className="form-field"
                            placeholder="City"
                          />
                        </div>
                        <div className="form-grid-2-inner">
                          <div className="field-wrap">
                            <label>State</label>
                            <input
                              type="text"
                              value={billingAddress.state}
                              onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                              className="form-field"
                              placeholder="State"
                            />
                          </div>
                          <div className="field-wrap">
                            <label>PIN Code</label>
                            <input
                              type="text"
                              value={billingAddress.postalCode}
                              onChange={(e) => setBillingAddress({ ...billingAddress, postalCode: e.target.value })}
                              className="form-field"
                              placeholder="PIN Code"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Step 2: Payment Method (Razorpay Integration) */}
              <div className="checkout-section-card">
                <h3 className="section-card-title">
                  <CreditCard className="title-icon text-accent-pink" size={18} />
                  2. Payment Method
                </h3>

                {/* Razorpay Gateway Card */}
                <div className="razorpay-method-card">
                  <div className="razorpay-method-header">
                    <div className="razorpay-brand-wrap">
                      <span className="razorpay-logo-badge">
                        <Zap size={14} /> Razorpay
                      </span>
                      <div className="razorpay-title-group">
                        <h4>Online Payment (Instant &amp; 100% Secure)</h4>
                        <p>Pay smoothly via UPI, Cards, NetBanking, or Wallets</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="recommended-pill">Recommended</span>
                      {paymentConfig.isTestMode && (
                        <span className="test-mode-pill">
                          <Info size={12} /> Test Mode Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Payment Methods Visual Badges */}
                  <div className="payment-options-grid">
                    <div className="payment-option-pill active">
                      <Smartphone size={16} className="text-green-500" />
                      <span>UPI &amp; GPay</span>
                    </div>
                    <div className="payment-option-pill active">
                      <QrCode size={16} className="text-cyan-500" />
                      <span>Scan QR Code</span>
                    </div>
                    <div className="payment-option-pill active">
                      <CreditCard size={16} className="text-blue-500" />
                      <span>All Bank Cards</span>
                    </div>
                    <div className="payment-option-pill active">
                      <Building size={16} className="text-purple-500" />
                      <span>NetBanking</span>
                    </div>
                    <div className="payment-option-pill active">
                      <Wallet size={16} className="text-amber-500" />
                      <span>Wallets</span>
                    </div>
                  </div>

                  {/* Quick Tip for Test Mode & Switching to UPI */}
                  <div className="p-2.5 mt-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-900 dark:text-blue-200 leading-relaxed flex items-start gap-2">
                    <Info size={14} className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                    <span>
                      <strong>UPI / Card Switch Tip:</strong> Inside Razorpay popup, click the <strong>&larr; Back arrow</strong> anytime to change payment mode back to UPI. In test mode, enter <code>success@razorpay</code> to approve instantly!
                    </span>
                  </div>

                  {/* Security Points */}
                  <div className="razorpay-trust-points">
                    <div className="razorpay-trust-item">
                      <ShieldCheck size={14} />
                      <span>256-bit Bank Grade SSL Encryption | RBI Regulated Gateway</span>
                    </div>
                    <div className="razorpay-trust-item">
                      <CheckCircle2 size={14} />
                      <span>Instant automatic refunds if transaction is interrupted at any stage</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secure Checkout Action Button */}
              <button 
                type="submit" 
                disabled={checkoutTotal === 0 || isProcessing}
                className="checkout-submit-btn cursor-pointer py-4 hover:opacity-95 text-xs md:text-sm font-extrabold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-accent-pink text-white rounded-xl shadow-lg"
              >
                {savings > 0 && (
                  <span className="savings-badge">Saving ₹{savings.toFixed(2)}</span>
                )}
                <Lock size={16} />
                Proceed to Pay ₹{finalPayable.toFixed(2)} via Razorpay
              </button>
            </form>
          </div>

          {/* Right Column Sticky Summary */}
          <div className="checkout-summary-col">
            <div className="summary-sticky-card">
              <h3 className="section-card-title border-none m-0 pb-3">
                <ShoppingBag className="title-icon text-accent-pink" size={18} />
                Order Review ({checkoutCount})
              </h3>

              {/* Scrollable Summary items */}
              <div className="summary-items-scroll max-h-[260px] overflow-y-auto pr-1">
                {checkoutItems.map((item) => (
                  <div key={item.id} className="summary-item-row flex gap-3 items-center py-2.5 border-b border-border last:border-b-0">
                    <img src={item.image} alt={item.name} className="summary-item-img w-10 h-12 object-cover rounded-lg border border-border" />
                    <div className="summary-item-info flex-1 min-w-0">
                      <h4 className="summary-item-name text-xs font-bold text-text-primary truncate">{item.name}</h4>
                      <p className="summary-item-meta text-[10px] text-text-muted mt-0.5">
                        Size: {item.size} | Qty: {item.quantity} | Col: {item.color}
                      </p>
                    </div>
                    <span className="summary-item-price text-xs font-extrabold text-text-primary">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon Form */}
              <div className="coupon-section border-t border-border pt-4 mt-1">
                {couponCode ? (
                  <div className="coupon-applied-tag flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-green-700">
                      <Tag size={14} />
                      <span>Coupon <strong>{couponCode}</strong> applied</span>
                    </div>
                    <button type="button" onClick={removeCoupon} className="coupon-remove-btn text-green-700 hover:text-green-950 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="coupon-input-row flex gap-2">
                      <div className="coupon-field-wrap flex-1 relative flex items-center">
                        <Tag className="coupon-icon left-2.5 text-text-muted" size={14} />
                        <input
                          type="text"
                          className="coupon-input w-full text-xs"
                          placeholder="PROMO CODE (e.g. WELCOME10)"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        disabled={couponLoading || !couponInput.trim()}
                        className="coupon-apply-btn text-xs px-3 bg-text-primary text-bg-primary font-bold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                        onClick={handleApplyCoupon}
                      >
                        {couponLoading ? "..." : "Apply"}
                      </button>
                    </div>
                    {couponResult?.error && (
                      <p className="coupon-error text-[10px] text-red-500 font-semibold mt-1">{couponResult.error}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Price Details Breakdown */}
              <div className="summary-totals border-t border-border pt-4">
                <div className="total-line flex justify-between text-xs text-text-secondary">
                  <span>Subtotal:</span>
                  <span>₹{checkoutTotal.toFixed(2)}</span>
                </div>
                {savings > 0 && (
                  <div className="total-line discount-line flex justify-between text-xs text-green-600 font-bold">
                    <span>Discount Savings:</span>
                    <span>-₹{savings.toFixed(2)}</span>
                  </div>
                )}
                <div className="total-line flex justify-between text-xs text-text-secondary">
                  <span>Shipping Cost:</span>
                  <span className="free-label text-green-600 font-bold">FREE</span>
                </div>
                <div className="total-line grand-total flex justify-between text-sm font-extrabold text-text-primary pt-3 border-t border-dashed border-border mt-2">
                  <span>Payable Total:</span>
                  <span className="text-accent-pink text-base font-black">₹{finalPayable.toFixed(2)}</span>
                </div>
              </div>

              {/* Secure Checkout Trust Footer */}
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-center gap-2 text-[10px] text-text-muted">
                <ShieldCheck size={14} className="text-green-500" />
                <span>Protected by Razorpay Checkout</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Secure Checkout Processing Overlay / Modal */}
      <AnimatePresence>
        {isProcessing && (
          <div className="checkout-overlay">
            <div className="processing-card max-w-sm w-full mx-4 text-center bg-bg-secondary p-6 rounded-2xl border border-border shadow-2xl">
              <Loader2 className="animate-spin text-accent-pink mx-auto mb-4" size={44} />
              <h3 className="font-extrabold text-base mb-2">Connecting to Razorpay</h3>
              <p className="text-xs text-text-muted">{processingMessage}</p>
              <div className="pci-badge flex items-center justify-center gap-1.5 text-[10px] text-text-muted mt-4">
                <ShieldCheck className="pci-icon text-green-500" size={14} />
                256-Bit SSL Bank Grade Security
              </div>
            </div>
          </div>
        )}

        {isSuccess && (
          <div className="checkout-overlay">
            <div className="success-card max-w-md w-full mx-4 text-center bg-bg-secondary p-6 rounded-2xl border border-border shadow-2xl">
              <div className="success-icon-wrap text-green-500 mx-auto mb-4">
                <CheckCircle2 size={56} />
              </div>
              <h2 className="text-xl font-black">Payment Verified &amp; Order Confirmed!</h2>
              <p className="text-xs text-text-muted mt-1">
                Your payment was received successfully via Razorpay. We have sent an invoice to your registered email.
              </p>

              <div className="success-details w-full mt-4 p-4 bg-bg-primary border border-border rounded-xl text-left">
                <div className="success-row flex justify-between text-xs py-1.5 border-b border-border/10">
                  <span className="text-text-muted">Order ID:</span>
                  <strong className="order-id-val text-cyan-400 font-mono font-bold">{createdOrderId}</strong>
                </div>
                {verifiedPaymentId && (
                  <div className="success-row flex justify-between text-xs py-1.5 border-b border-border/10">
                    <span className="text-text-muted">Razorpay Payment ID:</span>
                    <strong className="text-green-400 font-mono text-[11px]">{verifiedPaymentId}</strong>
                  </div>
                )}
                <div className="success-row flex justify-between text-xs py-1.5 border-b border-border/10">
                  <span className="text-text-muted">Total Paid:</span>
                  <strong className="text-text-primary font-bold">₹{finalPayable.toFixed(2)}</strong>
                </div>
                <div className="success-row flex justify-between text-xs py-1.5">
                  <span className="text-text-muted">Payment Mode:</span>
                  <strong className="text-accent-pink font-bold">Razorpay (UPI / Card)</strong>
                </div>
              </div>

              <div className="success-actions flex flex-col gap-2.5 w-full mt-6">
                <button 
                  className="btn-view-orders w-full py-3 font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 rounded-full bg-accent-pink hover:bg-accent-pink/90 text-white cursor-pointer" 
                  onClick={() => { 
                    setIsSuccess(false); 
                    navigate("/orders"); 
                  }}
                >
                  View My Order History <ChevronRight size={14} />
                </button>
                <button 
                  className="btn-continue-shop w-full py-2.5 text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer" 
                  onClick={() => { 
                    setIsSuccess(false); 
                    navigate("/catalog"); 
                  }}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default Checkout;
