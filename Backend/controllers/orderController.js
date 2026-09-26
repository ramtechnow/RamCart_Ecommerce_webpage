const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { incrementCouponUsage } = require('./couponController');
const { sendEmail } = require('./userController');

// Place a new Order (Authenticated User)
exports.placeOrder = async (req, res) => {
  try {
    const { items, amount, address, couponCode } = req.body;
    const userId = req.user.id;

    if (!items || items.length === 0 || !amount || !address) {
      return res.status(400).json({ success: false, error: "Missing required order details" });
    }

    // Create new Order document
    const newOrder = new Order({
      userId,
      items,
      amount,
      address,
      couponCode: couponCode || null,
      status: "Pending",
      payment: true,
    });

    await newOrder.save();

    // Deduct stock for each purchased item accurately in real time
    for (const item of items) {
      const prodId = item.id;
      const qty = Number(item.quantity) || 1;
      const color = item.color;
      const size = item.size;

      try {
        const query = isNaN(Number(prodId)) ? { _id: prodId } : { $or: [{ id: Number(prodId) }, { _id: prodId }] };
        const product = await Product.findOne(query);

        if (product) {
          // Deduct overall stockCount (minimum 0)
          product.stockCount = Math.max(0, (product.stockCount || 0) - qty);

          // Deduct variant stock if variant matches
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
          console.log(`📦 Real-time inventory sync: Product ${product.id} stock decreased by ${qty}. New stock: ${product.stockCount}`);
        }
      } catch (stockErr) {
        console.warn(`Could not sync stock for item ${prodId}:`, stockErr.message);
      }
    }

    // If a coupon was used, increment its usage counter
    if (couponCode) {
      await incrementCouponUsage(couponCode);
    }

    // Clear user's shopping cart on successful checkout
    await User.findByIdAndUpdate(userId, { $set: { cartData: {} } });

    // Send order confirmation email (fire-and-forget, non-blocking)
    try {
      const user = await User.findById(userId, { email: 1, name: 1 });
      if (user && user.email) {
        const itemsHtml = (items || []).map(item => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${item.name || item.title || 'Product'}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.size || '-'}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity || 1}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">₹${(item.price * (item.quantity || 1)).toFixed(2)}</td>
          </tr>
        `).join('');

        const emailHtml = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e8e8e8;">
            <div style="background:linear-gradient(135deg,#ff8906,#e53170);padding:28px 32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;letter-spacing:1px;">🛒 RamCart</h1>
              <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;font-size:14px;">Order Confirmation</p>
            </div>
            <div style="padding:28px 32px;">
              <p style="font-size:15px;color:#333;">Hi <strong>${user.name || 'Customer'}</strong>,</p>
              <p style="color:#555;line-height:1.6;">Thank you for your order! We've received it and it's being processed. Here's a summary of what you ordered:</p>

              <div style="background:#fff9f0;border-left:4px solid #ff8906;padding:14px 18px;border-radius:6px;margin:20px 0;">
                <p style="margin:0;font-size:13px;color:#888;">Order ID</p>
                <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#333;word-break:break-all;">${newOrder._id}</p>
              </div>

              <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:13px;">
                <thead>
                  <tr style="background:#f7f7f7;">
                    <th style="padding:10px 12px;text-align:left;color:#555;font-weight:600;">Item</th>
                    <th style="padding:10px 12px;text-align:center;color:#555;font-weight:600;">Size</th>
                    <th style="padding:10px 12px;text-align:center;color:#555;font-weight:600;">Qty</th>
                    <th style="padding:10px 12px;text-align:right;color:#555;font-weight:600;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding:12px;text-align:right;font-weight:700;color:#333;font-size:14px;">Total Paid:</td>
                    <td style="padding:12px;text-align:right;font-weight:800;color:#ff8906;font-size:16px;">₹${Number(amount).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>

              ${address ? `
              <div style="background:#f9f9f9;padding:14px 18px;border-radius:8px;margin-bottom:20px;font-size:13px;color:#555;line-height:1.7;">
                <p style="margin:0 0 6px;font-weight:700;color:#333;">📦 Delivery Address</p>
                <p style="margin:0;">${address.fullName || ''}<br/>${address.addressLine || ''}<br/>${address.city || ''}, ${address.state || ''} - ${address.postalCode || ''}</p>
              </div>
              ` : ''}

              <p style="color:#555;line-height:1.6;">We'll notify you when your order is shipped. You can track your order status anytime from your <strong>Order History</strong> page.</p>
            </div>
            <div style="background:#f7f7f7;padding:16px 32px;text-align:center;border-top:1px solid #e8e8e8;">
              <p style="margin:0;font-size:11px;color:#aaa;">© ${new Date().getFullYear()} RamCart by RamTechnow Technologies · Demo Platform · No real currency involved</p>
            </div>
          </div>
        `;
        sendEmail(user.email, '🛒 RamCart — Order Confirmed! Your order is being processed', emailHtml);
      }
    } catch (emailErr) {
      console.error("⚠️ Order confirmation email failed (non-critical):", emailErr.message);
    }

    console.log(`Order placed successfully by user ${userId}. Order ID: ${newOrder._id}`);
    res.json({ success: true, message: "Order placed successfully!", orderId: newOrder._id });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};


