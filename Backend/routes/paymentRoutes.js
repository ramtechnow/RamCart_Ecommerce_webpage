const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { fetchUser } = require('../middleware/auth');

// Public route to get Razorpay public Key ID
router.get('/payment/config', paymentController.getPaymentConfig);

// Protected routes requiring user authentication
router.post('/payment/create-order', fetchUser, paymentController.createRazorpayOrder);
router.post('/payment/verify-payment', fetchUser, paymentController.verifyRazorpayPayment);
router.post('/payment/refund', fetchUser, paymentController.refundRazorpayOrder);

module.exports = router;
