# New API Endpoints Summary

This document explains the **new endpoints** added recently so the frontend can integrate them correctly.

All paths below are relative to the base URL **`http://localhost:3001/api`** and use the global response envelope:

```json
{
  "data": ...,
  "message": "success",
  "code": 200
}
```

---

## 1. Customers minimal list

### `GET /customers/list`

- **Auth**: required (Bearer JWT)
- **Query**: none
- **Purpose**: Get a lightweight list of all customers for dropdowns/autocomplete.

**Response (success):**

```json
{
  "data": [
    { "id": 1, "name": "Customer A", "phone": "0912..." },
    { "id": 2, "name": "Customer B", "phone": "0999..." }
  ],
  "message": "success",
  "code": 200
}
```

- **Item shape**:  
  - `id: number`  
  - `name: string`  
  - `phone: string`
- **Notes**:
  - No pagination; returns all customers ordered by `name` then `id`.
  - No aggregates (no `ordersCount`, `totalSpent`, etc.).

**Frontend usage ideas:**
- Source for customer selection dropdown in `/orders/new`.
- Fast search list when you only need id + display name + phone.

---

## 2. Customer measurements by order

### `GET /customers/:id/measurements`

- **Auth**: required (Bearer JWT)
- **Params**:
  - `id` — customer id (number)
- **Query**: none
- **Purpose**: Get **all orders** for a customer, with full product + measurement details per order.

**Response (success):**

```json
{
  "data": [
    {
      "id": 123,
      "orderNumber": "000123",
      "type": "custom",
      "status": "pending",
      "total": 500,
      "paid": 300,
      "remaining": 200,
      "paymentMethod": "cash",
      "dueDate": "2026-03-10",
      "noteCustomer": "Shorten sleeves",
      "noteWorkshop": null,
      "createdAt": "2026-03-04T12:00:00.000Z",
      "customer": {
        "id": 5,
        "name": "Customer A",
        "phone": "0912..."
      },
      "items": [
        {
          "id": 1,
          "productId": 10,
          "qty": 1,
          "unitPrice": 500,
          "subtotal": 500,
          "product": {
            "id": 10,
            "name": "Jelabeya"
          },
          "measurements": [
            {
              "id": 100,
              "fieldId": 20,
              "value": "140",
              "field": {
                "id": 20,
                "fieldKey": "height",
                "inputType": "text",
                "required": true,
                "i18n": [
                  { "lang": "en", "label": "Height" },
                  { "lang": "ar", "label": "الطول" }
                ]
              }
            }
          ]
        }
      ]
    }
  ],
  "message": "success",
  "code": 200
}
```

**Data shape:**

`data` is an **array of orders** for that customer. Each element is equivalent to what you get from `GET /orders/:id`, with:

- **Order fields**:
  - `id`, `orderNumber`, `type`, `status`, `total`, `paid`, `remaining`,
  - `paymentMethod`, `dueDate`, `noteCustomer`, `noteWorkshop`, `createdAt`
- **Customer**:
  - `customer: { id: number; name: string; phone: string }`
- **Items**:
  - `items[]`:
    - `id`, `productId`, `qty`, `unitPrice`, `subtotal`
    - `product?: { id: number; name: string }`
    - `measurements[]`:
      - `id`, `fieldId`, `value`
      - `field?: {`
        - `id: number`
        - `fieldKey: string`
        - `inputType: string`
        - `required: boolean`
        - `i18n?: { lang: 'en' | 'ar' | 'bn'; label: string }[]`
      - `}`

If the customer has **no orders**, `data` is an **empty array**.

**Frontend usage ideas:**
- Customer profile “measurement history” view:
  - Group by order, then by product, showing the measurements used.
- Pre-filling default measurements when creating a new custom order (e.g. use latest measurements by product/field).

---

## 3. Notifications endpoints (for header dropdown)

These were added earlier but are included here for completeness.

### `GET /notifications`

- **Auth**: required
- **Query**:
  - `limit?: number` (default `20`)
- **Purpose**: Get latest notifications for the header dropdown.

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "title": "Order #000123 due tomorrow",
      "subtitle": "Customer: Ahmed",
      "kind": "due",
      "orderId": 123,
      "inventoryItemId": null,
      "window": "due_tomorrow",
      "isRead": false,
      "createdAt": "2026-03-04T10:00:00.000Z"
    }
  ],
  "message": "success",
  "code": 200
}
```

### `PATCH /notifications/:id/read`

- **Auth**: required
- **Params**:
  - `id` (number)
- **Purpose**: mark a single notification as read.
- **Response**:

```json
{
  "data": { "ok": true },
  "message": "success",
  "code": 200
}
```

### `PATCH /notifications/mark-all-read`

- **Auth**: required
- **Purpose**: mark all notifications as read.
- **Response**:

```json
{
  "data": { "ok": true },
  "message": "success",
  "code": 200
}
```

---

## Frontend checklist for new endpoints

- [ ] Wire customer dropdowns/autocomplete to **`GET /customers/list`** instead of the paginated `/customers` when you just need id + name + phone.
- [ ] Add a customer “measurement history” or debug view using **`GET /customers/:id/measurements`**.
- [ ] Use the existing order types for the measurement endpoint; it reuses the `/orders/:id` shape.
- [ ] Ensure the notifications header uses **`GET /notifications`** and the two PATCH endpoints to mark notifications as read.

