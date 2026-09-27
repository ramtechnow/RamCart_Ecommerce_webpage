const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { incrementCouponUsage } = require('./couponController');
const { sendEmail } = require('./userController');
const {
  getOrderPlacedTemplate,
  getOrderDeliveredTemplate,
  getOrderCancelledTemplate
} = require('../utils/emailTemplates');

/**
 * Safe stock restoration helper to prevent double restock
 * Restores both overall product stock and matching variant stock
 */
async function restoreOrderStock(order) {
  if (!order || !Array.isArray(order.items)) return;
  for (const item of order.items) {
    try {
      const prodId = item.id || item.productId;
      const qty = Number(item.quantity) || 1;
      const color = item.color;
      const size = item.size;

      const query = isNaN(Number(prodId)) ? { _id: prodId } : { $or: [{ id: Number(prodId) }, { _id: prodId }] };
      const product = await Product.findOne(query);

      if (product) {
        // Restore overall stock count
        product.stockCount = (product.stockCount || 0) + qty;

        // Restore variant stock if variants exist
        if (Array.isArray(product.variants) && product.variants.length > 0) {
          product.variants = product.variants.map(v => {
            const vObj = v.toObject ? v.toObject() : v;
            const matchColor = !color || (vObj.color && vObj.color.toLowerCase() === String(color).toLowerCase());
            const matchSize = !size || (vObj.size && vObj.size.toLowerCase() === String(size).toLowerCase());
            if (matchColor && matchSize) {
              return { ...vObj, stock: (vObj.stock || 0) + qty };
            }
            return vObj;
          });
        }

        await product.save();
        console.log(`🔄 Restocked cancelled order item: Product ${product.id} +${qty}. New stock: ${product.stockCount}`);
      }
    } catch (rErr) {
      console.warn("Could not restock cancelled item:", rErr.message);
    }
  }
}

