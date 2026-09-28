require('dotenv').config();
const dns = require('dns');
// Prioritize IPv4 DNS resolution globally to bypass IPv6 network routing issues on Render
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

// Assert JWT_SECRET is configured for security
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'secret_ecom') {
  console.error("\n🚨 FATAL ERROR: JWT_SECRET environment variable is either not defined or using insecure default 'secret_ecom'.");
  console.error("   The application cannot start securely. Please set a strong JWT_SECRET in your environment.\n");
  process.exit(1);
}
const port = process.env.PORT || 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const { MongoMemoryServer } = require('mongodb-memory-server');
const Product = require('./models/Product');
const User = require('./models/User');
const Coupon = require('./models/Coupon');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.set('trust proxy', 1);
app.use(cors({
  origin(origin, callback) {
    // Server-to-server calls and configured browser origins are allowed.
    const allowedOrigins = (process.env.CORS_ORIGINS || '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'auth-token']
}));

// Database connection with mongodb //
async function seedDatabase() {
  const srcDir = path.join(__dirname, '../frontend_project/src/Components/Assets');
  const destDir = path.join(__dirname, 'upload', 'images');

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  let copiedCount = 0;
  for (let i = 1; i <= 36; i++) {
    const fileName = `product_${i}.png`;
    const srcPath = path.join(srcDir, fileName);
    const destPath = path.join(destDir, fileName);
    if (fs.existsSync(srcPath) && !fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
      copiedCount++;
    }
  }
  if (copiedCount > 0) {
    console.log(`📂 Copied ${copiedCount} product assets to backend static upload folder.`);
  }

  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    console.log("🌱 Database is empty. Seeding 36 products into MongoDB...");
    const sampleProducts = [];

    for (let i = 1; i <= 36; i++) {
      let name = "";
      let category = "";
      let new_price = 85.0;
      let old_price = 120.5;

      if (i <= 12) {
        name = "Striped Flutter Sleeve Overlap Collar Peplum Hem Blouse";
        category = "women";
        if (i === 1) { new_price = 50.0; old_price = 80.5; }
        else if (i === 2) { new_price = 85.0; old_price = 120.5; }
        else if (i === 3) { new_price = 60.0; old_price = 100.5; }
        else if (i === 4) { new_price = 100.0; old_price = 150.0; }
      } else if (i <= 24) {
        name = "Men Green Solid Zippered Full-Zip Slim Fit Bomber Jacket";
        category = "men";
      } else {
        name = "Boys Orange Colourblocked Hooded Sweatshirt";
        category = "kid";
      }

      let colorsPool = ['Black', 'White'];
      if (category === 'women') {
        colorsPool = ['Black', 'White', 'Red', 'Pink'];
      } else if (category === 'men') {
        colorsPool = ['Green', 'Black', 'Blue'];
      } else if (category === 'kid') {
        colorsPool = ['Orange', 'Blue', 'Yellow'];
      }

      const variants = colorsPool.map(c => ({
        color: c,
        stock: 50,
        price: new_price
      }));

      sampleProducts.push({
        id: i,
        name,
        category,
        image: `http://localhost:${port}/images/product_${i}.png`,
        new_price,
        old_price,
        colors: colorsPool,
        variants,
        stockCount: variants.reduce((sum, v) => sum + v.stock, 0)
      });
    }

    await Product.insertMany(sampleProducts);
    console.log("✅ Seeded 36 products into MongoDB successfully!");
  }

  const adminCheck = await User.findOne({ email: { $regex: new RegExp("^Admin@gmail.com$", "i") } });
  if (!adminCheck) {
    console.log("🌱 Seeding Admin user...");
    const admin = new User({
      name: "Admin",
      email: "Admin@gmail.com",
      password: "Admin@1234",
      isAdmin: true,
      cartData: {},
    });
    await admin.save();
    console.log("✅ Admin user (Admin@gmail.com) pre-seeded successfully!");
  }
}

async function connectDatabase() {
  let mongoUri = process.env.MONGO_URI;

  try {
    if (!mongoUri) {
      console.error("\n🚨 =========================================================");
      console.error("   NO MONGO_URI SET — Using ephemeral in-memory MongoDB!");
      console.error("   ALL DATA (orders, users, coupons) WILL BE LOST on restart.");
      console.error("   Fix: Set MONGO_URI in Render > Environment Variables.");
      console.error("=========================================================\n");
      const mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
      console.log(`🚀 Ephemeral In-Memory MongoDB Server running at: ${mongoUri}`);
    }

    mongoose.connection.on('error', (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected successfully!");
    await seedDatabase();
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);

    try {
      console.log("⚠️ Falling back to an in-memory MongoDB Server...");
      const fallbackServer = await MongoMemoryServer.create();
      const fallbackUri = fallbackServer.getUri();
      await mongoose.connect(fallbackUri);
      console.log(`🚀 Ephemeral In-Memory MongoDB Server running at: ${fallbackUri}`);
      await seedDatabase();
    } catch (fallbackError) {
      console.error("❌ Failed to start fallback in-memory MongoDB:", fallbackError);
      process.exit(1);
    }
  }
}

const startServer = async () => {
  await connectDatabase();
  const server = app.listen(port, (error) => {
    if (!error) {
      console.log("Server Running on port " + port);
    } else {
      console.log("Error: " + error);
    }
  });

  // Fix Render / Load Balancer connection reset issue (intermittent ECONNRESET)
  server.keepAliveTimeout = 120000; // 120 seconds
  server.headersTimeout = 120000;   // 120 seconds
};

const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const couponRoutes = require('./routes/couponRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const seasonalRoutes = require('./routes/seasonalRoutes');

// API CREATION
app.get("/", (req, res) => {
  res.json({ success: true, service: "ecommerce-backend", status: "ok" });
});

app.get('/health', (req, res) => {
  res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({
    success: mongoose.connection.readyState === 1,
    service: 'ecommerce-backend',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'unavailable'
  });
});

// Image Storage Engine
const uploadDir = path.join(__dirname, 'upload', 'images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cd) => {
    cd(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// Create upload endpoint of images
app.use('/images', express.static(uploadDir, {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Cache-Control', 'public, max-age=86400');
  }
}));

app.post("/upload", upload.single('product'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: 0, error: 'A product image is required.' });
  }
  const host = req.get('host');
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('192.168.') || host.includes('10.') ? req.protocol : 'https';
  res.json({
    success: 1,
    image_url: `${protocol}://${host}/images/${req.file.filename}`
  })
});

// Use modular routes
app.use(productRoutes);
app.use(userRoutes);
app.use(orderRoutes);
app.use(couponRoutes);
app.use(bannerRoutes);
app.use(seasonalRoutes);

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ success: false, error: error.message });
  }
  if (error.message === 'Origin not allowed by CORS') {
    return res.status(403).json({ success: false, error: 'This site is not allowed to call the API.' });
  }
  console.error('Unhandled request error:', error);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

startServer();
