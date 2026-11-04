// Helper to generate clean alphabetic + numeric RamCart Order IDs (e.g. RC-784920)
function generateOrderNumber() {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `RC-${randomNum}`;
}

const crypto = require('crypto');
const Razorpay = require('razorpay');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { incrementCouponUsage } = require('./couponController');
const { sendEmail } = require('./userController');
const { getOrderPlacedTemplate } = require('../utils/emailTemplates');

// Helper to get initialized Razorpay instance
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.trim() : "";
  const key_secret = process.env.RAZORPAY_KEY_SECRET ? process.env.RAZORPAY_KEY_SECRET.trim() : "";

  if (!key_id || !key_secret || key_id.includes("replace_with_your_key_id")) {
    return null;
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
};

/**
 * GET /payment/config
 * Returns public Razorpay configuration (Key ID & mode)
 */
exports.getPaymentConfig = async (req, res) => {
  try {
    const rawKeyId = process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.trim() : "";
    const rawKeySecret = process.env.RAZORPAY_KEY_SECRET ? process.env.RAZORPAY_KEY_SECRET.trim() : "";

    const isPlaceholder = !rawKeyId || rawKeyId.includes("replace_with_your_key_id") || !rawKeySecret || rawKeySecret.includes("replace_with_your_key_secret");
    const isConfigured = Boolean(rawKeyId && rawKeySecret && !isPlaceholder);
    const isTestMode = rawKeyId.startsWith("rzp_test_") || isPlaceholder;

    return res.json({
      success: true,
      keyId: isPlaceholder ? "" : rawKeyId,
      isConfigured,
      isTestMode,
      currency: "INR",
    });
  } catch (error) {
    console.error("Error fetching payment config:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch payment config" });
  }
};

/**
 * POST /payment/create-order
 * Creates a Razorpay Order ID for checkout
 */
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;
    const userId = req.user.id;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: "Valid order amount is required" });
    }

    const rawKeyId = process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.trim() : "";
    const rawKeySecret = process.env.RAZORPAY_KEY_SECRET ? process.env.RAZORPAY_KEY_SECRET.trim() : "";
    const isPlaceholder = !rawKeyId || rawKeyId.includes("replace_with_your_key_id") || !rawKeySecret || rawKeySecret.includes("replace_with_your_key_secret");

    if (isPlaceholder) {
      return res.status(400).json({
        success: false,
        error: "Razorpay Test Key is not configured yet in Backend/.env. Please paste your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from https://dashboard.razorpay.com/app/keys"
      });
    }

    const instance = getRazorpayInstance();
    if (!instance) {
      return res.status(500).json({
        success: false,
        error: "Razorpay instance initialization failed. Check your API credentials in Backend/.env"
      });
    }

    // Razorpay requires amount in smallest currency unit (Paise for INR, ₹1 = 100 paise)
    const amountInPaise = Math.round(Number(amount) * 100);

    const options = {
      amount: amountInPaise,
      currency: currency || "INR",
      receipt: receipt || `rcpt_${Date.now()}_${String(userId).slice(-4)}`,
      notes: {
        userId: String(userId),
        userEmail: req.user?.email || "",
      }
    };

    const razorpayOrder = await instance.orders.create(options);

    return res.json({
      success: true,
      order: razorpayOrder,
      keyId: rawKeyId,
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to initialize Razorpay transaction"
    });
  }
};

