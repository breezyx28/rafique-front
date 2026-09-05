import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Pencil, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { NumberInput } from '@/components/ui/NumberInput'
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import {
  FilterToolbar,
  PaginationBar,
  SearchField,
  ToolbarField,
  toolbarSelectClass,
} from '@/components/ui/DataToolbar'
import {
  useCreateInventoryItemMutation,
  useCreateProductMutation,
  useDeleteInventoryItemMutation,
  useGetInventoryFabricsQuery,
  useGetInventoryItemsQuery,
  useGetProductsQuery,
  useUpdateInventoryItemMutation,
} from '@/features/api/appApi'

import { formatMoney as money } from '@/lib/localeFormat'

const PAGE_SIZE = 10

type ReadyForm = {
  productId: number | ''
  productName: string
  size: string
  fabricId: number | ''
  qty: number
  price: number
  color: string
  note: string
}

type ReadyRow = {
  id: number
  name: string
  productId?: number
  size: string
  qty: number
  price: number
  color: string
  note: string
  fabricId: number | null
  fabricName: string
}

const emptyForm = (): ReadyForm => ({
  productId: '',
  productName: '',
  size: '',
  fabricId: '',
  qty: 1,
  price: 0,
  color: '',
  note: '',
})

export function ReadyProductsPage() {
  const { t } = useTranslation()
  const { data: readyData, isLoading } = useGetInventoryItemsQuery({ page: 1, limit: 100 })
  const { data: readyProducts } = useGetProductsQuery({ type: 'ready' })
  const { data: fabricsData } = useGetInventoryFabricsQuery({ page: 1, limit: 100 })
  const [createInventoryItem, { isLoading: isCreating }] = useCreateInventoryItemMutation()
  const [updateInventoryItem, { isLoading: isUpdating }] = useUpdateInventoryItemMutation()
  const [deleteInventoryItem, { isLoading: isDeleting }] = useDeleteInventoryItemMutation()
  const [createProduct] = useCreateProductMutation()

  const [search, setSearch] = useState('')
  const [sizeFilter, setSizeFilter] = useState('all')
  const [fabricFilter, setFabricFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low' | 'out'>('all')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ReadyForm>(emptyForm)
  const [deleting, setDeleting] = useState<ReadyRow | null>(null)

  const rows = useMemo(
    () =>
      (readyData?.data ?? []).map((item) => ({
        id: item.id,
        name: item.product?.name ?? t('readyProductsPage.unnamed', 'Ready product'),
        productId: item.product?.id,
        size: item.size ?? '',
        qty: Number(item.qty) || 0,
        price: Number(item.price) || 0,
        color: item.color ?? '',
        note: item.note ?? '',
        fabricId: item.fabric?.id ?? item.fabricId ?? null,
        fabricName: item.fabric?.name ?? '',
      })),
    [readyData?.data, t],
  )

  const sizeOptions = useMemo(
    () => [...new Set(rows.map((row) => row.size).filter(Boolean))].sort(),
    [rows],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesSearch =
        !q ||
        row.name.toLowerCase().includes(q) ||
        row.size.toLowerCase().includes(q) ||
        row.color.toLowerCase().includes(q) ||
        row.fabricName.toLowerCase().includes(q) ||
        row.note.toLowerCase().includes(q)
      const matchesSize = sizeFilter === 'all' || row.size === sizeFilter
      const matchesFabric =
        fabricFilter === 'all' ||
        (fabricFilter === 'none' ? !row.fabricId : String(row.fabricId) === fabricFilter)
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'out' && row.qty <= 0) ||
        (stockFilter === 'low' && row.qty > 0 && row.qty <= 6) ||
        (stockFilter === 'in_stock' && row.qty > 6)
      return matchesSearch && matchesSize && matchesFabric && matchesStock
    })
  }, [fabricFilter, rows, search, sizeFilter, stockFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetPage = () => setPage(1)

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setFormOpen(true)
  }

  const openEdit = (row: ReadyRow) => {
    setEditingId(row.id)
    setForm({
      productId: row.productId ?? '',
      productName: row.name,
      size: row.size,
      fabricId: row.fabricId ?? '',
      qty: row.qty,
      price: row.price,
      color: row.color,
      note: row.note,
    })
    setFormOpen(true)
  }

  const saveForm = async () => {
    let productId = form.productId
    if (!productId && form.productName.trim()) {
      const existing = (readyProducts ?? []).find(
        (product) => product.name.trim().toLowerCase() === form.productName.trim().toLowerCase(),
      )
      if (existing) {
        productId = existing.id
      } else {
        const product = await createProduct({
          name: form.productName.trim(),
          type: 'ready',
          basePrice: form.price,
        }).unwrap()
        productId = product.id
      }
    }
    if (!productId) return

    const body = {
      productId,
      size: form.size.trim() || undefined,
      qty: form.qty,
      price: form.price,
      color: form.color.trim() || undefined,
      note: form.note.trim() || undefined,
      fabricId: form.fabricId === '' ? undefined : Number(form.fabricId),
    }

    if (editingId) {
      await updateInventoryItem({
        id: editingId,
        body: { ...body, fabricId: form.fabricId === '' ? null : Number(form.fabricId) },
      }).unwrap()
    } else {
      await createInventoryItem({ body }).unwrap()
    }

    setFormOpen(false)
    setEditingId(null)
    setForm(emptyForm())
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-text-primary">
            {t('readyProductsPage.title', 'Ready Products')}
          </h1>
          <p className="text-[13px] text-text-secondary">
            {t(
              'readyProductsPage.subtitle',
              'Stock finished garments with size, fabric, color, and selling price.',
            )}
          </p>
        </div>
        <Button className="gap-1" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('readyProductsPage.add', 'Add ready product')}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{t('readyProductsPage.listTitle', 'All ready products')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterToolbar>
            <SearchField
              label={t('common.search', 'Search')}
              value={search}
              onChange={(value) => {
                setSearch(value)
                resetPage()
              }}
              placeholder={t(
                'readyProductsPage.searchPlaceholder',
                'Name, size, fabric, color, note',
              )}
            />
            <ToolbarField label={t('readyProductsPage.size', 'Size')}>
              <select
                value={sizeFilter}
                onChange={(e) => {
                  setSizeFilter(e.target.value)
                  resetPage()
                }}
                className={toolbarSelectClass}
              >
                <option value="all">{t('readyProductsPage.allSizes', 'All sizes')}</option>
                {sizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </ToolbarField>
            <ToolbarField label={t('readyProductsPage.fabric', 'Fabric')}>
              <select
                value={fabricFilter}
                onChange={(e) => {
                  setFabricFilter(e.target.value)
                  resetPage()
                }}
                className={toolbarSelectClass}
              >
                <option value="all">{t('readyProductsPage.allFabrics', 'All fabrics')}</option>
                <option value="none">{t('readyProductsPage.noFabric', 'No fabric')}</option>
                {(fabricsData?.data ?? []).map((fabric) => (
                  <option key={fabric.id} value={String(fabric.id)}>
                    {fabric.name}
                  </option>
                ))}
              </select>
            </ToolbarField>
            <ToolbarField label={t('readyProductsPage.stock', 'Stock')}>
              <select
                value={stockFilter}
                onChange={(e) => {
                  setStockFilter(e.target.value as typeof stockFilter)
                  resetPage()
                }}
                className={toolbarSelectClass}
              >
                <option value="all">{t('readyProductsPage.allStock', 'All stock')}</option>
                <option value="in_stock">{t('inventoryPage.readyInStock', 'In stock')}</option>
                <option value="low">{t('inventoryPage.readyLowStock', 'Low stock')}</option>
                <option value="out">{t('readyProductsPage.outOfStock', 'Out of stock')}</option>
              </select>
            </ToolbarField>
          </FilterToolbar>

          <div className="overflow-hidden rounded-[12px] border border-border">
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full">
                <thead className="bg-[#FAFAFA]">
                  <tr className="text-start text-[12px] font-medium text-text-muted">
                    <th className="px-4 py-3">{t('readyProductsPage.name', 'Product name')}</th>
                    <th className="px-4 py-3">{t('readyProductsPage.size', 'Size')}</th>
                    <th className="px-4 py-3">{t('readyProductsPage.fabric', 'Fabric')}</th>
                    <th className="px-4 py-3">{t('readyProductsPage.color', 'Color')}</th>
                    <th className="px-4 py-3">{t('readyProductsPage.qty', 'Qty')}</th>
                    <th className="px-4 py-3">{t('readyProductsPage.price', 'Price')}</th>
                    <th className="px-4 py-3">{t('readyProductsPage.note', 'Note')}</th>
                    <th className="px-4 py-3">{t('inventoryPage.readyAlerts', 'Alerts')}</th>
                    <th className="px-4 py-3">{t('inventoryPage.readyActions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-[13px] text-text-muted">
                        {t('common.loading', 'Loading...')}
                      </td>
                    </tr>
                  )}
                  {!isLoading &&
                    pageRows.map((row) => (
                      <tr key={row.id} className="border-t border-border text-[13px]">
                        <td className="px-4 py-3 font-semibold text-text-primary">{row.name}</td>
                        <td className="px-4 py-3 text-text-secondary">{row.size || '—'}</td>
                        <td className="px-4 py-3 text-text-secondary">{row.fabricName || '—'}</td>
                        <td className="px-4 py-3 text-text-secondary">{row.color || '—'}</td>
                        <td className="px-4 py-3 tabular-nums">{row.qty}</td>
                        <td className="px-4 py-3 font-semibold">{money(row.price)}</td>
                        <td className="max-w-[180px] truncate px-4 py-3 text-text-secondary">
                          {row.note || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {row.qty <= 0 ? (
                            <span className="rounded-full bg-dangerBg px-2.5 py-0.5 text-[11px] font-semibold text-danger">
                              {t('readyProductsPage.outOfStock', 'Out of stock')}
                            </span>
                          ) : row.qty <= 6 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-dangerBg px-2.5 py-0.5 text-[11px] font-semibold text-danger">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {t('inventoryPage.readyLowStock', 'Low stock')}
                            </span>
                          ) : (
                            <span className="rounded-full bg-successBg px-2.5 py-0.5 text-[11px] font-semibold text-success">
                              {t('inventoryPage.readyInStock', 'In stock')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-text-secondary">
                            <button
                              type="button"
                              onClick={() => openEdit(row)}
                              className="cursor-pointer rounded-md p-1.5 transition-colors hover:bg-[#F5F5F5] hover:text-primary"
                              aria-label={t('readyProductsPage.edit', 'Edit')}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleting(row)}
                              className="cursor-pointer rounded-md p-1.5 transition-colors hover:bg-[#F5F5F5] hover:text-danger"
                              aria-label={t('readyProductsPage.delete', 'Delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {!isLoading && pageRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-[13px] text-text-muted">
                        {t('readyProductsPage.empty', 'No ready products match these filters.')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={filtered.length}
            onPageChange={setPage}
            label={t('readyProductsPage.rowsLabel', 'products')}
          />
        </CardContent>
      </Card>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingId(null)
        }}
        className="max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>
            {editingId
              ? t('readyProductsPage.editTitle', 'Edit ready product')
              : t('readyProductsPage.createTitle', 'Add ready product')}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-[12px] font-medium text-text-secondary">
              {t('readyProductsPage.existingProduct', 'Existing product')}
            </label>
            <select
              value={form.productId}
              onChange={(e) => {
                const productId = e.target.value ? Number(e.target.value) : ''
                const selected = (readyProducts ?? []).find((product) => product.id === productId)
                setForm({
                  ...form,
                  productId,
                  productName: selected?.name ?? form.productName,
                })
              }}
              className={toolbarSelectClass}
            >
              <option value="">{t('inventoryPage.selectProduct', 'Select a product')}</option>
              {(readyProducts ?? []).map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Input
              label={t('readyProductsPage.name', 'Product name')}
              value={form.productName}
              onChange={(e) => {
                setForm({
                  ...form,
                  productName: e.target.value,
                  productId: e.target.value.trim() ? '' : form.productId,
                })
              }}
              placeholder={t('readyProductsPage.namePlaceholder', 'e.g. Jelabeya ready')}
            />
          </div>
          <Input
            label={t('readyProductsPage.size', 'Size')}
            value={form.size}
            onChange={(e) => setForm({ ...form, size: e.target.value })}
            placeholder={t('inventoryPage.sizePlaceholder', 'e.g. L / 54')}
          />
          <ToolbarField label={t('readyProductsPage.fabric', 'Fabric')}>
            <select
              value={form.fabricId}
              onChange={(e) =>
                setForm({ ...form, fabricId: e.target.value ? Number(e.target.value) : '' })
              }
              className={toolbarSelectClass}
            >
              <option value="">{t('readyProductsPage.selectFabric', 'Select fabric')}</option>
              {(fabricsData?.data ?? []).map((fabric) => (
                <option key={fabric.id} value={fabric.id}>
                  {fabric.name}
                </option>
              ))}
            </select>
          </ToolbarField>
          <Input
            label={t('readyProductsPage.color', 'Color')}
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            placeholder={t('readyProductsPage.colorPlaceholder', 'e.g. White / Navy')}
          />
          <NumberInput
            label={t('readyProductsPage.qty', 'Qty')}
            format="integer"
            min={0}
            value={form.qty}
            onValueChange={(qty) => setForm({ ...form, qty })}
            placeholder={t('common.qtyPlaceholder', '0')}
          />
          <div className="md:col-span-2">
            <NumberInput
              label={t('readyProductsPage.price', 'Price')}
              format="money"
              min={0}
              value={form.price}
              onValueChange={(price) => setForm({ ...form, price })}
              placeholder={t('common.pricePlaceholder', 'e.g. 700,000')}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-[12px] font-medium text-text-secondary">
              {t('readyProductsPage.note', 'Note')}
            </label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="min-h-[84px] w-full rounded-[6px] border border-border bg-white px-3 py-2 text-[13px]"
              placeholder={t('readyProductsPage.notePlaceholder', 'Optional note')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setFormOpen(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={() => void saveForm()}
            disabled={(!form.productId && !form.productName.trim()) || isCreating || isUpdating}
          >
            {editingId ? t('common.save', 'Save') : t('readyProductsPage.add', 'Add ready product')}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogHeader>
          <DialogTitle>{t('inventoryPage.deleteReadyTitle', 'Delete Ready Product')}</DialogTitle>
        </DialogHeader>
        <p className="text-[13px] text-text-secondary">
          {t(
            'inventoryPage.deleteReadyMessage',
            'Are you sure you want to delete this inventory item?',
          )}
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleting(null)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="danger"
            disabled={isDeleting}
            onClick={async () => {
              if (!deleting) return
              await deleteInventoryItem(deleting.id)
              setDeleting(null)
            }}
          >
            {t('inventoryPage.deleteReadyConfirm', 'Delete')}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
