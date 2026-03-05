import { useMemo, useState } from 'react'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import {
  useCreateProductFieldMutation,
  useCreateProductMutation,
  useDeleteProductFieldMutation,
  useGetProductFieldsQuery,
  useGetProductsQuery,
  useUpdateProductFieldMutation,
} from '@/features/api/appApi'

interface FieldConfig {
  id: number
  en: string
  ar: string
  bn: string
  inputType: 'text' | 'number' | 'select'
  required: boolean
}

export function ProductConfigPage() {
  const { data: products } = useGetProductsQuery({ type: 'custom' })
  const [activeProductId, setActiveProductId] = useState<number | null>(null)
  const selectedProductId = activeProductId ?? products?.[0]?.id ?? null
  const { data: rawFields } = useGetProductFieldsQuery(selectedProductId ?? 0, { skip: !selectedProductId })
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [isCreatingProduct, setIsCreatingProduct] = useState(false)
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false)
  const [newFieldEn, setNewFieldEn] = useState('')
  const [newFieldAr, setNewFieldAr] = useState('')
  const [newFieldBn, setNewFieldBn] = useState('')
  const [newFieldInputType, setNewFieldInputType] = useState<'text' | 'number' | 'select'>('text')
  const [newFieldRequired, setNewFieldRequired] = useState(false)
  const [isCreatingField, setIsCreatingField] = useState(false)
  const [createProduct] = useCreateProductMutation()
  const [createField] = useCreateProductFieldMutation()
  const [updateFieldMutation] = useUpdateProductFieldMutation()
  const [deleteFieldMutation] = useDeleteProductFieldMutation()

  const fields: FieldConfig[] = useMemo(
    () =>
      (rawFields ?? []).map((f) => ({
        id: f.id,
        en: f.i18n.find((i) => i.lang === 'en')?.label ?? f.fieldKey,
        ar: f.i18n.find((i) => i.lang === 'ar')?.label ?? '',
        bn: f.i18n.find((i) => i.lang === 'bn')?.label ?? '',
        inputType: (f.inputType as FieldConfig['inputType']) ?? 'text',
        required: f.required ?? false,
      })),
    [rawFields]
  )

  const totalRequired = useMemo(() => fields.filter((f) => f.required).length, [fields])

  const updateField = async (id: number, patch: Partial<FieldConfig>) => {
    if (!selectedProductId) return
    const current = fields.find((f) => f.id === id)
    if (!current) return
    const merged = { ...current, ...patch }
    await updateFieldMutation({
      fieldId: id,
      productId: selectedProductId,
      body: {
        fieldKey: merged.en.trim().toLowerCase().replace(/\s+/g, '_'),
        inputType: merged.inputType,
        required: merged.required,
        labels: [
            { language: 'en', label: merged.en || 'Field' },
            { language: 'ar', label: merged.ar || merged.en || 'Field' },
            { language: 'bn', label: merged.bn || merged.en || 'Field' },
        ],
      },
    })
  }

  const removeField = async (id: number) => {
    if (!selectedProductId) return
    await deleteFieldMutation({ fieldId: id, productId: selectedProductId })
  }

  const openAddFieldDialog = () => {
    setNewFieldEn('')
    setNewFieldAr('')
    setNewFieldBn('')
    setNewFieldInputType('text')
    setNewFieldRequired(false)
    setIsAddFieldOpen(true)
  }

  const handleAddFieldSubmit = async () => {
    if (!selectedProductId) return
    const enLabel = newFieldEn.trim()
    if (!enLabel) return
    const fieldKey = enLabel
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '') || `field_${Date.now()}`
    setIsCreatingField(true)
    try {
      await createField({
        productId: selectedProductId,
        body: {
          fieldKey,
          inputType: newFieldInputType,
          required: newFieldRequired,
          labels: [
            { language: 'en', label: enLabel },
            { language: 'ar', label: newFieldAr.trim() || enLabel },
            { language: 'bn', label: newFieldBn.trim() || enLabel },
          ],
        },
      }).unwrap()
      setIsAddFieldOpen(false)
    } finally {
      setIsCreatingField(false)
    }
  }

  const handleCreateProduct = async () => {
    const trimmed = newProductName.trim()
    if (!trimmed) return
    setIsCreatingProduct(true)
    try {
      const created = await createProduct({ name: trimmed, type: 'custom' }).unwrap()
      setActiveProductId(created.id)
      setIsAddProductOpen(false)
    } finally {
      setIsCreatingProduct(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-bold text-text-primary">Products & Measurements</h1>
        <p className="text-[13px] text-text-secondary">Configure product types and dynamic multilingual measurement fields.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(products ?? []).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setActiveProductId(p.id)
                }}
                className={`w-full rounded-[10px] px-3 py-2 text-left text-[13px] font-medium ${
                  selectedProductId === p.id ? 'bg-primary-light text-primary' : 'hover:bg-[#F5F5F5] text-text-secondary'
                }`}
              >
                {p.name}
              </button>
            ))}
            <Button
              variant="outline"
              className="mt-2 w-full gap-1"
              onClick={() => {
                setNewProductName('')
                setIsAddProductOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{(products ?? []).find((p) => p.id === selectedProductId)?.name ?? 'Product'} Fields</CardTitle>
            <div className="text-[12px] text-text-muted">
              {fields.length} fields · {totalRequired} required
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field) => (
              <div key={field.id} className="rounded-[12px] border border-border bg-[#FAFAFA] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 text-[12px] text-text-muted">
                    <GripVertical className="h-4 w-4" />
                    Drag to reorder
                  </div>
                  <button type="button" onClick={() => removeField(field.id)} className="rounded-md p-1 hover:bg-white">
                    <Trash2 className="h-4 w-4 text-text-muted hover:text-danger" />
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-text-secondary">Label (EN)</label>
                    <Input value={field.en} onChange={(e) => updateField(field.id, { en: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-text-secondary">Label (AR)</label>
                    <Input value={field.ar} onChange={(e) => updateField(field.id, { ar: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-text-secondary">Label (BN)</label>
                    <Input value={field.bn} onChange={(e) => updateField(field.id, { bn: e.target.value })} />
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-text-secondary">Input Type</label>
                    <select
                      value={field.inputType}
                      onChange={(e) => void updateField(field.id, { inputType: e.target.value as FieldConfig['inputType'] })}
                      className="h-10 w-full rounded-[6px] border border-border bg-white px-3 text-[13px]"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="select">Select</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="inline-flex items-center gap-2 text-[13px] text-text-primary">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => void updateField(field.id, { required: e.target.checked })}
                        className="h-4 w-4 rounded border-border"
                      />
                      Required field
                    </label>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button variant="outline" className="gap-1" onClick={openAddFieldDialog}>
                <Plus className="h-4 w-4" />
                Add Field
              </Button>
              <Button disabled>Auto-saved to API</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-[13px] font-medium text-text-primary">Product name</label>
          <Input
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            autoFocus
            placeholder="Enter product name"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsAddProductOpen(false)
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateProduct}
            disabled={!newProductName.trim() || isCreatingProduct}
          >
            Create
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={isAddFieldOpen} onOpenChange={setIsAddFieldOpen}>
        <DialogHeader>
          <DialogTitle>Add measurement field</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-text-secondary">Label (EN) *</label>
            <Input
              value={newFieldEn}
              onChange={(e) => setNewFieldEn(e.target.value)}
              placeholder="e.g. Chest"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-text-secondary">Label (AR)</label>
            <Input
              value={newFieldAr}
              onChange={(e) => setNewFieldAr(e.target.value)}
              placeholder="e.g. الصدر"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-text-secondary">Label (BN)</label>
            <Input
              value={newFieldBn}
              onChange={(e) => setNewFieldBn(e.target.value)}
              placeholder="e.g. বুক"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-text-secondary">Input type</label>
            <select
              value={newFieldInputType}
              onChange={(e) => setNewFieldInputType(e.target.value as 'text' | 'number' | 'select')}
              className="h-10 w-full rounded-[6px] border border-border bg-white px-3 text-[13px]"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="select">Select</option>
            </select>
          </div>
          <label className="inline-flex items-center gap-2 text-[13px] text-text-primary">
            <input
              type="checkbox"
              checked={newFieldRequired}
              onChange={(e) => setNewFieldRequired(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Required field
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsAddFieldOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddFieldSubmit}
            disabled={!newFieldEn.trim() || isCreatingField}
          >
            Create field
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}

