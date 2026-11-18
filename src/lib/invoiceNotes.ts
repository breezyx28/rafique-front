export type InvoiceNotesByLang = {
  en: string
  ar: string
  bn: string
}

export const DEFAULT_INVOICE_NOTES: InvoiceNotesByLang = {
  en: 'The shop is not responsible after 15 days from the receipt date.\nThe paid deposit is non-refundable.',
  ar: 'المحل غير مسؤول بعد مرور 15 يوم من تاريخ الاستلام.\nالعربون المدفوع لا يرتجع.',
  bn: 'রসিদ তারিখ থেকে ১৫ দিন পর দোকান দায়ী নয়।\nপ্রদত্ত অগ্রিম ফেরতযোগ্য নয়।',
}

export function parseInvoiceNotes(value: unknown): InvoiceNotesByLang {
  if (!value || typeof value !== 'object') return { ...DEFAULT_INVOICE_NOTES }
  const record = value as Record<string, unknown>
  return {
    en: typeof record.en === 'string' && record.en.trim() ? record.en : DEFAULT_INVOICE_NOTES.en,
    ar: typeof record.ar === 'string' && record.ar.trim() ? record.ar : DEFAULT_INVOICE_NOTES.ar,
    bn: typeof record.bn === 'string' && record.bn.trim() ? record.bn : DEFAULT_INVOICE_NOTES.bn,
  }
}

export function resolveInvoiceNotes(
  notes: InvoiceNotesByLang | unknown,
  language?: string | null
): string {
  const parsed = parseInvoiceNotes(notes)
  const lang = (language || 'en').split('-')[0]
  if (lang === 'ar') return parsed.ar
  if (lang === 'bn') return parsed.bn
  return parsed.en
}

export function formatInvoiceNotesHtml(notes: string): string {
  return notes
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p class="terms-line">${line}</p>`)
    .join('')
}
