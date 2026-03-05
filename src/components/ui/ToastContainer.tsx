import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '@/app/store'
import { removeToast } from '@/features/ui/toastSlice'
import { AlertTriangle, Info } from 'lucide-react'

export function ToastContainer() {
  const toasts = useSelector((state: RootState) => state.toast.toasts)
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    if (!toasts.length) return
    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        dispatch(removeToast(toast.id))
      }, 5000)
    )
    return () => {
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [dispatch, toasts])

  if (!toasts.length) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-end px-4 sm:top-4 sm:px-6">
      <div className="flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => {
          const isError = toast.variant === 'error'
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-start gap-3 rounded-[12px] border px-3 py-2 shadow-card"
              style={{
                backgroundColor: isError
                  ? 'var(--color-danger-bg)'
                  : 'var(--color-primary-light)',
                borderColor: isError ? 'var(--color-danger)' : 'var(--color-primary)',
                color: isError ? 'var(--color-danger)' : 'var(--color-primary)',
              }}
            >
              <div className="mt-0.5">
                {isError ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Info className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold">{toast.title}</p>
                {toast.message && (
                  <p className="mt-0.5 text-[12px] text-text-primary/80">{toast.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dispatch(removeToast(toast.id))}
                className="ml-1 text-[11px] font-medium text-text-primary/80 hover:underline"
              >
                Dismiss
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