// Get orders history for the authenticated user
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ userId }).sort({ date: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get all orders (Admin Only)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ date: -1 });
    
    // Resolve usernames or emails for visual reporting
    const userIds = orders.map(o => o.userId);
    const users = await User.find({ _id: { $in: userIds } }, { email: 1, name: 1 });
    const userMap = users.reduce((acc, u) => {
      acc[u._id.toString()] = u;
      return acc;
    }, {});

    const enrichedOrders = orders.map(order => {
      const orderObj = order.toObject();
      const user = userMap[order.userId];
      orderObj.userEmail = user ? user.email : (order.address?.email || "Deleted User");
      orderObj.userName = user ? user.name : (order.address?.fullName || "Deleted User");
      return orderObj;
    });

    res.json(enrichedOrders);
  } catch (error) {
    console.error("Error fetching all orders for admin:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Update Order status (Admin Only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ success: false, error: "Missing required status fields" });
    }

    const prevOrder = await Order.findById(orderId);
    if (!prevOrder) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: { status, notificationSeen: false } },
      { new: true }
    );

    // If order was cancelled and was not cancelled before, restore stock
    if (status === "Cancelled" && prevOrder.status !== "Cancelled") {
      for (const item of (updatedOrder.items || [])) {
        try {
          const prodId = item.id;
          const qty = Number(item.quantity) || 1;
          const query = isNaN(Number(prodId)) ? { _id: prodId } : { $or: [{ id: Number(prodId) }, { _id: prodId }] };
          const product = await Product.findOne(query);
          if (product) {
            product.stockCount = (product.stockCount || 0) + qty;
            await product.save();
            console.log(`🔄 Restocked cancelled order item: Product ${product.id} +${qty}`);
          }
        } catch (rErr) {
          console.warn("Could not restock cancelled item:", rErr.message);
        }
      }
    }

    if (updatedOrder) {
      console.log(`🚚 Order ${orderId} shipping status updated to: ${status}`);
      res.json({ success: true, order: updatedOrder });
    } else {
      res.status(404).json({ success: false, error: "Order not found" });
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get all unseen orders for user
exports.getUnseenOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ userId, notificationSeen: false });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching unseen orders:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Mark order notification as seen
exports.markOrderAsSeen = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    if (!orderId) {
      return res.status(400).json({ success: false, error: "Missing orderId field" });
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId, userId },
      { $set: { notificationSeen: true } },
      { new: true }
    );

    if (updatedOrder) {
      res.json({ success: true, message: "Order notification marked as seen" });
    } else {
      res.status(404).json({ success: false, error: "Order not found" });
    }
  } catch (error) {
    console.error("Error marking order as seen:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Delete order (Admin Only)
exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, error: "Missing orderId field" });
    }

    const deleted = await Order.findByIdAndDelete(orderId);
    if (deleted) {
      console.log(`🗑️ Order ${orderId} deleted successfully by admin`);
      res.json({ success: true, message: "Order deleted successfully" });
    } else {
      res.status(404).json({ success: false, error: "Order not found" });
    }
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
