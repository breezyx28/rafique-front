import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  useCreateFabricMutation,
  useCreateInventoryItemMutation,
  useDeleteFabricMutation,
  useDeleteInventoryItemMutation,
  useGetInventoryFabricsQuery,
  useGetInventoryItemsQuery,
  useGetProductsQuery,
  useUpdateFabricMutation,
  useUpdateInventoryItemMutation,
} from '@/features/api/appApi'

type InventoryTab = 'ready' | 'fabrics'

const money = (v: number) => `${v.toLocaleString()} SDG`

export function InventoryPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<InventoryTab>('ready')
  const [search, setSearch] = useState('')
  const { data: readyData } = useGetInventoryItemsQuery({ page: 1, limit: 100 })
  const { data: fabricsData } = useGetInventoryFabricsQuery({ page: 1, limit: 100 })
  const [updateInventoryItem] = useUpdateInventoryItemMutation()
  const [updateFabric] = useUpdateFabricMutation()
  const [deleteInventoryItem] = useDeleteInventoryItemMutation()
  const [deleteFabric] = useDeleteFabricMutation()
  const { data: readyProducts } = useGetProductsQuery({ type: 'ready' })
  const [createInventoryItem] = useCreateInventoryItemMutation()
  const [createFabric] = useCreateFabricMutation()
  const [isCreateReadyOpen, setIsCreateReadyOpen] = useState(false)
  const [isCreateFabricOpen, setIsCreateFabricOpen] = useState(false)
  const [createReadyProductId, setCreateReadyProductId] = useState<number | ''>('')
  const [createReadySize, setCreateReadySize] = useState('')
  const [createReadyQty, setCreateReadyQty] = useState(1)
  const [createReadyPrice, setCreateReadyPrice] = useState(0)
  const [createFabricName, setCreateFabricName] = useState('')
  const [createFabricUnit, setCreateFabricUnit] = useState('')
  const [createFabricQty, setCreateFabricQty] = useState(0)
  const [createFabricCostPerUnit, setCreateFabricCostPerUnit] = useState(0)
  const [editingReady, setEditingReady] = useState<any | null>(null)
  const [editingFabric, setEditingFabric] = useState<any | null>(null)
  const [deletingReady, setDeletingReady] = useState<any | null>(null)
  const [deletingFabric, setDeletingFabric] = useState<any | null>(null)

  const readyRows = useMemo(() => {
    const q = search.toLowerCase().trim()
    return (readyData?.data ?? []).filter((item) => {
      const name = item.product?.name ?? ''
      const size = item.size ?? ''
      return !q || name.toLowerCase().includes(q) || size.toLowerCase().includes(q)
    })
  }, [readyData?.data, search])

  const fabricRows = useMemo(() => {
    const q = search.toLowerCase().trim()
    return (fabricsData?.data ?? []).filter((item) => !q || item.name.toLowerCase().includes(q) || (item.unit ?? '').toLowerCase().includes(q))
  }, [fabricsData?.data, search])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-text-primary">
            {t('inventoryPage.title', 'Inventory')}
          </h1>
          <p className="text-[13px] text-text-secondary">
            {t(
              'inventoryPage.subtitle',
              'Manage ready products and fabric/assets with stock alerts.'
            )}
          </p>
        </div>
        <Button
          className="gap-1"
          onClick={() => (tab === 'ready' ? setIsCreateReadyOpen(true) : setIsCreateFabricOpen(true))}
        >
          <Plus className="h-4 w-4" />
          {t('inventoryPage.addItem', 'Add Item')}
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="inline-flex rounded-full bg-[#F5F5F5] p-[3px]">
            <button
              type="button"
              onClick={() => setTab('ready')}
              className={`rounded-full px-4 py-1 text-[12px] font-medium ${
                tab === 'ready' ? 'bg-[#1A1A2E] text-white' : 'text-text-muted'
              }`}
            >
              {t('inventoryPage.tabReady', 'Ready Products')}
            </button>
            <button
              type="button"
              onClick={() => setTab('fabrics')}
              className={`rounded-full px-4 py-1 text-[12px] font-medium ${
                tab === 'fabrics' ? 'bg-[#1A1A2E] text-white' : 'text-text-muted'
              }`}
            >
              {t('inventoryPage.tabFabrics', 'Fabrics / Assets')}
            </button>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('inventoryPage.searchPlaceholder', 'Search inventory')}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {tab === 'ready' && (
            <div className="overflow-hidden rounded-[12px] border border-border">
              <table className="w-full min-w-[720px]">
                <thead className="bg-[#FAFAFA]">
                  <tr className="text-left text-[12px] font-medium text-text-muted">
                    <th className="px-4 py-3">
                      {t('inventoryPage.readyName', 'Name')}
                    </th>
                    <th className="px-4 py-3">
                      {t('inventoryPage.readySize', 'Size')}
                    </th>
                    <th className="px-4 py-3">
                      {t('inventoryPage.readyQty', 'Qty')}
                    </th>
                    <th className="px-4 py-3">
                      {t('inventoryPage.readyPrice', 'Selling Price')}
                    </th>
                    <th className="px-4 py-3">
                      {t('inventoryPage.readyAlerts', 'Alerts')}
                    </th>
                    <th className="px-4 py-3">
                      {t('inventoryPage.readyActions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {readyRows.map((r) => (
                    <tr key={String(r.id)} className="border-t border-border text-[13px]">
                      <td className="px-4 py-3 font-semibold text-text-primary">{r.product?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-text-secondary">{r.size || '—'}</td>
                      <td className="px-4 py-3 text-text-primary">{r.qty}</td>
                      <td className="px-4 py-3 font-semibold text-text-primary">{money(r.price)}</td>
                      <td className="px-4 py-3">
                        {r.qty <= 6 ? (
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
                      <td className="px-4 py-3"><div className="flex items-center gap-1 text-text-secondary"><button type="button" onClick={() => setEditingReady({ ...r })} className="rounded-md p-1.5 hover:bg-[#F5F5F5]" aria-label="Edit ready item"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => setDeletingReady(r)} className="rounded-md p-1.5 hover:bg-[#F5F5F5]" aria-label="Delete ready item"><Trash2 className="h-4 w-4" /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'fabrics' && (
            <div className="overflow-hidden rounded-[12px] border border-border">
              <table className="w-full min-w-[720px]">
                <thead className="bg-[#FAFAFA]">
                  <tr className="text-left text-[12px] font-medium text-text-muted">
                    <th className="px-4 py-3">
                      {t('inventoryPage.fabricName', 'Fabric / Asset')}
                    </th>
                    <th className="px-4 py-3">
                      {t('inventoryPage.fabricUnit', 'Unit')}
                    </th>
                    <th className="px-4 py-3">
                      {t('inventoryPage.fabricQty', 'Qty')}
                    </th>
                    <th className="px-4 py-3">
                      {t('inventoryPage.fabricCostPerUnit', 'Cost / Unit')}
                    </th>
                    <th className="px-4 py-3">
                      {t('inventoryPage.fabricTotalValue', 'Total Value')}
                    </th>
                    <th className="px-4 py-3">
                      {t('inventoryPage.fabricActions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fabricRows.map((f) => (
                    <tr key={String(f.id)} className="border-t border-border text-[13px]">
                      <td className="px-4 py-3 font-semibold text-text-primary">{f.name}</td>
                      <td className="px-4 py-3 text-text-secondary">{f.unit}</td>
                      <td className="px-4 py-3 text-text-primary">{f.qty}</td>
                      <td className="px-4 py-3 font-semibold text-text-primary">{money(f.costPerUnit)}</td>
                      <td className="px-4 py-3 font-semibold text-primary">{money(f.qty * f.costPerUnit)}</td>
                      <td className="px-4 py-3"><div className="flex items-center gap-1 text-text-secondary"><button type="button" onClick={() => setEditingFabric({ ...f })} className="rounded-md p-1.5 hover:bg-[#F5F5F5]" aria-label="Edit fabric item"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => setDeletingFabric(f)} className="rounded-md p-1.5 hover:bg-[#F5F5F5]" aria-label="Delete fabric item"><Trash2 className="h-4 w-4" /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingReady && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.32)] p-4">
          <div className="w-full max-w-lg rounded-[14px] bg-white p-5 shadow-lg">
            <h3 className="text-[18px] font-semibold text-text-primary">
              {t('inventoryPage.editReadyTitle', 'Edit Ready Product')}
            </h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[12px] text-text-secondary">
                  {t('inventoryPage.editReadySize', 'Size')}
                </label>
                <Input
                  value={editingReady.size || ''}
                  onChange={(e) =>
                    setEditingReady({ ...editingReady, size: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] text-text-secondary">
                  {t('inventoryPage.editReadyQty', 'Qty')}
                </label>
                <Input
                  type="number"
                  min={0}
                  value={editingReady.qty}
                  onChange={(e) =>
                    setEditingReady({ ...editingReady, qty: Number(e.target.value) })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-[12px] text-text-secondary">
                  {t('inventoryPage.editReadyPrice', 'Selling Price')}
                </label>
                <Input
                  type="number"
                  min={0}
                  value={editingReady.price}
                  onChange={(e) =>
                    setEditingReady({ ...editingReady, price: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingReady(null)}>
                {t('inventoryPage.editReadyCancel', 'Cancel')}
              </Button>
              <Button
                onClick={async () => {
                  await updateInventoryItem({
                    id: editingReady.id,
                    body: {
                      size: editingReady.size,
                      qty: editingReady.qty,
                      price: editingReady.price,
                      productId: editingReady.product?.id,
                    },
                  })
                  setEditingReady(null)
                }}
              >
                {t('inventoryPage.editReadySave', 'Save')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {editingFabric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.32)] p-4">
          <div className="w-full max-w-lg rounded-[14px] bg-white p-5 shadow-lg">
            <h3 className="text-[18px] font-semibold text-text-primary">
              {t('inventoryPage.editFabricTitle', 'Edit Fabric / Asset')}
            </h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[12px] text-text-secondary">
                  {t('inventoryPage.editFabricName', 'Name')}
                </label>
                <Input
                  value={editingFabric.name}
                  onChange={(e) =>
                    setEditingFabric({ ...editingFabric, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] text-text-secondary">
                  {t('inventoryPage.editFabricUnit', 'Unit')}
                </label>
                <Input
                  value={editingFabric.unit}
                  onChange={(e) =>
                    setEditingFabric({ ...editingFabric, unit: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] text-text-secondary">
                  {t('inventoryPage.editFabricQty', 'Qty')}
                </label>
                <Input
                  type="number"
                  min={0}
                  value={editingFabric.qty}
                  onChange={(e) =>
                    setEditingFabric({ ...editingFabric, qty: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] text-text-secondary">
                  {t('inventoryPage.editFabricCostPerUnit', 'Cost / Unit')}
                </label>
                <Input
                  type="number"
                  min={0}
                  value={editingFabric.costPerUnit}
                  onChange={(e) =>
                    setEditingFabric({
                      ...editingFabric,
                      costPerUnit: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingFabric(null)}>
                {t('inventoryPage.editFabricCancel', 'Cancel')}
              </Button>
              <Button
                onClick={async () => {
                  await updateFabric({
                    id: editingFabric.id,
                    body: {
                      name: editingFabric.name,
                      unit: editingFabric.unit,
                      qty: editingFabric.qty,
                      costPerUnit: editingFabric.costPerUnit,
                    },
                  })
                  setEditingFabric(null)
                }}
              >
                {t('inventoryPage.editFabricSave', 'Save')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deletingReady && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.32)] p-4">
          <div className="w-full max-w-md rounded-[14px] bg-white p-5 shadow-lg">
            <h3 className="text-[18px] font-semibold text-text-primary">
              {t('inventoryPage.deleteReadyTitle', 'Delete Ready Product')}
            </h3>
            <p className="mt-1 text-[13px] text-text-secondary">
              {t(
                'inventoryPage.deleteReadyMessage',
                'Are you sure you want to delete this inventory item?'
              )}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeletingReady(null)}>
                {t('inventoryPage.deleteReadyCancel', 'Cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  await deleteInventoryItem(deletingReady.id)
                  setDeletingReady(null)
                }}
              >
                {t('inventoryPage.deleteReadyConfirm', 'Delete')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deletingFabric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.32)] p-4">
          <div className="w-full max-w-md rounded-[14px] bg-white p-5 shadow-lg">
            <h3 className="text-[18px] font-semibold text-text-primary">
              {t('inventoryPage.deleteFabricTitle', 'Delete Fabric / Asset')}
            </h3>
            <p className="mt-1 text-[13px] text-text-secondary">
              {t(
                'inventoryPage.deleteFabricMessage',
                'Are you sure you want to delete {{name}}?',
                { name: deletingFabric.name }
              )}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeletingFabric(null)}>
                {t('inventoryPage.deleteFabricCancel', 'Cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  await deleteFabric(deletingFabric.id)
                  setDeletingFabric(null)
                }}
              >
                {t('inventoryPage.deleteFabricConfirm', 'Delete')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isCreateReadyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.32)] p-4">
          <div className="w-full max-w-lg rounded-[14px] bg-white p-5 shadow-lg">
            <h3 className="text-[18px] font-semibold text-text-primary">
              {t('inventoryPage.createReadyTitle', 'Add Ready Product')}
            </h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-[12px] text-text-secondary">
                  {t('inventoryPage.createReadyProduct', 'Product')}
                </label>
                <select
                  value={createReadyProductId}
                  onChange={(e) => setCreateReadyProductId(e.target.value ? Number(e.target.value) : '')}
                  className="h-10 w-full rounded-[6px] border border-border bg-white px-3 text-[13px]"
                >
                  <option value="">—</option>
                  {(readyProducts ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[12px] text-text-secondary">
                  {t('inventoryPage.editReadySize', 'Size')}
                </label>
                <Input value={createReadySize} onChange={(e) => setCreateReadySize(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-[12px] text-text-secondary">
                  {t('inventoryPage.editReadyQty', 'Qty')}
                </label>
                <Input
                  type="number"
                  min={0}
                  value={createReadyQty}
                  onChange={(e) => setCreateReadyQty(Number(e.target.value) || 0)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-[12px] text-text-secondary">
                  {t('inventoryPage.editReadyPrice', 'Selling Price')}
                </label>
                <Input
                  type="number"
                  min={0}
                  value={createReadyPrice || ''}
                  onChange={(e) => setCreateReadyPrice(Number(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateReadyOpen(false)}>
                {t('inventoryPage.editReadyCancel', 'Cancel')}
              </Button>
              <Button
                onClick={async () => {
                  if (!createReadyProductId) return
                  await createInventoryItem({
                    body: {
                      productId: createReadyProductId,
                      size: createReadySize || undefined,
                      qty: createReadyQty,
                      price: createReadyPrice,
                    },
                  })
                  setIsCreateReadyOpen(false)
                  setCreateReadyProductId('')
                  setCreateReadySize('')
                  setCreateReadyQty(1)
                  setCreateReadyPrice(0)
                }}
                disabled={!createReadyProductId}
              >
                {t('inventoryPage.createReadySave', 'Add')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isCreateFabricOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.32)] p-4">
          <div className="w-full max-w-lg rounded-[14px] bg-white p-5 shadow-lg">
            <h3 className="text-[18px] font-semibold text-text-primary">
              {t('inventoryPage.createFabricTitle', 'Add Fabric / Asset')}
            </h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-[12px] text-text-secondary">
                  {t('inventoryPage.editFabricName', 'Name')}
                </label>
                <Input value={createFabricName} onChange={(e) => setCreateFabricName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-[12px] text-text-secondary">
                  {t('inventoryPage.editFabricUnit', 'Unit')}
                </label>
                <Input value={createFabricUnit} onChange={(e) => setCreateFabricUnit(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-[12px] text-text-secondary">
                  {t('inventoryPage.editFabricQty', 'Qty')}
                </label>
                <Input
                  type="number"
                  min={0}
                  value={createFabricQty}
                  onChange={(e) => setCreateFabricQty(Number(e.target.value) || 0)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-[12px] text-text-secondary">
                  {t('inventoryPage.editFabricCostPerUnit', 'Cost / Unit')}
                </label>
                <Input
                  type="number"
                  min={0}
                  value={createFabricCostPerUnit || ''}
                  onChange={(e) => setCreateFabricCostPerUnit(Number(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateFabricOpen(false)}>
                {t('inventoryPage.editFabricCancel', 'Cancel')}
              </Button>
              <Button
                onClick={async () => {
                  if (!createFabricName.trim()) return
                  await createFabric({
                    body: {
                      name: createFabricName.trim(),
                      unit: createFabricUnit || undefined,
                      qty: createFabricQty,
                      costPerUnit: createFabricCostPerUnit,
                    },
                  })
                  setIsCreateFabricOpen(false)
                  setCreateFabricName('')
                  setCreateFabricUnit('')
                  setCreateFabricQty(0)
                  setCreateFabricCostPerUnit(0)
                }}
                disabled={!createFabricName.trim()}
              >
                {t('inventoryPage.createFabricSave', 'Add')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

