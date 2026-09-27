const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
  image: { type: String, required: true },
  description: { type: String, required: true },
  targetLink: { type: String, required: true }, // product ID or category name
  tag: { type: String, default: 'EARLY BIRD DEALS' },
  bankOfferText: { type: String, default: 'Instant Discount on Prepaid Orders*' },
  discountType: { type: String, default: null }, // 'percentage', 'flat', or null
  discountValue: { type: Number, default: 0 },
  page: { 
    type: String, 
    enum: ['home', 'men', 'women', 'kids'], 
    required: true 
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Banner', BannerSchema);
