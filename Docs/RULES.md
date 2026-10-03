# RamCart — Development Rules & Conventions

> **Version**: 1.0  
> **Last Updated**: October 2026  
> **Author**: Shriram M G  

These rules are the single source of truth for all development decisions on this project. All contributors (including AI coding assistants) must follow these rules precisely.

---

## 1. Git & Branching Rules

### 1.1 Branch Strategy
```
main                  ← Production branch (auto-deploys to Render backend)
Ecommerce_backend     ← Active development branch (all work happens here)
```

### 1.2 Workflow
1. All development work is done on `Ecommerce_backend` branch.
2. After completing a feature/fix, commit with a clear message.
3. Merge `Ecommerce_backend` → `main` after every stable commit.
4. Always push both branches: `git push origin Ecommerce_backend` then `git push origin main`.
5. Always return to `Ecommerce_backend` after merging to main.

### 1.3 Commit Message Format
```
type(scope): short description

Types:
  feat      ← New feature
  fix       ← Bug fix
  docs      ← Documentation only
  refactor  ← Code restructuring, no behavior change
  perf      ← Performance improvement
  style     ← Formatting, no logic change
  chore     ← Build, deployment, dependency changes

Examples:
  feat(catalog): add per-size new and old price variant table
  fix(email): switch to dual-port SMTP with 587 fallback
  docs(readme): add admin contact and protect credentials
```

### 1.4 What Never Goes Into Git
- `.env` files or any environment secrets
- Admin usernames, passwords, or API keys in source files
- `node_modules/` directories
- `dist/` or `build/` output folders
- MongoDB connection strings with real credentials

---

## 2. Frontend Code Rules

### 2.1 Language & Framework
- Use **TypeScript** (`.tsx` / `.ts`) for all new components and utilities.
- `.jsx` / `.js` files are legacy — do not create new ones; migrate gradually.
- React 19 functional components only. No class components.

### 2.2 Component Structure
```tsx
// 1. Imports (external libraries first, then internal)
import React, { useState } from 'react';
import { SomeIcon } from 'lucide-react';
import { useAppDispatch } from '../../store/hooks';

// 2. Interface / Type definitions
interface MyComponentProps {
  title: string;
  onAction: () => void;
}

// 3. Component (named export preferred)
export const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
  // 4. State declarations
  const [loading, setLoading] = useState(false);

  // 5. Handlers
  const handleClick = () => { ... };

  // 6. JSX return
  return (
    <div>...</div>
  );
};

// 7. Default export (if needed)
export default MyComponent;
```

### 2.3 Tailwind CSS Rules
- Use Tailwind utility classes. No inline `style={{}}` except for truly dynamic values (e.g., hex color from data).
- Respect the design system color tokens:
  - Primary accent: `#ff8906` (amber/orange)
  - Secondary accent: `#e53170` (pink/red)
  - Background light: `#eff0f6`
  - Background dark: `#171622`, `#212030`
  - Text primary: `#0f0e17`
  - Text secondary: `#717388`
- Always add `dark:` variants for all background and text colors.
- Use responsive prefixes: `sm:`, `md:`, `lg:` for breakpoints.

### 2.4 State Management Rules
- **Redux Toolkit** for cross-component/global state: cart, auth, wishlist, toasts.
- **Local `useState`** for UI-only state (loading spinners, form fields, modal open/close).
- Do NOT store fetched server data in Redux — use local state or React Query pattern.
- Cart prices must be resolved from the matching size **variant**, not from `product.newPrice`.

### 2.5 Image Handling Rules
- All product images must be compressed via `compressImageToBase64()` in `Utils/adminHelpers.js`.
- Maximum dimensions: **750px** width/height.
- Target size: **< 60KB** per image.
- Format: **WebP** (fallback to JPEG if WebP not supported).
- Maximum 5 images per product.

### 2.6 Form Validation Rules
- Validate all required fields before submission.
- Show per-field inline error messages using `fieldErrors` state pattern.
- Use `ShieldAlert` Lucide icon for error icons.
- Never submit forms with invalid data; block the button.

---

## 3. Backend Code Rules

### 3.1 Express API Rules
- All admin-protected routes must use `fetchAdmin` middleware.
- All user-authenticated routes must use `fetchUser` middleware.
- Return consistent JSON: `{ success: true, data: ... }` or `{ success: false, error: "..." }`.
- Always handle async errors with try/catch — no unhandled promise rejections.

