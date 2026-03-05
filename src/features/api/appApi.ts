import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { z } from 'zod'
import { API_BASE } from '@/lib/api'

const metaSchema = z.object({
  page: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().positive(),
  total: z.coerce.number().int().nonnegative(),
})

const customerSchema = z.object({
  id: z.coerce.number(),
  name: z.string().default(''),
  phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  ordersCount: z.coerce.number().optional().default(0),
  totalSpent: z.coerce.number().optional().default(0),
  lastOrderDate: z.string().nullable().optional(),
  orders: z.array(z.any()).optional(),
}).passthrough()

const customerMinimalSchema = z.object({
  id: z.coerce.number(),
  name: z.string(),
  phone: z.string(),
}).passthrough()

const productFieldI18nSchema = z.object({
  lang: z.string(),
  label: z.string(),
}).passthrough()

const productFieldSchema = z.object({
  id: z.coerce.number(),
  fieldKey: z.string(),
  inputType: z.string(),
  required: z.coerce.boolean().optional().default(false),
  sortOrder: z.coerce.number().optional().default(0),
  i18n: z.array(productFieldI18nSchema).optional().default([]),
}).passthrough()

const productSchema = z.object({
  id: z.coerce.number(),
  name: z.string(),
  type: z.enum(['custom', 'ready']),
  basePrice: z.coerce.number().nullable().optional(),
  fields: z.array(productFieldSchema).optional().default([]),
}).passthrough()

const orderMeasurementSchema = z
  .object({
    id: z.coerce.number().optional(),
    fieldId: z.coerce.number().optional(),
    value: z.string().nullable().optional().default(''),
    field: productFieldSchema.optional(),
  })
  .passthrough()

const customerMeasurementOrderSchema = z
  .object({
    id: z.coerce.number(),
    createdAt: z.string(),
    items: z.array(
      z.object({
        productName: z.string().nullable().optional(),
        measurements: z.array(orderMeasurementSchema),
      })
    ),
  })
  .passthrough()

const orderItemSchema = z
  .object({
    id: z.coerce.number().optional(),
    qty: z.coerce.number(),
    unitPrice: z.coerce.number(),
    subtotal: z.coerce.number().optional(),
    productId: z.coerce.number().optional(),
    product: productSchema.nullable().optional(),
    measurements: z.array(orderMeasurementSchema).optional().default([]),
  })
  .passthrough()

const orderSchema = z.object({
  id: z.coerce.number(),
  type: z.enum(['custom', 'ready']),
  status: z.enum(['pending', 'in_progress', 'ready', 'delivered', 'cancelled']).default('pending'),
  paymentMethod: z.enum(['cash', 'mbok']).nullable().optional().default('cash'),
  total: z.coerce.number(),
  paid: z.coerce.number().default(0),
  remaining: z.coerce.number().optional().default(0),
  dueDate: z.string().nullable().optional(),
  noteCustomer: z.string().nullable().optional(),
  noteWorkshop: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  customer: customerSchema.nullable().optional(),
  items: z.array(orderItemSchema).optional().default([]),
}).passthrough()

const inventoryItemSchema = z.object({
  id: z.coerce.number(),
  size: z.string().nullable().optional().default(''),
  qty: z.coerce.number().default(0),
  price: z.coerce.number().default(0),
  product: productSchema.nullable().optional(),
}).passthrough()

const fabricSchema = z.object({
  id: z.coerce.number(),
  name: z.string(),
  unit: z.string().nullable().optional().default('unit'),
  qty: z.coerce.number().default(0),
  costPerUnit: z.coerce.number().default(0),
}).passthrough()

const expenseTypeSchema = z.object({
  id: z.coerce.number(),
  name: z.string(),
  isCustom: z.coerce.boolean().optional().default(false),
}).passthrough()

const expenseSchema = z.object({
  id: z.coerce.number(),
  amount: z.coerce.number(),
  date: z.string(),
  note: z.string().nullable().optional().default(''),
  typeId: z.coerce.number().optional(),
  type: expenseTypeSchema.nullable().optional(),
}).passthrough()

