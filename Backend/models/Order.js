const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
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
  items: [
    {
      productId: { type: Number, required: true },
      name: { type: String, required: true },
      image: { type: String },
      size: { type: String, default: "M" },
      color: { type: String, default: "White" },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    }
  ],
  amount: {
    type: Number,
    required: true,
  },
  address: {
    fullName: { type: String, required: true },
    addressLine: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    phone: { type: String, required: true },
  },
  couponCode: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    default: "Pending", // Pending, Processing, Shipped, Delivered
  },
  payment: {
    type: Boolean,
    default: true,
  },
  notificationSeen: {
    type: Boolean,
    default: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  cancelledAt: {
    type: Date,
    default: null,
  },
  cancellationReason: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model('Order', OrderSchema);
