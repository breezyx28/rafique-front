# 🧵 Jelabeya Sewing POS — Full Development Plan

**Project:** Rafique Tailors — Jelabeya Sewing POS System  
**Stack:** React + TypeScript + TailwindCSS + ShadCN · NestJS + MySQL  
**Runtime / Package Manager:** **Bun** (for both `api` and `frontend`)  
**Mode:** Local (Offline-first) · **Languages:** English · Arabic (RTL) · Bengali

---

## 1. Project Architecture

```
Rafique-tailor/
├── api/                        # NestJS + TypeORM + MySQL (Bun)
├── frontend/                   # React + Vite + TS + Tailwind + ShadCN (Bun)
├── packages/
│   └── shared/                 # Shared types & DTOs (optional, Bun)
├── docker-compose.yml          # MySQL + phpMyAdmin (local)
└── DEVELOPMENT_PLAN.md         # This document
```

- **`api/`** — Backend NestJS application (run with `bun run start:dev`).
- **`frontend/`** — React SPA (run with `bun run dev`).
- Use **Bun** for install, scripts, and runtime in both apps.

---

## 2. Design System

### Typography
- **Inter** (UI/numbers/English) · **Cairo** (Arabic) · **Hind Siliguri** (Bengali) — all bundled locally via `@fontsource`.

### Color Palette
| Token     | Hex       | Usage                          |
|----------|-----------|--------------------------------|
| Primary  | `#1E3A5F` | Deep Navy Blue — brand         |
| Secondary| `#2E7D6B` | Emerald Teal — CTAs            |
| Accent   | `#C9A84C` | Warm Gold — Islamic aesthetic  |
| Background | `#F8F9FB` | Off-white                    |
| Surface  | `#FFFFFF` | Cards/panels                   |
| Muted    | `#94A3B8` | Labels/hints                   |
| Danger   | `#EF4444` | Delete/errors                  |
| Success  | `#22C55E` | Paid/confirmed                 |

### Layout Rules
- Collapsible sidebar + top header (language switcher, user avatar).
- RTL layout auto-flip on Arabic selection via `dir="rtl"` + Tailwind `rtl:` variants.
- Responsive: Mobile ≥375 · Tablet ≥768 · Desktop ≥1280.

---

## 3. Frontend — All Pages & Features

### `/login` — Auth Screen
Clean centered card, shop logo, username + password, language switcher.

### `/` — Dashboard
- **KPI Cards:** Total Orders · Total Revenue · Active Customers · Working Days.
- **Sales Line Chart:** Monthly (current year), compare previous years, export CSV/PDF.
- **Bar Chart:** Most Sold Products.
- **VIP Customers Table:** Top 20 by order value (desc).
- Global export button for all chart data.

---

### `/orders/new` — Custom Order Wizard (4 Steps)

**Step 1 — Customer Info**
- Phone number field with live lookup → auto-fills existing customer.
- Fields: Full Name, Phone, WhatsApp, Notes.
- Creates new customer on-the-fly if not found.

**Step 2 — Products & Measurements**
- Left: Product selector tabs (Jelabeya, Serwal, Allala, + custom).
- On product select → dynamic measurement inputs appear (user-configured per product).
- Inputs rendered with multilingual labels (EN/AR/BN).
- Workshop Note + Customer Note textareas.
- Right: **Live Cart sidebar** — product, qty, unit price, subtotal, remove/edit on the fly.

**Step 3 — Payment & Checkout**
- Total Price (auto-calculated from cart).
- Received Amount input.
- Remaining = Total − Received (auto-computed, highlighted red if > 0).
- Payment Method: `Cash` / `MBOK`.
- Due Date picker (when order is ready for pickup).

**Step 4 — Review & Confirm**
- Read-only full order summary.
- On Submit → **Confirm Modal** with:
  - Complete order details.
  - Submit / Cancel buttons.
  - Checkbox: *"Don't show this confirmation again"* (saved in preferences).

**→ Invoice Page (post-submit)**  
Two printable invoice variants:

