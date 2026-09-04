import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Check, ChevronRight, Minus, Plus, Trash2, Ruler, Clock3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { NumberInput } from '@/components/ui/NumberInput'
import type { InvoicePayload } from '@/features/invoices/types'
import { persistLatestInvoiceOrder } from '@/features/invoices/invoiceStore'
import {
  useCreateCustomOrderMutation,
  useCreateCustomerMutation,
  useGetCustomerListQuery,
  useGetCustomerMeasurementsQuery,
  useGetProductsQuery,
  useGetProductFieldsQuery,
  useGetInventoryFabricsQuery,
  useCreateFabricOrderMutation,
} from '@/features/api/appApi'

type PaymentMethod = 'Cash' | 'MBOK'
type OrderKind = 'custom' | 'fabric'

interface CartItem {
  id: string
  kind: OrderKind
  productId: number
  productName: string
  qty: number
  unitPrice: number
  fabricId: number
  fabricName: string
  fabricMeters: number
  measurements: Array<{ fieldId: number; label: string; value: string }>
}

const money = (v: number) => `${v.toLocaleString()} SDG`

export function NewOrderPage() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedCustomer = (location.state as { selectedCustomer?: { id?: number; name?: string; phone?: string } } | null)?.selectedCustomer
  const navigate = useNavigate()
  const orderKind: OrderKind = searchParams.get('kind') === 'fabric' ? 'fabric' : 'custom'
  const { t, i18n } = useTranslation()
  const tr = (key: string, defaultValue: string) => t(key, { defaultValue })
  const currentLang = (i18n.language || 'en').slice(0, 2) as 'en' | 'ar' | 'bn'
  const getFieldLabel = (field: { fieldKey: string; i18n?: Array<{ lang: string; label: string }> }) =>
    field.i18n?.find((x) => x.lang === currentLang)?.label ??
    field.i18n?.find((x) => x.lang === 'en')?.label ??
    field.i18n?.[0]?.label ??
    field.fieldKey
  const stepTitles = [
    tr('orders.new.steps.customerInfo', 'Customer Info'),
    orderKind === 'fabric'
      ? tr('orders.new.steps.fabricAndMeters', 'Fabric & Meters')
      : tr('orders.new.steps.productsAndMeasurements', 'Products & Measurements'),
    tr('orders.new.steps.paymentAndCheckout', 'Payment & Checkout'),
    tr('orders.new.steps.reviewAndConfirm', 'Review & Confirm'),
  ]

  const [step, setStep] = useState(1)
  const [showConfirm, setShowConfirm] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomerFromSearch, setSelectedCustomerFromSearch] = useState<{
    id: number
    name: string
    phone: string
  } | null>(
    selectedCustomer?.id && selectedCustomer.name != null && selectedCustomer.phone != null
      ? {
          id: selectedCustomer.id,
          name: selectedCustomer.name,
          phone: selectedCustomer.phone,
        }
      : null
  )
  const [fullName, setFullName] = useState(selectedCustomer?.name ?? '')
  const [phone, setPhone] = useState(selectedCustomer?.phone ?? '')
  const customerReady = Boolean(fullName.trim() && phone.trim())
  const [customerNotes, setCustomerNotes] = useState('')
  const [workshopNotes, setWorkshopNotes] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [ordersModalOpen, setOrdersModalOpen] = useState(false)
  const [ordersModalCustomer, setOrdersModalCustomer] = useState<{ id: number; name: string; phone: string } | null>(null)

  // Global minimal customer list (cached once, reused for search)
  const { data: customerList } = useGetCustomerListQuery()
  const allCustomers = useMemo(() => customerList ?? [], [customerList])
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return allCustomers.slice(0, 20)
    return allCustomers.filter(
      (c) =>
        (c.name ?? '').toLowerCase().includes(q) ||
        (c.phone ?? '').toLowerCase().includes(q)
    ).slice(0, 20)
  }, [allCustomers, searchQuery])

  const { data: measurementsOrders, isLoading: measurementsLoading } = useGetCustomerMeasurementsQuery(
    ordersModalCustomer?.id ?? 0,
    { skip: !ordersModalOpen || !ordersModalCustomer }
  )
  const pastOrderItems = useMemo(() => {
    if (!ordersModalCustomer) return []
    const orders =
      (measurementsOrders as
        | Array<{
            id: number
            createdAt: string
            items?: Array<{
              productName?: string | null
              measurements?: Array<{
                fieldId?: number
                value?: string
                field?: { fieldKey: string; i18n?: Array<{ lang: string; label: string }> }
              }>
            }>
          }>
        | undefined) ?? []
    const out: Array<{
      orderId: number
      createdAt: string
      productName: string
      measurements: Array<{
        fieldId: number
        value: string
        field?: { fieldKey: string; i18n?: Array<{ lang: string; label: string }> }
      }>
    }> = []
    for (const order of orders) {
      for (const item of order.items ?? []) {
        const productName = item.productName ?? ''
        const measurements = (item.measurements ?? []).map((m) => ({
          fieldId: m.fieldId ?? 0,
          value: m.value ?? '',
          field: m.field,
        }))
        out.push({
          orderId: order.id,
          createdAt: order.createdAt,
          productName,
          measurements,
        })
      }
    }
    return out
  }, [measurementsOrders, ordersModalCustomer])

  const { data: products } = useGetProductsQuery({ type: 'custom' })
  const { data: fabricsData } = useGetInventoryFabricsQuery({ page: 1, limit: 100 })
  const [productId, setProductId] = useState<number | null>(null)
  const activeProductId = productId ?? products?.[0]?.id ?? null
  const { data: productFields } = useGetProductFieldsQuery(activeProductId ?? 0, {
    skip: !activeProductId || orderKind === 'fabric',
  })

  const [qty, setQty] = useState(1)
  const [fabricId, setFabricId] = useState<number | null>(null)
  const [fabricMeters, setFabricMeters] = useState(0)
  const [unitPrice, setUnitPrice] = useState(0)
  const [cart, setCart] = useState<CartItem[]>([])
  const [measurementValuesByProduct, setMeasurementValuesByProduct] = useState<
    Record<number, Record<number, string>>
  >({})
  const setOrderKind = (kind: OrderKind) => {
    setCart([])
    setFabricId(null)
    setFabricMeters(0)
    if (kind === 'fabric') setSearchParams({ kind: 'fabric' })
    else setSearchParams({})
  }

  const activeProduct = useMemo(
    () => (products ?? []).find((p) => p.id === activeProductId),
    [products, activeProductId]
  )
  const selectedFabric = useMemo(
    () => (fabricsData?.data ?? []).find((fabric) => fabric.id === fabricId),
    [fabricsData?.data, fabricId]
  )
  useEffect(() => {
    if (orderKind === 'fabric') {
      const price = selectedFabric?.sellingPricePerMeter
      setUnitPrice(price != null && price > 0 ? Number(price) : 0)
      return
    }
    const base = activeProduct?.basePrice
    setUnitPrice(base != null && base > 0 ? Number(base) : 0)
  }, [activeProduct?.basePrice, activeProduct?.id, orderKind, selectedFabric?.id, selectedFabric?.sellingPricePerMeter])

  const [receivedAmount, setReceivedAmount] = useState(0)
  const [dueDate, setDueDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash')
  const [createCustomer] = useCreateCustomerMutation()
  const [createCustomOrder, { isLoading: isSubmittingCustom }] = useCreateCustomOrderMutation()
  const [createFabricOrder, { isLoading: isSubmittingFabric }] = useCreateFabricOrderMutation()
  const isSubmitting = isSubmittingCustom || isSubmittingFabric

  const totalPrice = useMemo(
    () =>
      cart.reduce((acc, item) => {
        if (item.kind === 'fabric') return acc + item.fabricMeters * item.unitPrice
        return acc + item.qty * item.unitPrice
      }, 0),
    [cart]
  )
  const remaining = Math.max(0, totalPrice - receivedAmount)

  const addToCart = () => {
    const meters = Number(fabricMeters)
    const reservedMeters = cart
      .filter((item) => item.fabricId === fabricId)
      .reduce((sum, item) => sum + item.fabricMeters, 0)
    if (
      !selectedFabric ||
      meters <= 0 ||
      meters + reservedMeters > selectedFabric.qty
    )
      return

    if (orderKind === 'fabric') {
      setCart((prev) => [
        ...prev,
        {
          id: `fabric-${selectedFabric.id}-${Date.now()}`,
          kind: 'fabric',
          productId: 0,
          productName: selectedFabric.name,
          qty: 1,
          unitPrice,
          fabricId: selectedFabric.id,
          fabricName: selectedFabric.name,
          fabricMeters: meters,
          measurements: [],
        },
      ])
      setFabricMeters(0)
      return
    }

    if (!activeProductId) return
    const product = activeProduct ?? (products ?? []).find((p) => p.id === activeProductId)
    if (!product) return
    const fields = productFields ?? []
    const valuesForProduct = measurementValuesByProduct[activeProductId] ?? {}
    setCart((prev) => [
      ...prev,
      {
        id: `${product.id}-${Date.now()}`,
        kind: 'custom',
        productId: product.id,
        productName: product.name,
        qty,
        unitPrice,
        fabricId: selectedFabric.id,
        fabricName: selectedFabric.name,
        fabricMeters: meters,
        measurements: fields.map((field) => {
          const fieldId = field.id
          const value = valuesForProduct[fieldId] ?? ''
          const label = getFieldLabel(field)
          return { fieldId, label, value }
        }),
      },
    ])
    setQty(1)
  }

  const updateQty = (id: string, nextQty: number) => {
    if (nextQty < 1) return
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, qty: nextQty } : item)))
  }

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-text-primary">
            {orderKind === 'fabric'
              ? tr('orders.new.fabricTitle', 'New Fabric Order')
              : tr('orders.new.title', 'New Custom Order')}
          </h1>
          <p className="text-[13px] text-text-secondary">
            {orderKind === 'fabric'
              ? tr('orders.new.fabricSubtitle', 'Register the customer, then sell fabric by the meter with the same checkout steps.')
              : tr('orders.new.subtitle', 'Create a custom order in 4 steps with live cart and payment summary.')}
          </p>
        </div>
        <div className="inline-flex rounded-full bg-[#F5F5F5] p-[3px]">
          <button
            type="button"
            onClick={() => setOrderKind('custom')}
            className={`rounded-full px-4 py-1.5 text-[12px] font-medium ${
              orderKind === 'custom' ? 'bg-[#1A1A2E] text-white' : 'text-text-muted'
            }`}
          >
            {tr('orders.new.kindCustom', 'Custom sewing')}
          </button>
          <button
            type="button"
            onClick={() => setOrderKind('fabric')}
            className={`rounded-full px-4 py-1.5 text-[12px] font-medium ${
              orderKind === 'fabric' ? 'bg-[#1A1A2E] text-white' : 'text-text-muted'
            }`}
          >
            {tr('orders.new.kindFabric', 'Fabric sale')}
          </button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="grid gap-2 md:grid-cols-4">
            {stepTitles.map((title, idx) => {
              const current = idx + 1
              const isActive = step === current
              const isDone = step > current
              return (
                <button
                  key={title}
                  type="button"
                  onClick={() => setStep(current)}
                  className={`flex items-center gap-2 rounded-[10px] border px-3 py-2 text-left ${
                    isActive
                      ? 'border-primary bg-primary-light'
                      : isDone
                      ? 'border-success bg-successBg'
                      : 'border-border bg-white'
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                      isActive
                        ? 'bg-primary text-white'
                        : isDone
                        ? 'bg-success text-white'
                        : 'bg-[#F5F5F5] text-text-secondary'
                    }`}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" /> : current}
                  </span>
                  <span className="text-[12px] font-semibold text-text-primary">{title}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,1.3fr)]">
        <div className="space-y-3">
          {step === 1 && (
            <div className="relative rounded-[12px] border border-border bg-white px-4 py-3">
              <label className="mb-1 block text-[12px] font-medium text-text-secondary">
                {tr('orders.new.customer.searchLabel', 'Search customer')}
              </label>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                placeholder={tr('orders.new.customer.phoneLookupPlaceholder', 'Search by phone or name')}
              />
              {searchFocused && searchQuery.trim() && searchResults.length > 0 && (
                <ul className="absolute left-4 right-4 top-full z-20 mt-1 max-h-48 overflow-auto rounded-[10px] border border-border bg-white py-1 shadow-lg">
                  {searchResults.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="w-full px-4 py-2 text-left text-[13px] hover:bg-[#F5F5F5]"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSelectedCustomerFromSearch({ id: c.id, name: c.name ?? '', phone: c.phone ?? '' })
                          setFullName(c.name ?? '')
                          setPhone(c.phone ?? '')
                          setSearchQuery('')
                          if (orderKind === 'custom') {
                            setOrdersModalCustomer({ id: c.id, name: c.name ?? '', phone: c.phone ?? '' })
                            setOrdersModalOpen(true)
                          }
                        }}
                      >
                        <span className="font-medium text-text-primary">{c.name || '—'}</span>
                        {c.phone && <span className="ml-2 text-text-muted">{c.phone}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{stepTitles[step - 1]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {step === 1 && (
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-text-secondary">
                    {tr('orders.new.customer.fullName', 'Full Name')} <span className="text-danger">*</span>
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      setSelectedCustomerFromSearch(null)
                    }}
                    placeholder={tr('orders.new.customer.fullNamePlaceholder', 'Customer name')}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-text-secondary">
                    {tr('orders.new.customer.phoneLabel', 'Phone')} <span className="text-danger">*</span>
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      setSelectedCustomerFromSearch(null)
                    }}
                    placeholder={tr('orders.new.customer.phonePlaceholder', 'Phone number')}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[12px] font-medium text-text-secondary">{tr('orders.new.customer.notes', 'Customer Notes')}</label>
                  <textarea
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="min-h-[96px] w-full rounded-[10px] border border-border bg-white px-3 py-2 text-[13px] text-text-primary"
                    placeholder={tr('orders.new.customer.notesPlaceholder', 'Optional customer notes')}
                  />
                </div>
                {!fullName.trim() && (
                  <p className="md:col-span-2 text-[12px] text-danger">
                    {tr('orders.new.customer.nameRequired', 'Customer name is required.')}
                  </p>
                )}
                {!phone.trim() && (
                  <p className="md:col-span-2 text-[12px] text-danger">
                    {tr('orders.new.customer.phoneRequired', 'Phone number is required.')}
                  </p>
                )}
              </div>
            )}

            {step === 2 && orderKind === 'fabric' && (
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-text-secondary">
                    {tr('orders.new.fabric', 'Fabric')}
                  </label>
                  <select
                    value={fabricId ?? ''}
                    onChange={(e) => setFabricId(e.target.value ? Number(e.target.value) : null)}
                    className="h-10 w-full rounded-[6px] border border-border bg-white px-3 text-[13px]"
                  >
                    <option value="">{tr('orders.new.selectFabric', 'Select fabric')}</option>
                    {(fabricsData?.data ?? []).map((fabric) => (
                      <option key={fabric.id} value={fabric.id}>
                        {fabric.name} ({fabric.qty} m)
                      </option>
                    ))}
                  </select>
                </div>
                <NumberInput
                  label={tr('orders.new.fabricMeters', 'Total fabric meters')}
                  format="decimal"
                  min={0}
                  value={fabricMeters}
                  onValueChange={setFabricMeters}
                  placeholder={tr('common.metersPlaceholder', '0')}
                />
                <NumberInput
                  label={tr('orders.new.pricePerMeter', 'Price per meter')}
                  format="money"
                  min={0}
                  value={unitPrice}
                  onValueChange={setUnitPrice}
                  placeholder={tr('common.pricePlaceholder', 'e.g. 700,000')}
                />
                <div className="flex items-end">
                  <Button
                    className="w-full"
                    onClick={addToCart}
                    disabled={!fabricId || Number(fabricMeters) <= 0}
                  >
                    {tr('orders.new.addFabric', 'Add fabric to cart')}
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && orderKind === 'custom' && (
              <div className="space-y-4">
                <div className="inline-flex rounded-full bg-[#F5F5F5] p-[3px]">
                  {(products ?? []).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProductId(p.id)}
                      className={`rounded-full px-4 py-1 text-[12px] font-medium ${
                        activeProductId === p.id ? 'bg-[#1A1A2E] text-white' : 'text-text-muted'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {(productFields ?? []).map((field) => {
                    const label = getFieldLabel(field)
                    const value =
                      activeProductId && measurementValuesByProduct[activeProductId]?.[field.id]
                        ? measurementValuesByProduct[activeProductId][field.id]
                        : ''
                    return (
                      <div key={field.id}>
                        <label className="mb-1 block text-[12px] font-medium text-text-secondary">
                          {label}
                        </label>
                      <Input
                        value={value}
                        onChange={(e) =>
                          setMeasurementValuesByProduct((prev) => ({
                            ...prev,
                            [activeProductId as number]: {
                              ...(prev[activeProductId as number] ?? {}),
                              [field.id]: e.target.value,
                            },
                          }))
                        }
                        placeholder={t('orders.new.measurementValue', '{{field}} value', { field: label })}
                      />
                      </div>
                    )
                  })}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-text-secondary">{tr('orders.new.workshopNote', 'Workshop Note')}</label>
                    <textarea
                      value={workshopNotes}
                      onChange={(e) => setWorkshopNotes(e.target.value)}
                      className="min-h-[96px] w-full rounded-[10px] border border-border bg-white px-3 py-2 text-[13px] text-text-primary"
                      placeholder={tr('orders.new.workshopNotePlaceholder', 'Note for workshop')}
                    />
                  </div>
                  <div className="space-y-2 rounded-[12px] border border-border bg-[#FAFAFA] p-3">
                    <p className="text-[12px] font-medium text-text-secondary">{tr('orders.new.addToCart', 'Add to cart')}</p>
                    <NumberInput
                      label={tr('orders.new.unitPrice', 'Unit price')}
                      format="money"
                      min={0}
                      value={unitPrice}
                      onValueChange={setUnitPrice}
                      placeholder={tr('common.pricePlaceholder', 'e.g. 700,000')}
                    />
                    <div>
                      <label className="mb-1 block text-[12px] font-medium text-text-secondary">
                        {tr('orders.new.fabric', 'Fabric')}
                      </label>
                      <select
                        value={fabricId ?? ''}
                        onChange={(e) => setFabricId(e.target.value ? Number(e.target.value) : null)}
                        className="h-10 w-full rounded-[6px] border border-border bg-white px-3 text-[13px]"
                      >
                        <option value="">{tr('orders.new.selectFabric', 'Select fabric')}</option>
                        {(fabricsData?.data ?? []).map((fabric) => (
                          <option key={fabric.id} value={fabric.id}>
                            {fabric.name} ({fabric.qty} m)
                          </option>
                        ))}
                      </select>
                    </div>
                    <NumberInput
                      label={tr('orders.new.fabricMeters', 'Total fabric meters')}
                      format="decimal"
                      min={0}
                      value={fabricMeters}
                      onValueChange={setFabricMeters}
                      placeholder={tr('common.metersPlaceholder', '0')}
                    />
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center text-[13px] font-semibold text-text-primary">{qty}</span>
                      <Button variant="outline" size="sm" onClick={() => setQty((q) => q + 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      className="w-full"
                      onClick={addToCart}
                      disabled={!fabricId || Number(fabricMeters) <= 0}
                    >
                      {tr('orders.new.addProduct', 'Add {{product}}').replace(
                        '{{product}}',
                        (products ?? []).find((p) => p.id === activeProductId)?.name ?? 'Product'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-text-secondary">{tr('orders.new.payment.totalPrice', 'Total Price')}</label>
                  <Input value={money(totalPrice)} readOnly />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-text-secondary">{tr('orders.new.payment.receivedAmount', 'Received Amount')}</label>
                  <NumberInput
                    format="money"
                    min={0}
                    value={receivedAmount}
                    onValueChange={setReceivedAmount}
                    placeholder={tr('common.pricePlaceholder', 'e.g. 700,000')}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-text-secondary">{tr('orders.new.payment.remaining', 'Remaining')}</label>
                  <Input value={money(remaining)} readOnly className={remaining > 0 ? 'text-danger font-semibold' : 'text-success'} />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-text-secondary">{tr('orders.new.payment.method', 'Payment Method')}</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="h-10 w-full rounded-[6px] border border-border bg-white px-3 text-[13px]"
                  >
                    <option value="Cash">{tr('orders.new.payment.cash', 'Cash')}</option>
                    <option value="MBOK">{tr('orders.new.payment.mbok', 'MBOK')}</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[12px] font-medium text-text-secondary">{tr('orders.new.payment.dueDate', 'Due Date')}</label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="rounded-[12px] border border-border bg-[#FAFAFA] p-4">
                  <p className="text-[13px] font-semibold text-text-primary">{tr('orders.new.review.orderSummary', 'Order Summary')}</p>
                  <div className="mt-3 grid gap-2 text-[13px]">
                    <p><span className="text-text-muted">{tr('orders.new.review.customer', 'Customer')}:</span> {fullName || '—'}</p>
                    <p><span className="text-text-muted">{tr('orders.new.review.phone', 'Phone')}:</span> {phone || '—'}</p>
                    <p><span className="text-text-muted">{tr('orders.new.review.items', 'Items')}:</span> {cart.length}</p>
                    <p><span className="text-text-muted">{tr('orders.new.review.total', 'Total')}:</span> {money(totalPrice)}</p>
                    <p><span className="text-text-muted">{tr('orders.new.review.paid', 'Paid')}:</span> {money(receivedAmount)}</p>
                    <p><span className="text-text-muted">{tr('orders.new.review.remaining', 'Remaining')}:</span> {money(remaining)}</p>
                    <p><span className="text-text-muted">{tr('orders.new.review.dueDate', 'Due date')}:</span> {dueDate || '—'}</p>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => setShowConfirm(true)}
                  disabled={!customerReady || cart.length === 0}
                >
                  {tr('orders.new.review.confirmSubmit', 'Confirm & Submit Order')}
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
                {tr('common.previous', 'Previous')}
              </Button>
              <Button
                onClick={() => setStep((s) => Math.min(4, s + 1))}
                disabled={
                  step === 4 ||
                  (step === 1 && !customerReady) ||
                  (step === 2 && cart.length === 0)
                }
              >
                {tr('common.next', 'Next')} <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>{tr('orders.new.cart.title', 'Live Cart')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.length === 0 && <p className="text-[13px] text-text-muted">{tr('orders.new.cart.empty', 'No products added yet.')}</p>}
            {cart.map((item) => (
              <div key={item.id} className="space-y-2 rounded-[10px] border border-border p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-text-primary">{item.productName}</p>
                    {item.kind === 'fabric' ? (
                      <p className="text-[12px] text-text-muted">
                        {item.fabricMeters} m · {money(item.unitPrice)} / m
                      </p>
                    ) : (
                      <>
                        <p className="text-[12px] text-text-muted">{money(item.unitPrice)} {tr('orders.new.cart.each', 'each')}</p>
                        <p className="text-[12px] text-text-muted">
                          {item.fabricName} · {item.fabricMeters} m
                        </p>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="rounded-md p-1 text-text-muted hover:bg-[#F5F5F5] hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  {item.kind === 'custom' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-[13px] font-semibold">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <p className={`text-[13px] font-semibold text-text-primary ${item.kind === 'fabric' ? 'ml-auto' : ''}`}>
                    {money(item.kind === 'fabric' ? item.fabricMeters * item.unitPrice : item.qty * item.unitPrice)}
                  </p>
                </div>
              </div>
            ))}
            <div className="rounded-[10px] bg-primary-light p-3">
              <p className="text-[12px] text-text-secondary">{tr('orders.new.cart.total', 'Total')}</p>
              <p className="text-[20px] font-bold text-primary">{money(totalPrice)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {ordersModalOpen && ordersModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.35)] p-4">
          <div className="w-full max-w-lg rounded-[16px] bg-white p-5 shadow-lg">
            <h3 className="text-[18px] font-semibold text-text-primary">
              {tr('orders.new.ordersModal.title', 'Copy from past order')}
            </h3>
            <p className="mt-1 text-[13px] text-text-secondary">
              {tr('orders.new.ordersModal.subtitle', 'Select a product to fill measurements in the form.')}
            </p>
            <div className="mt-4 max-h-64 space-y-3 overflow-auto">
              {measurementsLoading && !measurementsOrders ? (
                <p className="rounded-[10px] bg-[#FAFAFA] px-4 py-3 text-[13px] text-text-muted">
                  {tr('orders.new.ordersModal.loading', 'Loading…')}
                </p>
              ) : pastOrderItems.length === 0 ? (
                <p className="rounded-[10px] bg-[#FAFAFA] px-4 py-3 text-[13px] text-text-muted">
                  {tr('orders.new.ordersModal.noOrders', 'No past custom orders.')}
                </p>
              ) : (
                pastOrderItems.map((item) => {
                  const createdDate = item.createdAt?.slice(0, 10) || ''
                  return (
                    <button
                      key={`${item.orderId}-${item.productName}-${item.createdAt}`}
                      type="button"
                      className="group w-full rounded-[12px] border border-primary bg-secondary p-3 text-left shadow-sm transition-colors hover:border-primary hover:bg-primary/50 cursor-pointer"
                      onClick={() => {
                        const matchingProduct = (products ?? []).find((p) => p.name === item.productName)
                        const targetProductId = matchingProduct?.id ?? activeProductId
                        if (!targetProductId) return
                        setProductId(targetProductId)
                        setMeasurementValuesByProduct((prev) => ({
                          ...prev,
                          [targetProductId]: item.measurements.reduce(
                            (acc, m) => ({ ...acc, [m.fieldId]: m.value }),
                            {} as Record<number, string>
                          ),
                        }))
                        if (ordersModalCustomer) {
                          setFullName(ordersModalCustomer.name)
                          setPhone(ordersModalCustomer.phone)
                        }
                        setOrdersModalOpen(false)
                        setOrdersModalCustomer(null)
                        setStep(2)
                      }}
                    >
                      <div className="flex items-center justify-between text-[12px] text-text-secondary">
                        <span className="inline-flex items-center gap-1 font-semibold text-text-primary">
                          <Ruler className="h-3.5 w-3.5 text-primary" />
                          {item.productName || tr('orders.new.ordersModal.product', 'Product')}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-text-secondary group-hover:bg-white">
                          <Clock3 className="h-3 w-3" />
                          #{item.orderId} · {createdDate}
                        </span>
                      </div>
                      <div className="mt-2 grid gap-1 text-[12px] text-text-secondary">
                        {item.measurements.map((m) => {
                          const field = m.field
                          let label = `#${m.fieldId}`
                          if (field) {
                            const entry =
                              field.i18n?.find((i) => i.lang === currentLang) ??
                              field.i18n?.find((i) => i.lang === 'en') ??
                              field.i18n?.[0]
                            label = entry?.label ?? field.fieldKey ?? label
                          }
                          return (
                            <span key={`${item.orderId}-${item.productName}-${label}`}>
                              <span className="font-medium text-text-primary">{label}:</span> {m.value || '—'}
                            </span>
                          )
                        })}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
            
              <Button
                variant="outline"
                onClick={() => {
                  setOrdersModalOpen(false)
                  setOrdersModalCustomer(null)
                }}
                className='text-[12px]'
              >
             {tr('common.close', 'Close')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.35)] p-4">
          <div className="w-full max-w-lg rounded-[16px] bg-white p-5 shadow-lg">
            <h3 className="text-[18px] font-semibold text-text-primary">{tr('orders.new.modal.title', 'Confirm Order Submission')}</h3>
            <p className="mt-1 text-[13px] text-text-secondary">{tr('orders.new.modal.subtitle', 'Please review order details before final submit.')}</p>
            <div className="mt-4 space-y-2 rounded-[10px] bg-[#FAFAFA] p-3 text-[13px]">
              <p>{tr('orders.new.review.customer', 'Customer')}: {fullName || '—'}</p>
              <p>{tr('orders.new.review.phone', 'Phone')}: {phone || '—'}</p>
              <p>{tr('orders.new.review.items', 'Items')}: {cart.length}</p>
              <p>{tr('orders.new.review.total', 'Total')}: {money(totalPrice)}</p>
              <p>{tr('orders.new.review.remaining', 'Remaining')}: {money(remaining)}</p>
            </div>
            <label className="mt-4 flex items-center gap-2 text-[12px] text-text-secondary">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              {tr('orders.new.modal.dontShowAgain', "Don't show this confirmation again")}
            </label>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>
                {tr('common.cancel', 'Cancel')}
              </Button>
              <Button
                disabled={isSubmitting}
                onClick={async () => {
                  if (!cart.length || !fullName.trim() || !phone.trim()) return
                  let customerId = selectedCustomerFromSearch?.id ?? selectedCustomer?.id
                  setShowConfirm(false)

                  if (!customerId) {
                    const created = await createCustomer({
                      name: fullName.trim(),
                      phone: phone.trim(),
                      notes: customerNotes || undefined,
                    }).unwrap()
                    customerId = created.id
                  }

                  const apiOrder =
                    orderKind === 'fabric'
                      ? await createFabricOrder({
                          customerId,
                          items: cart.map((item) => ({
                            fabricId: item.fabricId,
                            meters: item.fabricMeters,
                            unitPrice: item.unitPrice,
                          })),
                          paid: receivedAmount,
                          paymentMethod: paymentMethod === 'Cash' ? 'cash' : 'mbok',
                          dueDate: dueDate || undefined,
                          noteCustomer: customerNotes || undefined,
                        }).unwrap()
                      : await createCustomOrder({
                          customerId,
                          items: cart.map((item) => ({
                            productId: item.productId,
                            qty: item.qty,
                            unitPrice: item.unitPrice,
                            fabricId: item.fabricId,
                            fabricMeters: item.fabricMeters,
                            measurements: item.measurements.map((m) => ({
                              fieldId: m.fieldId,
                              value: m.value,
                            })),
                          })),
                          total: totalPrice,
                          paid: receivedAmount,
                          paymentMethod: paymentMethod === 'Cash' ? 'cash' : 'mbok',
                          dueDate: dueDate || undefined,
                          noteCustomer: customerNotes || undefined,
                          noteWorkshop: workshopNotes || undefined,
                        }).unwrap()

                  const submittedAt = (apiOrder.createdAt ?? new Date().toISOString()).slice(0, 10)
                  const invoiceItems = cart.map((item) => ({
                    product: item.kind === 'fabric' ? item.fabricName : item.productName,
                    qty: item.kind === 'fabric' ? item.fabricMeters : item.qty,
                    unitPrice: item.unitPrice,
                    subtotal:
                      item.kind === 'fabric'
                        ? item.fabricMeters * item.unitPrice
                        : item.qty * item.unitPrice,
                    measurements: item.measurements.map((m) => ({ label: m.label, value: m.value })),
                  }))
                  const orderPayload: InvoicePayload = {
                    orderNumber: String(apiOrder.id),
                    submittedAt,
                    customerName: (apiOrder.customer?.name ?? fullName) || '—',
                    customerPhone: (apiOrder.customer?.phone ?? phone) || '—',
                    dueDate: ((apiOrder.dueDate ?? '').slice(0, 10) || dueDate) || '—',
                    customerNote: apiOrder.noteCustomer ?? customerNotes,
                    workshopNote: apiOrder.noteWorkshop ?? workshopNotes,
                    paymentMethod,
                    total: apiOrder.total,
                    paid: apiOrder.paid,
                    remaining: Math.max(0, apiOrder.total - apiOrder.paid),
                    items: invoiceItems,
                  }
                  persistLatestInvoiceOrder(orderPayload)
                  navigate(`/invoices/${apiOrder.id}?type=customer`, {
                    state: {
                      order: orderPayload,
                      dontShowAgain,
                    },
                  })
                }}
              >
                {tr('orders.new.modal.submit', 'Submit Order')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

