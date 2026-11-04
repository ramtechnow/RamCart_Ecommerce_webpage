const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  new_price: {
    type: Number,
    required: true,
  },
  old_price: {
    type: Number,
    required: true,
  },
  sizes: {
    type: [String],
    default: ['S', 'M', 'L', 'XL']
  },
  colors: {
    type: [String],
    default: ['Black', 'White']
  },
  variants: {
    type: [{
      size: { type: String },
      color: { type: String, default: "Standard" },
      stock: { type: Number, default: 0 },
      price: { type: Number },
      old_price: { type: Number }
    }],
    default: []
  },
  stockCount: {
    type: Number,
    default: 100
  },
  images: {
    type: [String],
    default: []
  },
  description: {
    type: String,
    default: ""
  },
  fabric: {
    type: String,
    default: "Cotton Blend"
  },
  pattern: {
    type: String,
    default: "Solid"
  },
  fit: {
    type: String,
    default: "Regular"
  },
  vendor: {
    type: String,
    default: ""
  },
  vendorEmail: {
    type: String,
    default: ""
  },
  vendorAddress: {
    type: String,
    default: ""
  },
  vendorRating: {
    type: Number,
    default: 4.2
  },
  date: {
    type: Date,
    default: Date.now,
  },
  available: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model('Product', ProductSchema);
