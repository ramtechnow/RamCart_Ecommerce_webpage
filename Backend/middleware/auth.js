const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to fetch user from token
exports.fetchUser = async (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) {
    return res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.user = data.user;
    next();
  } catch (error) {
    return res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
};

// Middleware to fetch user and verify admin or vendor status
exports.fetchAdmin = async (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) {
    return res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    if (!data || !data.user) {
      return res.status(401).send({ errors: "Please authenticate using a valid token" });
    }

    let isSuper = Boolean(data.user.isAdmin || data.user.email?.toLowerCase() === "bvhss20@gmail.com");
    let isVendor = Boolean(data.user.role === "vendor");

    // Live MongoDB lookup if token claims don't reflect current privileges (handles role promotions without requiring re-login)
    if (!isSuper && !isVendor) {
      try {
        const query = [];
        if (data.user.id !== undefined) query.push({ id: data.user.id });
        if (data.user._id) query.push({ _id: data.user._id });
        if (data.user.email) query.push({ email: { $regex: new RegExp("^" + data.user.email + "$", "i") } });

        if (query.length > 0) {
          const dbUser = await User.findOne({ $or: query });
          if (dbUser) {
            if (dbUser.isAdmin || dbUser.email?.toLowerCase() === "bvhss20@gmail.com") {
              isSuper = true;
              data.user.isAdmin = true;
              data.user.role = 'admin';
            } else if (dbUser.role === 'vendor') {
              isVendor = true;
              data.user.role = 'vendor';
              data.user.vendorName = dbUser.vendorName || data.user.vendorName || dbUser.name;
              data.user.vendorAddress = dbUser.vendorAddress || data.user.vendorAddress || '';
            }
          }
        }
      } catch (dbErr) {
        console.error("fetchAdmin DB lookup error:", dbErr);
      }
    }

    if (isSuper || isVendor) {
      req.user = data.user;
      next();
    } else {
      return res.status(403).send({ errors: "Access denied. Admin or Vendor privileges required." });
    }
  } catch (error) {
    return res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
};
