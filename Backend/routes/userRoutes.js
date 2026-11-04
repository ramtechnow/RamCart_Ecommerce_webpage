const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { fetchUser, fetchAdmin } = require('../middleware/auth');

// Auth routes
router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.post('/auth/send-login-otp', userController.sendLoginOtp);
router.post('/auth/verify-login-otp', userController.verifyLoginOtp);
router.post('/auth/forgot-password', userController.forgotPassword);
router.post('/auth/reset-password', userController.resetPassword);
router.post('/auth/firebase-sync', userController.firebaseSync);

// Cart routes
router.get('/getcart', fetchUser, userController.getCart);
router.post('/addtocart', fetchUser, userController.addToCart);
router.post('/removefromcart', fetchUser, userController.removeFromCart);
router.post('/clearcart', fetchUser, userController.clearCart);

// Wishlist routes
router.get('/getwishlist', fetchUser, userController.getWishlist);
router.post('/addtowishlist', fetchUser, userController.addToWishlist);
router.post('/removefromwishlist', fetchUser, userController.removeFromWishlist);

// Admin routes
router.get('/admin/verify', fetchAdmin, userController.verifyAdmin);
router.get('/admin/users', fetchAdmin, userController.getAllUsers);
router.post('/admin/updateuserrole', fetchAdmin, userController.updateUserRole);
router.post('/admin/deleteuser', fetchAdmin, userController.deleteUser);
router.post('/admin/send-campaign-email', fetchAdmin, userController.sendCampaignEmail);

// Profile & Address Book routes
router.get('/user/profile', fetchUser, userController.getProfile);
router.post('/user/profile/update', fetchUser, userController.updateProfile);
router.post('/user/addresses/add', fetchUser, userController.addAddress);
router.post('/user/addresses/delete', fetchUser, userController.deleteAddress);

// Public Newsletter Subscription
router.post('/newsletter/subscribe', userController.subscribeNewsletter);

module.exports = router;
