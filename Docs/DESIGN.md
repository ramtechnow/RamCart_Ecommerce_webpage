# RamCart — Design Specifications

> **Version**: 1.0  
> **Last Updated**: October 2026  
> **Author**: Shriram M G  

---

## 1. Design Philosophy

RamCart's visual language follows **contemporary fashion commerce** aesthetics — clean, editorial, and high-contrast. The design is inspired by modern fashion retail interfaces with crisp card edges, bold typography, and vibrant accent colors against neutral backgrounds.

**Core Principles**:
1. **Clarity first** — Users should immediately understand what to do next
2. **Speed matters** — Perceived performance via skeleton loaders and lazy images
3. **Dark mode parity** — Every light-mode design must have an equal dark-mode counterpart
4. **Mobile-first responsive** — Every component is designed for mobile, then scaled up

---

## 2. Color Palette

### 2.1 Brand Colors

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--brand-primary` | `#ff8906` | CTA buttons, active states, price highlights, focused inputs |
| `--brand-secondary` | `#e53170` | Hover states, destructive actions, sale badges, admin section headers |

### 2.2 Light Mode

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--bg-page` | `#eff0f6` | Page background |
| `--bg-card` | `#ffffff` | Card, panel, modal backgrounds |
| `--bg-input` | `#ffffff` | Input fields |
| `--text-primary` | `#0f0e17` | Main headings and body text |
| `--text-secondary` | `#717388` | Subtitles, meta text, placeholders |
| `--text-accent-1` | `#2e2f3e` | Form labels |
| `--border` | `#e2e4ed` (40% opacity) | Card borders, input borders |

### 2.3 Dark Mode

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--bg-page-dark` | `#0f0e17` | Page background |
| `--bg-card-dark` | `#171622` | Card, panel, modal backgrounds |
| `--bg-input-dark` | `#212030` | Input fields |
| `--bg-sidebar-dark` | `#171622` | Admin sidebar |
| `--text-primary-dark` | `#fffffe` | Main headings and body text |
| `--text-secondary-dark` | `#a7a9be` | Form labels, secondary text |

### 2.4 Status Colors

| Status | Color | Usage |
| :--- | :--- | :--- |
| Success / In Stock | `emerald-600` / `#10b981` | Stock badges, order delivered |
| Warning | `amber-500` / `#f59e0b` | Low stock, info alerts |
| Error / Out of Stock | `red-500` / `#ef4444` | OOS badges, cancel actions |
| Processing | `blue-500` / `#3b82f6` | Order processing status |
| Cancelled | `red-400` | Cancelled order badge |

---

## 3. Typography

### 3.1 Font Stack
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### 3.2 Type Scale

| Level | Class | Size | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| H1 | `text-2xl font-bold` | 24px | 700 | Page titles |
| H2 | `text-xl font-bold` | 20px | 700 | Section titles |
| H3 | `text-sm font-black uppercase tracking-wider` | 14px | 900 | Card section headers (admin) |
| Body | `text-sm` | 14px | 400 | Main body text |
| Small | `text-xs` | 12px | 400 | Meta text, labels |
| Micro | `text-[10px]` | 10px | 700 | Error messages, badges |

---

## 4. Spacing & Layout

### 4.1 Grid System
- **1 column** (mobile < 640px)
- **2 columns** (sm: ≥ 640px)
- **3 columns** (lg: ≥ 1024px)
- **3 columns with span** — Admin panel uses `lg:col-span-2` for main content

### 4.2 Card Spacing
- Card padding: `p-6` (24px)
- Card border radius: `rounded-2xl` (16px) for containers, `rounded-xl` (12px) for inputs
- Gap between grid items: `gap-6` (24px)
- Section gap in cards: `gap-4` (16px)

### 4.3 Product Card Border
- Border radius: `border-radius: 4px` — Sharp box, not bubbly
- Border: `1px solid rgba(226, 228, 237, 0.4)`
- Hover elevation: `hover:shadow-lg hover:-translate-y-0.5`

---

## 5. Component Specifications

### 5.1 Product Card (ProductCard.tsx)
```
┌─────────────────────────┐
│   [Product Image]       │  ← aspect-[3/4], object-cover, lazy loaded
│   [❤ Wishlist] [badge]  │  ← absolute top-right
├─────────────────────────┤
│  Product Name           │  ← text-sm font-semibold, 2 lines max, truncate
│  ₹ New Price  ₹ Old     │  ← new: text-[#ff8906] bold, old: line-through muted
│  ★ 4.2  [Discount %]    │  ← rating chip + discount badge
└─────────────────────────┘
```

### 5.2 Primary Button
```
Background: #ff8906
Hover: #e53170
Text: white, font-bold
Border: none
Border radius: rounded-xl (12px)
Padding: px-6 py-3
Shadow: shadow-md shadow-[#ff8906]/20
Disabled: opacity-50, cursor-not-allowed
Transition: all 200ms
```

