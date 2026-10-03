# RamCart — System Architecture

> **Version**: 2.0  
> **Last Updated**: October 2026  
> **Author**: Shriram M G  

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               CLIENT APPLICATIONS                               │
├─────────────────────────────────────┬───────────────────────────────────────────┤
│        Web App (Firebase CDN)       │         Mobile App (Expo Go)              │
│   React 19 + TypeScript + Vite 6    │      React Native 0.86 + Expo ~57         │
│   Tailwind CSS + Redux Toolkit      │      React Navigation (Stack + Tabs)      │
│   Firebase Auth + localStorage      │      Expo SecureStore + Async Storage     │
└────────────────────┬────────────────┴──────────────────────┬────────────────────┘
                     │                                        │
                     │            REST JSON API               │
                     │        (auth-token header)             │
                     └────────────────┬───────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND API SERVER (Render)                           │
│                        Node.js v18+ + Express.js 4.x                            │
├──────────────────────┬───────────────────────┬──────────────────────────────────┤
│   Product / Catalog  │     Orders & Stock    │       Auth & Security            │
│   Variant Pricing    │   Real-time Decrement │   JWT Sign/Verify (RS256)        │
│   Image Base64 Store │   Cancellation Restock│   Firebase UID Sync              │
│   Category Filtering │   Status Lock Guards  │   Role-based Middleware           │
├──────────────────────┴───────────────────────┴──────────────────────────────────┤
│               Notification / Email Layer (Nodemailer SMTP)                      │
│       Port 465 SSL (Primary) → Port 587 STARTTLS (Fallback)                    │
│       Templates: Order Placed, Shipped, Delivered, Cancelled                   │
└────────────┬──────────────────────────────────────────────┬─────────────────────┘
             │                                              │
             ▼                                              ▼
