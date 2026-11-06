const express = require('express');
const router = express.Router();
const youpiController = require('../controllers/youpiController');
const { fetchUser, fetchAdmin } = require('../middleware/auth');

// ── Public Routes ─────────────────────────────────────────────────────────────
router.get('/api/youpi/config', youpiController.getYoupiConfig);
router.post('/api/youpi/webhook', youpiController.youpiWebhook);

// ── Customer Protected Routes ────────────────────────────────────────────────
router.post('/api/youpi/initiate', fetchUser, youpiController.initiateYoupiSession);
router.post('/api/youpi/submit-utr', fetchUser, youpiController.submitYoupiUtr);
router.get('/api/youpi/status/:orderId', fetchUser, youpiController.checkYoupiStatus);

// ── Admin Protected Routes ───────────────────────────────────────────────────
router.post('/api/youpi/admin/verify', fetchAdmin, youpiController.adminVerifyPayment);
router.post('/api/youpi/admin/refund', fetchAdmin, youpiController.adminRefundPayment);

module.exports = router;
