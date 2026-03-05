import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/useAuthStore'
import { useLoginMutation } from '@/features/auth/authApi'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { languages, setLanguage, type LangCode } from '@/lib/i18n'

const schema = z.object({
  username: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [error, setError] = useState('')
  const [login, { isLoading }] = useLoginMutation()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const { accessToken, user } = await login(data).unwrap()
      setAuth(accessToken, { id: user.id, username: user.username, role: user.role })
      navigate('/', { replace: true })
    } catch {
      setError(t('auth.loginError'))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-app px-4 py-8">
      <div className="absolute right-6 top-6 flex gap-2">
        {languages.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLanguage(l.code as LangCode)}
            className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-text-muted shadow-card hover:bg-gray-50"
          >
            {l.label}
          </button>
        ))}
      </div>
      <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-[16px] bg-white shadow-lg md:grid-cols-2">
        {/* Left gradient / promo panel */}
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-primary via-[#0B9E8E] to-[#FFB48A] px-10 py-10 md:flex">
          <div className="text-[16px] font-bold tracking-[0.04em] text-white uppercase">
            {t('app.shopName')}
          </div>
          <div className="space-y-3">
            <p className="text-[12px] font-medium text-white/80">
              {t('app.name')}
            </p>
            <p className="text-[24px] font-semibold leading-snug text-white">
              {t(
                'auth.heroSubtitle',
                'Get access to your personal hub for clarity and productivity.'
              )}
            </p>
          </div>
        </div>

        {/* Right form panel (image-inspired layout) */}
        <div className="px-6 py-8 md:px-10 md:py-10">
          <div className="mb-8">
            <div className="mb-4 text-[24px] text-[#F59E0B]">*</div>
            <h1 className="text-[24px] font-bold text-text-primary">
              {t('auth.loginTitle', 'Login to your account')}
            </h1>
            <p className="mt-2 text-[13px] text-text-secondary">
              {t(
                'auth.loginSubtitle',
                'Sign in to manage orders, customers, and invoices in one place.'
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-text-primary">
                {t('auth.username', 'Username')}
              </label>
              <Input
                {...register('username')}
                autoComplete="username"
                className="h-10 rounded-[10px] border-border text-[13px] placeholder:text-text-muted"
              />
              {errors.username && (
                <p className="text-[11px] font-medium text-danger">
                  {errors.username.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-text-primary">
                {t('auth.password', 'Password')}
              </label>
              <Input
                type="password"
                {...register('password')}
                autoComplete="current-password"
                className="h-10 rounded-[10px] border-border text-[13px] placeholder:text-text-muted"
              />
              {errors.password && (
                <p className="text-[11px] font-medium text-danger">
                  {errors.password.message}
                </p>
              )}
            </div>
            {error && (
              <p className="text-[11px] font-medium text-danger">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="mt-4 h-10 w-full rounded-[10px] border-none text-[14px] font-semibold shadow-md"
              disabled={isLoading}
            >
              {t('auth.login', 'Login')}
            </Button>
          </form>

          {/* Footer link */}
          <p className="mt-8 text-center text-[12px] text-text-muted">
            {t('auth.footerHint', 'Use your admin account to log in.')}
          </p>
        </div>
      </div>
    </div>
  )
}