┌────────────────────────┐                    ┌────────────────────────────────────┐
│     MongoDB Atlas      │                    │         Firebase Hosting           │
│  Cloud DB Cluster (M0) │                    │  Global CDN — SSL — Auto-cache     │
│  Collections:          │                    │  Static React build (dist/)        │
│  • products            │                    │  ecommerce-website-dfd55.web.app   │
│  • users               │                    └────────────────────────────────────┘
│  • orders              │
│  • banners             │
│  • coupons             │
│  • seasonalpromos      │
│  • otps                │
│  • subscribers         │
└────────────────────────┘
```

---

## 2. Repository Structure

```
d:\Ecommerce/
│
├── Docs/                            ← Project documentation (this folder)
│   ├── PRD.md                       ← Product Requirements
│   ├── ARCHITECTURE.md              ← System Architecture (this file)
│   ├── RULES.md                     ← Development Rules & Conventions
│   ├── DESIGN.md                    ← UI/UX Design Specifications
│   ├── TASK.md                      ← Active Task Tracker
│   └── MEMORY.md                    ← Project Context & Decisions Log
│
├── Screenshots/                     ← High-res platform screenshots (01–24)
│
├── frontend_project/                ← React 19 + TypeScript Web Application
│   ├── src/
│   │   ├── App.tsx                  ← Root router + global providers
│   │   ├── index.tsx                ← React DOM entry point
│   │   ├── Components/
│   │   │   ├── admin/               ← Admin Panel tab components
│   │   │   │   ├── AdminAddProductTab.tsx
│   │   │   │   ├── AdminCatalogTab.tsx
│   │   │   │   ├── AdminOrdersTab.jsx
│   │   │   │   ├── AdminBannersTab.tsx
│   │   │   │   ├── AdminCouponsTab.jsx
│   │   │   │   ├── AdminDashboardTab.tsx
│   │   │   │   ├── AdminSeasonalTab.tsx
│   │   │   │   ├── AdminUsersTab.jsx
│   │   │   │   ├── AdminSidebar.jsx
│   │   │   │   └── AdminTopbar.jsx
│   │   │   ├── ui/                  ← Reusable atomic UI components
│   │   │   ├── auth/                ← ForgotPasswordForm
│   │   │   ├── Navbar.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── CartPanel.tsx
│   │   │   ├── PromoBanner.jsx      ← Multi-card peeking carousel
│   │   │   ├── Footer.tsx
│   │   │   └── ...
│   │   ├── Pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Shop.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   ├── Cart.tsx
│   │   │   ├── Checkout.tsx
│   │   │   ├── Orders.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── Wishlist.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── AdminPanel.tsx
│   │   │   └── NotFound.tsx
│   │   ├── features/                ← Domain-driven feature modules
│   │   │   ├── auth/                ← useAuth, authService, authSchemas
│   │   │   ├── catalog/             ← useProducts, useWishlist, productService
│   │   │   ├── checkout/            ← useCart, cartService, orderService
│   │   │   └── admin/               ← adminService
│   │   ├── store/                   ← Redux Toolkit global state
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.ts
│   │   │   │   ├── cartSlice.ts
│   │   │   │   ├── wishlistSlice.ts
│   │   │   │   └── toastSlice.ts
│   │   │   ├── hooks.ts
│   │   │   └── index.ts
│   │   ├── Context/
│   │   │   └── ThemeContext.tsx     ← Dark/Light mode context
│   │   ├── config/
│   │   │   └── firebase.ts          ← Firebase SDK init
│   │   ├── routes/
│   │   │   └── ProtectedRoute.tsx   ← Auth guard HOC
│   │   ├── Hooks/
│   │   │   ├── useOtpTimer.js
│   │   │   └── useTheme.js
│   │   ├── Utils/
│   │   │   ├── adminApi.js          ← Admin API abstraction
│   │   │   ├── adminHelpers.js      ← compressImageToBase64 (WebP, <60KB)
│   │   │   ├── cartUtils.js
│   │   │   ├── helpers.js
│   │   │   └── validators.js
│   │   └── Styles/                  ← Per-page CSS modules
│   ├── public/
│   ├── dist/                        ← Production build output
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── Backend/                         ← Node.js + Express REST API
│   ├── index.js                     ← Express bootstrap + DB connect + seeding
│   ├── models/
│   │   ├── Product.js               ← Product + variants schema
│   │   ├── User.js                  ← User + wishlist + address schema
│   │   ├── Order.js                 ← Order + status + items schema
│   │   ├── Banner.js                ← Promotional banner schema
│   │   ├── Coupon.js                ← Coupon codes schema
│   │   ├── SeasonalPromo.js         ← Festive promo settings schema
│   │   ├── OTP.js                   ← OTP verification schema
│   │   └── Subscriber.js            ← Newsletter subscriber schema
│   ├── controllers/
│   │   ├── productController.js
│   │   ├── orderController.js       ← Includes stock decrement + restock logic
│   │   ├── userController.js
│   │   ├── bannerController.js
│   │   ├── couponController.js
│   │   └── seasonalController.js
│   ├── routes/
│   │   ├── productRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── userRoutes.js
│   │   ├── bannerRoutes.js
│   │   ├── couponRoutes.js
│   │   └── seasonalRoutes.js
│   ├── middleware/
│   │   ├── fetchUser.js             ← JWT auth middleware
│   │   └── fetchAdmin.js            ← Admin role guard middleware
│   ├── utils/
│   │   └── sendEmail.js             ← Nodemailer dual-port SMTP
│   └── .env                         ← Environment secrets (not in git)
│
├── RamCartMobile/                   ← React Native + Expo Mobile App
│   ├── src/
│   │   ├── screens/
│   │   ├── navigation/
│   │   └── storage/
│   └── package.json
│
└── README.md
```

---

## 3. Data Models

### 3.1 Product
```js
{
  _id: ObjectId,
  name: String,
  description: String,
  category: "women" | "men" | "kid",
  newPrice: Number,          // derived: Math.min(...variant prices)
  oldPrice: Number,          // derived: Math.max(...variant oldPrices)
  image: String,             // base64 WebP (primary cover)
  images: [String],          // up to 5 base64 WebP images
  sizes: [String],           // e.g. ["S","M","L","XL"]
  colors: [String],          // e.g. ["Black","White"]
  stockCount: Number,        // total units across all variants
  available: Boolean,
  variants: [{               // per-size variant pricing
    sku: String,
    size: String,
    color: String,
    price: Number,
    oldPrice: Number,
    old_price: Number,
    stock: Number
  }],
  date: Date
}
```

### 3.2 Order
```js
{
  _id: ObjectId,
  userId: String,
  email: String,
  items: [{
    productId: ObjectId,
    name: String,
    size: String,
    color: String,
    quantity: Number,
    price: Number,
    image: String
  }],
  totalAmount: Number,
  couponCode: String,
  discount: Number,
  shippingAddress: Object,
  status: "Pending"|"Processing"|"Shipped"|"Delivered"|"Cancelled",
  cancelledAt: Date,
  estimatedDelivery: Date,
  createdAt: Date
}
```

### 3.3 User
```js
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String,         // bcrypt hashed
  phone: String,            // optional
  firebaseUid: String,      // Firebase social login
  isAdmin: Boolean,
  address: [{
    street, city, state, pincode, country
  }],
  wishlist: [ObjectId],     // product refs
  date: Date
}
```

---

## 4. API Endpoint Reference

### Products
| Method | Route | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/allproducts` | None | Fetch all products |
| POST | `/addproduct` | Admin | Add product with variants |
| POST | `/removeproduct` | Admin | Delete product by ID |
| POST | `/updateproduct` | Admin | Update product fields |

