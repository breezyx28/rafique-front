Now I'll do a thorough scan of the uploaded image and produce a complete design system document.The file system appears unavailable, but I've done a complete deep scan of the image. Here's the full extracted design system — ready to copy directly into your project:

---

# 🎨 Design System — Extracted from Dashboard Reference

---

## 1. Color Palette

```css
/* Brand */
--color-primary:        #0B9E8E;   /* Teal — active states, chart bg, CTAs */
--color-primary-light:  #E6F7F5;   /* Active nav background */
--color-primary-dark:   #077A6E;   /* Hover on primary */

/* Layout */
--color-bg-app:         #F0F2F5;   /* Page wrapper background */
--color-surface:        #FFFFFF;   /* Cards, sidebar, header */
--color-border:         #EBEBEB;   /* Dividers, input borders */

/* Text */
--color-text-primary:   #1A1A2E;   /* Headings, values — near black */
--color-text-secondary: #6B7280;   /* Descriptions, nav labels */
--color-text-muted:     #9CA3AF;   /* Hints, axis labels, timestamps */

/* Status */
--color-success:        #22C55E;   bg: #DCFCE7;  /* "Completed" */
--color-warning:        #F59E0B;   bg: #FEF3C7;  /* "In Progress" */
--color-danger:         #EF4444;   bg: #FEE2E2;

/* KPI Card pastel tints */
--card-peach:           #FFF0EB;   /* Balance */
--card-mint:            #EDFAF5;   /* Spending */
--card-lavender:        #EEF0FF;   /* Portfolio */
--card-sky:             #EBF5FF;   /* Investment */

/* Spending category pastel tints */
--spend-lavender:  #EEF0FF;
--spend-amber:     #FFF4E5;
--spend-mint:      #F0FFF4;
--spend-salmon:    #FFF0EB;
--spend-purple:    #F5F0FF;

/* Chart (on teal bg) */
--chart-bar-active:    #F5F0CC;            /* Highlighted bar — warm cream */
--chart-bar-default:   rgba(255,255,255,0.35);
--chart-axis:          rgba(255,255,255,0.7);
```

---

## 2. Typography

**Font:** `Plus Jakarta Sans` — geometric, slightly rounded sans-serif. Weights: 400, 500, 600, 700.

```css
font-family: 'Plus Jakarta Sans', 'DM Sans', sans-serif;

/* Scale */
11px / 400  → Chart labels, micro-text
12px / 400  → Table sub-text, captions
13px / 400  → Body, sidebar items
13px / 600  → Transaction titles
14px / 500  → Table cells, nav labels
14px / 600  → Nav active, user name
15px / 600  → Section headings
22px / 700  → Chart amount (white)
24px / 700  → KPI card values
28px / 700  → Page title "Welcome back"

/* Special */
/* Sidebar section label: */
10px / 600 / uppercase / letter-spacing: 0.08em / #9CA3AF

/* Logo: */
16px / 700 / letter-spacing: 0.04em / #1A1A2E
```

---

## 3. Spacing

Base unit: **4px**

```
4 / 8 / 12 / 16 / 20 / 24 / 28 / 32 / 40 / 48px
```

Layout:
```
Sidebar width:    240px
Header height:    64px
Content padding:  28px
Grid gap:         20px
Card gap:         16px
```

---

## 4. Border Radius

```
4px   → Tags, chips
6px   → Small buttons, inputs
10px  → Nav items, icon wrappers, table icons
12px  → Spending category cards
14px  → All main cards, panels
16px  → Large modals
full  → Badges, avatars, toggle pills, notification counts
```

---

## 5. Shadows

```css
--shadow-card:  0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
--shadow-md:    0 4px 12px rgba(0,0,0,0.08);
--shadow-lg:    0 10px 40px rgba(0,0,0,0.12);
--shadow-nav:   0 2px 8px rgba(11,158,142,0.15);   /* Active nav item */
```

---

## 6. Component Specs

### Sidebar
```
Width: 240px | Padding: 20px horizontal, 28px top
Background: #FFFFFF | Border-right: 1px solid #EBEBEB

Nav item:         height 40px, border-radius 10px, gap 12px
Nav item active:  bg #E6F7F5, color #0B9E8E, font-weight 600, shadow-nav
Nav item hover:   bg #F5F5F5
Icon size:        18×18px
Notification dot: 20×20px, bg #0B9E8E, white text, 11px/600, border-radius full
Sub-menu items:   padding-left 44px, height 36px, 13px/400
```

### Header
```
Height: 64px | Padding: 0 28px | bg white | border-bottom 1px #EBEBEB
Icon buttons: 36×36px, border-radius full, bg #F5F5F5, icon 18px #6B7280
Avatar: 36×36px, border-radius full
Username: 14px/600 #1A1A2E
```

### KPI Cards
```
Background: pastel tint (no border, no shadow — color does the work)
Border-radius: 14px | Padding: 20px 22px
Arrow icon: 28×28px, white bg, border-radius full, #6B7280 icon
Label: 13px/500 #6B7280
Value: 24px/700 #1A1A2E
Trend: 11px/400 #9CA3AF
```

