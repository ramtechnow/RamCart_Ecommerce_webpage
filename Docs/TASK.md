# RamCart — Task Tracker

> **Last Updated**: October 2026  
> **Active Branch**: `Ecommerce_backend`  
> **Developer**: Shriram M G  

---

## Legend

| Symbol | Meaning |
| :--- | :--- |
| ✅ | Completed |
| 🔄 | In Progress |
| 📋 | Planned / To Do |
| 🐛 | Bug Fix |
| ⛔ | Blocked |
| 🔍 | Needs Investigation |

---

## 🔥 Active Sprint — Current Work

> Update this section with what you're currently working on.

| # | Task | Status | Notes |
| :--- | :--- | :--- | :--- |
| — | *(No active task — add here)* | — | — |

---

## ✅ Completed Tasks (Recent)

### Email System
| Task | Commit | Date |
| :--- | :--- | :--- |
| Fix email not sending on order place and cancel | `3bb7f3d` | Sep 2026 |
| Add dual-port SMTP failover (465 → 587) | — | Sep 2026 |
| Fix Unicode emoji encoding issues in email templates | `3bb7f3d` | Sep 2026 |
| Test email delivery confirmed working | — | Sep 2026 |

### Pricing & Variants
| Task | Commit | Date |
| :--- | :--- | :--- |
| Remove top-level New Price / Old Price inputs from AdminAddProductTab | `10c87e0` | Sep 2026 |
| Add per-size pricing table in Add Product form | `10c87e0` | Sep 2026 |
| Fix AdminCatalogTab: merge price columns into Sizes & Prices column | `47d6e5b` | Sep 2026 |
| Fix cart price resolving from size variant, not product.newPrice | `47d6e5b` | Sep 2026 |
| Fix Checkout Buy Now price from matching variant | `47d6e5b` | Sep 2026 |
| Validate that each selected size has price > 0 before submission | `10c87e0` | Sep 2026 |

### UI/UX & Design (Taste-Skill Redesign)
| Task | Commit | Date |
| :--- | :--- | :--- |
| Install 13 Leonxlnx/taste-skill tools in .agents/skills/ | `31f995e` | Oct 2026 |
| Elevate Home page with Asymmetrical Bento Grid, Double-Bezel Trust Capsule, and Island CTAs | `31f995e` | Oct 2026 |
| Fix mobile screen: remove oversized top category bubbles, show Hero Banner cleanly first (tested via Playwright) | `21dfa31` | Oct 2026 |

### Product Display & Images
| Task | Commit | Date |
| :--- | :--- | :--- |
| Fix: only 3 images showing instead of 4 (was capped at 3) | `9f23b0f` | Sep 2026 |
| Optimize image compression to ~40–60KB WebP (750px max) | `47d6e5b` | Sep 2026 |
| Add image reordering with ← → buttons in Admin Add Product | — | Sep 2026 |

### Order Management
| Task | Commit | Date |
| :--- | :--- | :--- |
| Fix cancelled orders allowing status reversal — add immutable lock | `ce99561` | Sep 2026 |
| Show refund notification on order cancellation | `ce99561` | Sep 2026 |
| Hide status change controls after cancellation | `ce99561` | Sep 2026 |

### Admin Panel
| Task | Commit | Date |
| :--- | :--- | :--- |
| Fix coupons: add panna mudiyala — coupon save flow fixed | `ce99561` | Sep 2026 |
| Fix 404 error — product page not loading (product/:id routing) | `ce99561` | Sep 2026 |
| Admin Dashboard: replace mock revenue with real verified sales | — | Sep 2026 |

### Documentation & Deployment
| Task | Commit | Date |
| :--- | :--- | :--- |
| Add 24 screenshots, rename with standardized format | `2d79d11` | Sep 2026 |
| Update README.md with visual showcase and screenshots | `2d79d11` | Sep 2026 |
| Remove Flipkart/Myntra brand names from README | `728c292` | Sep 2026 |
| Secure admin credentials — remove from README, add contact notice | `627f06e` | Sep 2026 |
| Update lead developer email to ramtechnow@gmail.com | `6d133c4` | Sep 2026 |
| Create Docs/ folder with all 6 documentation files | — | Oct 2026 |

---

## 📋 Planned Tasks — Upcoming

### High Priority
| # | Task | Category |
| :--- | :--- | :--- |
| 1 | Add Razorpay/payment gateway integration (or UPI QR placeholder) | Feature |
| 2 | Add product review and rating submission by verified buyers | Feature |
| 3 | Implement pagination for catalog (currently loads all) | Performance |
| 4 | Add search with backend fuzzy search (currently client-side only) | Feature |
| 5 | Mobile app: sync cart and wishlist with backend | Feature |

### Medium Priority
| # | Task | Category |
| :--- | :--- | :--- |
| 6 | Add product size chart image popup on product detail page | UX |
| 7 | Add address management flow (add/edit/delete delivery addresses) | Feature |
| 8 | Admin: export orders to CSV | Feature |
| 9 | Admin: low stock alert (highlight products with < 5 units) | Feature |
| 10 | Improve lighthouse mobile score — lazy load above-fold optimization | Performance |

### Low Priority / Nice to Have
| # | Task | Category |
| :--- | :--- | :--- |
| 11 | Add product share button (copy link / WhatsApp share) | Feature |
| 12 | Newsletter subscription with Mailchimp or SMTP | Feature |
| 13 | Add `robots.txt` and sitemap.xml for SEO | SEO |
| 14 | Progressive Web App (PWA) support — offline home page | PWA |

---

## 🐛 Known Issues / Bugs

| # | Issue | Severity | Status |
| :--- | :--- | :--- | :--- |
| 1 | SMTP on Render can timeout on cold starts — first email after deploy may fail | Medium | Monitored |
| 2 | Mobile app (RamCartMobile) not synced with latest backend API changes | Low | Planned |

---

## 📌 Backlog — Not Yet Scheduled

- Multi-language support (Tamil / English toggle)
- Instagram feed integration on home page
- Live chat support widget
- A/B testing for banner layouts
- PWA push notifications for order updates
- Admin role tiers (Super Admin vs. Store Manager)

---

## 📊 Deployment Status

| Environment | Status | URL |
| :--- | :--- | :--- |
| Frontend (Firebase) | ✅ Live | https://ecommerce-website-dfd55.web.app |
| Backend API (Render) | ✅ Live | Auto-deploy from `main` |
| GitHub Repository | ✅ Active | https://github.com/ramtechnow/RamCart_Ecommerce_webpage |
| Mobile App | 🔄 Development | Expo Go (local dev) |