| Customer Invoice       | Workshop Invoice           |
|------------------------|----------------------------|
| Shop name, address, phone | Order # + Due Date only  |
| Order # + Customer name   | Per-product measurement tables |
| Per-product measurement tables | Workshop note        |
| Total, Paid, Remaining, Due Date | No price, no contacts |
| Customer note at bottom   |                            |

---

### `/orders/ready` — Ready Products POS
- Grid of in-stock products with image/name/price.
- Click to add to cart (right panel).
- Same payment step 3 as custom order.

---

### `/orders` — Orders Report
Tabs: Custom Orders | Ready Orders.

Advanced table (newest first):
- Columns: Order #, Customer, Products, Date, Due Date, Total, Paid, Remaining, Status, Method.
- Search: date range · customer · product · payment method · status.
- Row actions: 👁 View · ✏️ Edit · 🗑 Delete · 🖨 Print Invoice.
- Pagination (configurable page size).

---

### `/customers` — Customer Management
- Table: Name, Phone, Orders Count, Total Spent, Last Order Date.
- Full CRUD + view order history drawer.

---

### `/inventory` — Inventory Management
**Tab 1 — Ready Products:** Name · Size · Qty · Selling Price · Restock alert.  
**Tab 2 — Fabrics/Assets:** Fabric name · Unit · Qty · Cost/unit · Total value.  
- CRUD for both, low stock badge alerts.

---

### `/expenses` — Daily Expenses
- Quick-add form: Type (dropdown + add custom type inline) · Amount · Date (default: today) · Note.
- Table: newest first, search by date range/type.
- Summary cards: Today · This Month · This Year totals.

---

### `/settings/products` — Product & Measurement Config
- Products list (Jelabeya, Serwal, Allala + add custom).
- Per product → custom measurement fields:
  - **Label:** 3 inputs — English / Arabic / Bengali (all required).
  - **Input Type:** text · number · select (user can change type).
  - Required toggle.
  - Drag-handle reorder.
  - Add / Edit / Delete fields.

---

### `/settings` — Application Settings
| Tab            | Content                                                                 |
|----------------|-------------------------------------------------------------------------|
| General        | Shop name, address, phone, logo (used in invoices)                     |
| Preferences    | Language, currency, date format, printer config, confirm-dialog toggle  |
| Users & Roles  | User list, assign roles (Admin / Cashier / Workshop)                   |
| Security       | Change password                                                         |
| Backup         | Export DB snapshot · Import/Restore backup (offline use)                |

---

## 4. Frontend Tech Stack

| Purpose       | Library                              |
|---------------|--------------------------------------|
| UI Components| ShadCN/ui + Radix UI primitives       |
| Data Tables   | TanStack Table v8 (headless, custom)  |
| Charts        | Recharts                             |
| Forms         | React Hook Form + Zod validation     |
| Client State  | Zustand (cart, prefs, auth)          |
| Server State  | TanStack Query v5                    |
| i18n          | i18next + react-i18next               |
| Date Picker   | react-day-picker (bundled)           |
| Drag & Drop   | @dnd-kit/core                        |
| Print         | react-to-print + CSS @media print    |
| Icons         | lucide-react                         |
| HTTP          | Axios (pointing to localhost:3001)   |
| Build / Dev   | **Bun** (install, scripts, optional runtime) |

---

## 5. Frontend File Structure

```
frontend/src/
├── app/
│   ├── routes/                  # React Router v6 file-based routes
│   └── providers/               # i18n, Theme, Auth, QueryClient
├── components/
│   ├── ui/                      # ShadCN re-exports + custom atoms
│   ├── layout/                  # Sidebar, Header, PageWrapper, Breadcrumb
│   ├── tables/                  # AdvancedDataTable<T> (generic reusable)
│   ├── forms/                  # WizardForm, DynamicMeasurementForm
│   ├── charts/                  # SalesChart, TopProductsChart wrappers
│   └── invoice/                 # CustomerInvoice, WorkshopInvoice
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── orders/
│   │   ├── custom/              # 4-step wizard + cart
│   │   └── ready/               # POS grid
│   ├── customers/
│   ├── inventory/
│   ├── expenses/
│   └── settings/
│       ├── products/            # Dynamic field config
│       └── app/                 # Tabs: general, prefs, users, security
├── hooks/
│   ├── useCart.ts
│   ├── useWizard.ts
│   ├── usePrint.ts
│   └── useAuth.ts
├── lib/
│   ├── api.ts                   # Axios instance → localhost:3001
│   ├── i18n.ts                  # i18next setup
│   └── utils.ts
├── store/
│   ├── useCartStore.ts
│   └── usePreferenceStore.ts
└── types/
    └── index.ts
```

