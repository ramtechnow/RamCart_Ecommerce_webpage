const mongoose = require('mongoose');

const YoupiTransactionSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    default: null,
  },
  userName: {
    type: String,
    default: null,
  },
  merchantVpa: {
    type: String,
    required: true,
  },
  merchantName: {
    type: String,
    default: 'RamCart',
  },
  amount: {
    type: Number,
    required: true,
  },
  upiUri: {
    type: String,
    required: true,
  },
  customerVpa: {
    type: String,
    default: null,
  },
  customerPhone: {
    type: String,
    default: null,
  },
  utr: {
    type: String,
    default: null,
    sparse: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUBMITTED', 'VERIFIED_PAID', 'REFUNDED', 'EXPIRED', 'FAILED'],
    default: 'PENDING',
    index: true,
  },
  verifiedBy: {
    type: String,
    default: null, // "OBSERVER_WEBHOOK", "ADMIN_MANUAL", "SYSTEM"
  },
  verifiedAt: {
    type: Date,
    default: null,
  },
  bankAlertRaw: {
    type: String,
    default: null,
  },
  refundUtr: {
    type: String,
    default: null,
  },
  refundAmount: {
    type: Number,
    default: null,
  },
  refundedAt: {
    type: Date,
    default: null,
  },
  refundReason: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('YoupiTransaction', YoupiTransactionSchema);