/**
 * POST /payment/verify-payment
 * Cryptographically verifies payment signature & persists order to MongoDB
 */
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      amount,
      address,
      couponCode
    } = req.body;

    const userId = req.user.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: "Missing Razorpay verification credentials (order_id, payment_id, or signature)"
      });
    }

    if (!items || items.length === 0 || !amount || !address) {
      return res.status(400).json({
        success: false,
        error: "Missing required order details (items, amount, or address)"
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET ? process.env.RAZORPAY_KEY_SECRET.trim() : "";
    if (!secret) {
      return res.status(500).json({
        success: false,
        error: "Server configuration missing RAZORPAY_KEY_SECRET"
      });
    }

    // Verify HMAC SHA256 Signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.error(`🚨 Payment Signature Tampering Detected! Order: ${razorpay_order_id}, Payment: ${razorpay_payment_id}`);
      return res.status(400).json({
        success: false,
        error: "Payment verification failed. Invalid digital signature."
      });
    }

    // Resolve user profile info for order and notifications
    let user = null;
    try {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId, { email: 1, name: 1 });
      }
      if (!user) {
        user = await User.findOne({ $or: [{ email: req.user?.email }, { _id: userId }] });
      }
    } catch (uErr) {
      console.warn("User lookup note:", uErr.message);
    }

    const customerEmail = req.user?.email || user?.email || address?.email;
    const customerName = req.user?.name || user?.name || address?.fullName || "Valued Customer";

    // Create and save new verified Order in database
    const newOrder = new Order({
      userId,
      userEmail: customerEmail,
      userName: customerName,
      items,
      amount: Number(amount),
      address,
      couponCode: couponCode || null,
      status: "Pending",
      payment: true,
      paymentMethod: "Razorpay",
      paymentStatus: "Paid",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      notificationSeen: true,
      date: new Date(),
    });

    await newOrder.save();
    console.log(`✅ Order #${newOrder._id} saved with verified Razorpay Payment ID: ${razorpay_payment_id}`);

    // Deduct stock for each purchased item accurately
    for (const item of items) {
      const prodId = item.id || item.productId;
      const qty = Number(item.quantity) || 1;
      const color = item.color;
      const size = item.size;

      try {
        const query = isNaN(Number(prodId)) ? { _id: prodId } : { $or: [{ id: Number(prodId) }, { _id: prodId }] };
        const product = await Product.findOne(query);

        if (product) {
          product.stockCount = Math.max(0, (product.stockCount || 0) - qty);

          if (Array.isArray(product.variants) && product.variants.length > 0) {
            product.variants = product.variants.map((v) => {
              const vObj = v.toObject ? v.toObject() : v;
              const matchColor = !color || (vObj.color && vObj.color.toLowerCase() === String(color).toLowerCase());
              const matchSize = !size || (vObj.size && vObj.size.toLowerCase() === String(size).toLowerCase());
              if (matchColor && matchSize) {
                return { ...vObj, stock: Math.max(0, (vObj.stock || 0) - qty) };
              }
              return vObj;
            });
          }

          await product.save();
        }
      } catch (err) {
        console.warn(`Could not update stock for product ${prodId}:`, err.message);
      }
    }

    // Increment coupon usage if used
    if (couponCode) {
      try {
        await incrementCouponUsage(couponCode);
      } catch (cErr) {
        console.warn(`Could not increment coupon usage for ${couponCode}:`, cErr.message);
      }
    }

    // Trigger Order Placed Confirmation Email asynchronously
    if (customerEmail) {
      try {
        const emailHtml = getOrderPlacedTemplate({
          orderId: newOrder._id,
          customerName,
          items: newOrder.items,
          totalAmount: newOrder.amount,
          address: newOrder.address,
        });

        sendEmail(
          customerEmail,
          `RamCart — Payment Received & Order Confirmed #${String(newOrder._id).substring(0, 8).toUpperCase()}`,
          emailHtml
        ).then(result => {
          console.log(`📧 Order confirmation email to ${customerEmail}:`, result);
        }).catch(err => {
          console.error(`⚠️ Order confirmation email failed for ${customerEmail}:`, err.message);
        });
      } catch (eErr) {
        console.error("Order placed email construction failed:", eErr.message);
      }
    }

    return res.json({
      success: true,
      orderId: newOrder.orderId || String(newOrder._id),
      rawOrderId: String(newOrder._id),
      paymentId: razorpay_payment_id,
      message: "Payment successfully verified and order placed!"
    });
  } catch (error) {
    console.error("Payment verification transaction failed:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to finalize verified order transaction"
    });
  }
};

/**
 * POST /payment/refund
 * Initiates a full or partial refund on a paid Razorpay order
 */
exports.refundRazorpayOrder = async (req, res) => {
  try {
    const { orderId, reason, amount } = req.body;
    const userId = req.user.id;

    if (!orderId) {
      return res.status(400).json({ success: false, error: "Missing required orderId" });
    }

    const order = await Order.findOne({
      $or: [
        { orderId: orderId },
        { _id: mongoose.Types.ObjectId.isValid(orderId) ? orderId : null }
      ]
    });
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // Ensure user is authorized (either owner or admin)
    const isAdmin = req.user?.isAdmin || req.user?.role === 'admin';
    if (!isAdmin && order.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, error: "Unauthorized to request refund for this order" });
    }

    if (!order.razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        error: "No Razorpay Payment ID associated with this order to refund"
      });
    }

    if (order.paymentStatus === "Refunded") {
      return res.status(400).json({ success: false, error: "This order has already been refunded" });
    }

    const instance = getRazorpayInstance();
    if (!instance) {
      return res.status(500).json({ success: false, error: "Razorpay instance not configured" });
    }

    // Calculate refund amount in paise (default to full order amount)
    const refundAmountInPaise = amount ? Math.round(Number(amount) * 100) : Math.round(order.amount * 100);

    const refundResponse = await instance.payments.refund(order.razorpayPaymentId, {
      amount: refundAmountInPaise,
      notes: {
        orderId: String(order._id),
        reason: reason || "Customer requested refund"
      }
    });

    order.paymentStatus = "Refunded";
    order.cancellationReason = (order.cancellationReason ? order.cancellationReason + " | " : "") + `Refund ID: ${refundResponse.id}`;
    await order.save();

    console.log(`💸 Refund processed for order #${order._id}: Refund ID ${refundResponse.id}`);

    return res.json({
      success: true,
      refund: refundResponse,
      message: "Refund processed successfully through Razorpay"
    });
  } catch (error) {
    console.error("Razorpay refund error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to process Razorpay refund"
    });
  }
};