### 5.3 Input Field
```
Height: h-11 (44px)
Padding: px-4
Border: 1px solid rgba(226,228,237,0.4)
Border radius: rounded-xl (12px)
Focus: border-[#ff8906] ring-1 ring-[#ff8906]
Error: border-red-500
Background light: #ffffff
Background dark: #212030
```

### 5.4 Admin Section Header
```
Text: text-sm font-black uppercase tracking-wider
Color light: #e53170
Color dark: #ff8906
Border bottom: 1px solid rgba(226,228,237,0.2)
Padding bottom: pb-3
Icon: 18px Lucide icon, same color
```

### 5.5 Size Variant Chip
```
Selected:   bg-[#ff8906] border-[#ff8906] text-white
Unselected: bg-[#eff0f6] dark:bg-[#212030] border muted text
Border radius: rounded-full
Padding: px-3 py-1.5
Font: text-xs font-bold
```

### 5.6 Multi-Card Peeking Hero Carousel (PromoBanner.jsx)
```
Desktop: 
  - Container: overflow-hidden
  - Cards visible: 2.2 (width: calc(50% - 8px))
  - Active pill indicator: 32px wide, 6px tall, black/white
  - Inactive dots: 8px wide, 6px tall, gray
  - Navigation chevrons: floating, semi-transparent background

Mobile:
  - Swipe container: overflow-x: auto, scroll-snap-type: x mandatory
  - Card width: 88vw (peeks next card)
  - Touch-native scrolling
```

---

## 6. Icon Library

- **Lucide React** (primary) — All UI icons
- **Size standard**: 16px for inline, 18px for section headers, 20px for buttons, 28px for drag zones

### Commonly Used Icons
| Context | Icon |
| :--- | :--- |
| Add product | `FolderPlus` |
| Upload | `Upload` |
| Delete | `Trash2` |
| Add custom | `Plus` |
| Error/Alert | `ShieldAlert` |
| Loading | `Loader2` (animate-spin) |
| Image | `Image as ImageIcon` |
| Price | `DollarSign` |
| Tag/Category | `Tag` |
| Document | `FileText` |

---

## 7. Dark Mode Rules

- Tailwind strategy: `darkMode: 'class'` — toggled by `ThemeContext.tsx`
- Toggle persisted in `localStorage` under key `theme`
- Every component must have `dark:` Tailwind variants for:
  - Background colors
  - Text colors
  - Border colors
  - Input backgrounds

### Dark Mode Example Pattern
```tsx
<div className="bg-white dark:bg-[#171622] border border-[#e2e4ed]/40 dark:border-white/10">
  <p className="text-[#0f0e17] dark:text-[#fffffe]">...</p>
  <span className="text-[#717388] dark:text-[#a7a9be]">...</span>
</div>
```

---

## 8. Animation & Transitions

| Element | Animation |
| :--- | :--- |
| Page entrance | `animate-fade-in` |
| Button hover | `transition-all duration-200` |
| Card hover | `hover:-translate-y-0.5 hover:shadow-lg` |
| Upload bounce icon | `animate-bounce` |
| Loading spinner | `animate-spin` |
| Skeleton loader | CSS gradient shimmer animation |
| Festive particles | Custom CSS particle animation (`FestiveParticles.tsx`) |

---

## 9. Responsive Breakpoints (Tailwind)

| Prefix | Min Width | Usage |
| :--- | :--- | :--- |
| (none) | 0px | Mobile base |
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Large desktop |

---

## 10. Email Template Design

### Structure
```
┌──────────────────────────────────┐
│  🛍️ RamCart Logo               │  ← centered header bar, brand color
├──────────────────────────────────┤
│  [Emoji] Status Heading          │  ← large, bold
│  Subheading / greeting           │
├──────────────────────────────────┤
│  ┌──────┬──────────────────────┐ │
│  │Label │ Value               │ │  ← key info table layout
│  │Label │ Value               │ │
│  └──────┴──────────────────────┘ │
├──────────────────────────────────┤
│  Order Items table              │  ← product, size, qty, price
├──────────────────────────────────┤
│  Total amount                   │
├──────────────────────────────────┤
│  Footer: Team RamCart           │
└──────────────────────────────────┘
```

### Email Color Tokens
- Header background: `#ff8906`
- CTA button: `#ff8906`
- Accent links: `#e53170`
- Table border: `#e2e4ed`
- Body text: `#333333`

---

## 11. Banner Artwork Specifications

| Platform | Dimensions | Aspect Ratio | Max File Size |
| :--- | :--- | :--- | :--- |
| Desktop / Laptop | 1920 × 600 px | 16:5 | 300 KB |
| Tablet | 1440 × 500 px | ~3:1 | 250 KB |
| Mobile | 800 × 500 px | 16:10 | 150 KB |

**Design Safe Zone**: 
- Left 50% → Promo headline, discount CTA, shop now button
- Right 50% → Model or product photography
- Avoid important content in the edges (carousel crops sides)
