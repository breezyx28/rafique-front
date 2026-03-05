import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  useCreateExpenseMutation,
  useCreateExpenseTypeMutation,
  useGetExpenseTypesQuery,
  useGetExpensesQuery,
  useGetExpensesSummaryQuery,
} from '@/features/api/appApi'

const money = (v: number) => `${v.toLocaleString()} SDG`

export function ExpensesPage() {
  const { t } = useTranslation()
  const [type, setType] = useState('')
  const [customType, setCustomType] = useState('')
  const [amount, setAmount] = useState<number>(0)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { data: types } = useGetExpenseTypesQuery()
  const { data: expensesData } = useGetExpensesQuery({ page: 1, limit: 100, from: fromDate || undefined, to: toDate || undefined, type: type && type !== 'custom' ? Number(type) : undefined })
  const { data: todaySummary } = useGetExpensesSummaryQuery({ period: 'today' })
  const { data: monthSummary } = useGetExpensesSummaryQuery({ period: 'month' })
  const { data: yearSummary } = useGetExpensesSummaryQuery({ period: 'year' })
  const [createExpense] = useCreateExpenseMutation()
  const [createExpenseType] = useCreateExpenseTypeMutation()

  const rows = useMemo(() => {
    const q = search.toLowerCase().trim()
    return (expensesData?.data ?? []).filter((e) => {
      const typeName = e.type?.name ?? ''
      return !q || typeName.toLowerCase().includes(q) || (e.note ?? '').toLowerCase().includes(q)
    })
  }, [expensesData?.data, search])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-bold text-text-primary">
          {t('expensesPage.title', 'Expenses')}
        </h1>
        <p className="text-[13px] text-text-secondary">
          {t(
            'expensesPage.subtitle',
            'Track daily expenses with quick-add and timeline filters.'
          )}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,2.5fr)]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              {t('expensesPage.quickAddTitle', 'Quick Add Expense')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-text-secondary">
                {t('expensesPage.typeLabel', 'Type')}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-10 w-full rounded-[6px] border border-border bg-white px-3 text-[13px]"
              >
                <option value="">
                  {t('expensesPage.typeSelectPlaceholder', 'Select type')}
                </option>
                {(types ?? []).map((typeRow) => (
                  <option key={typeRow.id} value={String(typeRow.id)}>{typeRow.name}</option>
                ))}
                <option value="custom">
                  {t('expensesPage.typeCustomLabel', 'Custom Type')}
                </option>
              </select>
            </div>
            {type === 'custom' && (
              <div>
                <label className="mb-1 block text-[12px] font-medium text-text-secondary">
                  {t('expensesPage.typeCustomLabel', 'Custom Type')}
                </label>
                <Input
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder={t(
                    'expensesPage.typeCustomPlaceholder',
                    'Enter custom expense type'
                  )}
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-[12px] font-medium text-text-secondary">
                {t('expensesPage.amountLabel', 'Amount')}
              </label>
              <Input type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-text-secondary">
                {t('expensesPage.dateLabel', 'Date')}
              </label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-text-secondary">
                {t('expensesPage.noteLabel', 'Note')}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[90px] w-full rounded-[10px] border border-border bg-white px-3 py-2 text-[13px]"
                placeholder={t(
                  'expensesPage.notePlaceholder',
                  'Optional expense note'
                )}
              />
            </div>
            <Button
              className="w-full gap-1"
              onClick={async () => {
                let typeId = Number(type)
                if (type === 'custom' && customType.trim()) {
                  const created = await createExpenseType({ name: customType.trim(), isCustom: true }).unwrap()
                  typeId = created.id
                }
                if (!typeId || amount <= 0) return
                await createExpense({ typeId, amount, date, note: note.trim() || undefined })
                setAmount(0)
                setNote('')
              }}
            >
              <Plus className="h-4 w-4" />
              {t('expensesPage.saveExpense', 'Save Expense')}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-none bg-[var(--card-peach)] shadow-none">
              <CardContent className="pt-5">
                <p className="text-[12px] text-text-secondary">
                  {t('expensesPage.summaryToday', 'Today')}
                </p>
                <p className="text-[22px] font-bold text-text-primary">{money(todaySummary?.total ?? 0)}</p>
              </CardContent>
            </Card>
            <Card className="border-none bg-[var(--card-mint)] shadow-none">
              <CardContent className="pt-5">
                <p className="text-[12px] text-text-secondary">
                  {t('expensesPage.summaryThisMonth', 'This Month')}
                </p>
                <p className="text-[22px] font-bold text-text-primary">{money(monthSummary?.total ?? 0)}</p>
              </CardContent>
            </Card>
            <Card className="border-none bg-[var(--card-lavender)] shadow-none">
              <CardContent className="pt-5">
                <p className="text-[12px] text-text-secondary">
                  {t('expensesPage.summaryThisYear', 'This Year')}
                </p>
                <p className="text-[22px] font-bold text-text-primary">{money(yearSummary?.total ?? 0)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>
                {t('expensesPage.listTitle', 'Expenses List')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="relative md:col-span-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t(
                      'expensesPage.searchPlaceholder',
                      'Search by type or note'
                    )}
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
              </div>

              <div className="overflow-hidden rounded-[12px] border border-border">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-[#FAFAFA]">
                    <tr className="text-left text-[12px] font-medium text-text-muted">
                      <th className="px-4 py-3">
                        {t('expensesPage.tableType', 'Type')}
                      </th>
                      <th className="px-4 py-3">
                        {t('expensesPage.tableAmount', 'Amount')}
                      </th>
                      <th className="px-4 py-3">
                        {t('expensesPage.tableDate', 'Date')}
                      </th>
                      <th className="px-4 py-3">
                        {t('expensesPage.tableNote', 'Note')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((e) => (
                      <tr key={String(e.id)} className="border-t border-border text-[13px]">
                        <td className="px-4 py-3 font-semibold text-text-primary">{e.type?.name ?? '—'}</td>
                        <td className="px-4 py-3 font-semibold text-danger">{money(e.amount)}</td>
                        <td className="px-4 py-3 text-text-secondary">{e.date.slice(0, 10)}</td>
                        <td className="px-4 py-3 text-text-secondary">{e.note || '—'}</td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-[13px] text-text-muted">
                          {t('expensesPage.noExpenses', 'No expenses found.')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