const notificationSchema = z.object({
  id: z.coerce.number(),
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  kind: z.enum(['due', 'stock']),
  orderId: z.coerce.number().nullable().optional(),
  inventoryItemId: z.coerce.number().nullable().optional(),
  window: z.string().nullable().optional(),
  isRead: z.coerce.boolean(),
  createdAt: z.string(),
}).passthrough()

const settingsSchema = z.record(z.string(), z.unknown())

const dashboardStatsSchema = z.object({
  totalOrders: z.coerce.number().default(0),
  totalRevenue: z.coerce.number().default(0),
  activeCustomers: z.coerce.number().default(0),
  workingDays: z.coerce.number().default(0),
}).passthrough()

const salesPointSchema = z.object({
  month: z.coerce.number(),
  total: z.coerce.number().default(0),
  compare: z.coerce.number().nullable().optional(),
})

const salesChartSchema = z.object({
  year: z.coerce.number(),
  compareYear: z.coerce.number().nullable().optional(),
  data: z.array(salesPointSchema),
})

const topProductSchema = z.object({
  productId: z.coerce.number(),
  name: z.string(),
  qty: z.coerce.number(),
  total: z.coerce.number(),
})

const topCustomerSchema = z.object({
  customerId: z.coerce.number(),
  name: z.string(),
  phone: z.string().nullable().optional(),
  ordersCount: z.coerce.number(),
  totalSpent: z.coerce.number(),
})

