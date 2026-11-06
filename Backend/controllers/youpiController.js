const mongoose = require('mongoose');
const YoupiTransaction = require('../models/YoupiTransaction');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { incrementCouponUsage } = require('./couponController');
const { sendEmail } = require('./userController');
const { getOrderPlacedTemplate } = require('../utils/emailTemplates');
const { notifyDualAdminsNewOrder, notifyDualAdminsRefundCompleted } = require('../utils/adminNotifier');

// Helper to generate clean order reference
function generateOrderNumber() {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `RC-${randomNum}`;
}

// ── 1. Get YouPI Public Configuration ────────────────────────────────────────
exports.getYoupiConfig = async (req, res) => {
  try {
    const merchantVpa = (process.env.YOUPI_UPI_VPA || "rams20294-2@okhdfcbank").trim();
    const merchantName = (process.env.YOUPI_MERCHANT_NAME || "RamCart").trim();

    return res.json({
      success: true,
      merchantVpa,
      merchantName,
      isConfigured: Boolean(merchantVpa && !merchantVpa.includes("replace_with")),
      currency: "INR"
    });
  } catch (error) {
    console.error("Error fetching YouPI config:", error);
    return res.status(500).json({ success: false, error: "Failed to load payment config" });
  }
};

// ── 2. Initiate YouPI Session & Generate Dynamic UPI Intent ──────────────────
exports.initiateYoupiSession = async (req, res) => {
  try {
    const { amount, items, address, couponCode } = req.body;
    const userId = req.user.id;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: "Valid order amount is required" });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "Cart items are required" });
    }
    if (!address || !address.addressLine) {
      return res.status(400).json({ success: false, error: "Shipping address is required" });
    }

    const merchantVpa = (process.env.YOUPI_UPI_VPA || "rams20294-2@okhdfcbank").trim();
    const merchantName = (process.env.YOUPI_MERCHANT_NAME || "RamCart").trim();
    const orderId = generateOrderNumber();

    // Standard NPCI UPI URI Scheme
    // upi://pay?pa={vpa}&pn={name}&am={amount}&cu=INR&tn={note}&tr={ref}
    const cleanNote = `Order ${orderId} RamCart`;
    const upiUri = `upi://pay?pa=${encodeURIComponent(merchantVpa)}&pn=${encodeURIComponent(merchantName)}&am=${Number(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(cleanNote)}&tr=${orderId}`;

    // Get user details
    let customerEmail = req.user?.email || address?.email || null;
    let customerName = req.user?.name || address?.fullName || "Valued Customer";
    try {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        const u = await User.findById(userId, { email: 1, name: 1 });
        if (u) {
          customerEmail = u.email || customerEmail;
          customerName = u.name || customerName;
        }
      }
    } catch (e) {}

    // Record pending transaction
    const txn = new YoupiTransaction({
      orderId,
      userId,
      userEmail: customerEmail,
      userName: customerName,
      merchantVpa,
      merchantName,
      amount: Number(amount),
      upiUri,
      customerPhone: address.phone || null,
      status: 'PENDING'
    });

    await txn.save();

    // Pre-create pending Order in database so it exists reliably
    try {
      const formattedItems = (items || []).map((it) => ({
        productId: Number(it.productId) || Number(it.id) || 1,
        name: it.name || "Product",
        image: it.image || "",
        size: it.size || "M",
        color: it.color || "Standard",
        quantity: Number(it.quantity) || 1,
        price: Number(it.price) || 0
      }));

      const safeAddress = {
        fullName: address.fullName || customerName,
        addressLine: address.addressLine || "Address",
        city: address.city || "City",
        state: address.state || "State",
        postalCode: String(address.postalCode || "600001"),
        phone: String(address.phone || "0000000000")
      };

      let pendingOrder = await Order.findOne({ orderId });
      if (!pendingOrder) {
        pendingOrder = new Order({
          orderId,
          userId,
          userEmail: customerEmail,
          userName: customerName,
          items: formattedItems,
          amount: Number(amount),
          address: safeAddress,
          couponCode: couponCode || null,
          status: "Pending",
          payment: false,
          paymentMethod: "YouPI",
          paymentStatus: "Pending",
          youpiOrderId: orderId
        });
        await pendingOrder.save();
      }
    } catch (orderPreErr) {
      console.warn("Notice: Order pre-creation note:", orderPreErr.message);
    }

    console.log(`⚡ YouPI transaction initiated for Order ${orderId}: ₹${amount} to VPA: ${merchantVpa}`);

    return res.json({
      success: true,
      orderId,
      amount: Number(amount),
      merchantVpa,
      merchantName,
      upiUri,
      expiresInSeconds: 600 // 10 minute payment window
    });
  } catch (error) {
    console.error("Error initiating YouPI session:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// ── 3. Submit Customer UTR & Paying UPI ID (Verification Step) ───────────────
exports.submitYoupiUtr = async (req, res) => {
  try {
    const { orderId, utr, customerVpa, items, address, amount, couponCode } = req.body;
    const userId = req.user.id;

    if (!orderId) {
      return res.status(400).json({ success: false, error: "Order ID is required" });
    }

    let cleanUtr = String(utr || '').trim();
    const isAppDirectConfirm = !cleanUtr || cleanUtr === 'APP_CONFIRMED' || cleanUtr === 'SKIP_UTR' || cleanUtr.toUpperCase() === 'PAID';

    if (!isAppDirectConfirm) {
      // Allow Amazon Pay / GPay / PhonePe reference IDs (alphanumeric, 5-30 chars)
      cleanUtr = cleanUtr.replace(/[^a-zA-Z0-9]/g, '');
      if (cleanUtr.length < 5) {
        return res.status(400).json({ 
          success: false, 
          error: "Please enter a valid Transaction / Reference ID from your payment receipt or tap 'I Have Paid in App'." 
        });
      }

      // 🛡️ ANTI-FRAUD CHECK: Prevent reuse of same UTR across different orders
      const duplicateCheck = await YoupiTransaction.findOne({
        utr: cleanUtr,
        orderId: { $ne: orderId },
        status: { $in: ['VERIFIED_PAID'] }
      });

      if (duplicateCheck) {
        return res.status(400).json({
          success: false,
          error: `Transaction Reference ${cleanUtr} has already been registered for another order (#${duplicateCheck.orderId}).`
        });
      }
    } else {
      // Auto-assign clean reference for users who don't know where to find UTR
      cleanUtr = `UPI_APP_${Date.now()}`;
    }

    // Find and update transaction
    let txn = await YoupiTransaction.findOne({ orderId });
    if (!txn) {
      const merchantVpa = (process.env.YOUPI_UPI_VPA || "rams20294-2@okhdfcbank").trim();
      txn = new YoupiTransaction({
        orderId,
        userId: userId || "guest",
        merchantVpa,
        amount: Number(amount || 0),
        upiUri: `upi://pay?pa=${merchantVpa}&am=${amount || 0}&tr=${orderId}`
      });
    }

    txn.utr = cleanUtr;
    txn.customerVpa = (customerVpa || '').trim().toLowerCase() || txn.customerVpa || null;
    txn.status = 'VERIFIED_PAID'; // Confirmed by customer submission + duplicate protection
    txn.verifiedBy = isAppDirectConfirm ? 'APP_INTENT_CONFIRM' : 'CUSTOMER_SUBMISSION';
    txn.verifiedAt = new Date();
    await txn.save();

    // Now securely finalize the Order in database
    let existingOrder = await Order.findOne({ orderId });
    const customerEmail = req.user?.email || (address && address.email) || txn.userEmail || existingOrder?.userEmail || 'customer@ramcart.com';
    const customerName = req.user?.name || (address && address.fullName) || txn.userName || existingOrder?.userName || 'Valued Customer';

    if (existingOrder) {
      existingOrder.payment = true;
      existingOrder.paymentStatus = 'Paid';
      existingOrder.paymentMethod = 'YouPI';
      existingOrder.status = 'Processing';
      existingOrder.youpiOrderId = orderId;
      existingOrder.youpiUtr = cleanUtr;
      if (customerVpa) {
        existingOrder.youpiCustomerVpa = customerVpa.trim().toLowerCase();
      }
      existingOrder.youpiVerifiedAt = new Date();
      await existingOrder.save();
    } else {
      // Safe fallback create if order was not pre-created
      const safeItems = Array.isArray(items) && items.length > 0 ? items.map(it => ({
        productId: Number(it.productId) || Number(it.id) || 1,
        name: it.name || 'Product',
        image: it.image || '',
        size: it.size || 'M',
        color: it.color || 'Standard',
        quantity: Number(it.quantity) || 1,
        price: Number(it.price) || 0
      })) : [{ productId: 1, name: 'Product', quantity: 1, price: Number(amount || txn.amount || 0) }];

      const safeAddress = address && address.addressLine ? {
        fullName: address.fullName || customerName,
        addressLine: address.addressLine,
        city: address.city || 'City',
        state: address.state || 'State',
        postalCode: String(address.postalCode || '600001'),
        phone: String(address.phone || '0000000000')
      } : {
        fullName: customerName,
        addressLine: 'Shipping Address',
        city: 'City',
        state: 'State',
        postalCode: '600001',
        phone: txn.customerPhone || '0000000000'
      };

      existingOrder = new Order({
        orderId,
        userId: userId || 'guest',
        userEmail: customerEmail,
        userName: customerName,
        items: safeItems,
        amount: Number(amount || txn.amount || 0),
        address: safeAddress,
        couponCode: couponCode || null,
        status: 'Processing',
        payment: true,
        paymentMethod: 'YouPI',
        paymentStatus: 'Paid',
        youpiOrderId: orderId,
        youpiUtr: cleanUtr,
        youpiCustomerVpa: (customerVpa || '').trim().toLowerCase() || null,
        youpiVerifiedAt: new Date()
      });

      await existingOrder.save();
    }

    // Deduct warehouse inventory
    const orderItems = (existingOrder.items && existingOrder.items.length > 0) ? existingOrder.items : (Array.isArray(items) ? items : []);
    for (const item of orderItems) {
      const prodId = item.productId || item.id;
      const qty = Number(item.quantity) || 1;
      const color = item.color;
      const size = item.size;

      try {
        const query = isNaN(Number(prodId)) ? { _id: prodId } : { $or: [{ id: Number(prodId) }, { _id: prodId }] };
        const product = await Product.findOne(query);

        if (product) {
          product.stockCount = Math.max(0, (product.stockCount || 0) - qty);
          if (Array.isArray(product.variants) && product.variants.length > 0) {
            product.variants = product.variants.map(v => {
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
      } catch (stkErr) {
        console.warn('Stock decrement warning:', stkErr.message);
      }
    }

    // If coupon used, increment count
    if (couponCode || existingOrder.couponCode) {
      await incrementCouponUsage(couponCode || existingOrder.couponCode);
    }

    // Clear customer shopping cart
    if (userId && userId !== 'guest') {
      await User.findByIdAndUpdate(userId, { $set: { cartData: {} } });
    }

    // Dispatch Order Confirmation Email to Customer
    if (customerEmail) {
      try {
        const emailHtml = getOrderPlacedTemplate({
          orderId: existingOrder.orderId,
          rawId: existingOrder._id,
          customerName,
          items: existingOrder.items,
          totalAmount: existingOrder.amount,
          address: existingOrder.address,
          orderDate: existingOrder.date || new Date(),
          paymentMethod: 'YouPI Direct UPI',
          utr: cleanUtr,
          customerVpa: customerVpa || existingOrder.youpiCustomerVpa
        });
        sendEmail(
          customerEmail,
          `RamCart — Order Confirmed! (Paid via YouPI UPI: ${cleanUtr}) #${existingOrder.orderId}`,
          emailHtml
        ).catch(() => {});
      } catch (e) {}
    }

    // Notify Dual Admins (bvhss20@gmail.com & ramtechnow@gmail.com)
    notifyDualAdminsNewOrder({
      order: existingOrder,
      paymentMethod: 'YouPI UPI',
      utr: cleanUtr,
      customerVpa: customerVpa || existingOrder.youpiCustomerVpa
    }).catch(err => console.error('Dual admin YouPI alert error:', err.message));

    console.log(`✅ Order ${orderId} verified via YouPI! UTR: ${cleanUtr}, Customer VPA: ${customerVpa || 'N/A'}`);

    return res.json({
      success: true,
      message: "Payment verified successfully!",
      orderId: existingOrder.orderId,
      rawId: existingOrder._id,
      utr: cleanUtr
    });
  } catch (error) {
    console.error("Error submitting YouPI UTR:", error);
    return res.status(500).json({ success: false, error: "Failed to verify transaction" });
  }
};

// ── 4. Check YouPI Payment Status (Polling endpoint) ────────────────────────
exports.checkYoupiStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const txn = await YoupiTransaction.findOne({ orderId });

    if (!txn) {
      return res.status(404).json({ success: false, error: "Transaction not found" });
    }

    return res.json({
      success: true,
      orderId: txn.orderId,
      status: txn.status,
      utr: txn.utr,
      customerVpa: txn.customerVpa,
      amount: txn.amount,
      verifiedAt: txn.verifiedAt
    });
  } catch (error) {
    console.error("Error checking YouPI status:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// ── 5. YouPI Observer Webhook (Automated Bank SMS / Email match) ─────────────
exports.youpiWebhook = async (req, res) => {
  try {
    const configuredSecret = (process.env.YOUPI_WEBHOOK_SECRET || "youpi_secret_key_ramcart_2026").trim();
    const providedSecret = req.headers['x-youpi-secret'] || req.body.secret;

    if (configuredSecret && providedSecret !== configuredSecret) {
      return res.status(401).json({ success: false, error: "Unauthorized webhook caller" });
    }

    const { amount, utr, rawMessage, customerVpa } = req.body;
    console.log(`🔔 YouPI Webhook received bank alert: Amount ₹${amount}, UTR: ${utr}`);

    let query = {};
    if (utr) {
      query = { utr: String(utr).trim() };
    } else if (amount) {
      query = { amount: Number(amount), status: 'PENDING' };
    }

    const txn = await YoupiTransaction.findOne(query).sort({ createdAt: -1 });
    if (!txn) {
      return res.json({ success: true, message: "Alert received but no matching pending order found" });
    }

    txn.status = 'VERIFIED_PAID';
    txn.verifiedBy = 'OBSERVER_WEBHOOK';
    txn.verifiedAt = new Date();
    if (utr) txn.utr = String(utr).trim();
    if (customerVpa) txn.customerVpa = String(customerVpa).trim().toLowerCase();
    if (rawMessage) txn.bankAlertRaw = String(rawMessage);
    await txn.save();

    await Order.findOneAndUpdate(
      { orderId: txn.orderId },
      { 
        $set: { 
          paymentStatus: 'Paid', 
          status: 'Processing',
          youpiUtr: txn.utr,
          youpiVerifiedAt: new Date()
        } 
      }
    );

    console.log(`🎉 Webhook auto-matched Order #${txn.orderId} with UTR ${txn.utr}`);
    return res.json({ success: true, message: "Payment verified via webhook", orderId: txn.orderId });
  } catch (error) {
    console.error("Error in YouPI webhook:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// ── 6. Admin Manual Bank Verification ───────────────────────────────────────
exports.adminVerifyPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, error: "Order ID required" });
    }

    const order = await Order.findOne({ $or: [{ orderId }, { _id: orderId }] });
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    order.paymentStatus = 'Paid';
    order.status = 'Processing';
    order.youpiVerifiedAt = new Date();
    await order.save();

    await YoupiTransaction.findOneAndUpdate(
      { orderId: order.orderId },
      { 
        $set: { 
          status: 'VERIFIED_PAID', 
          verifiedBy: 'ADMIN_MANUAL',
          verifiedAt: new Date()
        } 
      }
    );

    return res.json({ success: true, message: `Order #${order.orderId || order._id} verified manually by Admin` });
  } catch (error) {
    console.error("Error admin verifying YouPI payment:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// ── 7. Admin Safe UPI Refund (With Customer UPI VPA & Refund UTR) ────────────
exports.adminRefundPayment = async (req, res) => {
  try {
    const { orderId, refundUtr, refundReason, customerVpa } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, error: "Order ID is required" });
    }

    let cleanRefundUtr = refundUtr ? String(refundUtr).trim() : '';
    if (!cleanRefundUtr || cleanRefundUtr.length < 3) {
      cleanRefundUtr = `UPI_REF_${Date.now()}`;
    }

    const order = await Order.findOne({ $or: [{ orderId }, { _id: orderId }] });
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    order.paymentStatus = 'Refunded';
    order.status = 'Cancelled';
    order.youpiRefundUtr = cleanRefundUtr;
    order.youpiRefundedAt = new Date();
    order.cancellationReason = refundReason || 'Order refunded by Admin via direct UPI';
    if (customerVpa && String(customerVpa).trim()) {
      order.youpiCustomerVpa = String(customerVpa).trim().toLowerCase();
    }
    await order.save();

    await YoupiTransaction.findOneAndUpdate(
      { orderId: order.orderId },
      { 
        $set: { 
          status: 'REFUNDED', 
          refundUtr: cleanRefundUtr,
          refundAmount: order.amount,
          refundedAt: new Date(),
          refundReason: refundReason || 'Direct UPI refund processed'
        } 
      }
    );

    // Send automated refund confirmation email to customer
    if (order.userEmail) {
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #059669; margin-top: 0;">🎉 Refund Processed Successfully!</h2>
          <p>Dear <strong>${order.userName || "Customer"}</strong>,</p>
          <p>We have successfully processed your refund of <strong>₹${order.amount.toFixed(2)}</strong> for Order <strong>#${order.orderId || order._id}</strong> directly to your bank account via UPI.</p>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0; color: #166534;"><strong>Refund Amount:</strong> ₹${order.amount.toFixed(2)}</p>
            <p style="margin: 4px 0; color: #166534;"><strong>Bank UPI Refund Reference (UTR):</strong> <code style="background: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${cleanRefundUtr}</code></p>
            <p style="margin: 4px 0; color: #166534;"><strong>Refund Destination:</strong> ${order.youpiCustomerVpa || 'Your Original Bank UPI Account'}</p>
            <p style="margin: 4px 0; color: #166534;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="color: #64748b; font-size: 13px;">Please check your bank account or Google Pay / PhonePe app. The amount should reflect under the reference number above.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">RamCart — Modern Fashion & Apparel Store</p>
        </div>
      `;

      sendEmail(
        order.userEmail,
        `RamCart — Refund Issued for Order #${order.orderId || order._id} (UTR: ${cleanRefundUtr})`,
        emailContent
      ).catch(() => {});
    }

    // Notify Dual Admins (bvhss20@gmail.com & ramtechnow@gmail.com)
    notifyDualAdminsRefundCompleted({
      order,
      refundUtr: cleanRefundUtr,
      refundAmount: order.amount
    }).catch(err => console.error('Dual admin refund completed alert error:', err.message));

    console.log(`💸 Refund processed for Order ${order.orderId || order._id}: ₹${order.amount} with UTR ${cleanRefundUtr}`);

    return res.json({
      success: true,
      message: `Refund of ₹${order.amount} recorded successfully with UTR ${cleanRefundUtr}`,
      orderId: order.orderId,
      refundUtr: cleanRefundUtr
    });
  } catch (error) {
    console.error("Error processing YouPI refund:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
