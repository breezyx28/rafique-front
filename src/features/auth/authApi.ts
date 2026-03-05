import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { User } from '@/store/useAuthStore'
import { API_BASE } from '@/lib/api'

interface LoginRequest {
  username: string
  password: string
}

interface LoginResponse {
  accessToken: string
  user: User
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE,
    credentials: 'include',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token')
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any): LoginResponse => {
        const data = response?.data ?? response
        return {
          accessToken: data.accessToken,
          user: data.user,
        }
      },
    }),
  }),
})

export const { useLoginMutation } = authApi

