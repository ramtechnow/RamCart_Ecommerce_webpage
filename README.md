# 🛍️ RamCart — Modern Fashion & Apparel E-Commerce Platform

[![Live Web Application](https://img.shields.io/badge/Live%20Web%20App-Firebase%20Hosting-blueviolet?style=for-the-badge&logo=firebase)](https://ecommerce-website-dfd55.web.app)
[![Frontend Stack](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%206%20%7C%20TypeScript%20%7C%20Tailwind-blue?style=for-the-badge&logo=react)](https://ecommerce-website-dfd55.web.app)
[![Backend Stack](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20MongoDB%20Atlas-green?style=for-the-badge&logo=nodedotjs)](https://ecommerce-website-dfd55.web.app)
[![Mobile App](https://img.shields.io/badge/Mobile-React%20Native%20%7C%20Expo%2057-black?style=for-the-badge&logo=expo)](https://github.com/ramtechnow/RamCart_Ecommerce_webpage)
[![License](https://img.shields.io/badge/License-MIT-orange?style=for-the-badge)](LICENSE)

> **RamCart** is a modern, full-stack fashion and apparel e-commerce platform built with **React 19, TypeScript, Vite 6, Tailwind CSS, Node.js, Express, MongoDB Atlas, Firebase, and React Native (Expo)**. Engineered to deliver high-performance online shopping for clothing and fashion wear, real-time warehouse inventory synchronization, size-tier variant pricing, progressive image loading, and high-contrast administrative intelligence.

---

## 📸 Visual Showcase & Platform Previews

### 🌟 1. Customer Storefront Experience

| Storefront Home Page | Multi-Card Peeking Hero Carousel |
| :---: | :---: |
| ![Storefront Home](Screenshots/01_storefront_home.png) | ![Storefront Carousel](Screenshots/02_storefront_carousel.png) |

| Smart Voice Search & Multi-Filters | High-Contrast Dark Mode Experience |
| :---: | :---: |
| ![Search Voice Filters](Screenshots/04_search_voice_filters.png) | ![Dark Mode](Screenshots/03_storefront_dark_mode.png) |

| Catalog Grid View | Category Page (Women's Collection) |
| :---: | :---: |
| ![Catalog Grid](Screenshots/05_catalog_grid.png) | ![Womens Collection](Screenshots/06_category_womens_collection.png) |

---

### 🛍️ 2. Product Detail, Cart & Order Tracking

| Product Details (Size Selection & Dynamic Pricing) | Shopping Cart & Price Breakdown |
| :---: | :---: |
| ![Product Details](Screenshots/07_product_details_view.png) | ![Shopping Cart](Screenshots/08_shopping_cart.png) |

| Customer Wishlist | Customer Orders & Live Status Tracking |
| :---: | :---: |
| ![Wishlist](Screenshots/09_customer_wishlist.png) | ![Customer Orders](Screenshots/10_customer_orders_tracking.png) |

---

### 🛡️ 3. Administrative Intelligence & Operations Suite

| Executive Analytics Dashboard | Catalog & Inventory Quick-Edit |
| :---: | :---: |
| ![Admin Dashboard](Screenshots/13_admin_dashboard_analytics.png) | ![Admin Catalog](Screenshots/15_admin_catalog_inventory.png) |

| Add Product with Size-Tier Pricing | Order Fulfillment & Restock Pipeline |
| :---: | :---: |
| ![Add Product](Screenshots/16_admin_add_product_variants.png) | ![Order Management](Screenshots/17_admin_orders_fulfillment.png) |

| Hero Banners Manager | Offers & Coupon Codes Manager |
| :---: | :---: |
| ![Hero Banners](Screenshots/18_admin_hero_banners.png) | ![Coupons Offers](Screenshots/19_admin_coupons_discounts.png) |

| Seasonal & Festive Campaigns | Customer & User Management |
| :---: | :---: |
| ![Seasonal Campaigns](Screenshots/20_admin_festive_seasonal.png) | ![User Management](Screenshots/21_admin_user_management.png) |

---

### 📧 4. Automated Transactional Email Notifications (Nodemailer SMTP)

| Order Placed Confirmation | Out for Delivery / Delivered Receipt | Order Cancellation & Restock Notification |
| :---: | :---: | :---: |
| ![Order Placed](Screenshots/22_email_order_placed.png) | ![Order Delivered](Screenshots/23_email_order_delivered.png) | ![Order Cancelled](Screenshots/24_email_order_cancelled.png) |

---

<details>
<summary><b>🔐 Click to View Customer Authentication & Profile Screens</b></summary>

| User Sign In | Create Account / Registration | Admin Profile & System Settings |
| :---: | :---: | :---: |
| ![User Sign In](Screenshots/11_user_signin.png) | ![User Sign Up](Screenshots/12_user_signup.png) | ![Admin Profile](Screenshots/14_admin_profile_system.png) |

</details>

---

## 🚀 Key Capabilities & Architectural Highlights

### 1. 🎠 Multi-Card Peeking Hero Carousel
- **Desktop / Laptop View**: Displays **2.2 promotional banner cards simultaneously** with smooth spacing, interactive preview of upcoming offers, and floating navigation chevrons.
- **Mobile Touch-Swipe**: Native touch gesture handling with right-edge slide peeking (`88vw` viewport width) inviting users to swipe naturally.
- **Adaptive Pill Indicators**: Elongated dark active pill (`32px`) with compact rounded inactive dots (`8px`) tracking slide position in real-time.
- **Direct Offer Deep Linking**: Clicking anywhere on a banner card instantly routes customers to specific product pages (`/product/:id`), categories (`/womens`, `/mens`, `/kids`), or custom seasonal sale filters.

### 2. 🏷️ Size-Tier Variant Pricing & Instant Checkout Sync
- **Granular Price Specification**: Set individual `New Price (₹)` and `Old Price (₹)` directly per size variant (XXS to 4XL).
- **Dynamic Price Selection**: Switching size variants dynamically updates the item price in the product view, shopping cart, and Buy Now checkout workflow.
- **Automated Base Price Aggregation**: Catalog sorting and card previews automatically aggregate `Math.min(...)` promo prices across available variants.

### 3. 📦 Sharp Box Product Card Architecture
- Modernized from rounded bubbly edges to crisp, premium **sharp box borders (`border-radius: 4px`)** tailored for contemporary fashion and lifestyle e-commerce.
- Full-card hover elevation, interactive heart wishlist toggle, rating chips, discount percentages, and clean typography.

### 4. ⚡ High-Speed Image Performance & Shimmer Skeletons
- **WebP Compression Engine**: Automatic client-side image compression up to 750px retina resolution with WebP priority, shrinking base64 payloads to **~35KB–60KB per image**.
- **Progressive Shimmer Skeletons**: Integrated animated gradient skeleton shimmer placeholders during image fetches, eliminating blank white frames.
- **Native Browser Optimization**: Built with `loading="lazy"` and `decoding="async"` for optimal Core Web Vitals and zero layout shift.

### 5. 🔄 Real-Time Inventory Sync & Restocking Protection
- **Automated Stock Decrement**: Placing an order (`/placeorder`) automatically reduces global `stockCount` and respective color/size variant stock in MongoDB in real time.
- **Automated Restocking on Cancel**: Marking an order as `Cancelled` automatically returns the exact purchased quantity back into warehouse inventory.
- **Locked Cancellation Status**: Cancelled orders are immutably locked against accidental status reversals to prevent duplicate inventory accounting.

### 6. 📧 Multi-Channel Automated Transactional Emails
- **100% Reliable SMTP Delivery**: Powered by dual-port SMTP delivery (Port 465 SSL with Port 587 STARTTLS auto-failover).
- **Branded HTML Receipts**: Instant email dispatch upon Order Placement, Shipping Status Updates, Delivery Confirmation, and Cancellation Notices.

### 7. 🛡️ Accurate Administrative Analytics & Monochrome Theme
- **100% Truthful Financials**: Replaced dummy mock revenue projections with **Realized Sales** calculated strictly from verified, paid orders.
- **Warehouse Asset Valuation**: Real-time calculation of total warehoused units and gross catalog monetary valuation (`stockCount × price`).
- **Classic Minimalist Monochrome Theme**: Pure jet black (`#000000`) and crisp white (`#ffffff`) high-contrast palette with strict `darkMode: 'class'` support.

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
├── Screenshots/                  # High-Resolution Application Screen Captures
│   ├── 01_storefront_home.png
│   ├── 02_storefront_carousel.png
│   ├── 03_storefront_dark_mode.png
│   ├── 04_search_voice_filters.png
│   ├── 05_catalog_grid.png
│   ├── ...
│   └── 24_email_order_cancelled.png
│
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
| **Notifications** | Automated HTML emails via Nodemailer SMTP (Dual-port 465 SSL / 587 STARTTLS) |
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

> [!NOTE]
> **Admin Panel Credentials Protected**:
> For security and database integrity, default administrative credentials (User ID & Password) are not publicly disclosed in this repository. To experience the live Admin Intelligence Suite (Catalog Manager, Orders Pipeline, Banner Engine, and Coupons), please contact the developer directly (details below).

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
- `POST /addproduct` — Add new product with size-tier pricing and stock (Admin)
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

When designing promotional hero banners for the multi-card carousel:
- **Desktop / Laptop**: `1920 × 600 px` (Aspect ratio: `16:5`) or `1440 × 500 px`
- **Mobile View**: `800 × 500 px` (Aspect ratio: `16:10`) or `750 × 450 px`
- **Recommended File Format**: WebP or high-quality JPEG under 300 KB
- **Design Safe Zone**: Left 50% for promo headline & CTA; Right 50% for model & product imagery

---

## 🛡️ Administrative Console Access & Inquiries

> [!IMPORTANT]
> **Admin Credentials Protected**:
> To ensure production data privacy, prevent unauthorized catalog tampering, and safeguard inventory workflows, **administrative login credentials (User ID & Password) are not publicly shared on GitHub**.
>
> If you are a recruiter, engineering evaluator, prospective client, or collaborator interested in test-driving the administrative console and operations features (Analytics, Catalog Management, Variant Pricing, Order Pipelines, and Coupon Engines), please reach out directly:
>
> - **Lead Developer**: **Shriram M G**
> - **Email**: [bvhss20@gmail.com](mailto:bvhss20@gmail.com)
> - **GitHub**: [@ramtechnow20](https://github.com/ramtechnow20)
>
> Verified demo access credentials or a guided walkthrough session will be provided upon request.

---

## 🔗 Live Deployment & Resources

- 🌐 **Live Web Application**: [https://ecommerce-website-dfd55.web.app](https://ecommerce-website-dfd55.web.app)
- 🐙 **GitHub Repository**: [https://github.com/ramtechnow/RamCart_Ecommerce_webpage](https://github.com/ramtechnow/RamCart_Ecommerce_webpage)
- 📦 **Target Git Branch**: `Ecommerce_backend`
- 👨‍💻 **Developer & Maintainer**: **Shriram M G** ([bvhss20@gmail.com](mailto:bvhss20@gmail.com))

---

*Engineered with precision, clean architecture, and modern full-stack web craftsmanship.*