// Place a new Order (Authenticated User)
exports.placeOrder = async (req, res) => {
  try {
    const { items, amount, address, couponCode } = req.body;
    const userId = req.user.id;

    if (!items || items.length === 0 || !amount || !address) {
      return res.status(400).json({ success: false, error: "Missing required order details" });
    }

    // Resolve customer email and name for notification and records
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

    // Create new Order document
    const newOrder = new Order({
      userId,
      userEmail: customerEmail,
      userName: customerName,
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

    // Send order confirmation email with GST breakdown and expected delivery date
    if (customerEmail) {
      try {
        const emailHtml = getOrderPlacedTemplate({
          orderId: newOrder._id,
          customerName,
          items: newOrder.items,
          totalAmount: newOrder.amount,
          address: newOrder.address,
          orderDate: newOrder.date || new Date()
        });
        sendEmail(
          customerEmail,
          `🛒 RamCart — Order Placed! #${String(newOrder._id).substring(0, 8).toUpperCase()}`,
          emailHtml
        ).then(result => {
          console.log(`📧 Order placement email to ${customerEmail}:`, result);
        }).catch(err => {
          console.error(`⚠️ Order placement email error to ${customerEmail}:`, err.message);
        });
      } catch (emailErr) {
        console.error("⚠️ Order confirmation email preparation error:", emailErr.message);
      }
    } else {
      console.warn("⚠️ No recipient email available for placed order:", newOrder._id);
    }

    console.log(`Order placed successfully by user ${userId}. Order ID: ${newOrder._id}, Email: ${customerEmail}`);
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

// Cancel an Order (Customer Endpoint)
exports.cancelUserOrder = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    const userId = req.user.id;

    if (!orderId) {
      return res.status(400).json({ success: false, error: "Missing required orderId field" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // Authorization check: User can only cancel their own order
    if (order.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, error: "Unauthorized: You can only cancel your own orders" });
    }

    // Safety checks: Cannot cancel if already cancelled
    if (order.status === "Cancelled") {
      return res.status(400).json({ success: false, error: "This order is already cancelled" });
    }

    // Cannot cancel if already shipped or delivered
    if (order.status === "Shipped" || order.status === "Delivered") {
      return res.status(400).json({ 
        success: false, 
        error: `Order cannot be cancelled because it is already ${order.status.toLowerCase()}. You may request an exchange or return upon delivery.` 
      });
    }

    // Safely restore stock quantities (both overall count & variants)
    await restoreOrderStock(order);

    // Update order status & record cancellation details
    order.status = "Cancelled";
    order.notificationSeen = false;
    order.cancelledAt = new Date();
    order.cancellationReason = reason || "Cancelled by customer prior to dispatch";
    await order.save();

    // Trigger Order Cancelled confirmation email
    let user = null;
    try {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId, { email: 1, name: 1 });
      }
      if (!user) {
        user = await User.findOne({ $or: [{ email: req.user?.email }, { _id: userId }] });
      }
    } catch (uErr) {
      console.warn("User lookup note on cancel:", uErr.message);
    }

    const customerEmail = order.userEmail || req.user?.email || user?.email || order.address?.email;
    const customerName = order.userName || req.user?.name || user?.name || order.address?.fullName || "Valued Customer";

    if (customerEmail) {
      try {
        const cancelHtml = getOrderCancelledTemplate({
          orderId: order._id,
          customerName,
          items: order.items,
          totalAmount: order.amount,
          reason: order.cancellationReason
        });
        sendEmail(
          customerEmail,
          `✕ RamCart — Order Cancellation Confirmed #${String(order._id).substring(0, 8).toUpperCase()}`,
          cancelHtml
        ).then(result => {
          console.log(`📧 Order cancellation email to ${customerEmail}:`, result);
        }).catch(err => {
          console.error(`⚠️ Order cancellation email error to ${customerEmail}:`, err.message);
        });
      } catch (cErr) {
        console.error("⚠️ Cancellation confirmation email failed:", cErr.message);
      }
    } else {
      console.warn("⚠️ No recipient email available for cancelled order:", order._id);
    }

    console.log(`🛑 Order #${order._id} successfully cancelled by user ${userId}`);
    res.json({ success: true, message: "Order cancelled successfully.", order });
  } catch (error) {
    console.error("Error cancelling user order:", error);
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

    // 1. If order was changed to Cancelled and was not cancelled before, restore stock safely and notify
    if (status === "Cancelled" && prevOrder.status !== "Cancelled") {
      await restoreOrderStock(updatedOrder);

      try {
        let user = null;
        if (mongoose.Types.ObjectId.isValid(updatedOrder.userId)) {
          user = await User.findById(updatedOrder.userId, { email: 1, name: 1 });
        }
        const customerEmail = updatedOrder.userEmail || user?.email || updatedOrder.address?.email;
        const customerName = updatedOrder.userName || user?.name || updatedOrder.address?.fullName || "Customer";
        if (customerEmail) {
          const cancelHtml = getOrderCancelledTemplate({
            orderId: updatedOrder._id,
            customerName,
            items: updatedOrder.items,
            totalAmount: updatedOrder.amount,
            reason: "Cancelled by store administrator"
          });
          sendEmail(
            customerEmail,
            `✕ RamCart — Order Cancellation Notice #${String(updatedOrder._id).substring(0, 8).toUpperCase()}`,
            cancelHtml
          ).then(res => console.log(`📧 Admin cancel email to ${customerEmail}:`, res))
           .catch(err => console.error(`⚠️ Admin cancel email error to ${customerEmail}:`, err.message));
        }
      } catch (cEmailErr) {
        console.error("⚠️ Admin cancel email error:", cEmailErr.message);
      }
    }

    // 2. If order status changed to Delivered and was not Delivered before, send Delivered email
    if (status === "Delivered" && prevOrder.status !== "Delivered") {
      try {
        let user = null;
        if (mongoose.Types.ObjectId.isValid(updatedOrder.userId)) {
          user = await User.findById(updatedOrder.userId, { email: 1, name: 1 });
        }
        const customerEmail = updatedOrder.userEmail || user?.email || updatedOrder.address?.email;
        const customerName = updatedOrder.userName || user?.name || updatedOrder.address?.fullName || "Customer";
        if (customerEmail) {
          const deliveredHtml = getOrderDeliveredTemplate({
            orderId: updatedOrder._id,
            customerName,
            items: updatedOrder.items,
            totalAmount: updatedOrder.amount,
            address: updatedOrder.address,
            deliveredDate: new Date()
          });
          sendEmail(
            customerEmail,
            `📦 RamCart — Your Order Has Been Delivered! #${String(updatedOrder._id).substring(0, 8).toUpperCase()}`,
            deliveredHtml
          ).then(res => console.log(`📧 Admin delivered email to ${customerEmail}:`, res))
           .catch(err => console.error(`⚠️ Admin delivered email error to ${customerEmail}:`, err.message));
        }
      } catch (dEmailErr) {
        console.error("⚠️ Admin delivered email error:", dEmailErr.message);
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

// Diagnostic endpoint to test live SMTP delivery
exports.testEmailEndpoint = async (req, res) => {
  try {
    const toEmail = req.query.to || req.body?.to || 'bvhss20@gmail.com';
    const testHtml = `
      <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #9c27b0; margin-bottom: 8px;">🛒 RamCart Live SMTP Verification</h2>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
          Congratulations! This email confirms that the RamCart production email notification system is functioning <strong>100%</strong>.
        </p>
        <div style="background: #f8fafc; padding: 14px; border-radius: 8px; margin: 16px 0; font-family: monospace; font-size: 12px; color: #1e293b; border-left: 4px solid #9c27b0;">
          <strong>Timestamp:</strong> ${new Date().toISOString()}<br/>
          <strong>Recipient:</strong> ${toEmail}<br/>
          <strong>Sender:</strong> ${process.env.SMTP_USER || 'bvhss20@gmail.com'}<br/>
          <strong>Host:</strong> ${process.env.SMTP_HOST || 'smtp.gmail.com'}:465
        </div>
        <p style="color: #64748b; font-size: 12px;">RamCart Production Notification Engine &bull; Automated System</p>
      </div>
    `;

    const result = await sendEmail(
      toEmail,
      `🧪 RamCart — Live SMTP Verification [${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}]`,
      testHtml
    );

    res.json({
      success: result.success !== false,
      recipient: toEmail,
      smtpUser: process.env.SMTP_USER || 'bvhss20@gmail.com',
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in testEmailEndpoint:", error);
    res.status(500).json({ success: false, error: error.message });
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
