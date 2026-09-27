/**
 * RamCart Transactional Email Templates
 * Responsive, mobile-friendly HTML emails for Order Lifecycle
 */

function formatCurrency(amount) {
  return Number(amount || 0).toFixed(2);
}

function calculateGstBreakdown(totalAmount) {
  const total = Number(totalAmount || 0);
  // Assuming 18% GST included in total price (common for fashion/lifestyle)
  const taxableSubtotal = total / 1.18;
  const totalGst = total - taxableSubtotal;
  const cgst = totalGst / 2;
  const sgst = totalGst / 2;
  return {
    taxableSubtotal: formatCurrency(taxableSubtotal),
    cgst: formatCurrency(cgst),
    sgst: formatCurrency(sgst),
    totalGst: formatCurrency(totalGst),
    total: formatCurrency(total)
  };
}

function calculateExpectedDelivery(orderDate) {
  const date = orderDate ? new Date(orderDate) : new Date();
  // Expected delivery 4 days after order placement
  const deliveryDate = new Date(date);
  deliveryDate.setDate(deliveryDate.getDate() + 4);
  return deliveryDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * 1. Order Placed Confirmation Email
 */
function getOrderPlacedTemplate({ orderId, customerName, items = [], totalAmount, address, orderDate }) {
  const gst = calculateGstBreakdown(totalAmount);
  const expectedDelivery = calculateExpectedDelivery(orderDate);

  const itemsRows = items.map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;color:#222;">
        <strong>${item.name || item.title || 'Apparel Item'}</strong>
        <div style="font-size:11px;color:#777;margin-top:2px;">
          ${item.size ? `Size: <strong>${item.size}</strong>` : ''} 
          ${item.color ? `· Color: <strong>${item.color}</strong>` : ''}
        </div>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;font-size:13px;color:#555;">
        ${item.quantity || 1}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-size:13px;font-weight:700;color:#222;">
        ₹${formatCurrency((item.price || 0) * (item.quantity || 1))}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - RamCart</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 4px 16px rgba(0,0,0,0.04);">
    <!-- Brand Header -->
    <div style="background:linear-gradient(135deg,#ff8906 0%,#e53170 100%);padding:28px 24px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:900;letter-spacing:1px;">🛒 RamCart</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.92);font-size:13px;font-weight:600;">Order Placed Successfully</p>
    </div>

    <!-- Main Body -->
    <div style="padding:24px 24px 16px;">
      <p style="margin:0 0 12px;font-size:15px;color:#111827;">Hello <strong>${customerName || 'Valued Customer'}</strong>,</p>
      <p style="margin:0 0 20px;font-size:13px;color:#4b5563;line-height:1.6;">
        Thank you for shopping with RamCart! Your order has been placed and is currently being prepared for dispatch.
      </p>

      <!-- Key Info Banner -->
      <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:8px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <div>
            <span style="font-size:11px;color:#92400e;text-transform:uppercase;font-weight:700;display:block;">Order ID</span>
            <span style="font-size:14px;font-weight:800;color:#78350f;font-family:monospace;">#${orderId}</span>
          </div>
          <div>
            <span style="font-size:11px;color:#92400e;text-transform:uppercase;font-weight:700;display:block;">Estimated Delivery</span>
            <span style="font-size:13px;font-weight:800;color:#78350f;">📅 ${expectedDelivery}</span>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <h3 style="margin:0 0 10px;font-size:14px;font-weight:800;color:#111827;text-transform:uppercase;letter-spacing:0.5px;">Purchased Items</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr style="background:#f9fafb;border-bottom:1.5px solid #e5e7eb;">
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;">Item</th>
            <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;">Qty</th>
            <th style="padding:8px 12px;text-align:right;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- Price & GST Breakdown Card -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 18px;margin-bottom:20px;">
        <table style="width:100%;font-size:12px;color:#4b5563;">
          <tr>
            <td style="padding:3px 0;">Items Subtotal (Taxable):</td>
            <td style="padding:3px 0;text-align:right;font-weight:600;color:#111827;">₹${gst.taxableSubtotal}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;">Central GST (CGST 9%):</td>
            <td style="padding:3px 0;text-align:right;font-weight:600;color:#111827;">₹${gst.cgst}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;">State GST (SGST 9%):</td>
            <td style="padding:3px 0;text-align:right;font-weight:600;color:#111827;">₹${gst.sgst}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;">Standard Delivery:</td>
            <td style="padding:3px 0;text-align:right;font-weight:700;color:#10b981;">FREE</td>
          </tr>
          <tr style="border-top:1.5px solid #d1d5db;">
            <td style="padding:8px 0 0;font-size:14px;font-weight:800;color:#111827;">Total Amount:</td>
            <td style="padding:8px 0 0;text-align:right;font-size:16px;font-weight:900;color:#e53170;">₹${gst.total}</td>
          </tr>
        </table>
      </div>

      <!-- Shipping Address -->
      ${address ? `
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px 16px;margin-bottom:20px;">
        <span style="font-size:11px;font-weight:800;color:#374151;text-transform:uppercase;display:block;margin-bottom:4px;">📦 Shipping Address</span>
        <p style="margin:0;font-size:12px;color:#4b5563;line-height:1.5;">
          <strong>${address.fullName || customerName || 'Customer'}</strong><br/>
          ${address.addressLine || ''}<br/>
          ${address.city || ''}, ${address.state || ''} - ${address.postalCode || ''}<br/>
          ${address.phone ? `Phone: ${address.phone}` : ''}
        </p>
      </div>
      ` : ''}

      <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.5;">
        You can track the progress of your order anytime in the <strong>My Orders</strong> section on RamCart.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">
        Need help? Contact <a href="mailto:support@ramcart.com" style="color:#ff8906;text-decoration:none;font-weight:700;">support@ramcart.com</a>
      </p>
      <p style="margin:4px 0 0;font-size:10px;color:#9ca3af;">
        &copy; ${new Date().getFullYear()} RamCart. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 2. Order Delivered Confirmation Email
 */
function getOrderDeliveredTemplate({ orderId, customerName, items = [], address, deliveredDate }) {
  const deliveryTime = deliveredDate 
    ? new Date(deliveredDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  const itemsList = items.map(item => `
    <li style="margin-bottom:6px;font-size:13px;color:#374151;">
      <strong>${item.name || item.title || 'Apparel Item'}</strong> (Qty: ${item.quantity || 1}${item.size ? `, Size: ${item.size}` : ''})
    </li>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Delivered - RamCart</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 4px 16px rgba(0,0,0,0.04);">
    <!-- Celebratory Header -->
    <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:28px 24px;text-align:center;">
      <div style="font-size:36px;margin-bottom:6px;">📦 🎉</div>
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:900;">Your Package Has Arrived!</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.92);font-size:13px;font-weight:600;">Delivered on ${deliveryTime}</p>
    </div>

    <!-- Main Content -->
    <div style="padding:24px 24px 16px;">
      <p style="margin:0 0 12px;font-size:15px;color:#111827;">Hi <strong>${customerName || 'Customer'}</strong>,</p>
      <p style="margin:0 0 16px;font-size:13px;color:#4b5563;line-height:1.6;">
        Great news! Your package for Order <strong>#${orderId}</strong> has been successfully delivered. Thank you so much for choosing <strong>RamCart</strong>!
      </p>

      <!-- Delivered Items -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 18px;margin-bottom:20px;">
        <h4 style="margin:0 0 8px;font-size:12px;font-weight:800;color:#374151;text-transform:uppercase;">Delivered Package Contents:</h4>
        <ul style="margin:0;padding-left:18px;">
          ${itemsList}
        </ul>
      </div>

      <!-- Feedback CTA Card -->
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
        <h3 style="margin:0 0 6px;font-size:15px;font-weight:800;color:#1e40af;">How was your fit &amp; shopping experience?</h3>
        <p style="margin:0 0 14px;font-size:12px;color:#3b82f6;">Your feedback helps us continuously improve product quality and delivery standards.</p>
        <a href="mailto:feedback@ramcart.com?subject=Feedback%20for%20Order%20%23${orderId}" style="display:inline-block;padding:10px 22px;background:#2563eb;color:#ffffff;font-size:12px;font-weight:700;border-radius:8px;text-decoration:none;">
          ★ Share Your Feedback
        </a>
      </div>

      <!-- Support Link -->
      <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6;">
        Have an issue with your delivery, fit, or quality? Reach out to our 24/7 support team anytime at 
        <a href="mailto:support@ramcart.com" style="color:#ff8906;font-weight:700;text-decoration:none;">support@ramcart.com</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">
        Thank you for being a valued RamCart customer!
      </p>
      <p style="margin:4px 0 0;font-size:10px;color:#9ca3af;">
        &copy; ${new Date().getFullYear()} RamCart. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 3. Order Cancelled Confirmation Email
 */
function getOrderCancelledTemplate({ orderId, customerName, items = [], totalAmount, reason }) {
  const cancelReasonText = reason || 'Requested by customer prior to dispatch';

  const itemsList = items.map(item => `
    <li style="margin-bottom:6px;font-size:13px;color:#374151;">
      <strong>${item.name || item.title || 'Apparel Item'}</strong> (Qty: ${item.quantity || 1})
    </li>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Cancellation - RamCart</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 4px 16px rgba(0,0,0,0.04);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#ef4444 0%,#b91c1c 100%);padding:28px 24px;text-align:center;">
      <div style="font-size:32px;margin-bottom:6px;">✕</div>
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:900;">Order Cancellation Confirmed</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.92);font-size:13px;">Order #${orderId}</p>
    </div>

    <!-- Main Content -->
    <div style="padding:24px 24px 16px;">
      <p style="margin:0 0 12px;font-size:15px;color:#111827;">Hello <strong>${customerName || 'Customer'}</strong>,</p>
      <p style="margin:0 0 16px;font-size:13px;color:#4b5563;line-height:1.6;">
        As requested, your order <strong>#${orderId}</strong> has been successfully cancelled. The items have been released back to our inventory.
      </p>

      <!-- Cancellation Details Card -->
      <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:14px 16px;border-radius:8px;margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:800;color:#991b1b;text-transform:uppercase;">Reason for Cancellation:</p>
        <p style="margin:0;font-size:13px;color:#7f1d1d;">${cancelReasonText}</p>
      </div>

      <!-- Refund Notice -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 18px;margin-bottom:20px;">
        <h4 style="margin:0 0 6px;font-size:13px;font-weight:800;color:#111827;">💳 Refund Information</h4>
        <p style="margin:0;font-size:12px;color:#4b5563;line-height:1.6;">
          If an online payment was processed for this order (₹${formatCurrency(totalAmount)}), your refund will be automatically credited back to your original payment method (Credit/Debit Card, UPI, or Net Banking) within <strong>3-5 business days</strong>.
        </p>
      </div>

      <!-- Cancelled Items List -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 18px;margin-bottom:20px;">
        <h4 style="margin:0 0 8px;font-size:12px;font-weight:800;color:#374151;text-transform:uppercase;">Cancelled Items:</h4>
        <ul style="margin:0;padding-left:18px;">
          ${itemsList}
        </ul>
      </div>

      <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6;">
        If you did not request this cancellation or have any questions, please reach out to us at 
        <a href="mailto:support@ramcart.com" style="color:#ef4444;font-weight:700;text-decoration:none;">support@ramcart.com</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">
        We hope to see you again soon at RamCart.
      </p>
      <p style="margin:4px 0 0;font-size:10px;color:#9ca3af;">
        &copy; ${new Date().getFullYear()} RamCart. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

module.exports = {
  calculateGstBreakdown,
  calculateExpectedDelivery,
  getOrderPlacedTemplate,
  getOrderDeliveredTemplate,
  getOrderCancelledTemplate
};
