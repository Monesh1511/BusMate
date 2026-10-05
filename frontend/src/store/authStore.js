import { create } from 'zustand'
import { authApi } from '../api'

const safeStorage = {
  get: (key) => {
    try {
      return typeof window === 'undefined' ? null : window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set: (key, value) => {
    try {
      if (typeof window !== 'undefined' && value) {
        window.localStorage.setItem(key, String(value))
      }
    } catch {
      // ignore storage failures and keep the app usable
    }
  },
  remove: (key) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch {
      // ignore storage failures
    }
  },
}

const getStoredToken = () => safeStorage.get('busgo_token')

export const useAuthStore = create((set, get) => ({
  user: null,
  token: getStoredToken(),
  isAuthenticated: !!getStoredToken(),

  setAuth: ({ token, user }) => {
    if (!token) {
      safeStorage.remove('busgo_token')
      set({ token: null, user: user || null, isAuthenticated: false })
      return
    }

    safeStorage.set('busgo_token', token)
    set({ token, user, isAuthenticated: true })
  },

  logout: () => {
    safeStorage.remove('busgo_token')
    set({ token: null, user: null, isAuthenticated: false })
  },

  hydrate: async () => {
    const token = getStoredToken()
    if (!token) {
      set({ token: null, user: null, isAuthenticated: false })
      return null
    }

    try {
      const response = await authApi.me()
      set({ user: response.data, token, isAuthenticated: true })
      return response.data
    } catch (error) {
      safeStorage.remove('busgo_token')
      set({ token: null, user: null, isAuthenticated: false })
      return null
    }
  },
}))
