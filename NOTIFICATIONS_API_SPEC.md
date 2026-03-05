# Notifications API Spec (Frontend-driven)

This document defines the notification response shape and endpoints required to match the existing frontend UI.  
The frontend is considered the source of truth for the fields and behavior described here.

## 1. Notification DTO shape

The `Header` component currently uses an in-memory `alerts` array with this structure:

```ts
// src/components/layout/Header.tsx
const [alerts, setAlerts] = useState([
  { id: 'a1', title: 'Order #000123 due tomorrow', subtitle: 'Customer: Ahmed Ali', kind: 'due',  isRead: false },
  { id: 'a2', title: 'Order #000128 due in 2 days', subtitle: 'Customer: Sara Osman', kind: 'due',  isRead: false },
  { id: 'a3', title: 'Low stock: Classic White (qty 3)', subtitle: 'Inventory alert', kind: 'stock', isRead: false },
  { id: 'a4', title: 'Low stock: Kids Jelabeya (qty 6)', subtitle: 'Inventory alert', kind: 'stock', isRead: true  },
])
```

To support this UI, the backend should expose notifications in a compatible DTO:

```ts
type NotificationKind = 'due' | 'stock'

type NotificationDto = {
  id: number               // unique per notification
  title: string            // main line, shown in bold
  subtitle: string         // secondary line, small gray text
  kind: NotificationKind   // controls pill color + label in UI
  isRead: boolean          // controls badge count and highlight

  // optional metadata for future use (not used by UI today, but recommended):
  orderId?: number | null        // for 'due' notifications
  inventoryItemId?: number | null// for 'stock' notifications
  createdAt?: string | null      // ISO timestamp for sorting
}
```

**Notes for backend:**
- `kind: 'due'` → UI shows a yellow pill with label `"Due date"`.
- `kind: 'stock'` → UI shows a red pill with label `"Stock"`.
- `isRead === false`:
  - Included in unread badge count.
  - Row is highlighted (`bg-primary-light/50`).

## 2. Required endpoints

### `GET /notifications`

- **Auth**: required.
- **Query (optional)**:
  - `limit?` (number; default e.g. `20`).
  - `onlyUnread?` (boolean; default `false`).
- **Success (`200`)**:

```json
{
  "data": [
    {
      "id": 1,
      "title": "Order #000123 due tomorrow",
      "subtitle": "Customer: Ahmed Ali",
      "kind": "due",
      "isRead": false,
      "orderId": 123,
      "createdAt": "2026-03-02T10:00:00.000Z"
    },
    {
      "id": 2,
      "title": "Low stock: Classic White (qty 3)",
      "subtitle": "Inventory alert",
      "kind": "stock",
      "isRead": true,
      "inventoryItemId": 45,
      "createdAt": "2026-03-01T09:00:00.000Z"
    }
  ]
}
```

### `PATCH /notifications/:id/read`

- **Auth**: required.
- **Params**:
  - `id` (number).
- **Body** (optional, for flexibility):

```json
{
  "isRead": true
}
```

- **Success (`200`)**:

```json
{
  "data": {
    "id": 1,
    "title": "Order #000123 due tomorrow",
    "subtitle": "Customer: Ahmed Ali",
    "kind": "due",
    "isRead": true
  }
}
```

### `PATCH /notifications/mark-all-read`

- **Auth**: required.
- **Body**: none.
- **Success (`200`)**:

```json
{
  "data": { "ok": true }
}
```

## 3. How the frontend will use this

Once these endpoints exist, the Header will:

1. Replace the hard-coded `alerts` array with data from `GET /notifications`.
2. Compute `unreadCount` as the count of `isRead === false`.
3. Call:
   - `PATCH /notifications/mark-all-read` when the user clicks **"Mark all read"**.
   - `PATCH /notifications/:id/read` when the user clicks an individual notification row.

No additional fields are required for the current UI beyond those listed in `NotificationDto`. The optional IDs (`orderId`, `inventoryItemId`) and `createdAt` are recommended for future deep-linking and sorting, but not strictly required for the existing design.

