import { describe, expect, test } from 'bun:test'
import {
  fillOnProductClick,
  labelSet,
  replaceFromPickedProduct,
  type PastProductMeasurements,
} from './sharedMeasurements'

const shoulder = {
  id: 1,
  fieldKey: 'shoulder',
  inputType: 'number',
  i18n: [
    { lang: 'en', label: 'Shoulder' },
    { lang: 'ar', label: 'كتف' },
    { lang: 'bn', label: 'কাঁধ' },
  ],
}
const note = {
  id: 2,
  fieldKey: 'note',
  inputType: 'text',
  i18n: [{ lang: 'en', label: 'Note' }],
}
const length = {
  id: 3,
  fieldKey: 'length',
  inputType: 'number',
  i18n: [{ lang: 'en', label: 'Length' }],
}

function past(
  productId: number,
  productName: string,
  createdAt: string,
  measurements: PastProductMeasurements['measurements'],
): PastProductMeasurements {
  return { productId, productName, createdAt, measurements }
}

function measure(
  fieldId: number,
  value: string,
  inputType: string,
  labels: string[],
) {
  return { fieldId, value, inputType, labels: new Set(labels) }
}

describe('shared measurements', () => {
  test('matches labels after trim, in any language or by field key', () => {
    const labels = labelSet(shoulder)
    expect(labels.has('shoulder')).toBe(true)
    expect(labels.has('كتف')).toBe(true)
    expect(labels.has('কাঁধ')).toBe(true)
  })

  test('an ordered product uses only its newest measurements by field id', () => {
    const filled = fillOnProductClick({
      productId: 10,
      productName: 'Jellabeya',
      fields: [shoulder, note],
      current: { 1: 'typed', 2: 'keep me' },
      history: [
        past(10, 'Jellabeya', '2026-01-01', [
          measure(1, '40', 'number', ['shoulder']),
          measure(2, 'old', 'text', ['note']),
        ]),
        past(10, 'Jellabeya', '2026-06-01', [
          measure(1, '44', 'number', ['shoulder']),
        ]),
        past(20, 'Serwal', '2026-08-01', [
          measure(99, '99', 'number', ['shoulder', 'كتف']),
        ]),
      ],
    })
    expect(filled.orderedBefore).toBe(true)
    expect(filled.source).toBeNull()
    expect(filled.values).toEqual({ 1: '44', 2: '' })
  })

  test('a new product fills only empty matching labels, newest value wins, and names the source', () => {
    const filled = fillOnProductClick({
      productId: 30,
      productName: 'Allalah',
      fields: [shoulder, note, length],
      current: { 2: 'already typed' },
      history: [
        past(10, 'Jellabeya', '2026-01-01', [
          measure(11, '40', 'number', ['shoulder']),
          measure(12, 'old note', 'text', ['note']),
        ]),
        past(20, 'Serwal', '2026-05-01', [
          measure(21, '46', 'number', ['  كتف  ']),
          measure(22, 'newer note', 'text', ['Note']),
          measure(23, 'text-length', 'text', ['length']),
        ]),
      ],
    })
    expect(filled.orderedBefore).toBe(false)
    expect(filled.values[1]).toBe('46')
    expect(filled.values[2]).toBe('already typed')
    expect(filled.values[3]).toBeUndefined()
    expect(filled.source).toBe('Serwal')
  })

  test('picking a past product replaces matching labels and leaves the rest', () => {
    const picked = past(10, 'Jellabeya', '2026-05-01', [
      measure(11, '42', 'number', ['shoulder']),
    ])
    const replaced = replaceFromPickedProduct({
      orderedBefore: false,
      fields: [shoulder, note],
      current: { 1: '10', 2: 'handwritten' },
      picked,
    })
    expect(replaced.values).toEqual({ 1: '42', 2: 'handwritten' })
    expect(replaced.source).toBe('Jellabeya')
  })

  test('picking measurements does not overwrite a product the customer already ordered', () => {
    const replaced = replaceFromPickedProduct({
      orderedBefore: true,
      fields: [shoulder],
      current: { 1: 'own' },
      picked: past(20, 'Serwal', '2026-05-01', [
        measure(21, '99', 'number', ['shoulder']),
      ]),
    })
    expect(replaced.values).toEqual({ 1: 'own' })
    expect(replaced.source).toBeNull()
  })
})
