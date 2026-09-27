# 🛍️ RamCart — Omnichannel Enterprise E-Commerce Platform

[![Live Web Application](https://img.shields.io/badge/Live%20Web%20App-Firebase%20Hosting-blueviolet?style=for-the-badge&logo=firebase)](https://ecommerce-website-dfd55.web.app)
[![Frontend Stack](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%206%20%7C%20TypeScript%20%7C%20Tailwind-blue?style=for-the-badge&logo=react)](https://ecommerce-website-dfd55.web.app)
[![Backend Stack](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20MongoDB%20Atlas-green?style=for-the-badge&logo=nodedotjs)](https://ecommerce-website-dfd55.web.app)
[![Mobile App](https://img.shields.io/badge/Mobile-React%20Native%20%7C%20Expo%2057-black?style=for-the-badge&logo=expo)](https://github.com/ramtechnow/RamCart_Ecommerce_webpage)
[![License](https://img.shields.io/badge/License-MIT-orange?style=for-the-badge)](LICENSE)

> **RamCart** is a modern, enterprise-grade omnichannel e-commerce platform built with **React 19, TypeScript, Vite 6, Tailwind CSS, Node.js, Express, MongoDB Atlas, Firebase, and React Native (Expo)**. Engineered to deliver Flipkart/Myntra-grade shopping experiences, real-time warehouse inventory synchronization, progressive image loading, and high-contrast administrative intelligence.

---

## 🚀 What's New & Current Capabilities (Latest Release)

### 1. 🎠 Flipkart-Style Multi-Card Peeking Carousel
- **Desktop / Laptop View**: Displays **2.2 banner cards simultaneously** with smooth spacing, interactive preview of upcoming offers, and floating navigation chevrons.
- **Mobile Touch-Swipe**: Native touch gesture handling with right-edge slide peeking (`88vw` viewport width) inviting users to swipe naturally.
- **Signature Flipkart Pill Indicators**: Elongated black active pill (`32px`) with compact rounded inactive dots (`8px`) tracking slide position in real-time.
- **Direct Offer Deep Linking**: Clicking anywhere on a banner card instantly routes customers to specific product pages (`/product/:id`), categories (`/womens`, `/mens`, `/kids`), or custom seasonal sale filters.

### 2. 📦 Sharp Box Product Card Architecture
- Modernized from rounded bubbly edges to crisp, premium **sharp box borders (`border-radius: 4px`)** inspired by Zara, Meesho, and modern luxury commerce.
- Full-card hover elevation, interactive heart wishlist toggle, rating chips, discount percentages, and clean typography.

### 3. ⚡ High-Speed Image Performance & Shimmer Skeletons
- **WebP Compression Engine**: Automatic client-side image compression up to 640px retina resolution with WebP priority, shrinking base64 payloads by **60%–70%** (~35KB–50KB per item).
- **Progressive Shimmer Skeletons**: Integrated animated gradient skeleton shimmer placeholders during image fetches, eliminating blank white frames.
- **Native Browser Optimization**: Built with `loading="lazy"` and `decoding="async"` for optimal Core Web Vitals and zero layout shift.

### 4. 🔄 Real-Time Inventory Sync & Restocking
- **Automated Stock Decrement**: Placing an order (`/placeorder`) automatically reduces global `stockCount` and respective color/size variant stock in MongoDB in real time.
- **Automated Restocking on Cancel**: Marking an order as `Cancelled` automatically returns the exact purchased quantity back into warehouse inventory.

### 5. 🛡️ Accurate Administrative Analytics & Monochrome Theme
- **100% Truthful Financials**: Replaced dummy mock revenue projections with **Realized Sales** calculated strictly from verified, paid orders.
- **Warehouse Asset Valuation**: Real-time calculation of total warehoused units and gross catalog monetary valuation (`stockCount × price`).
- **Classic Minimalist Monochrome Theme**: Pure jet black (`#000000`) and crisp white (`#ffffff`) high-contrast palette with strict `darkMode: 'class'` support.
- **Sidebar & Table Contrast Fixes**: Eliminated hover badge invisibility and removed distracting heavy black background tints from product audit rows.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT APPLICATIONS                            │
├────────────────────────────────────────┬────────────────────────────────────┤
│           Web Storefront & Admin       │             Mobile App             │
│      React 19 + TypeScript + Vite 6    │       React Native 0.86 + Expo 57  │
│      Tailwind CSS + Redux Toolkit      │       React Navigation + Secure    │
└───────────────────┬────────────────────┴──────────────────┬─────────────────┘
                    │                                       │
                    │               REST JSON API           │
                    └───────────────────┬───────────────────┘
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND API & MICROSERVICES                        │
│                         Node.js + Express.js Engine                         │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│  Catalog & Variants  │    Orders & Stock    │      Auth & Security          │
│  Real-time Inventory │  Real-time Decrement │   JWT Auth + Firebase Sync    │
│  Base64 WebP Engine  │  Auto-Restock Logic  │   Role-based Admin Guard      │
└──────────┬───────────┴──────────┬───────────┴───────────────┬───────────────┘
           │                      │                           │
           ▼                      ▼                           ▼
┌──────────────────────┐ ┌──────────────────────┐ ┌───────────────────────────┐
│     MongoDB Atlas    │ │    Nodemailer SMTP   │ │      Firebase Hosting     │
│ Cloud Database Cluster│ │ Automated Order HTML │ │ Global Fast CDN Edge      │
│ Persistent Commerce  │ │ Delivery Receipts    │ │ SSL / Static Build Cache  │
└──────────────────────┘ └──────────────────────┘ └───────────────────────────┘
```

---

## 📁 Repository Structure

```plaintext
D:\Ecommerce/
├── frontend_project/             # React 19 + TypeScript Web Application
│   ├── src/
│   │   ├── Components/           # UI Components (ProductCard, PromoBanner, Navbar, etc.)
│   │   │   └── admin/            # Admin Console (Dashboard, Catalog, Banners, Orders)
│   │   ├── Context/              # Global Theme & Authentication Contexts
│   │   ├── features/             # Domain modules (catalog, auth, cart, orders)
│   │   ├── Pages/                # Client Views (Home, Shop, ProductDetail, Cart, Profile)
│   │   ├── Styles/               # Styling tokens (adminPanel.css, promobanner.css, etc.)
│   │   └── Utils/                # Helper utilities (compression, admin API, currency)
│   ├── tailwind.config.js        # Tailwind v3 with darkMode: 'class'
│   └── vite.config.ts            # Vite 6 bundler configuration
│
├── Backend/                      # Node.js + Express REST API Server
│   ├── controllers/              # Business logic (orderController, productController, etc.)
│   ├── middleware/               # Auth guards (fetchUser, fetchAdmin)
│   ├── models/                   # Mongoose schemas (Product, Order, User, Banner, Coupon)
│   ├── routes/                   # Modular REST routes
│   └── index.js                  # Express bootstrap, static uploads, database seed
│
├── RamCartMobile/                # React Native + Expo Mobile Application
│   ├── src/                      # Mobile screens, navigation stacks, storage
│   └── package.json              # Expo ~57 and React Native dependencies
│
└── README.md                     # Comprehensive project documentation
```

---

## 🛠️ Technology Stack Breakdown

| Layer | Technologies Used |
| :--- | :--- |
| **Web Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS, Redux Toolkit, React Router 7, Lucide Icons, React Bootstrap |
| **Mobile Frontend** | React Native 0.86, Expo ~57, React Navigation (Tabs & Stack), Expo SecureStore |
| **Backend API** | Node.js v18+, Express.js, Multer, Mongoose ORM, JSON Web Tokens (JWT), CORS |
| **Database** | MongoDB Atlas (Cloud) with fallback to MongoMemoryServer for offline dev |
| **Notifications** | Automated HTML emails via Nodemailer SMTP; In-App notification drawers |
| **Deployment** | Firebase Hosting (Global CDN) for Frontend; Render / Cloud for Backend API |

---

## 💻 Local Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: Installed and configured

### 1. Clone the Repository
```bash
git clone https://github.com/ramtechnow/RamCart_Ecommerce_webpage.git
cd RamCart_Ecommerce_webpage
```

### 2. Frontend Web Setup
```bash
cd frontend_project
npm install
npm run dev
```
- Local Dev URL: `http://localhost:5173`
- Production Build: `npm run build`
- Deploy to Firebase: `firebase deploy --only hosting`

### 3. Backend API Setup
```bash
cd ../Backend
npm install
```
Create a `.env` file in the `Backend` directory:
```env
PORT=4000
JWT_SECRET=your_super_secret_jwt_key
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/ecommerce
CORS_ORIGINS=http://localhost:5173,https://ecommerce-website-dfd55.web.app
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```
Start the server:
```bash
npm start
```
- Backend API running at: `http://localhost:4000`
- Pre-seeded Admin: `Admin@gmail.com` / `Admin@1234`

### 4. Mobile App Setup (Optional)
```bash
cd ../RamCartMobile
npm install
npx expo start
```

---

## 🌐 API Route Endpoints

### Catalog & Products
- `GET /allproducts` — Fetch full product catalog
- `POST /addproduct` — Add new product with per-variant pricing and stock (Admin)
- `POST /removeproduct` — Delete product (Admin)
- `POST /updateproduct` — Inline catalog edit (title, stock, pricing, variants)

### Orders & Real-time Inventory
- `POST /placeorder` — Place order, deduct stock from MongoDB, clear user cart
- `GET /userorders` — Retrieve authenticated user's order history
- `GET /admin/orders` — Retrieve enriched order list with customer details (Admin)
- `POST /admin/orders/status` — Update order status (triggers restock if `Cancelled`)

### Promotional Banners
- `GET /banners/active?page=home` — Fetch published hero banners
- `POST /admin/banners/create` — Publish banner with target link and discount (Admin)
- `POST /admin/banners/delete` — Remove promotional banner (Admin)

---

## 🎨 Recommended Banner Artwork Specifications

When designing hero banners for the Flipkart carousel:
- **Desktop / Laptop**: `1920 × 600 px` (Aspect ratio: `16:5`) or `1440 × 500 px`
- **Mobile View**: `800 × 500 px` (Aspect ratio: `16:10`) or `750 × 450 px`
- **Recommended File Format**: WebP or high-quality JPEG under 300 KB
- **Design Safe Zone**: Left 50% for promo headline & CTA; Right 50% for model & product imagery

---

## 🔗 Live Deployment & Resources

- 🌐 **Live Web Application**: [https://ecommerce-website-dfd55.web.app](https://ecommerce-website-dfd55.web.app)
- 🐙 **GitHub Repository**: [https://github.com/ramtechnow/RamCart_Ecommerce_webpage](https://github.com/ramtechnow/RamCart_Ecommerce_webpage)
- 📦 **Target Git Branch**: `Ecommerce_backend`

---

*Engineered with precision, clean architecture, and modern full-stack web craftsmanship.*
