import { configureStore, type Middleware, isRejectedWithValue } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { authApi } from '@/features/auth/authApi'
import { appApi } from '@/features/api/appApi'
import { toastReducer, addToast } from '@/features/ui/toastSlice'
import i18n from '@/lib/i18n'
import { translateApiMessage } from '@/lib/apiErrors'

type RejectedQueryAction = {
  type?: string
  meta?: { arg?: { endpointName?: string } }
  payload?: {
    data?: { message?: unknown }
    message?: unknown
    error?: unknown
  }
  error?: { message?: string }
}

const errorToastMiddleware: Middleware = (storeApi) => (next) => (action) => {
  const result = next(action)

  if (isRejectedWithValue(action)) {
    try {
      const rejected = action as RejectedQueryAction
      const endpointName =
        rejected.meta?.arg?.endpointName ??
        rejected.type?.split('/')?.[0] ??
        'Request'
      const payload = rejected.payload
      const errorData = payload?.data ?? payload
      const rawMessage =
        errorData?.message ??
        payload?.error ??
        rejected.error?.message
      const message = translateApiMessage(rawMessage)

      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`

      storeApi.dispatch(
        addToast({
          id,
          variant: 'error',
          title: i18n.t('errors.requestFailedGeneric', { defaultValue: i18n.t('errors.requestFailed', { name: endpointName }) }),
          message,
        })
      )
    } catch {
      // Best-effort only; avoid breaking the app if toast creation fails.
    }
  }

  return result
}

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [appApi.reducerPath]: appApi.reducer,
    toast: toastReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware, appApi.middleware, errorToastMiddleware),
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

