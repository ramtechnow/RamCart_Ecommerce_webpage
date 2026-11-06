const { sendEmail } = require('../controllers/userController');

const PRIMARY_ADMIN_EMAIL = 'bvhss20@gmail.com';
const CC_ADMIN_EMAIL = 'ramtechnow@gmail.com';

/**
 * 1. Notify both admins when a new order is placed (COD or YouPI UPI)
 */
async function notifyDualAdminsNewOrder({ order, paymentMethod, utr, customerVpa }) {
  try {
    const oId = order.orderId || order._id;
    const itemsHtml = (order.items || []).map((it) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-size: 13px; color: #1e293b;">
          <strong>${it.name || "Product"}</strong><br/>
          <span style="font-size: 11px; color: #64748b;">Size: ${it.size || "M"} | Color: ${it.color || "Standard"} | Qty: ${it.quantity}</span>
        </td>
        <td style="padding: 10px; font-size: 13px; font-weight: bold; text-align: right; color: #0f172a;">
          ₹${(Number(it.price || 0) * Number(it.quantity || 1)).toFixed(2)}
        </td>
      </tr>
    `).join('');

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1px;">RAMCART ADMIN ALERT</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">🔔 New Customer Order Placed</p>
        </div>

        <div style="padding: 24px;">
          <!-- Order Summary Badge -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-size: 12px; color: #64748b; font-weight: bold;">ORDER ID:</td>
                <td style="font-size: 14px; font-weight: 900; color: #0284c7; text-align: right; font-family: monospace;">#${oId}</td>
              </tr>
              <tr>
                <td style="font-size: 12px; color: #64748b; font-weight: bold; padding-top: 6px;">TOTAL AMOUNT:</td>
                <td style="font-size: 16px; font-weight: 900; color: #059669; text-align: right; padding-top: 6px;">₹${Number(order.amount || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="font-size: 12px; color: #64748b; font-weight: bold; padding-top: 6px;">PAYMENT METHOD:</td>
                <td style="font-size: 12px; font-weight: bold; color: #475569; text-align: right; padding-top: 6px;">${paymentMethod || order.paymentMethod || "YouPI UPI"}</td>
              </tr>
              ${utr ? `
              <tr>
                <td style="font-size: 12px; color: #64748b; font-weight: bold; padding-top: 6px;">TRANSACTION / UTR ID:</td>
                <td style="font-size: 12px; font-family: monospace; font-weight: bold; color: #0f172a; text-align: right; padding-top: 6px;">${utr}</td>
              </tr>
              ` : ''}
              ${customerVpa ? `
              <tr>
                <td style="font-size: 12px; color: #64748b; font-weight: bold; padding-top: 6px;">CUSTOMER UPI ID:</td>
                <td style="font-size: 12px; font-family: monospace; font-weight: bold; color: #0284c7; text-align: right; padding-top: 6px;">${customerVpa}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <!-- Customer & Destination Details -->
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 8px;">📍 Customer & Delivery Destination</h3>
            <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 10px; font-size: 12px; line-height: 1.6; color: #334155;">
              <strong>Recipient:</strong> ${order.userName || order.address?.fullName || "Customer"}<br/>
              <strong>Email:</strong> ${order.userEmail || order.address?.email || "N/A"}<br/>
              <strong>Phone:</strong> ${order.address?.phone || "N/A"}<br/>
              <strong>Address:</strong> ${order.address?.addressLine || ""}, ${order.address?.city || ""}, ${order.address?.state || ""} - ${order.address?.postalCode || ""}
            </div>
          </div>

          <!-- Purchased Items -->
          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 8px;">📦 Order Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${itemsHtml}
            </table>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-top: 24px;">
            <a href="https://ecommerce-website-dfd55.web.app/admin" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 12px 28px; font-size: 13px; font-weight: 800; text-decoration: none; border-radius: 10px;">
              View in Admin Console &rarr;
            </a>
          </div>
        </div>

        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 12px; text-align: center; font-size: 11px; color: #94a3b8;">
          Sent automatically to RamCart Store Admins (${PRIMARY_ADMIN_EMAIL} &amp; ${CC_ADMIN_EMAIL})
        </div>
      </div>
    `;

    return await sendEmail(
      PRIMARY_ADMIN_EMAIL,
      `🔔 [NEW ORDER #${oId}] ₹${Number(order.amount || 0).toFixed(2)} - ${paymentMethod || "YouPI UPI"} (${order.userName || "Customer"})`,
      html,
      CC_ADMIN_EMAIL
    );
  } catch (err) {
    console.error("Dual admin order alert error:", err.message);
  }
}

/**
 * 2. Notify both admins when an order is cancelled & refund is needed
 */
async function notifyDualAdminsOrderCancelled({ order, reason, cancelledBy }) {
  try {
    const oId = order.orderId || order._id;
    const isCod = order.paymentMethod === 'COD' || !order.payment;
    const customerVpa = order.youpiCustomerVpa || order.customerVpa || '';
    const refundAmt = Number(order.amount || 0).toFixed(2);

    // If Cash on Delivery, no refund is needed because no money was collected
    if (isCod) {
      const codHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
          <div style="background: linear-gradient(135deg, #475569 0%, #334155 100%); padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 0.5px;">🚚 COD ORDER CANCELLED</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1;">Order #${oId} Cancelled &bull; No Refund Required</p>
          </div>
          <div style="padding: 24px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="font-size: 12px; color: #64748b; font-weight: bold;">CANCELLED ORDER:</td>
                  <td style="font-size: 14px; font-weight: 900; color: #0f172a; text-align: right; font-family: monospace;">#${oId}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #64748b; font-weight: bold; padding-top: 8px;">ORDER AMOUNT:</td>
                  <td style="font-size: 16px; font-weight: 900; color: #475569; text-align: right; padding-top: 8px;">₹${refundAmt}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #64748b; font-weight: bold; padding-top: 8px;">PAYMENT METHOD:</td>
                  <td style="font-size: 12px; font-weight: bold; color: #ea580c; text-align: right; padding-top: 8px;">Cash on Delivery (COD)</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #64748b; font-weight: bold; padding-top: 8px;">CANCELLED BY:</td>
                  <td style="font-size: 12px; font-weight: bold; color: #475569; text-align: right; padding-top: 8px;">${cancelledBy || "Customer"}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #64748b; font-weight: bold; padding-top: 8px;">REASON:</td>
                  <td style="font-size: 12px; color: #475569; text-align: right; padding-top: 8px;">${reason || "Customer requested cancellation"}</td>
                </tr>
              </table>
            </div>
            <div style="padding: 14px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; font-size: 12px; color: #065f46; line-height: 1.5; text-align: center;">
              ✅ <strong>No Refund Action Needed:</strong> Since this was a Cash on Delivery order, no advance money was collected from the customer. Reserved inventory has been automatically restocked in the warehouse.
            </div>
            <div style="text-align: center; margin-top: 20px;">
              <a href="https://ecommerce-website-dfd55.web.app/admin" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 11px 24px; font-size: 12px; font-weight: 800; text-decoration: none; border-radius: 10px;">
                View Orders in Admin Console &rarr;
              </a>
            </div>
          </div>
          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 12px; text-align: center; font-size: 11px; color: #94a3b8;">
            Delivered to RamCart Store Admins (${PRIMARY_ADMIN_EMAIL} &amp; ${CC_ADMIN_EMAIL})
          </div>
        </div>
      `;

      return await sendEmail(
        PRIMARY_ADMIN_EMAIL,
        `ℹ️ [COD ORDER CANCELLED] Order #${oId} - Customer: ${order.userName || "Customer"} (No Refund Needed)`,
        codHtml,
        CC_ADMIN_EMAIL
      );
    }

    const upiPayLink = customerVpa 
      ? `upi://pay?pa=${encodeURIComponent(customerVpa)}&pn=${encodeURIComponent(order.userName || 'Customer')}&am=${encodeURIComponent(refundAmt)}&cu=INR&tn=${encodeURIComponent('Refund for RamCart Order ' + oId)}`
      : null;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #fecdd3; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
        <!-- Warning Header -->
        <div style="background: linear-gradient(135deg, #be123c 0%, #e11d48 100%); padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 0.5px;">🚨 REFUND ACTION REQUIRED</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #ffe4e6;">Order #${oId} has been Cancelled</p>
        </div>

        <div style="padding: 24px;">
          <!-- Refund Details Box -->
          <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-size: 12px; color: #9f1239; font-weight: bold;">CANCELLED ORDER:</td>
                <td style="font-size: 14px; font-weight: 900; color: #881337; text-align: right; font-family: monospace;">#${oId}</td>
              </tr>
              <tr>
                <td style="font-size: 12px; color: #9f1239; font-weight: bold; padding-top: 8px;">REFUND AMOUNT:</td>
                <td style="font-size: 18px; font-weight: 900; color: #be123c; text-align: right; padding-top: 8px;">₹${refundAmt}</td>
              </tr>
              <tr>
                <td style="font-size: 12px; color: #9f1239; font-weight: bold; padding-top: 8px;">CUSTOMER UPI ID:</td>
                <td style="font-size: 13px; font-family: monospace; font-weight: 900; color: #0284c7; text-align: right; padding-top: 8px;">${customerVpa || "Not provided (check phone)"}</td>
              </tr>
              ${order.youpiUtr ? `
              <tr>
                <td style="font-size: 12px; color: #9f1239; font-weight: bold; padding-top: 8px;">ORIGINAL PAYMENT UTR:</td>
                <td style="font-size: 12px; font-family: monospace; font-weight: bold; color: #334155; text-align: right; padding-top: 8px;">${order.youpiUtr}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="font-size: 12px; color: #9f1239; font-weight: bold; padding-top: 8px;">CANCELLED BY:</td>
                <td style="font-size: 12px; font-weight: bold; color: #475569; text-align: right; padding-top: 8px;">${cancelledBy || "Customer"}</td>
              </tr>
              <tr>
                <td style="font-size: 12px; color: #9f1239; font-weight: bold; padding-top: 8px;">REASON:</td>
                <td style="font-size: 12px; color: #475569; text-align: right; padding-top: 8px;">${reason || "Customer requested order cancellation"}</td>
              </tr>
            </table>
          </div>

          <!-- Customer Info -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 10px; font-size: 12px; color: #334155; margin-bottom: 22px;">
            <strong>Customer:</strong> ${order.userName || order.address?.fullName || "Customer"} &bull; <strong>Email:</strong> ${order.userEmail || "N/A"} &bull; <strong>Phone:</strong> ${order.address?.phone || "N/A"}
          </div>

          <!-- Direct UPI Refund 1-Click Button & QR Code -->
          ${upiPayLink ? `
          <div style="text-align: center; margin-bottom: 18px; padding: 18px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px;">
            <p style="font-size: 13px; font-weight: bold; color: #065f46; margin: 0 0 12px 0;">
              ⚡ 1-Click Mobile Refund (Tap below on your phone to open GPay/PhonePe):
            </p>
            <a href="${upiPayLink}" style="display: inline-block; background: #059669; color: #ffffff; padding: 14px 26px; font-size: 14px; font-weight: 900; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); margin-bottom: 12px;">
              📲 Send ₹${refundAmt} Refund via UPI App
            </a>
            <p style="font-size: 11px; color: #047857; margin: 8px 0 6px 0;">Or scan this QR code with Google Pay / PhonePe to send refund:</p>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiPayLink)}" alt="Scan to Refund" style="width: 180px; height: 180px; display: block; margin: 0 auto; border-radius: 8px; border: 1px solid #a7f3d0; background: #ffffff; padding: 6px;" />
          </div>
          ` : `
          <div style="text-align: center; margin-bottom: 18px; padding: 14px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; font-size: 12px; color: #92400e;">
            ℹ️ Customer UPI ID was not registered at checkout. Please contact customer phone (${order.address?.phone || "N/A"}) to obtain their UPI ID for refund.
          </div>
          `}

          <!-- Admin Console Link -->
          <div style="text-align: center; margin-top: 14px;">
            <a href="https://ecommerce-website-dfd55.web.app/admin" style="display: inline-block; background: #be123c; color: #ffffff; padding: 11px 24px; font-size: 12px; font-weight: 800; text-decoration: none; border-radius: 10px;">
              Open Admin Console to Mark Refund as Completed &rarr;
            </a>
          </div>
        </div>

        <div style="background: #fff1f2; border-top: 1px solid #fecdd3; padding: 12px; text-align: center; font-size: 11px; color: #9f1239;">
          Alert delivered to Dual Store Administrators (${PRIMARY_ADMIN_EMAIL} &amp; ${CC_ADMIN_EMAIL})
        </div>
      </div>
    `;

    return await sendEmail(
      PRIMARY_ADMIN_EMAIL,
      `🚨 [REFUND ACTION REQUIRED] Order #${oId} Cancelled (₹${refundAmt}) - Customer: ${order.userName || "Customer"}`,
      html,
      CC_ADMIN_EMAIL
    );
  } catch (err) {
    console.error("Dual admin cancellation alert error:", err.message);
  }
}