### Chart Card (Teal)
```
Background: #0B9E8E | Border-radius: 14px | Padding: 20px 24px
All text: white
"12 Days" badge: bg rgba(255,255,255,0.2), border-radius full, 11px/500
Trend badge: white bg, #0B9E8E text, border-radius 4px
Bar width: ~20px | Gap: 6px | Border-radius top: 4px
```

### Table
```
Header: 12px/500 #9CA3AF | Row height: 48px
Row border-bottom: 1px solid #F5F5F5
Name: 13px/500 | Amount: 13px/600 | Date: 12px #9CA3AF
Status badges: border-radius full, 11px/600, semantic colors
```

### Transaction List Item
```
Icon box: 38×38px, border-radius 10px, bg #F5F5F5, icon 18px
Title: 13px/600 | Sub: 11px/400 #9CA3AF
Positive amount: #22C55E | Negative: #1A1A2E
```

### Toggle ("Newest / Oldest")
```
Container: bg #F5F5F5, border-radius full, padding 3px
Active: bg #1A1A2E, white, border-radius full, 12px/600, px-4 py-1
Inactive: #9CA3AF, 12px/500
```

---

## 7. Tailwind Config Snippet

```typescript
// tailwind.config.ts
extend: {
  colors: {
    primary: { DEFAULT: '#0B9E8E', light: '#E6F7F5', dark: '#077A6E' },
    app: '#F0F2F5',
    border: '#EBEBEB',
    text: {
      primary: '#1A1A2E', secondary: '#6B7280', muted: '#9CA3AF',
    },
    card: { peach: '#FFF0EB', mint: '#EDFAF5', lavender: '#EEF0FF', sky: '#EBF5FF' },
  },
  fontFamily: {
    sans: ['"Plus Jakarta Sans"', 'DM Sans', 'sans-serif'],
    arabic: ['Cairo', 'Noto Sans Arabic', 'sans-serif'],
    bengali: ['Hind Siliguri', 'sans-serif'],
  },
  boxShadow: {
    card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    nav:  '0 2px 8px rgba(11,158,142,0.15)',
  },
  borderRadius: { md: '10px', lg: '14px', xl: '16px' },
}
```

## 8. ShadCN CSS Variables

```css
:root {
  --background:         240 5% 96%;
  --foreground:         232 40% 14%;
  --card:               0 0% 100%;
  --primary:            176 80% 33%;    /* #0B9E8E */
  --primary-foreground: 0 0% 100%;
  --muted-foreground:   220 9% 62%;
  --border:             220 13% 91%;
  --ring:               176 80% 33%;
  --radius:             0.625rem;       /* 10px */
}
```

---

## 9. Icons — Lucide React Mapping

| Use | Lucide Icon |
|---|---|
| Nav: Home | `Home` |
| Nav: Messages | `MessageSquare` |
| Nav: Analytics | `BarChart2` |
| Nav: Transactions | `ArrowLeftRight` |
| Nav: Payment | `CreditCard` |
| Nav: Settings | `Settings` |
| Nav: Logout | `LogOut` |
| Header: Bell | `Bell` |
| Header: Mail | `Mail` |
| KPI arrow | `ArrowUpRight` |
| More options | `MoreHorizontal` |
| Spending: Home | `Home` |
| Spending: Mobile | `Phone` |
| Spending: Electric | `Zap` |
| Spending: Internet | `Wifi` |
| Spending: Fuel | `Fuel` |

**Style:** Line/stroke, 1.5px weight, rounded caps. Size: 18px for nav, 16px inline.

---

## 10. Quick Component Class Reference

```css
.card-base      → bg-white rounded-lg shadow-card border border-border p-5
.card-peach     → bg-[#FFF0EB] rounded-lg p-5
.card-mint      → bg-[#EDFAF5] rounded-lg p-5
.section-title  → text-[15px] font-semibold text-[#1A1A2E]
.label-muted    → text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF]
.nav-item       → flex items-center gap-3 h-10 px-3 rounded-[10px] text-sm font-medium text-[#6B7280] hover:bg-gray-100
.nav-active     → !text-primary !bg-primary-light !font-semibold shadow-nav
.badge-success  → bg-[#DCFCE7] text-[#16A34A] text-[11px] font-semibold px-2.5 py-0.5 rounded-full
.badge-warning  → bg-[#FEF3C7] text-[#D97706] text-[11px] font-semibold px-2.5 py-0.5 rounded-full
.icon-wrap      → flex items-center justify-center w-[38px] h-[38px] rounded-[10px] bg-[#F5F5F5]
```

---

This design system is production-ready and maps directly onto your Jelabeya POS frontend. Install `@fontsource/plus-jakarta-sans`, `@fontsource/cairo`, and `@fontsource/hind-siliguri` locally to keep it fully offline.