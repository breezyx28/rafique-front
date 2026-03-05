# Customer Endpoints: Minimal List & Measurements

This document explains the **two new customer endpoints** for the frontend.

All paths are relative to `http://localhost:3001/api` and use the global response envelope:

```json
{
  "data": ...,
  "message": "success",
  "code": 200
}
```

---

## 1. Minimal customers list

### `GET /customers/list`

- **Auth**: required (Bearer JWT)
- **Query**: none
- **Purpose**: Get a lightweight list of **all customers** for dropdowns/autocomplete.

**Success response:**

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
  - No pagination: returns all rows.
  - Ordered by `name` (ASC), then `id` (ASC).
  - No aggregates (`ordersCount`, `totalSpent`, etc.).

**Frontend usage:**
- Use as the source for customer pickers (selects, autocompletes).
- Recommended type:

```ts
type CustomerMinimal = {
  id: number;
  name: string;
  phone: string;
};
```

---

## 2. Customer measurements by order

### `GET /customers/:id/measurements`

- **Auth**: required (Bearer JWT)
- **Params**:
  - `id` — customer id (number)
- **Query**: none
- **Purpose**: Fetch **all orders** for a customer, including products and all measurements per order item.

**Success response (example, truncated):**

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

- `data` is an **array of orders** for the given customer.
- Each order has the same structure as `GET /orders/:id`:
  - Base order fields:
    - `id`, `orderNumber`, `type`, `status`, `total`, `paid`, `remaining`,
    - `paymentMethod`, `dueDate`, `noteCustomer`, `noteWorkshop`, `createdAt`.
  - `customer`:
    - `{ id: number; name: string; phone: string }`
  - `items[]`:
    - `id`, `productId`, `qty`, `unitPrice`, `subtotal`
    - `product?: { id: number; name: string }`
    - `measurements[]`:
      - `id: number`
      - `fieldId: number`
      - `value: string`
      - `field?: {`
        - `id: number`
        - `fieldKey: string`
        - `inputType: string`
        - `required: boolean`
        - `i18n?: { lang: 'en' | 'ar' | 'bn'; label: string }[]`
      - `}`

- If the customer has **no orders**, `data` is an **empty array**.

**Frontend usage:**

- To show a **measurement history** per customer:
  - Group orders by date, then within each order show product + measurements.
- To derive latest measurements for a given product/field:
  - Filter `data` by product, sort by `createdAt`, and pick the latest `measurements` entries.

Recommended TypeScript type (simplified, reusing your existing `Order` type is fine):

```ts
type CustomerMeasurementOrder = {
  id: number;
  orderNumber: string;
  type: 'custom' | 'ready';
  status: 'pending' | 'in_progress' | 'ready' | 'delivered' | 'cancelled';
  total: number;
  paid: number;
  remaining: number;
  paymentMethod: 'cash' | 'mbok' | null;
  dueDate: string | null;
  noteCustomer: string | null;
  noteWorkshop: string | null;
  createdAt: string;
  customer: { id: number; name: string; phone: string };
  items: Array<{
    id: number;
    productId: number;
    qty: number;
    unitPrice: number;
    subtotal: number;
    product?: { id: number; name: string };
    measurements: Array<{
      id: number;
      fieldId: number;
      value: string;
      field?: {
        id: number;
        fieldKey: string;
        inputType: string;
        required: boolean;
        i18n?: Array<{ lang: 'en' | 'ar' | 'bn'; label: string }>;
      };
    }>;
  }>;
};
```