---

## 6. Backend — NestJS Architecture (Bun)

### Design Principles Applied
- **Repository Pattern** via TypeORM custom repositories.
- **DTO Validation** — class-validator on every endpoint input.
- **Service Layer** — controllers thin, all business logic in services.
- **SOLID** — single-responsibility services, constructor injection.
- **Global Exception Filter** — consistent `{ error, message, statusCode }` shape.
- **Response Interceptor** — wraps all responses in `{ data, meta }`.

### Database Schema (MySQL)

```sql
-- Auth
users              (id, username, password_hash, role_id, created_at)
roles              (id, name, permissions JSON)

-- Core
customers          (id, name, phone, whatsapp, notes, created_at)
products           (id, name, type ENUM('custom','ready'), base_price, created_at)
product_fields     (id, product_id, field_key, input_type, required, sort_order)
product_field_i18n (id, field_id, lang ENUM('en','ar','bn'), label)

-- Orders
orders             (id, order_number, customer_id, type, status, total, paid,
                    remaining, payment_method, due_date, note_customer,
                    note_workshop, created_at)
order_items        (id, order_id, product_id, qty, unit_price, subtotal)
order_measurements (id, order_item_id, field_id, value)

-- Inventory
inventory_items    (id, product_id, size, qty, price)
fabrics            (id, name, unit, qty, cost_per_unit)

-- Expenses
expense_types      (id, name, is_custom)
expenses           (id, type_id, amount, date, note, created_at)

-- Settings
app_settings       (key VARCHAR, value JSON)
```

### NestJS Module Structure (api/)

```
api/src/
├── main.ts                      # Bootstrap, global pipes/filters
├── app.module.ts
├── common/
│   ├── filters/                 # GlobalExceptionFilter
│   ├── interceptors/            # TransformResponseInterceptor
│   ├── decorators/              # @Roles(), @CurrentUser()
│   ├── guards/                  # JwtAuthGuard, RolesGuard
│   └── dto/                     # PaginationDto, DateRangeDto
├── config/
│   ├── typeorm.config.ts
│   └── jwt.config.ts
└── modules/
    ├── auth/                    # JWT login, bcrypt
    ├── users/
    ├── customers/
    ├── products/                # Products + dynamic fields + i18n labels
    ├── orders/                  # Custom + Ready orders, measurements
    ├── inventory/
    ├── expenses/
    ├── dashboard/               # Aggregate SQL for stats + charts
    └── settings/
```

### Key API Endpoints

```
POST   /auth/login
GET    /auth/me

GET    /customers?search=&phone=&page=&limit=
POST   /customers
PATCH  /customers/:id
DELETE /customers/:id

GET    /products
POST   /products
PATCH  /products/:id
DELETE /products/:id
GET    /products/:id/fields
POST   /products/:id/fields
PATCH  /products/fields/:fieldId
DELETE /products/fields/:fieldId

POST   /orders/custom
POST   /orders/ready
GET    /orders?type=&status=&from=&to=&page=&limit=
GET    /orders/:id
PATCH  /orders/:id
DELETE /orders/:id

GET    /inventory?page=
POST   /inventory
PATCH  /inventory/:id
DELETE /inventory/:id

GET    /expenses?from=&to=&type=&page=
POST   /expenses
PATCH  /expenses/:id
DELETE /expenses/:id
GET    /expense-types
POST   /expense-types

GET    /dashboard/stats
GET    /dashboard/sales-chart?year=&compareYear=
GET    /dashboard/top-products
GET    /dashboard/top-customers?limit=20

GET    /settings
PATCH  /settings
PATCH  /users/:id/password
POST   /settings/backup/export
POST   /settings/backup/import
```

