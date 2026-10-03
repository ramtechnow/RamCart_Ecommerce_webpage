# RamCart — Project Memory & Decisions Log

> This document serves as the persistent context and decision log for the RamCart project. It answers the question: *"Why was this built this way?"*

---

## 1. Project Identity

| Field | Value |
| :--- | :--- |
| **Project Name** | RamCart |
| **Type** | Fashion & Apparel E-Commerce Platform |
| **Developer** | Shriram M G |
| **Email** | ramtechnow@gmail.com |
| **GitHub** | @ramtechnow20 |
| **Live App** | https://ecommerce-website-dfd55.web.app |
| **Repository** | https://github.com/ramtechnow/RamCart_Ecommerce_webpage |
| **Working Branch** | `Ecommerce_backend` |
| **Production Branch** | `main` (auto-deploys Render backend) |
| **Frontend Deploy** | Firebase Hosting (manual: `firebase deploy --only hosting`) |
| **Admin Email** | *(Protected — contact developer for access)* |

---

## 2. Technology Choices & Why

### Frontend: React 19 + TypeScript + Vite 6
**Why**: Modern ecosystem with excellent TypeScript support, Vite's fast HMR accelerates development, and React 19 features improved rendering primitives.

### Tailwind CSS
**Why**: Utility-first, zero-runtime CSS in JS. With `darkMode: 'class'` strategy, we get granular dark mode control tied to ThemeContext.

### Redux Toolkit
**Why**: Cart state must persist across page navigations. Redux provides predictable global state. Cart + auth + wishlist + toasts are all cross-component concerns.

### Backend: Node.js + Express
**Why**: Lightweight, familiar ecosystem for the developer, excellent MongoDB integration via Mongoose.

### MongoDB Atlas
**Why**: Free M0 tier, cloud-hosted, auto-backups. No self-hosted database maintenance. Works great with base64 image storage pattern.

### Base64 Images Instead of File Uploads
**Why**: Render (backend hosting) uses ephemeral filesystems — any uploaded files are lost on service restart. Base64 in MongoDB persists across all restarts. Trade-off: larger document size, mitigated by WebP compression to <60KB.

### Firebase Hosting for Frontend
**Why**: Free, global CDN, automatic HTTPS, supports custom domains, and one-command deploys. No server management needed.

### Nodemailer SMTP for Emails
**Why**: Direct control over email content and delivery. No external service dependencies. Dual-port fallback (465 → 587) handles Render's firewall restrictions.

---

## 3. Key Architectural Decisions

### Decision: Price from Variant, Not from Product
**Date**: Sep 2026  
**Context**: Originally, cart and checkout used `product.newPrice` for all sizes. This was incorrect — a Size S and Size XXXL can have very different prices.  
**Decision**: Cart price is always resolved from `variant.price` by matching `variant.size === selectedSize`. `product.newPrice` is a derived aggregate (minimum across variants) used only for catalog display and sorting.  
**Impact**: Changed `cartService.ts`, `useCart.ts`, and `Checkout.tsx` Buy Now loader.

### Decision: Remove Top-Level Price Inputs in Admin Add Product
**Date**: Sep 2026  
**Context**: Admin form had both top-level "New Price" / "Old Price" fields AND per-size pricing in the table — creating confusion and duplicate/conflicting data.  
**Decision**: Top-level price inputs completely removed. Prices are entered exclusively in the size-tier table. `newPrice` and `oldPrice` on the Product document are auto-derived as `Math.min()` and `Math.max()` respectively from variant prices at submit time.  
**Impact**: Modified `AdminAddProductTab.tsx` extensively.

### Decision: Cancelled Orders Are Immutable
**Date**: Sep 2026  
**Context**: Admins could accidentally re-activate cancelled orders by changing status, causing inventory double-accounting (restock already happened on cancel).  
**Decision**: Once an order status is `Cancelled`, no further status changes are allowed. The status change controls are hidden from the UI. Backend also validates and rejects status updates on cancelled orders.  
**Impact**: Modified `AdminOrdersTab.jsx` and `orderController.js`.

### Decision: Dual-Port SMTP (465 + 587 fallback)
**Date**: Sep 2026  
**Context**: On Render hosting, outbound port 465 sometimes times out due to cloud provider firewall rules. Emails were failing completely.  
**Decision**: Attempt port 465 (SSL) first. If connection times out or fails, automatically retry on port 587 (STARTTLS). Log both attempts clearly.  
**Impact**: All order emails now deliver reliably.

### Decision: Remove Brand Name References from README
**Date**: Sep 2026  
**Context**: README mentioned "Flipkart-style", "Myntra-grade", "inspired by Zara, Meesho" — creating potential trademark infringement risks.  
**Decision**: All third-party brand names removed. Replaced with generic technical descriptors: "multi-card peeking hero carousel", "contemporary fashion and lifestyle e-commerce", "adaptive pill indicators".  
**Impact**: README.md updated; committed and pushed to both branches.

