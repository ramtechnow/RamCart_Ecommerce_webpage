# RamCart — Product Requirements Document (PRD)

> **Version**: 2.0  
> **Last Updated**: October 2026  
> **Author**: Shriram M G  
> **Status**: Active Development  

---

## 1. Product Overview

**RamCart** is a modern, full-stack fashion and apparel e-commerce platform tailored for selling clothing, accessories, and lifestyle products online. The platform serves three distinct user types: **Customers** (browse, buy, track), **Admins** (manage catalog, orders, promotions), and **Developers** (maintain, extend, deploy).

### 1.1 Mission Statement
Deliver a fast, reliable, and visually polished shopping experience for fashion apparel — with production-grade inventory controls, size-tier variant pricing, and automated operational workflows.

### 1.2 Live Deployment
- **Web App**: https://ecommerce-website-dfd55.web.app  
- **Backend API**: Hosted on Render (auto-deploys from `main` branch)  
- **Repository**: https://github.com/ramtechnow/RamCart_Ecommerce_webpage  

---

## 2. Target Users & Personas

| Persona | Description | Primary Goal |
| :--- | :--- | :--- |
| **Customer** | Fashion shoppers (18–45 age group) browsing on mobile or desktop | Browse products, buy clothes, track orders |
| **Admin / Store Owner** | Business owner managing catalog and orders | Add/edit products, fulfill orders, run promotions |
| **Developer** | Engineers maintaining or extending the platform | Clean codebase, documented API, easy deployment |

---

## 3. Core Feature Requirements

### 3.1 Customer-Facing Features

#### 3.1.1 Storefront & Discovery
- [ ] Home page with animated multi-card peeking hero carousel (2.2 cards visible on desktop)
- [ ] Category browsing: Women's, Men's, Kids
- [ ] Catalog grid with product cards showing new price, old price, and discount badge
- [ ] Smart search bar with voice search support
- [ ] Multi-attribute filtering (category, price range, size, color)
- [ ] Dark/Light theme toggle (persisted in localStorage)
- [ ] Festive seasonal banners and promotional announcement marquee

#### 3.1.2 Product Detail Page
- [ ] Multi-image gallery (up to 5 images: Front, Back, Side, Detail, Size Chart)
- [ ] Size variant selector (XXS to 4XL) with dynamic price display per size
- [ ] Quantity selector with stock-aware increment limit
- [ ] Add to Cart and Buy Now actions (disabled until size selected)
- [ ] Wishlist toggle (heart button)
- [ ] Out-of-stock size strikethrough display

#### 3.1.3 Shopping Cart & Checkout
- [ ] Persistent cart (Redux + localStorage)
- [ ] Cart panel slide-over with item price resolved from chosen size variant
- [ ] Coupon code application with discount calculation
- [ ] Order summary with subtotal, discount, and final amount
- [ ] Order placement with stock decrement and email confirmation trigger

#### 3.1.4 Order Tracking
- [ ] User orders page with full order history
- [ ] Per-order status: Pending → Processing → Shipped → Delivered / Cancelled
- [ ] Cancellation allowed only on non-final statuses
- [ ] Cancelled orders locked permanently (no status reversal)
- [ ] Refund initiation notification displayed on cancellation

#### 3.1.5 Account & Authentication
- [ ] Sign up with email + OTP verification
- [ ] Sign in (email/password) with JWT session
- [ ] Forgot password via OTP email
- [ ] Firebase Authentication integration for social login
- [ ] Profile page: name, phone (optional), address management

#### 3.1.6 Wishlist
- [ ] Add/remove products to wishlist
- [ ] Persistent wishlist (Redux slice + backend sync)
- [ ] Move to cart directly from wishlist

---

### 3.2 Admin Panel Features

#### 3.2.1 Dashboard Analytics
- [ ] Verified revenue (calculated from confirmed orders only — no mock data)
- [ ] Total orders count with breakdown by status
- [ ] Total products and warehoused units count
- [ ] Gross catalog valuation (stockCount × price across all variants)
- [ ] Recent orders table with customer details

#### 3.2.2 Catalog Management
- [ ] Add product with multi-image upload (up to 5 WebP-compressed images)
- [ ] Per-size pricing table: New Price (₹) and Old Price (₹) for each size
- [ ] Auto-derived catalog `newPrice` = `Math.min(...variant prices)`, `oldPrice` = `Math.max(...oldPrices)`
- [ ] Stock management per size variant (In Stock / Out of Stock toggle + unit count)
- [ ] Inline catalog editing without page navigation
- [ ] Delete products with confirmation modal

#### 3.2.3 Order Management
- [ ] View all orders enriched with customer details
- [ ] Update order shipping status: Processing → Shipped → Delivered
- [ ] Cancel orders with automatic inventory restock
- [ ] Cancelled status immutably locked (no reversal)

#### 3.2.4 Hero Banner Management
- [ ] Create promotional banners with image, title, link, and discount percentage
- [ ] Toggle active/inactive banners
- [ ] Assign banners to pages: home, womens, mens, kids
- [ ] Banner artwork specs: 1920×600px desktop / 800×500px mobile

#### 3.2.5 Coupon & Offer Management
- [ ] Create coupon codes with fixed or percentage discounts
- [ ] Set expiry dates and minimum order value
- [ ] Activate / deactivate coupons
- [ ] Usage tracking per coupon

#### 3.2.6 Seasonal & Festive Settings
- [ ] Enable/disable seasonal sale banners and particle animations
- [ ] Configure festive theme (Diwali, Pongal, Sale events)
- [ ] Set promotional messaging displayed site-wide

#### 3.2.7 User Management
- [ ] View all registered customers
- [ ] See order count and total spend per user
- [ ] Block/unblock users

---

### 3.3 Notification & Email System

- [ ] Order Placed confirmation email with order summary and estimated delivery
- [ ] Order Shipped / Delivered status update email
- [ ] Order Cancelled email with refund initiation notice
- [ ] Dual-port SMTP delivery: Port 465 (SSL primary) → Port 587 (STARTTLS fallback)
- [ ] Branded HTML email templates (not plain text)

---

## 4. Non-Functional Requirements

| Category | Requirement |
| :--- | :--- |
| **Performance** | Page load < 2s on 4G; images compressed to <60KB WebP |
| **Responsiveness** | Full mobile, tablet, and desktop support (Tailwind breakpoints) |
| **Security** | JWT authentication, role-based API guards, no credentials in codebase |
| **Reliability** | SMTP dual-port failover; MongoDB Atlas cloud persistence |
| **SEO** | Semantic HTML, lazy image loading, proper meta tags |
| **Dark Mode** | Full dark/light theme via `darkMode: 'class'` Tailwind strategy |

---

## 5. Out of Scope (Current Version)

- Payment gateway integration (Razorpay/Stripe) — placeholder checkout only
- Product reviews and ratings (display only, no write)
- Advanced recommendation engine
- Multi-language / i18n support
- Seller multi-vendor marketplace

---

## 6. Success Metrics

| Metric | Target |
| :--- | :--- |
| Page load time (LCP) | < 2.5 seconds |
| Image size per product | < 60 KB WebP |
| Order email delivery | 100% (dual-port fallback) |
| Admin task completion time | < 30 seconds for catalog edits |
| Mobile usability score | > 90 (Lighthouse) |