---

## 7. Sprint Plan (10 Weeks)

| Phase | Weeks | Deliverables |
|-------|-------|--------------|
| **1 — Foundation** | 1–2 | Monorepo with `api/` + `frontend/` (Bun), Auth, Sidebar, i18n skeleton, RTL support |
| **2 — Core Entities** | 3–4 | Products + dynamic fields UI, Customers, Inventory, Expenses (BE + FE) |
| **3 — Custom Order Wizard** | 5–6 | Full 4-step wizard, dynamic measurements, live cart, confirm modal, invoice print |
| **4 — Ready Products POS** | 7 | Inventory POS grid, cart, checkout reuse |
| **5 — Reports & Dashboard** | 8 | Advanced tables all entities, dashboard KPIs + charts, export |
| **6 — Settings & Polish** | 9 | All settings tabs, backup/restore, responsive polish, empty/error states |
| **7 — QA & Packaging** | 10 | Jest (BE), Playwright (E2E), build optimization, offline packaging docs |

---

## 8. Multi-language Strategy

- **Static UI strings** → `i18n/en.json`, `ar.json`, `bn.json`.
- **Dynamic measurement labels** → `product_field_i18n` table (fetched per product, merged at render).

When user creates a measurement field, 3 label inputs are shown:

```
Label (EN): Height         ← required
Label (AR): الطول          ← required
Label (BN): উচ্চতা         ← required
```

Frontend uses `useTranslation()` for UI and API labels for measurements, using current language key.

---

## 9. Invoice Spec

**Customer Invoice** — printed A5 or thermal:

```
[Logo] Shop Name | Address | Phone | WhatsApp
Order #: 00123  |  Date: 01/03/2026
Customer: Ahmed Ali | Phone: 09xxxxxxxx
─────────────────────────────
JELABEYA
Measurement      Value
Height           180 cm
Arms             65 cm
Neck             42 cm
─────────────────────────────
Total:       500 SDG
Paid:        300 SDG
Remaining:   200 SDG
Pickup Date: 15/03/2026
─────────────────────────────
Note: Please bring this receipt when collecting.
```

**Workshop Invoice** — thermal/A5, no prices:

```
ORDER #00123  |  DUE: 15/03/2026
─────────────────────────────
JELABEYA (qty: 1)
Height: 180cm | Arms: 65cm | Neck: 42cm
─────────────────────────────
Workshop Note: Urgent - use white fabric
```

---

## 10. Offline & Deployment

- NestJS API on `localhost:3001` (run with **Bun**).
- MySQL via Docker Desktop (or XAMPP/WAMP for non-technical users).
- Frontend: Vite build served via `bun run build` then `serve` or Nginx on localhost.
- **Optional:** Wrap in Electron for a desktop `.exe` / `.dmg` app.
- **Backup:** API endpoint → dumps MySQL to JSON/SQL file → browser download.

---

## 11. Key Technical Decisions

| Decision       | Choice                | Why |
|----------------|-----------------------|-----|
| Runtime / PM   | **Bun**               | Fast install/run for both api and frontend, single toolchain. |
| ORM            | TypeORM               | Native NestJS integration. |
| FE Validation  | Zod + React Hook Form | Type-safe schema validation. |
| BE Validation  | class-validator       | NestJS convention, pipe-friendly. |
| Auth           | JWT, long-lived       | Simplicity for local/offline use. |
| State          | Zustand + TanStack Query | Minimal boilerplate, good DX. |
| RTL            | Tailwind `rtl:` + `document.dir` | Zero-runtime, CSS only. |
| Tables         | TanStack Table v8     | Headless, full control. |
| Charts         | Recharts              | Light bundle, composable, offline. |
| Print          | CSS `@media print` + react-to-print | No PDF lib needed. |

---

This plan is ready for a senior dev team to begin Sprint 1. Use **Bun** for creating and running both the `api` and `frontend` applications. A mock API layer is recommended during Phase 2–3 for parallel frontend development.