### Decision: 5-Image Gallery (Max) Per Product
**Date**: Sep 2026  
**Context**: User reported only 3 images showing despite uploading 4. Bug: upload was capped at 3.  
**Decision**: Maximum of 5 images per product (Front, Back, Side, Detail, Additional). Image roles labeled. Reorder with ← → buttons. Gallery carousel on product detail shows all images.  
**Impact**: Fixed upload limit cap in `AdminAddProductTab.tsx`.

### Decision: Admin Credentials Not In GitHub
**Date**: Sep 2026  
**Context**: Default admin credentials (`Admin@gmail.com` / `Admin@1234`) were visible in README. This is a security risk — allows unauthorized admin access to the live site.  
**Decision**: Credentials removed from all public documentation. README now directs to developer (ramtechnow@gmail.com) for verified demo access.  
**Impact**: README updated; safer for public portfolio use.

---

## 4. Environment Variables Reference

> These are documented here for developer reference only. Never commit actual values.

| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | Express server port | `4000` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Random string |
| `MONGO_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173,...` |
| `EMAIL_USER` | SMTP sender email address | Gmail address |
| `EMAIL_PASS` | SMTP app password (not account password) | Google App Password |

---

## 5. Database Collections Reference

| Collection | Purpose |
| :--- | :--- |
| `products` | All product listings with variants, images, pricing |
| `users` | Registered customers — auth, address, wishlist |
| `orders` | All orders with items, status, and shipping |
| `banners` | Promotional hero banners |
| `coupons` | Discount coupon codes |
| `seasonalpromos` | Festive seasonal promotion settings |
| `otps` | Temporary OTP codes for email verification |
| `subscribers` | Newsletter email subscribers |

---

## 6. Important File Locations

| File | Purpose |
| :--- | :--- |
| `frontend_project/src/Utils/adminHelpers.js` | `compressImageToBase64()` — WebP compression |
| `frontend_project/src/Utils/adminApi.js` | All admin API call abstractions |
| `frontend_project/src/features/checkout/services/cartService.ts` | Cart price from variant resolution |
| `frontend_project/src/features/checkout/hooks/useCart.ts` | Add-to-cart with variant price |
| `frontend_project/src/Pages/Checkout.tsx` | Buy Now variant price resolution |
| `frontend_project/src/Components/admin/AdminAddProductTab.tsx` | Add product with per-size pricing |
| `frontend_project/src/Components/admin/AdminCatalogTab.tsx` | Inline catalog editing with merged price column |
| `Backend/utils/sendEmail.js` | Dual-port SMTP email sender |
| `Backend/controllers/orderController.js` | Order placement + stock decrement + email trigger |
| `Backend/middleware/fetchAdmin.js` | Admin role guard |
| `Backend/middleware/fetchUser.js` | User JWT auth guard |

---

## 7. Lessons Learned

1. **Always test email delivery** after backend deployment — Render's first startup can timeout SMTP connections.
2. **Never use `product.newPrice` for cart pricing** — always resolve from the matching variant.
3. **Base64 compression must happen client-side** before upload — not server-side — to keep API payload sizes manageable.
4. **Dark mode must be tested** for every new component immediately, not as an afterthought.
5. **Third-party brand names in docs** can create trademark issues even in open source projects.
6. **Admin credentials in public repos** are a real security risk — even on "personal" projects.
7. **Cancelled order status locks** must be enforced both in UI (hide buttons) AND in backend API (reject requests) — don't rely on just one layer.

---

## 8. Commit History Reference (Recent)

| Commit Hash | Description | Date |
| :--- | :--- | :--- |
| `6d133c4` | docs: update lead developer email to ramtechnow@gmail.com | Sep 2026 |
| `627f06e` | docs: secure admin credentials and add developer contact | Sep 2026 |
| `728c292` | docs: remove external brand names from README | Sep 2026 |
| `2d79d11` | docs: add 24 screenshots and comprehensive README visual showcase | Sep 2026 |
| `10c87e0` | feat: remove redundant top price inputs, manage prices solely per size | Sep 2026 |
| `47d6e5b` | fix: unify size-level pricing, remove duplicate price columns, optimize image compression | Sep 2026 |
| `9f23b0f` | fix: product image count, size variant pricing, mobile checkout, admin notifications | Sep 2026 |
| `ce99561` | fix: product detail 404, admin coupon management, cancelled order status lock | Sep 2026 |
| `3bb7f3d` | fix: email encoding, clean unicode emojis, use table layout for key info | Sep 2026 |

---

## 9. How to Update This File

Add a new entry under the appropriate section whenever:
- A significant architectural decision is made
- A bug is found and fixed with an important lesson
- A new technology or library is added
- A breaking change is introduced
- Environment variable names change
- Important file locations change

Format for decisions:
```markdown
### Decision: [Title]
**Date**: [Month Year]  
**Context**: [What problem existed]  
**Decision**: [What was decided and why]  
**Impact**: [What files/behavior changed]
```
