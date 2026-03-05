import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type ToastVariant = 'error' | 'success' | 'info'

export interface Toast {
  id: string
  title: string
  message?: string
  variant: ToastVariant
}

interface ToastState {
  toasts: Toast[]
}

const initialState: ToastState = {
  toasts: [],
}

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    addToast(state, action: PayloadAction<Toast>) {
      state.toasts.unshift(action.payload)
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload)
    },
    clearToasts(state) {
      state.toasts = []
    },
  },
})

export const { addToast, removeToast, clearToasts } = toastSlice.actions
export const toastReducer = toastSlice.reducer

