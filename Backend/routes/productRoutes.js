const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { fetchAdmin } = require('../middleware/auth');

// Public route to get all products
router.get('/allproducts', productController.getAllProducts);

// Public route to get single product by ID (numeric or ObjectId)
router.get('/product/:id', productController.getProductById);

// Admin route to add a product
router.post('/addproduct', fetchAdmin, productController.addProduct);

// Admin route to remove a product
router.post('/removeproduct', fetchAdmin, productController.removeProduct);

// Admin route to update a product
router.post('/updateproduct', fetchAdmin, productController.updateProduct);

// Admin route to update stock of a specific variant directly
router.post('/admin/updatevariantstock', fetchAdmin, productController.updateVariantStock);

module.exports = router;
