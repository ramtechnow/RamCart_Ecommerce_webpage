const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { fetchAdmin } = require('../middleware/auth');

// Public route to get category showcase cards
router.get('/api/categories/showcase', categoryController.getCategoryCards);

// Admin-only routes to update/reset category cards
router.post('/admin/categories/update', fetchAdmin, categoryController.updateCategoryCard);
router.post('/admin/categories/reset', fetchAdmin, categoryController.resetCategoryCards);

module.exports = router;
