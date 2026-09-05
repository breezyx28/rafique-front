import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useGetCustomerByIdQuery, useUpdateCustomerMutation } from '@/features/api/appApi'

export function CustomerEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { customerId = '' } = useParams()
  const customerIdNumber = Number(customerId)
  const { data: customer, isLoading } = useGetCustomerByIdQuery(customerIdNumber, {
    skip: Number.isNaN(customerIdNumber),
  })
  const [updateCustomer, { isLoading: isSaving }] = useUpdateCustomerMutation()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [phoneError, setPhoneError] = useState('')

  useEffect(() => {
    if (!customer) return
    setName(customer.name ?? '')
    setPhone(customer.phone ?? '')
    setNotes(customer.notes ?? '')
  }, [customer])

  if (!isLoading && !customer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('customersPage.notFound')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to="/customers">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              {t('customersPage.backToCustomers')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const onSave = async () => {
    if (!customer) return
    setPhoneError('')
    if (!phone.trim()) {
      setPhoneError(t('customersPage.phoneRequired'))
      return
    }
    await updateCustomer({
      id: customer.id,
      body: {
        name: name.trim() || customer.name,
        phone: phone.trim(),
        notes: notes.trim() || undefined,
      },
    })
    navigate('/customers')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-text-primary">{t('customersPage.editTitle')}</h1>
          <p className="text-[13px] text-text-secondary">{t('customersPage.editSubtitle')}</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/customers">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t('common.back')}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('customersPage.information')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-text-secondary">{t('customersPage.fullName')}</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('customersPage.fullNamePlaceholder')}
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-text-secondary">
              {t('customersPage.phoneNumber')} <span className="text-danger">*</span>
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('customersPage.phoneNumber')}
            />
            {phoneError && <p className="mt-1 text-[12px] text-danger">{phoneError}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-[12px] font-medium text-text-secondary">{t('customersPage.notes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[96px] w-full rounded-[10px] border border-border bg-white px-3 py-2 text-[13px] text-text-primary"
              placeholder={t('customersPage.notesPlaceholder')}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate('/customers')}>{t('common.cancel')}</Button>
        <Button onClick={onSave} disabled={isSaving}>{t('customersPage.saveCustomer')}</Button>
      </div>
    </div>
  )
}
