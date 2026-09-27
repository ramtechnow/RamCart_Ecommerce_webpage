const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { fetchUser, fetchAdmin } = require('../middleware/auth');

// Customer Order endpoints
router.post('/placeorder', fetchUser, orderController.placeOrder);
router.get('/userorders', fetchUser, orderController.getUserOrders);
router.get('/userorders/unseen', fetchUser, orderController.getUnseenOrders);
router.post('/userorders/mark-seen', fetchUser, orderController.markOrderAsSeen);
router.post('/userorders/cancel', fetchUser, orderController.cancelUserOrder);

// Admin Order tracking endpoints
router.get('/admin/orders', fetchAdmin, orderController.getAllOrders);
router.post('/admin/orders/status', fetchAdmin, orderController.updateOrderStatus);
router.post('/admin/orders/delete', fetchAdmin, orderController.deleteOrder);

module.exports = router;