### Orders
| Method | Route | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/placeorder` | User | Place order, decrement stock |
| GET | `/userorders` | User | Get user's order history |
| GET | `/admin/orders` | Admin | Get all orders enriched |
| POST | `/admin/orders/status` | Admin | Update status, trigger restock |

### Auth & Users
| Method | Route | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/signup` | None | Register new user |
| POST | `/login` | None | Login, return JWT |
| POST | `/verify-otp` | None | OTP email verification |
| GET | `/getuser` | User | Get profile data |
| POST | `/updateuser` | User | Update profile/address |

### Banners
| Method | Route | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/banners/active` | None | Fetch active banners by page |
| POST | `/admin/banners/create` | Admin | Create banner |
| POST | `/admin/banners/delete` | Admin | Delete banner |

### Coupons
| Method | Route | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/admin/coupons` | Admin | Create coupon |
| GET | `/admin/coupons` | Admin | List coupons |
| POST | `/validate-coupon` | User | Validate & apply coupon |

---

## 5. Deployment Pipeline

```
Developer → git push origin Ecommerce_backend
                  ↓
         Merge to main branch
                  ↓
    ┌─────────────────────────────┐
    │   Render (Auto-deploy)      │  ← Backend API (Node.js)
    │   On push to main branch    │
    └─────────────────────────────┘
    ┌─────────────────────────────┐
    │   Firebase Hosting          │  ← Frontend (Static React build)
    │   firebase deploy           │     Manual: npm run build → firebase deploy
    └─────────────────────────────┘
```

### Environment Variables (Backend `.env`)
```env
PORT=4000
JWT_SECRET=<strong_random_secret>
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/ecommerce
CORS_ORIGINS=http://localhost:5173,https://ecommerce-website-dfd55.web.app
EMAIL_USER=<smtp_email>
EMAIL_PASS=<smtp_app_password>
```

---

## 6. Key Technical Decisions

| Decision | Reason |
| :--- | :--- |
| Base64 images instead of file uploads | Simpler deployment (no static file server needed), Render ephemeral filesystem |
| WebP compression to <60KB client-side | Reduces MongoDB document size, faster API responses |
| MongoDB Atlas M0 free tier | Zero-cost cloud persistence with automatic backups |
| Firebase Hosting for frontend | Global CDN, free SSL, instant deploys |
| Redux Toolkit for state | Predictable state for cart, auth, wishlist across page navigations |
| Dual-port SMTP (465 + 587) | Maximum email delivery reliability across different hosting environments |
| `darkMode: 'class'` in Tailwind | Manual theme control via ThemeContext, persisted in localStorage |