type Paginated<T> = {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

type Envelope = {
  data?: unknown
  meta?: unknown
}

function unwrapBody(payload: unknown) {
  const root = (payload ?? {}) as Envelope
  return root.data ?? payload
}

function parseOne<T>(payload: unknown, schema: z.ZodType<T>): T {
  return schema.parse(unwrapBody(payload))
}

function parseMany<T>(payload: unknown, schema: z.ZodType<T>): T[] {
  return z.array(schema).parse(unwrapBody(payload))
}

function parsePaginated<T>(payload: unknown, schema: z.ZodType<T>): Paginated<T> {
  const body = unwrapBody(payload) as Envelope
  const data = z.array(schema).parse((body as any)?.data ?? [])
  const meta = metaSchema.parse((body as any)?.meta ?? (payload as any)?.meta ?? { page: 1, limit: data.length || 20, total: data.length })
  return { data, meta }
}

export const appApi = createApi({
  reducerPath: 'appApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE,
    credentials: 'include',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token')
      if (token) headers.set('authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['Customer', 'Order', 'InventoryItem', 'Fabric', 'Expense', 'ExpenseType', 'Settings', 'Product', 'ProductField', 'Notification'],
  endpoints: (builder) => ({
    getDashboardStats: builder.query<z.infer<typeof dashboardStatsSchema>, void>({
      query: () => '/dashboard/stats',
      transformResponse: (response) => parseOne(response, dashboardStatsSchema),
    }),
    getDashboardSalesChart: builder.query<z.infer<typeof salesChartSchema>, { year?: number; compareYear?: number } | undefined>({
      query: (params) => ({ url: '/dashboard/sales-chart', params: params || undefined }),
      transformResponse: (response) => parseOne(response, salesChartSchema),
    }),
    getDashboardTopProducts: builder.query<z.infer<typeof topProductSchema>[], { limit?: number } | undefined>({
      query: (params) => ({ url: '/dashboard/top-products', params: params || undefined }),
      transformResponse: (response) => parseMany(response, topProductSchema),
    }),
    getDashboardTopCustomers: builder.query<z.infer<typeof topCustomerSchema>[], { limit?: number } | undefined>({
      query: (params) => ({ url: '/dashboard/top-customers', params: params || undefined }),
      transformResponse: (response) => parseMany(response, topCustomerSchema),
    }),

    getCustomers: builder.query<Paginated<z.infer<typeof customerSchema>>, { page?: number; limit?: number; search?: string; phone?: string } | undefined>({
      query: (params) => ({ url: '/customers', params: params || undefined }),
      transformResponse: (response) => parsePaginated(response, customerSchema),
      providesTags: (result) =>
        result
          ? [...result.data.map((customer) => ({ type: 'Customer' as const, id: customer.id })), { type: 'Customer' as const, id: 'LIST' }]
          : [{ type: 'Customer' as const, id: 'LIST' }],
    }),
    getCustomerList: builder.query<z.infer<typeof customerMinimalSchema>[], void>({
      query: () => '/customers/list',
      transformResponse: (response) => parseMany(response, customerMinimalSchema),
      providesTags: (result) =>
        result
          ? [
              ...result.map((customer) => ({ type: 'Customer' as const, id: customer.id })),
              { type: 'Customer' as const, id: 'LIST-MIN' },
            ]
          : [{ type: 'Customer' as const, id: 'LIST-MIN' }],
    }),
    getCustomerById: builder.query<z.infer<typeof customerSchema>, number>({
      query: (id) => `/customers/${id}`,
      transformResponse: (response) => parseOne(response, customerSchema),
      providesTags: (_result, _error, id) => [{ type: 'Customer', id }],
    }),
    createCustomer: builder.mutation<z.infer<typeof customerSchema>, { name: string; phone: string; notes?: string }>({
      query: (body) => ({ url: '/customers', method: 'POST', body }),
      transformResponse: (response) => parseOne(response, customerSchema),
      invalidatesTags: [{ type: 'Customer', id: 'LIST' }, { type: 'Customer', id: 'LIST-MIN' }],
    }),
    updateCustomer: builder.mutation<z.infer<typeof customerSchema>, { id: number; body: { name?: string; phone?: string; notes?: string } }>({
      query: ({ id, body }) => ({ url: `/customers/${id}`, method: 'PATCH', body }),
      transformResponse: (response) => parseOne(response, customerSchema),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Customer', id },
        { type: 'Customer', id: 'LIST' },
        { type: 'Customer', id: 'LIST-MIN' },
      ],
    }),
    deleteCustomer: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/customers/${id}`, method: 'DELETE' }),
      transformResponse: () => ({ ok: true }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Customer', id },
        { type: 'Customer', id: 'LIST' },
        { type: 'Customer', id: 'LIST-MIN' },
      ],
    }),

    changeUserPassword: builder.mutation<{ ok: boolean }, { id: number; password: string }>({
      query: ({ id, password }) => ({ url: `/users/${id}/password`, method: 'PATCH', body: { password } }),
      transformResponse: () => ({ ok: true }),
    }),

    getProducts: builder.query<z.infer<typeof productSchema>[], { type?: 'custom' | 'ready' } | undefined>({
      query: (params) => ({ url: '/products', params: params || undefined }),
      transformResponse: (response) => parseMany(response, productSchema),
      providesTags: (result) =>
        result
          ? [...result.map((product) => ({ type: 'Product' as const, id: product.id })), { type: 'Product' as const, id: 'LIST' }]
          : [{ type: 'Product' as const, id: 'LIST' }],
    }),
    createProduct: builder.mutation<z.infer<typeof productSchema>, { name: string; type: 'custom' | 'ready'; basePrice?: number }>({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      transformResponse: (response) => parseOne(response, productSchema),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),
    getProductFields: builder.query<z.infer<typeof productFieldSchema>[], number>({
      query: (productId) => `/products/${productId}/fields`,
      transformResponse: (response) => parseMany(response, productFieldSchema),
      providesTags: (result, _error, productId) =>
        result
          ? [...result.map((field) => ({ type: 'ProductField' as const, id: field.id })), { type: 'ProductField' as const, id: `LIST-${productId}` }]
          : [{ type: 'ProductField' as const, id: `LIST-${productId}` }],
    }),
    createProductField: builder.mutation<
      z.infer<typeof productFieldSchema>,
      { productId: number; body: { fieldKey: string; inputType: string; required?: boolean; labels?: Array<{ language: 'en' | 'ar' | 'bn'; label: string }> } }
    >({
      query: ({ productId, body }) => ({ url: `/products/${productId}/fields`, method: 'POST', body }),
      transformResponse: (response) => parseOne(response, productFieldSchema),
      invalidatesTags: (_result, _error, { productId }) => [{ type: 'ProductField', id: `LIST-${productId}` }],
    }),
    updateProductField: builder.mutation<
      z.infer<typeof productFieldSchema>,
      { fieldId: number; productId: number; body: { fieldKey?: string; inputType?: string; required?: boolean; labels?: Array<{ language: 'en' | 'ar' | 'bn'; label: string }> } }
    >({
      query: ({ fieldId, body }) => ({ url: `/products/fields/${fieldId}`, method: 'PATCH', body }),
      transformResponse: (response) => parseOne(response, productFieldSchema),
      invalidatesTags: (_result, _error, { fieldId, productId }) => [{ type: 'ProductField', id: fieldId }, { type: 'ProductField', id: `LIST-${productId}` }],
    }),
    deleteProductField: builder.mutation<{ ok: boolean }, { fieldId: number; productId: number }>({
      query: ({ fieldId }) => ({ url: `/products/fields/${fieldId}`, method: 'DELETE' }),
      transformResponse: () => ({ ok: true }),
      invalidatesTags: (_result, _error, { fieldId, productId }) => [{ type: 'ProductField', id: fieldId }, { type: 'ProductField', id: `LIST-${productId}` }],
    }),

    getOrders: builder.query<Paginated<z.infer<typeof orderSchema>>, { page?: number; limit?: number; type?: 'custom' | 'ready'; status?: 'pending' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'; from?: string; to?: string } | undefined>({
      query: (params) => ({ url: '/orders', params: params || undefined }),
      transformResponse: (response) => parsePaginated(response, orderSchema),
      providesTags: (result) =>
        result
          ? [...result.data.map((order) => ({ type: 'Order' as const, id: order.id })), { type: 'Order' as const, id: 'LIST' }]
          : [{ type: 'Order' as const, id: 'LIST' }],
    }),
    getCustomerMeasurements: builder.query<z.infer<typeof customerMeasurementOrderSchema>[], number>({
      query: (customerId) => `/customers/${customerId}/measurements`,
      transformResponse: (response) => parseMany(response, customerMeasurementOrderSchema),
      providesTags: (_result, _error, customerId) => [{ type: 'Customer', id: `MEASUREMENTS-${customerId}` }],
    }),
    getOrderById: builder.query<z.infer<typeof orderSchema>, number>({
      query: (id) => `/orders/${id}`,
      transformResponse: (response) => parseOne(response, orderSchema),
      providesTags: (_result, _error, id) => [{ type: 'Order', id }],
    }),
    createCustomOrder: builder.mutation<
      z.infer<typeof orderSchema>,
      {
        customerId: number
        items: Array<{ productId: number; qty: number; unitPrice: number; measurements: Array<{ fieldId: number; value: string }> }>
        total: number
        paid: number
        paymentMethod?: 'cash' | 'mbok'
        dueDate?: string
        noteCustomer?: string
        noteWorkshop?: string
      }
    >({
      query: (body) => ({ url: '/orders/custom', method: 'POST', body }),
      transformResponse: (response) => parseOne(response, orderSchema),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }, { type: 'Customer', id: 'LIST-MIN' }],
    }),
    createReadyOrder: builder.mutation<
      z.infer<typeof orderSchema>,
      {
        items: Array<{ inventoryItemId: number; qty: number; unitPrice: number }>
        total: number
        paid: number
        paymentMethod?: 'cash' | 'mbok'
        dueDate?: string
      }
    >({
      query: (body) => ({ url: '/orders/ready', method: 'POST', body }),
      transformResponse: (response) => parseOne(response, orderSchema),
      invalidatesTags: [
        { type: 'Order', id: 'LIST' },
        { type: 'InventoryItem', id: 'LIST' },
        { type: 'Customer', id: 'LIST-MIN' },
      ],
    }),
    updateOrder: builder.mutation<
      z.infer<typeof orderSchema>,
      {
        id: number
        body: {
          status?: 'pending' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'
          paid?: number
          dueDate?: string
          paymentMethod?: 'cash' | 'mbok'
        }
      }
    >({
      query: ({ id, body }) => ({ url: `/orders/${id}`, method: 'PATCH', body }),
      transformResponse: (response) => parseOne(response, orderSchema),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
        { type: 'Customer', id: 'LIST-MIN' },
      ],
    }),
    deleteOrder: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/orders/${id}`, method: 'DELETE' }),
      transformResponse: () => ({ ok: true }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
        { type: 'Customer', id: 'LIST-MIN' },
      ],
    }),

    getInventoryItems: builder.query<Paginated<z.infer<typeof inventoryItemSchema>>, { page?: number; limit?: number } | undefined>({
      query: (params) => ({ url: '/inventory/items', params: params || undefined }),
      transformResponse: (response) => parsePaginated(response, inventoryItemSchema),
      providesTags: (result) =>
        result
          ? [...result.data.map((item) => ({ type: 'InventoryItem' as const, id: item.id })), { type: 'InventoryItem' as const, id: 'LIST' }]
          : [{ type: 'InventoryItem' as const, id: 'LIST' }],
    }),
    createInventoryItem: builder.mutation<
      z.infer<typeof inventoryItemSchema>,
      { body: { productId: number; size?: string; qty: number; price: number } }
    >({
      query: ({ body }) => ({ url: '/inventory/items', method: 'POST', body }),
      transformResponse: (response) => parseOne(response, inventoryItemSchema),
      invalidatesTags: [{ type: 'InventoryItem', id: 'LIST' }],
    }),
    updateInventoryItem: builder.mutation<z.infer<typeof inventoryItemSchema>, { id: number; body: { productId?: number; size?: string; qty?: number; price?: number } }>({
      query: ({ id, body }) => ({ url: `/inventory/items/${id}`, method: 'PATCH', body }),
      transformResponse: (response) => parseOne(response, inventoryItemSchema),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'InventoryItem', id }, { type: 'InventoryItem', id: 'LIST' }],
    }),
    deleteInventoryItem: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/inventory/items/${id}`, method: 'DELETE' }),
      transformResponse: () => ({ ok: true }),
      invalidatesTags: (_result, _error, id) => [{ type: 'InventoryItem', id }, { type: 'InventoryItem', id: 'LIST' }],
    }),

    getInventoryFabrics: builder.query<Paginated<z.infer<typeof fabricSchema>>, { page?: number; limit?: number } | undefined>({
      query: (params) => ({ url: '/inventory/fabrics', params: params || undefined }),
      transformResponse: (response) => parsePaginated(response, fabricSchema),
      providesTags: (result) =>
        result
          ? [...result.data.map((fabric) => ({ type: 'Fabric' as const, id: fabric.id })), { type: 'Fabric' as const, id: 'LIST' }]
          : [{ type: 'Fabric' as const, id: 'LIST' }],
    }),
    createFabric: builder.mutation<
      z.infer<typeof fabricSchema>,
      { body: { name: string; unit?: string; qty: number; costPerUnit: number } }
    >({
      query: ({ body }) => ({ url: '/inventory/fabrics', method: 'POST', body }),
      transformResponse: (response) => parseOne(response, fabricSchema),
      invalidatesTags: [{ type: 'Fabric', id: 'LIST' }],
    }),
    updateFabric: builder.mutation<z.infer<typeof fabricSchema>, { id: number; body: { name?: string; unit?: string; qty?: number; costPerUnit?: number } }>({
      query: ({ id, body }) => ({ url: `/inventory/fabrics/${id}`, method: 'PATCH', body }),
      transformResponse: (response) => parseOne(response, fabricSchema),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Fabric', id }, { type: 'Fabric', id: 'LIST' }],
    }),
    deleteFabric: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/inventory/fabrics/${id}`, method: 'DELETE' }),
      transformResponse: () => ({ ok: true }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Fabric', id }, { type: 'Fabric', id: 'LIST' }],
    }),

    getExpenseTypes: builder.query<z.infer<typeof expenseTypeSchema>[], void>({
      query: () => '/expenses/types',
      transformResponse: (response) => parseMany(response, expenseTypeSchema),
      providesTags: (result) =>
        result
          ? [...result.map((type) => ({ type: 'ExpenseType' as const, id: type.id })), { type: 'ExpenseType' as const, id: 'LIST' }]
          : [{ type: 'ExpenseType' as const, id: 'LIST' }],
    }),
    createExpenseType: builder.mutation<z.infer<typeof expenseTypeSchema>, { name: string; isCustom?: boolean }>({
      query: (body) => ({ url: '/expenses/types', method: 'POST', body }),
      transformResponse: (response) => parseOne(response, expenseTypeSchema),
      invalidatesTags: [{ type: 'ExpenseType', id: 'LIST' }],
    }),
    getExpenses: builder.query<Paginated<z.infer<typeof expenseSchema>>, { page?: number; limit?: number; from?: string; to?: string; type?: number } | undefined>({
      query: (params) => ({ url: '/expenses', params: params || undefined }),
      transformResponse: (response) => parsePaginated(response, expenseSchema),
      providesTags: (result) =>
        result
          ? [...result.data.map((expense) => ({ type: 'Expense' as const, id: expense.id })), { type: 'Expense' as const, id: 'LIST' }]
          : [{ type: 'Expense' as const, id: 'LIST' }],
    }),
    getExpensesSummary: builder.query<{ total: number }, { period?: 'today' | 'month' | 'year' } | undefined>({
      query: (params) => ({ url: '/expenses/summary', params: params || undefined }),
      transformResponse: (response) => {
        const body = unwrapBody(response) as { total?: number | string }
        return { total: Number(body?.total ?? 0) }
      },
      providesTags: [{ type: 'Expense', id: 'LIST' }],
    }),
    createExpense: builder.mutation<z.infer<typeof expenseSchema>, { typeId: number; amount: number; date: string; note?: string }>({
      query: (body) => ({ url: '/expenses', method: 'POST', body }),
      transformResponse: (response) => parseOne(response, expenseSchema),
      invalidatesTags: [{ type: 'Expense', id: 'LIST' }],
    }),

    getNotifications: builder.query<z.infer<typeof notificationSchema>[], { limit?: number } | undefined>({
      query: (params) => ({ url: '/notifications', params: params || undefined }),
      transformResponse: (response) => parseMany(response, notificationSchema),
      providesTags: (result) =>
        result
          ? [
              ...result.map((n) => ({ type: 'Notification' as const, id: n.id })),
              { type: 'Notification' as const, id: 'LIST' },
            ]
          : [{ type: 'Notification' as const, id: 'LIST' }],
    }),
    markNotificationRead: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      transformResponse: () => ({ ok: true }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Notification', id }, { type: 'Notification', id: 'LIST' }],
    }),
    markAllNotificationsRead: builder.mutation<{ ok: boolean }, void>({
      query: () => ({ url: '/notifications/mark-all-read', method: 'PATCH' }),
      transformResponse: () => ({ ok: true }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),

    getSettings: builder.query<z.infer<typeof settingsSchema>, void>({
      query: () => '/settings',
      transformResponse: (response) => parseOne(response, settingsSchema),
      providesTags: [{ type: 'Settings', id: 'CURRENT' }],
    }),
    patchSettings: builder.mutation<z.infer<typeof settingsSchema>, Record<string, unknown>>({
      query: (body) => ({ url: '/settings', method: 'PATCH', body }),
      transformResponse: (response) => parseOne(response, settingsSchema),
      invalidatesTags: [{ type: 'Settings', id: 'CURRENT' }],
    }),
  }),
})

export const {
  useGetDashboardStatsQuery,
  useGetDashboardSalesChartQuery,
  useGetDashboardTopProductsQuery,
  useGetDashboardTopCustomersQuery,
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useChangeUserPasswordMutation,
  useGetProductsQuery,
  useCreateProductMutation,
  useGetProductFieldsQuery,
  useCreateProductFieldMutation,
  useUpdateProductFieldMutation,
  useDeleteProductFieldMutation,
  useGetCustomerListQuery,
  useGetCustomerMeasurementsQuery,
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateCustomOrderMutation,
  useCreateReadyOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
  useGetInventoryItemsQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useGetInventoryFabricsQuery,
  useCreateFabricMutation,
  useUpdateFabricMutation,
  useDeleteFabricMutation,
  useGetExpenseTypesQuery,
  useCreateExpenseTypeMutation,
  useGetExpensesQuery,
  useGetExpensesSummaryQuery,
  useCreateExpenseMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetSettingsQuery,
  usePatchSettingsMutation,
} = appApi