### 3.2 Order Status Rules — CRITICAL
```
Order lifecycle:
  Pending → Processing → Shipped → Delivered
                                      ↓
                                  (LOCKED)
           → Cancelled (from Pending / Processing only)
                ↓
           (LOCKED — cannot be reversed)
```
- **Cancelled orders are IMMUTABLE**. Never allow status changes on cancelled orders.
- **Delivered orders are IMMUTABLE**. Never allow status changes after delivery.
- On cancellation: automatically restock all ordered quantities back to variants.

### 3.3 Inventory Rules
- When an order is placed: decrement `stockCount` on product AND `stock` on each matching variant.
- When an order is cancelled: increment `stockCount` on product AND `stock` on each matching variant.
- Never allow `stock` to go below 0.
- Set `available: false` on product if `stockCount` reaches 0.

### 3.4 Email Rules
- Always attempt Port 465 (SSL) first for SMTP.
- If Port 465 fails, automatically retry on Port 587 (STARTTLS).
- Log both success and failure with emoji prefixes: ✅ for success, ❌ for failure, ⚠ for warning.
- Use HTML email templates — never plain text.
- Email triggers: Order placed, Order shipped, Order delivered, Order cancelled.

### 3.5 Authentication Rules
- JWT tokens must be verified on every protected request.
- JWT secret must be a strong, random string (minimum 32 characters).
- Never hardcode JWT secret in source files — use `.env` only.
- Admin access: `isAdmin: true` field on User model.

---

## 4. Pricing Rules — CRITICAL

### 4.1 Product-Level Pricing
- `product.newPrice` = `Math.min(...all active variant prices)`
- `product.oldPrice` = `Math.max(...all variant oldPrices)`
- These are derived values for catalog display and sorting only.

### 4.2 Variant-Level Pricing
- Each size variant has its own `price` (new price) and `oldPrice` / `old_price`.
- When a user selects a size, the price shown must come from `variant.price`, NOT from `product.newPrice`.
- Cart item price must be resolved from the matching variant at time of add-to-cart.
- Checkout total must use variant-resolved prices.

### 4.3 Admin Add Product
- The top-level "New Price" and "Old Price" input fields are REMOVED.
- Prices are entered exclusively in the Size-Specific Pricing & Stock Control table.
- Validation: every selected size must have a `price > 0` before submission is allowed.

---

## 5. Security Rules

- Admin credentials are **never** stored in README, source files, or any tracked file.
- `.env` is listed in `.gitignore` and never committed.
- Admin demo access is provided on request via email: ramtechnow@gmail.com
- All CORS origins are explicitly whitelisted via `CORS_ORIGINS` environment variable.
- Request body size limit: 10MB (for base64 image payloads).

---

## 6. Documentation Rules

- All 6 Docs files (`PRD.md`, `ARCHITECTURE.md`, `RULES.md`, `DESIGN.md`, `TASK.md`, `MEMORY.md`) must be kept up to date.
- When a significant feature is added or changed, update:
  - `PRD.md` → Feature requirements
  - `ARCHITECTURE.md` → Data models or API changes
  - `TASK.md` → Mark task as completed, add new tasks
  - `MEMORY.md` → Add a decision or context entry
- README.md is the public-facing document — keep it clean and professional.
- No third-party brand names in documentation (Flipkart, Myntra, Zara, etc.).

---

## 7. Deployment Rules

### Frontend
```bash
cd frontend_project
npm run build          # Always build first, verify no TypeScript errors
firebase deploy --only hosting
```

### Backend
- Push to `main` branch — Render auto-deploys.
- Verify deployment logs on Render dashboard after every push.
- Check email delivery test after backend deployment.

### After Any Change
```bash
git add .
git commit -m "type(scope): description"
git push origin Ecommerce_backend
git checkout main
git merge Ecommerce_backend
git push origin main
git checkout Ecommerce_backend
```

---

## 8. Naming Conventions

| Item | Convention | Example |
| :--- | :--- | :--- |
| React components | PascalCase | `ProductCard`, `AdminOrdersTab` |
| Hooks | `use` + PascalCase | `useCart`, `useProducts` |
| Utility functions | camelCase | `compressImageToBase64`, `formatCurrency` |
| CSS classes | Tailwind utilities only | — |
| API routes | kebab-case | `/admin/orders/status` |
| MongoDB collections | lowercase plural | `products`, `orders`, `users` |
| Environment variables | SCREAMING_SNAKE_CASE | `JWT_SECRET`, `MONGO_URI` |
| Screenshot files | `NN_descriptive_name.png` | `07_product_details_view.png` |
