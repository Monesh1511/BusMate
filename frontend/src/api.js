import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('busgo_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authApi = {
  register: (payload) => api.post('/api/auth/register', payload),
  login: (payload) => api.post('/api/auth/login', payload),
  me: () => api.get('/api/auth/me'),
}

export const busApi = {
  getBuses: () => api.get('/api/buses'),
  getRoutes: () => api.get('/api/routes'),
  getCities: () => api.get('/api/routes/cities'),
  search: ({ from, to, date, busName, departureAfter, departureBefore }) => api.get('/api/buses/search', {
    params: { from, to, date, busName, departureAfter: departureAfter || undefined, departureBefore: departureBefore || undefined },
  }),
}

export const homeApi = {
  metrics: () => api.get('/api/home/metrics'),
}

export const bookingApi = {
  getSeats: (scheduleId) => api.get(`/api/schedules/${scheduleId}/seats`),
  getMyBookings: () => api.get('/api/bookings'),
  create: (payload) => api.post('/api/bookings', payload),
  cancel: (bookingId) => api.post(`/api/bookings/${bookingId}/cancel`),
}

export const reviewApi = {
  submitForBooking: (bookingId, payload) => api.post(`/api/reviews/bookings/${bookingId}`, payload),
}

export const adminApi = {
  dashboard: () => api.get('/api/admin/dashboard'),
  buses: () => api.get('/api/admin/buses'),
  createBus: (payload) => api.post('/api/admin/buses', payload),
  updateBus: (id, payload) => api.put(`/api/admin/buses/${id}`, payload),
  cities: () => api.get('/api/admin/cities'),
  operators: () => api.get('/api/admin/operators'),
  drivers: () => api.get('/api/admin/drivers'),
  createDriver: (payload) => api.post('/api/admin/drivers', payload),
  amenities: () => api.get('/api/admin/amenities'),
  boardingPoints: (city) => api.get('/api/admin/boarding-points', { params: { city } }),
  routes: () => api.get('/api/admin/routes'),
  createRoute: (payload) => api.post('/api/admin/routes', payload),
  updateRoute: (id, payload) => api.put(`/api/admin/routes/${id}`, payload),
  schedules: () => api.get('/api/admin/schedules'),
  createSchedule: (payload) => api.post('/api/admin/schedules', payload),
  updateSchedule: (id, payload) => api.put(`/api/admin/schedules/${id}`, payload),
}

export const mlApi = {
  recommendations: ({ from, to, date }) => api.get('/api/ml/recommendations', { params: { from, to, date } }),
  delay: (scheduleId) => api.get(`/api/ml/delay/${scheduleId}`),
  analyzeReview: (busId, text) => api.post('/api/ml/review-analysis', { busId, text }),
}

export default api