/**
 * 3. Notify both admins when a refund has been completed
 */
async function notifyDualAdminsRefundCompleted({ order, refundUtr, refundAmount }) {
  try {
    const oId = order.orderId || order._id;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #a7f3d0; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 22px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 900;">✅ REFUND COMPLETED &amp; CLOSED</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #d1fae5;">Order #${oId} Refund Dispatched</p>
        </div>
        <div style="padding: 20px; font-size: 13px; color: #1e293b; line-height: 1.6;">
          <p><strong>Order ID:</strong> #${oId}</p>
          <p><strong>Refund Amount:</strong> ₹${Number(refundAmount || order.amount || 0).toFixed(2)}</p>
          <p><strong>Refund UTR / Ref No:</strong> <span style="font-family: monospace; font-weight: bold; color: #059669;">${refundUtr || "Confirmed by Admin"}</span></p>
          <p><strong>Customer:</strong> ${order.userName || "Customer"} (${order.userEmail || "N/A"})</p>
          <p><strong>Customer UPI ID:</strong> ${order.youpiCustomerVpa || "N/A"}</p>
          <p style="margin-top: 16px; padding: 10px; background: #f0fdf4; border-radius: 8px; font-size: 12px; color: #166534;">
            Official branded refund confirmation receipt has also been dispatched to the customer.
          </p>
        </div>
      </div>
    `;

    return await sendEmail(
      PRIMARY_ADMIN_EMAIL,
      `✅ [REFUND COMPLETED] Order #${oId} - ₹${Number(refundAmount || order.amount || 0).toFixed(2)} Refunded via UPI`,
      html,
      CC_ADMIN_EMAIL
    );
  } catch (err) {
    console.error("Dual admin refund completed alert error:", err.message);
  }
}

module.exports = {
  PRIMARY_ADMIN_EMAIL,
  CC_ADMIN_EMAIL,
  notifyDualAdminsNewOrder,
  notifyDualAdminsOrderCancelled,
  notifyDualAdminsRefundCompleted
};
