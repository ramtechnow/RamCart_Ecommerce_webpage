const mongoose = require('mongoose');

const CategoryCardSchema = new mongoose.Schema({
  categoryKey: { 
    type: String, 
    required: true, 
    unique: true, 
    enum: ['women', 'men', 'kids'] 
  },
  name: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  badgeText: { type: String, default: '' },
  tagline: { type: String, default: '' },
  image: { type: String, required: true },
  link: { type: String, required: true },
  objectPosition: { type: String, default: 'top' }, // 'top', 'center', 'bottom', 'top 20%'
  aspectRatio: { type: String, default: 'auto' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CategoryCard', CategoryCardSchema);
