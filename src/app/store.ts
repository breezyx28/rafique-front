import { configureStore, type Middleware, isRejectedWithValue } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { authApi } from '@/features/auth/authApi'
import { appApi } from '@/features/api/appApi'
import { toastReducer, addToast } from '@/features/ui/toastSlice'

const errorToastMiddleware: Middleware = (storeApi) => (next) => (action) => {
  const result = next(action)

  if (isRejectedWithValue(action)) {
    try {
      const endpointName =
        (action as any).meta?.arg?.endpointName ??
        (action as any).type?.split('/')?.[0] ??
        'Request'
      const payload = action.payload as any
      const errorData = payload?.data ?? payload
      const message =
        errorData?.message ??
        payload?.error ??
        action.error?.message ??
        'Something went wrong. Please try again.'

      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`

      storeApi.dispatch(
        addToast({
          id,
          variant: 'error',
          title: `${endpointName} failed`,
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

