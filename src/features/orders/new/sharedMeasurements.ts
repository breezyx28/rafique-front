export type MeasurementField = {
  id: number
  fieldKey?: string
  inputType?: string
  i18n?: Array<{ lang?: string; label: string }>
}

export type PastMeasurement = {
  fieldId: number
  value: string
  inputType: string
  labels: Set<string>
}

export type PastProductMeasurements = {
  createdAt: string
  productId: number | null
  productName: string
  measurements: PastMeasurement[]
}

export function labelSet(field: {
  fieldKey?: string
  i18n?: Array<{ label: string }>
}) {
  const labels = new Set<string>()
  const add = (value?: string | null) => {
    const text = (value ?? '').trim().toLowerCase()
    if (text) labels.add(text)
  }
  add(field.fieldKey)
  for (const entry of field.i18n ?? []) add(entry.label)
  return labels
}

function sameInputType(left?: string, right?: string) {
  return (left || 'text') === (right || 'text')
}

function matchesProduct(
  item: PastProductMeasurements,
  productId: number,
  productName: string,
) {
  if (item.productId) return item.productId === productId
  return item.productName.trim().toLowerCase() === productName.trim().toLowerCase()
}

function newestFirst(items: PastProductMeasurements[]) {
  return [...items].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

function matchingValue(field: MeasurementField, item: PastProductMeasurements) {
  const wanted = labelSet(field)
  return item.measurements.find(
    (measurement) =>
      measurement.value.trim() &&
      sameInputType(measurement.inputType, field.inputType) &&
      [...measurement.labels].some((label) => wanted.has(label.trim().toLowerCase())),
  )
}

export function fillOnProductClick(input: {
  productId: number
  productName: string
  fields: MeasurementField[]
  history: PastProductMeasurements[]
  current: Record<number, string>
}) {
  const ownItems = newestFirst(
    input.history.filter((item) => matchesProduct(item, input.productId, input.productName)),
  )
  if (ownItems.length > 0) {
    const byField = new Map(
      ownItems[0].measurements.map((measurement) => [measurement.fieldId, measurement.value]),
    )
    return {
      orderedBefore: true,
      source: null as string | null,
      values: Object.fromEntries(
        input.fields.map((field) => [field.id, byField.get(field.id) ?? '']),
      ) as Record<number, string>,
    }
  }

  const others = newestFirst(input.history)
  const current = { ...input.current }
  const sources = new Set<string>()
  for (const field of input.fields) {
    if ((current[field.id] ?? '').trim()) continue
    for (const item of others) {
      const match = matchingValue(field, item)
      if (!match) continue
      current[field.id] = match.value
      if (item.productName) sources.add(item.productName)
      break
    }
  }
  return {
    orderedBefore: false,
    source: sources.size ? [...sources].join(', ') : null,
    values: current,
  }
}

export function replaceFromPickedProduct(input: {
  orderedBefore: boolean
  fields: MeasurementField[]
  current: Record<number, string>
  picked: PastProductMeasurements
}) {
  if (input.orderedBefore) {
    return { values: input.current, source: null as string | null }
  }
  const values = { ...input.current }
  let replaced = false
  for (const field of input.fields) {
    const match = matchingValue(field, input.picked)
    if (!match) continue
    values[field.id] = match.value
    replaced = true
  }
  return {
    values,
    source: replaced ? input.picked.productName : null,
  }
}
