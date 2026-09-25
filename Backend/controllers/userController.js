const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const dns = require('dns').promises;

// User Registration / Signup
exports.signup = async (req, res) => {
  try {
    let check = await User.findOne({ email: { $regex: new RegExp("^" + req.body.email + "$", "i") } });
    if (check) {
      return res.status(400).json({ success: false, errors: "Existing user found with same email address" });
    }
    
    // Initialize an empty cart object
    let cart = {};

    // Hash the password with bcrypt
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = new User({
      name: req.body.username,
      email: req.body.email,
      password: hashedPassword,
      cartData: cart,
    });

    await user.save();

    const data = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    };
    const token = jwt.sign(data, process.env.JWT_SECRET);
    res.json({ success: true, token });
  } catch (error) {
    console.error("Error in signup:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// User Login
exports.login = async (req, res) => {
  try {
    let user = await User.findOne({ email: { $regex: new RegExp("^" + req.body.email + "$", "i") } });
    if (user) {
      let passCompare = false;
      
      // Compatibility and secure migration check:
      if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
        passCompare = await bcrypt.compare(req.body.password, user.password);
      } else {
        // Plain text fallback (for legacy database entries)
        passCompare = req.body.password === user.password;
        if (passCompare) {
          // Migrate plain text password to secure bcrypt hash on-the-fly
          user.password = await bcrypt.hash(req.body.password, 10);
          await user.save();
          console.log(`🔒 Migrated plain text password for ${user.email} to bcrypt hash on login.`);
        }
      }

      if (passCompare) {
        const data = {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin
          }
        };
        const token = jwt.sign(data, process.env.JWT_SECRET);
        return res.json({ success: true, token });
      }
      return res.status(401).json({ success: false, errors: "Invalid email address or password." });
    }
    return res.status(401).json({ success: false, errors: "Invalid email address or password." });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Fetch User's Cart
exports.getCart = async (req, res) => {
  try {
    let userData = await User.findOne({ _id: req.user.id });
    console.log("Cart data fetched successfully!");
    res.json(userData.cartData || {});
  } catch (error) {
    console.error("Error in getcart:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Add product to user's cart
exports.addToCart = async (req, res) => {
  try {
    let userData = await User.findOne({ _id: req.user.id });
    
    const itemKey = req.body.itemId; 
    const size = req.body.size;
    const color = req.body.color;
    const key = (size && color) ? `${itemKey}-${size}-${color}` : (size ? `${itemKey}-${size}` : `${itemKey}`);
    const qty = Number(req.body.qty !== undefined ? req.body.qty : 1);
    const setQty = req.body.setQty === true;

    if (!userData.cartData) {
      userData.cartData = {};
    }

    if (userData.cartData[key]) {
      if (setQty) {
        userData.cartData[key].quantity = qty;
      } else {
        userData.cartData[key].quantity += qty;
      }
    } else {
      userData.cartData[key] = {
        id: Number(itemKey) || itemKey,
        size: size || "M",
        color: color || "White",
        quantity: qty
      };
    }

    userData.markModified('cartData');
    await userData.save();
    console.log("Added to cart database successfully!");
    res.send({ success: true, message: "Added to cart successfully", cartData: userData.cartData });
  } catch (error) {
    console.error("Error in addtocart:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Remove product from user's cart
exports.removeFromCart = async (req, res) => {
  try {
    let userData = await User.findOne({ _id: req.user.id });
    const key = req.body.key || req.body.itemId; 
    const removeAll = req.body.removeAll === true;

    if (userData.cartData && userData.cartData[key]) {
      if (userData.cartData[key].quantity > 1 && !removeAll) {
        userData.cartData[key].quantity -= 1;
      } else {
        delete userData.cartData[key];
      }
      userData.markModified('cartData');
      await userData.save();
      console.log("Removed from cart database successfully!");
      res.send({ success: true, message: "Removed from cart successfully", cartData: userData.cartData });
    } else {
      res.status(400).send({ success: false, error: "Item not in cart" });
    }
  } catch (error) {
    console.error("Error in removefromcart:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Clear entire cart
exports.clearCart = async (req, res) => {
  try {
    let userData = await User.findOne({ _id: req.user.id });
    userData.cartData = {};
    userData.markModified('cartData');
    await userData.save();
    console.log("Cleared user cart successfully!");
    res.send({ success: true, message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Error in clearcart:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Fetch User's Wishlist
exports.getWishlist = async (req, res) => {
  try {
    let userData = await User.findOne({ _id: req.user.id });
    console.log("Wishlist data fetched successfully!");
    res.json(userData.wishlistData || []);
  } catch (error) {
    console.error("Error in getwishlist:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Add product to user's wishlist
exports.addToWishlist = async (req, res) => {
  try {
    let userData = await User.findOne({ _id: req.user.id });
    const itemId = Number(req.body.itemId);

    if (!userData.wishlistData) {
      userData.wishlistData = [];
    }

    if (!userData.wishlistData.includes(itemId)) {
      userData.wishlistData.push(itemId);
      userData.markModified('wishlistData');
      await userData.save();
      console.log(`Added product ${itemId} to user ${userData.email} wishlist`);
    }

    res.send({ success: true, message: "Added to wishlist successfully", wishlist: userData.wishlistData });
  } catch (error) {
    console.error("Error in addtowishlist:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Remove product from user's wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    let userData = await User.findOne({ _id: req.user.id });
    const itemId = Number(req.body.itemId);

    if (userData.wishlistData && userData.wishlistData.includes(itemId)) {
      userData.wishlistData = userData.wishlistData.filter(id => id !== itemId);
      userData.markModified('wishlistData');
      await userData.save();
      console.log(`Removed product ${itemId} from user ${userData.email} wishlist`);
      res.send({ success: true, message: "Removed from wishlist successfully", wishlist: userData.wishlistData });
    } else {
      res.status(400).send({ success: false, error: "Item not in wishlist" });
    }
  } catch (error) {
    console.error("Error in removefromwishlist:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Admin: Get all registered user credentials and carts
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, { name: 1, email: 1, isAdmin: 1, cartData: 1, date: 1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching registered users:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Admin: Toggle user admin status / role
exports.updateUserRole = async (req, res) => {
  try {
    const { email, isAdmin } = req.body;
    const updatedUser = await User.findOneAndUpdate(
      { email: { $regex: new RegExp("^" + email + "$", "i") } },
      { $set: { isAdmin: Boolean(isAdmin) } },
      { new: true }
    );
    if (updatedUser) {
      console.log(`Updated user role for ${email}: isAdmin = ${isAdmin}`);
      res.json({ success: true, user: { name: updatedUser.name, email: updatedUser.email, isAdmin: updatedUser.isAdmin } });
    } else {
      res.status(404).json({ success: false, error: "User not found" });
    }
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Admin: Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const { email } = req.body;
    const deletedUser = await User.findOneAndDelete({ email: { $regex: new RegExp("^" + email + "$", "i") } });
    if (deletedUser) {
      console.log(`Deleted user account: ${email}`);
      // Clean up orders associated with this user
      const Order = require('../models/Order');
      const deleteResult = await Order.deleteMany({ userId: deletedUser._id.toString() });
      console.log(`Deleted ${deleteResult.deletedCount} orders for user ${deletedUser._id}`);
      res.json({ success: true, message: "User and associated orders deleted successfully" });
    } else {
      res.status(404).json({ success: false, error: "User not found" });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Admin: Verify admin token credentials
exports.verifyAdmin = async (req, res) => {
  try {
    // req.user has already been set and validated by fetchAdmin middleware
    const user = await User.findById(req.user.id, { name: 1, email: 1, isAdmin: 1 });
    if (!user || !user.isAdmin) {
      return res.status(403).json({ success: false, error: "Access denied. Admin privileges required." });
    }
    res.json({ success: true, user: { name: user.name, email: user.email, isAdmin: user.isAdmin } });
  } catch (error) {
    console.error("Error verifying admin status:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Provider-agnostic SMS OTP sender helper
async function sendSMS(phone, otp) {
  if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE) {
    try {
      const sid = process.env.TWILIO_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_PHONE;
      const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
      
      const authHeader = 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          To: phone,
          From: from,
          Body: `Your RamCart login OTP code is: ${otp}. It is valid for 5 minutes.`
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        console.log(`✅ Real SMS dispatched via Twilio to ${phone}: SID ${data.sid}`);
        return true;
      } else {
        console.error(`❌ Twilio API Error: ${data.message}`);
        return false;
      }
    } catch (err) {
      console.error("❌ Failed to connect to Twilio SMS API:", err);
      return false;
    }
  } else {
    console.log(`\n======================================================`);
    console.log(`📱 SMS OTP SENT TO: ${phone}`);
    console.log(`💬 CODE: [ ${otp} ]`);
    console.log(`======================================================\n`);
    return true;
  }
}

// Transactional Email OTP sender helper using Nodemailer
async function sendEmail(email, subject, html) {
  const host = process.env.SMTP_HOST || process.env.SMTP_SERVER || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.error('❌ SMTP credentials are not configured. Set SMTP_USER and SMTP_PASS environment variables.');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      family: 4, // Force IPv4 resolution to bypass IPv6 ENETUNREACH errors on Render
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
      tls: {
        servername: host, // Ensure TLS SNI is sent correctly for certificate verification
        rejectUnauthorized: false // Avoid connection drops due to local certificate issues
      }
    });
    await transporter.sendMail({
      from: `"RamCart Support" <${user}>`,
      to: email,
      subject: subject,
      html: html
    });
    console.log(`✉️ Email successfully sent to ${email}`);
    return true;
  } catch (err) {
    console.error("❌ Failed to send transactional email:", err);
    return false;
  }
}
exports.sendEmail = sendEmail;

// POST: Send OTP to Indian phone number for login/registration
exports.sendLoginOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^\+91[6789]\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, errors: "Invalid Indian mobile number. Format: +91XXXXXXXXXX" });
    }

    // Rate limiting: 60s cooldown per number
    const lastOtp = await OTP.findOne({ target: phone, type: 'login' }).sort({ createdAt: -1 });
    if (lastOtp) {
      const diff = Date.now() - new Date(lastOtp.createdAt).getTime();
      if (diff < 60000) {
        return res.status(429).json({ success: false, errors: `Please wait ${Math.ceil((60000 - diff) / 1000)} seconds before requesting a new OTP.` });
      }
    }

    // Generate random 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Overwrite any existing active OTP for this phone
    await OTP.deleteMany({ target: phone, type: 'login' });
    const otpDoc = new OTP({ target: phone, otp: otpCode, type: 'login' });
    await otpDoc.save();

    // Send SMS
    await sendSMS(phone, otpCode);

    res.json({ success: true, message: "OTP sent successfully to your mobile number.", cooldown: 60 });
  } catch (error) {
    console.error("Error in sendLoginOtp:", error);
    res.status(500).json({ success: false, errors: "Internal Server Error" });
  }
};

// POST: Verify Phone OTP and log user in / register them
exports.verifyLoginOtp = async (req, res) => {
  try {
    const { phone, otp, name } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, errors: "Phone number and OTP code are required" });
    }

    // Find the latest OTP for the number
    const otpRecord = await OTP.findOne({ target: phone, type: 'login' });
    if (!otpRecord) {
      return res.status(400).json({ success: false, errors: "OTP code has expired or is invalid. Please request a new one." });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ success: false, errors: "Incorrect OTP. Please check the code and try again." });
    }

    // Delete verified OTP from database
    await OTP.deleteOne({ _id: otpRecord._id });

    // Check if user already exists by phone number
    let user = await User.findOne({ phone });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Auto-register user since their phone is verified
      user = new User({
        name: name || `Shopper_${phone.slice(-4)}`,
        phone,
        email: `${phone.replace('+', '')}@shopper.in`, // Generate fallback unique email
        cartData: {},
        wishlistData: []
      });
      await user.save();
    }

    const data = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    };
    const token = jwt.sign(data, process.env.JWT_SECRET);
    
    res.json({ 
      success: true, 
      token, 
      isNewUser, 
      user: { 
        name: user.name, 
        email: user.email, 
        phone: user.phone, 
        isAdmin: user.isAdmin 
      } 
    });
  } catch (error) {
    console.error("Error in verifyLoginOtp:", error);
    res.status(500).json({ success: false, errors: "Internal Server Error" });
  }
};

// POST: Forgot password (sends OTP code to email)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ success: false, errors: "Valid email address is required" });
    }

    const user = await User.findOne({ email: { $regex: new RegExp("^" + email + "$", "i") } });

    // Always return generic success message to prevent user enumeration
    const genericResponse = { 
      success: true, 
      message: "If your email is registered in our system, you will receive a 6-digit OTP code to reset your password shortly." 
    };

    if (!user) {
      return res.json(genericResponse);
    }

    // Rate limiting: 60s cooldown per email
    const lastOtp = await OTP.findOne({ target: email, type: 'reset' }).sort({ createdAt: -1 });
    if (lastOtp) {
      const diff = Date.now() - new Date(lastOtp.createdAt).getTime();
      if (diff < 60000) {
        return res.status(429).json({ success: false, errors: `Please wait ${Math.ceil((60000 - diff) / 1000)} seconds before requesting a new reset code.` });
      }
    }

    // Generate 6-digit reset OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save/Overwrite OTP
    await OTP.deleteMany({ target: email, type: 'reset' });
    const otpDoc = new OTP({ target: email, otp: otpCode, type: 'reset' });
    await otpDoc.save();

    // Send email
    const subject = "RamCart — Password Reset Verification Code";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #ff8906; text-align: center;">🛒 RamCart Account Recovery</h2>
        <p>Hello ${user.name || 'Customer'},</p>
        <p>We received a request to reset your password. Use the verification code below to complete the reset process. This code is valid for 5 minutes.</p>
        <div style="background-color: #fff9f0; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ff8906;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #333;">${otpCode}</span>
        </div>
        <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #888; text-align: center;">RamCart by RamTechnow Technologies &bull; Secure Password Reset Service</p>
      </div>
    `;
    // Send email asynchronously in the background
    sendEmail(email, subject, html);

    res.json(genericResponse);
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ success: false, errors: "Internal Server Error" });
  }
};

// POST: Reset password (verifies OTP code and sets new password)
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, errors: "Email, OTP code, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, errors: "Password must be at least 6 characters long" });
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({ target: email, type: 'reset' });
    if (!otpRecord) {
      return res.status(400).json({ success: false, errors: "Reset code has expired or is invalid. Please request a new code." });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ success: false, errors: "Incorrect verification code. Please try again." });
    }

    // Find user and update password
    const user = await User.findOne({ email: { $regex: new RegExp("^" + email + "$", "i") } });
    if (!user) {
      return res.status(400).json({ success: false, errors: "We were unable to complete the request. User not found." });
    }

    // Hash new password using bcryptjs
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Delete verified OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({ success: true, message: "Your password has been successfully reset! You can now log in." });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ success: false, errors: "Internal Server Error" });
  }
};

// POST: Firebase Authentication user synchronization
exports.firebaseSync = async (req, res) => {
  try {
    const { email, phone, uid, name } = req.body;
    if (!email && !phone) {
      return res.status(400).json({ success: false, errors: "Email or Phone number is required for user sync" });
    }

    let user;
    let isNewUser = false;

    if (email) {
      user = await User.findOne({ email: { $regex: new RegExp("^" + email + "$", "i") } });
    } else if (phone) {
      user = await User.findOne({ phone });
    }

    if (!user) {
      isNewUser = true;
      // Auto-register user since their identity is verified by Firebase
      user = new User({
        name: name || (email ? email.split('@')[0] : `Shopper_${phone.slice(-4)}`),
        email: email || `${phone.replace('+', '')}@shopper.in`, // Generate unique placeholder email if phone-only
        phone: phone || undefined,
        cartData: {},
        wishlistData: []
      });
      await user.save();
    }

    const data = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    };
    
    const token = jwt.sign(data, process.env.JWT_SECRET);
    
    res.json({
      success: true,
      token,
      isNewUser,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error("Error in firebaseSync:", error);
    res.status(500).json({ success: false, errors: "Internal Server Error" });
  }
};

// GET: Fetch User Profile details
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id, { password: 0 });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error("Error in getProfile:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// POST: Update User Profile fields
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const userId = req.user.id;

    if (!name || !email) {
      return res.status(400).json({ success: false, errors: "Name and email are required fields" });
    }

    const emailCheck = await User.findOne({ email: { $regex: new RegExp("^" + email + "$", "i") }, _id: { $ne: userId } });
    if (emailCheck) {
      return res.status(400).json({ success: false, errors: "Email address is already in use by another account" });
    }

    if (phone) {
      const phoneCheck = await User.findOne({ phone, _id: { $ne: userId } });
      if (phoneCheck) {
        return res.status(400).json({ success: false, errors: "Phone number is already in use by another account" });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { name, email, phone } },
      { new: true, select: "-password" }
    );

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error in updateProfile:", error);
    res.status(500).json({ success: false, errors: "Internal Server Error" });
  }
};

// POST: Add new address to profile
exports.addAddress = async (req, res) => {
  try {
    const { fullName, addressLine, city, state, postalCode, phone, isDefault } = req.body;
    if (!fullName || !addressLine || !city || !state || !postalCode || !phone) {
      return res.status(400).json({ success: false, error: "Missing required shipping address fields" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (!user.addresses) {
      user.addresses = [];
    }

    // If marked default, toggle other defaults off
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    const newAddress = {
      fullName,
      addressLine,
      city,
      state,
      postalCode,
      phone,
      isDefault: Boolean(isDefault || user.addresses.length === 0) // Make default if it's the first one
    };

    user.addresses.push(newAddress);
    user.markModified('addresses');
    await user.save();

    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error("Error in addAddress:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// POST: Delete address from profile
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.body;
    if (!addressId) {
      return res.status(400).json({ success: false, error: "Missing addressId field" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);
    user.markModified('addresses');
    await user.save();

    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error("Error in deleteAddress:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// POST: Subscribe to promotional newsletter (Public)
exports.subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ success: false, error: "A valid email address is required" });
    }

    const Subscriber = require('../models/Subscriber');
    const existing = await Subscriber.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, error: "This email address is already subscribed to our newsletter." });
    }

    const subscriber = new Subscriber({ email: email.toLowerCase() });
    await subscriber.save();
    console.log(`✉️ New newsletter subscriber registered: ${email}`);
    res.json({ success: true, message: "Thank you for subscribing to the RamCart newsletter!" });
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};


