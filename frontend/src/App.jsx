import {
  ArrowRight,
  BusFront,
  CalendarDays,
  CreditCard,
  LogOut,
  MapPin,
  ShieldCheck,
  Star,
  Ticket,
  Users,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { adminApi, authApi, bookingApi, busApi, homeApi, mlApi, reviewApi } from './api'
import { useAuthStore } from './store/authStore'

const benefits = [
  { title: 'Easy Booking', text: 'Search, choose seats, and confirm in minutes.' },
  { title: 'Secure Payments', text: 'Simulated payment flow ready for a real gateway.' },
  { title: 'Comfort First', text: 'AC, sleeper, Wi‑Fi and live travel details.' },
]

const formatIndianTime = (value) => {
  if (!value) return '--'
  const [hoursText, minutesText] = value.split(':')
  const hours = Number(hoursText)
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutesText} ${suffix}`
}

const getDefaultTravelDate = () => {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date.toISOString().split('T')[0]
}

const addMinutesToTime = (timeValue, minutesToAdd = 0) => {
  if (!timeValue) return '--'
  const [hoursText, minutesText] = timeValue.split(':')
  const baseDate = new Date()
  baseDate.setHours(Number(hoursText), Number(minutesText), 0, 0)
  baseDate.setMinutes(baseDate.getMinutes() + Number(minutesToAdd || 0))
  const finalHours = String(baseDate.getHours()).padStart(2, '0')
  const finalMinutes = String(baseDate.getMinutes()).padStart(2, '0')
  return `${finalHours}:${finalMinutes}`
}

function AppShell({ children }) {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between rounded-full border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
              <BusFront className="h-5 w-5" />
            </div>
            <div className="text-lg font-bold tracking-tight">BUSGO</div>
          </div>

          <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/search">Search Buses</NavLink>
            <NavLink to="/bookings">My Bookings</NavLink>
            {user?.role === 'ADMIN' && <NavLink to="/admin">Admin</NavLink>}
          </div>

          <div className="flex items-center gap-3 text-sm">
            {isAuthenticated ? (
              <>
                <span className="rounded-full bg-slate-100 px-3 py-2 font-medium text-slate-700">
                  {user?.name || 'User'}
                </span>
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-700"
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-700" onClick={() => navigate('/auth')}>
                  Login
                </button>
                <button className="rounded-full bg-slate-900 px-4 py-2 font-medium text-white" onClick={() => navigate('/auth')}>
                  Register
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>© 2026 BUSGO</div>
          <div className="flex gap-6">
            <button onClick={() => navigate('/info/about')} className="hover:text-slate-900">About</button>
            <button onClick={() => navigate('/info/help')} className="hover:text-slate-900">Help</button>
            <button onClick={() => navigate('/info/privacy')} className="hover:text-slate-900">Privacy</button>
          </div>
        </div>
      </footer>
    </div>
  )
}

function HomePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState({ from: '', to: '', date: getDefaultTravelDate() })
  const [metrics, setMetrics] = useState(null)
  const [routes, setRoutes] = useState([])
  const [cities, setCities] = useState([])

  useEffect(() => {
    let active = true
    Promise.all([homeApi.metrics(), busApi.getRoutes(), busApi.getCities()])
      .then(([metricsResponse, routesResponse, citiesResponse]) => {
        if (!active) return
        const cityList = Array.isArray(citiesResponse.data) ? citiesResponse.data : []
        setMetrics(metricsResponse.data || {})
        setRoutes(Array.isArray(routesResponse.data) ? routesResponse.data : [])
        setCities(cityList)
        setQuery((current) => ({
          ...current,
          from: current.from || cityList[0]?.name || '',
          to: current.to || cityList.find((city) => city.name !== cityList[0]?.name)?.name || '',
        }))
      })
      .catch(() => {
        if (active) {
          setMetrics(null)
          setRoutes([])
          setCities([])
        }
      })
    return () => { active = false }
  }, [])

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:grid-cols-[1.4fr_0.6fr] lg:p-8">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Trusted travel platform
            </span>

            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Travel anywhere.<br />
              Book your journey effortlessly.
            </h1>

            <div className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">From</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <input list="home-city-list" value={query.from} onChange={(e) => setQuery((prev) => ({ ...prev, from: e.target.value }))} className="w-full bg-transparent outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">To</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <input list="home-city-list" value={query.to} onChange={(e) => setQuery((prev) => ({ ...prev, to: e.target.value }))} className="w-full bg-transparent outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Travel Date</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  <input type="date" value={query.date} onChange={(e) => setQuery((prev) => ({ ...prev, date: e.target.value }))} className="w-full bg-transparent outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Passengers</label>
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800">1</div>
              </div>
            </div>
            <datalist id="home-city-list">
              {cities.map((city) => <option key={city.id} value={city.name} />)}
            </datalist>

            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => navigate(`/search?from=${encodeURIComponent(query.from)}&to=${encodeURIComponent(query.to)}&date=${encodeURIComponent(query.date)}`)} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
                Search Buses
                <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={() => navigate('/search')} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">
                View Routes
              </button>
            </div>
          </div>

          <aside className="rounded-[28px] bg-slate-900 p-6 text-white">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>BusGo live inventory</span>
              <span className="rounded-full bg-white/10 px-2 py-1">busgo_demo</span>
            </div>

            <div className="mt-5 space-y-4 rounded-2xl bg-white/5 p-4">
              <div>
                <div className="text-sm text-slate-300">Active buses</div>
                <div className="mt-1 text-4xl font-black">{metrics?.activeBuses ?? '—'}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-sm text-slate-300">
                <div><span className="block text-xs text-slate-400">Routes</span>{metrics?.routes ?? '—'}</div>
                <div><span className="block text-xs text-slate-400">Scheduled trips</span>{metrics?.scheduledTrips ?? '—'}</div>
              </div>
              <p className="text-xs leading-5 text-slate-400">Only active database schedules appear in search.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Popular routes</h2>
          <button onClick={() => navigate('/search')} className="text-sm font-semibold text-slate-700">View all</button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {routes.slice(0, 4).map((route) => (
            <div key={route.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>{route.source}</span>
                <ArrowRight className="h-4 w-4" />
                <span>{route.destination}</span>
              </div>
              <div className="mt-4 text-2xl font-black text-slate-900">{route.distanceKm} km</div>
              <button onClick={() => navigate(`/search?from=${encodeURIComponent(route.source)}&to=${encodeURIComponent(route.destination)}&date=${encodeURIComponent(getDefaultTravelDate())}`)} className="mt-4 w-full rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800">
                Book now
              </button>
            </div>
          ))}
          {routes.length === 0 && <p className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">No routes are configured in the database yet.</p>}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-2 text-slate-900">
                {benefit.title === 'Easy Booking' ? <Ticket className="h-5 w-5" /> : benefit.title === 'Secure Payments' ? <ShieldCheck className="h-5 w-5" /> : <Star className="h-5 w-5" />}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{benefit.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-3xl bg-slate-900 p-8 text-white md:grid-cols-4">
          <div>
            <div className="text-3xl font-black">{metrics?.users?.toLocaleString() ?? '—'}</div>
            <div className="mt-2 text-sm text-slate-300">Registered users</div>
          </div>
          <div>
            <div className="text-3xl font-black">{metrics?.routes ?? '—'}</div>
            <div className="mt-2 text-sm text-slate-300">Routes</div>
          </div>
          <div>
            <div className="text-3xl font-black">{metrics?.activeBuses ?? '—'}</div>
            <div className="mt-2 text-sm text-slate-300">Active buses</div>
          </div>
          <div>
            <div className="text-3xl font-black">{metrics?.scheduledTrips ?? '—'}</div>
            <div className="mt-2 text-sm text-slate-300">Scheduled trips</div>
          </div>
        </div>
      </section>
    </AppShell>
  )
}

function AuthPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = mode === 'register'
        ? { name: form.name, email: form.email, password: form.password, phone: form.phone }
        : { email: form.email, password: form.password }

      const response = mode === 'register'
        ? await authApi.register(payload)
        : await authApi.login(payload)

      const responseData = response?.data || {}
      let token = responseData.token

      if (!token && mode === 'register') {
        const loginResponse = await authApi.login({ email: form.email, password: form.password })
        const loginData = loginResponse?.data || {}
        token = loginData.token
        if (!token) {
          throw new Error('Authentication failed: no token returned')
        }
      }

      if (!token) {
        throw new Error('Authentication failed: no token returned')
      }

      const user = responseData.user || {
        name: responseData.name || form.name || 'Customer',
        email: responseData.email || form.email,
        role: responseData.role || 'CUSTOMER',
        id: responseData.userId || responseData.id || null,
      }

      setAuth({ token, user })
      navigate('/search')
    } catch (err) {
      const message = err.response?.data?.message || 'Authentication failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:grid-cols-2">
          <div className="flex flex-col justify-center rounded-[28px] bg-slate-900 p-8 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/10 p-2"><BusFront className="h-5 w-5" /></div>
              <div className="text-xl font-bold">BusGo</div>
            </div>
            <h1 className="mt-8 text-3xl font-black">Travel smarter, book faster.</h1>
            <p className="mt-4 text-slate-300">Manage routes, ticket booking, and your trip details from one modern platform.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-2">
            <div className="flex gap-2 rounded-full border border-slate-200 bg-slate-100 p-1">
              <button type="button" onClick={() => setMode('login')} className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${mode === 'login' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>
                Login
              </button>
              <button type="button" onClick={() => setMode('register')} className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${mode === 'register' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>
                Register
              </button>
            </div>

            {mode === 'register' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none" />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none" />
            </div>

            {mode === 'register' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none" />
              </div>
            )}

            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

            <button disabled={loading} type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-60">
              {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  )
}

function SearchPage() {
  const navigate = useNavigate()
  const location = useMemo(() => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''), [])
  const [form, setForm] = useState({
    from: location.get('from') || '',
    to: location.get('to') || '',
    date: location.get('date') || getDefaultTravelDate(),
    busName: location.get('busName') || '',
    departureAfter: location.get('departureAfter') || '',
    departureBefore: location.get('departureBefore') || '',
  })
  const [results, setResults] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    busApi.getCities()
      .then((response) => setCities(Array.isArray(response?.data) ? response.data : []))
      .catch(() => setCities([]))

    const fetchResults = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await busApi.search(form)
        setResults(Array.isArray(response?.data) ? response.data : [])
        try {
          const mlResponse = await mlApi.recommendations(form)
          setRecommendations(mlResponse.data?.recommendations || [])
        } catch {
          setRecommendations([])
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to fetch routes right now.')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await busApi.search(form)
      setResults(Array.isArray(response?.data) ? response.data : [])
      try {
        const mlResponse = await mlApi.recommendations(form)
        setRecommendations(mlResponse.data?.recommendations || [])
      } catch {
        setRecommendations([])
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No routes found')
    } finally {
      setLoading(false)
    }
  }

  const getRecommendationMeta = (category) => {
    const styles = {
      TOP_PICK: { badge: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Top pick' },
      VALUE_CHOICE: { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Value choice' },
      COMFORT_FIRST: { badge: 'bg-violet-100 text-violet-700 border-violet-200', label: 'Comfort first' },
      ON_TIME_FAVORITE: { badge: 'bg-sky-100 text-sky-700 border-sky-200', label: 'On-time favorite' },
    }

    return styles[category] || { badge: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Recommended' }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-3xl font-black text-slate-900">Search buses</h1>

        <form onSubmit={handleSubmit} className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">From</label>
              <input list="busgo-cities" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">To</label>
              <input list="busgo-cities" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none" />
            </div>
          </div>
          <datalist id="busgo-cities">
            {cities.map((city) => <option key={city.id} value={city.name} />)}
          </datalist>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Bus or operator</label>
              <input placeholder="Bus number or operator" value={form.busName} onChange={(e) => setForm({ ...form, busName: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Departs after</label>
              <input type="time" value={form.departureAfter} onChange={(e) => setForm({ ...form, departureAfter: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Departs before</label>
              <input type="time" value={form.departureBefore} onChange={(e) => setForm({ ...form, departureBefore: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white">Search</button>
          </div>
        </form>

        {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="mt-8 space-y-4">
          {loading ? <div className="rounded-2xl bg-white p-6 text-slate-600">Loading schedules...</div> : (Array.isArray(results) && results.length === 0) ? <div className="rounded-2xl bg-white p-6 text-slate-600">No schedules available for this route.</div> : (Array.isArray(results) ? results : []).map((item) => {
            const recommendation = recommendations.find((entry) => entry.scheduleId === item.id)
            const recommendationReasons = Array.isArray(recommendation?.reasons) ? recommendation.reasons : []
            const recommendationMeta = recommendation ? getRecommendationMeta(recommendation.category) : null
            const recommendationScore = Number(recommendation?.score || 0)
            const matchWidth = Math.min(100, Math.max(58, recommendationScore))

            return (
              <div key={item.id} className={`rounded-3xl border bg-white p-6 shadow-sm transition ${recommendation ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{item.bus?.operator || 'Bus Operator'}</div>
                    <div className="mt-2 text-2xl font-black text-slate-900">{item.bus?.busType || 'Coach'} · {item.bus?.busNumber || 'BUS'}</div>
                    <div className="mt-2 text-sm text-slate-600">{item.route?.source} → {item.route?.destination}</div>
                    <div className="mt-2 text-sm font-semibold text-amber-600">
                      {item.bus?.reviews?.length ? `${(item.bus.reviews.reduce((sum, review) => sum + review.rating, 0) / item.bus.reviews.length).toFixed(1)} ★ · ${item.bus.reviews.length} reviews` : 'New route, first reviews soon'}
                    </div>
                  </div>

                  {recommendation && (
                    <div className={`rounded-2xl border px-3 py-2 text-right ${recommendationMeta.badge}`}>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em]">{recommendationMeta.label}</div>
                      <div className="mt-1 text-lg font-black">AI {recommendationScore.toFixed(1)}</div>
                    </div>
                  )}
                </div>

                {recommendation && (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      <span>Match strength</span>
                      <span>{recommendationScore.toFixed(1)}/100</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-orange-500" style={{ width: `${matchWidth}%` }} />
                    </div>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <div className="flex gap-10">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Departure</div>
                      <div className="mt-1 text-lg font-black text-slate-900">{formatIndianTime(item.departureTime)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Arrival</div>
                      <div className="mt-1 text-lg font-black text-slate-900">{formatIndianTime(item.arrivalTime)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Fare</div>
                      <div className="mt-1 text-lg font-black text-slate-900">₹{item.fare}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-700">{item.bus?.ac ? 'AC' : 'Non-AC'}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-700">{item.bus?.sleeper ? 'Sleeper' : 'Seat'}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-700">{item.bus?.seatCapacity || 0} seats</span>
                  {recommendationReasons.length > 0 && recommendationReasons.map((reason, index) => (
                    <span key={`${item.id}-${index}`} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{reason}</span>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-slate-500">{item.bus?.reviews?.length > 0 ? `Recent rider note: ${item.bus.reviews[0].comment}` : 'Fresh schedule with new pricing and travel timing.'}</div>
                  <button onClick={() => navigate('/bus-details', { state: { schedule: item, recommendation } })} className="rounded-full bg-slate-900 px-5 py-2.5 font-semibold text-white">View details</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}

function BusDetailsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useAuthStore()
  const schedule = location.state?.schedule
  const recommendation = location.state?.recommendation || null
  const [step, setStep] = useState('details')
  const [selectedSeats, setSelectedSeats] = useState([])
  const [seatOptions, setSeatOptions] = useState([])
  const [seatsLoading, setSeatsLoading] = useState(false)
  const [passengers, setPassengers] = useState([])
  const [processing, setProcessing] = useState(false)
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState('')
  const [delayInfo, setDelayInfo] = useState(null)
  const [reviewInsights, setReviewInsights] = useState(null)

  const bus = schedule?.bus || {}
  const route = schedule?.route || {}

  useEffect(() => {
    setPassengers((current) => selectedSeats.map((seatId, index) => {
      const existing = current.find((passenger) => passenger.seatId === seatId)
      const seatOption = seatOptions.find((seat) => seat.id === seatId)
      return existing || {
        name: index === 0 ? user?.name || '' : '', age: '', gender: 'Male',
        phone: index === 0 ? user?.phone || '' : '', email: index === 0 ? user?.email || '' : '',
        seat: seatOption?.seatNumber || '', seatId,
      }
    }))
  }, [selectedSeats, seatOptions, user])

  useEffect(() => {
    if (!schedule?.id) return

    let active = true
    setDelayInfo(null)
    setReviewInsights(null)
    setSeatsLoading(true)
    bookingApi.getSeats(schedule.id)
      .then((response) => {
        if (active) setSeatOptions(Array.isArray(response?.data) ? response.data : [])
      })
      .catch(() => {
        if (active) setSeatOptions([])
      })
      .finally(() => {
        if (active) setSeatsLoading(false)
      })

    mlApi.delay(schedule.id)
      .then((response) => {
        if (!active) return
        setDelayInfo(response?.data || {})
      })
      .catch(() => {
        if (!active) return
        setDelayInfo({
          status: 'UNAVAILABLE',
          confidence: 'low',
          message: 'Delay prediction is unavailable; the published schedule remains the guide.',
        })
      })

    const reviewText = (bus.reviews || []).map((entry) => entry.comment).filter(Boolean).join('. ')
    if (reviewText) {
      mlApi.analyzeReview(bus.id, reviewText)
        .then((response) => {
          if (!active) return
          setReviewInsights(response?.data || { sentiment: 'NEUTRAL', aspects: [] })
        })
        .catch(() => {
          if (!active) return
          setReviewInsights({ status: 'UNAVAILABLE', sentiment: 'INSUFFICIENT_DATA', aspects: [], message: 'Review analysis is unavailable; original reviews remain visible.' })
        })
    } else {
      setReviewInsights({ status: 'INSUFFICIENT_DATA', sentiment: 'INSUFFICIENT_DATA', aspects: [], message: 'There are no passenger reviews for this bus yet.' })
    }

    return () => {
      active = false
    }
  }, [schedule?.id, bus.reviews])

  if (!schedule) {
    return <AppShell><div className="mx-auto max-w-4xl px-4 py-20 text-center"><h1 className="text-3xl font-black text-slate-900">Choose a bus first</h1><button onClick={() => navigate('/search')} className="mt-6 rounded-full bg-slate-900 px-5 py-3 font-semibold text-white">Back to search</button></div></AppShell>
  }

  const fee = selectedSeats.length * 20
  const total = (Number(schedule.fare) * selectedSeats.length) + fee
  const boardingPoints = schedule?.boardingPoint?.name ? [schedule.boardingPoint.name] : []
  const droppingPoints = schedule?.droppingPoint?.name ? [schedule.droppingPoint.name] : []
  const amenities = (bus.amenities || 'AC').split(',').map((amenity) => amenity.trim()).filter(Boolean)
  const reviews = bus.reviews || []
  const selectedSeatLabels = seatOptions
    .filter((seat) => selectedSeats.includes(seat.id))
    .map((seat) => seat.seatNumber)
  const averageRating = reviews.length ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : 'New'
  const steps = ['details', 'seats', 'passengers', 'summary', 'ticket']
  const delayReady = delayInfo?.status === 'READY' && Number.isFinite(Number(delayInfo.predictedDelayMinutes))
  const predictedDelay = delayReady ? Number(delayInfo.predictedDelayMinutes) : null
  const estimatedArrival = delayReady ? addMinutesToTime(schedule.arrivalTime, predictedDelay) : null
  const reviewReady = reviewInsights?.status === 'READY' || reviewInsights?.status === 'PARTIAL_DATA'
  const likedAspects = (reviewInsights?.aspects || []).filter((aspect) => aspect.sentiment === 'POSITIVE').slice(0, 3)
  const concernAspects = (reviewInsights?.aspects || []).filter((aspect) => aspect.sentiment === 'NEGATIVE').slice(0, 3)
  const canOpenStep = (stage) => stage === 'details'
    || stage === 'seats'
    || (stage === 'passengers' && selectedSeats.length > 0)
    || (stage === 'summary' && selectedSeats.length > 0 && passengers.every((passenger) => passenger.name && passenger.age && passenger.phone))
    || (stage === 'ticket' && Boolean(booking))
  const toggleSeat = (seat) => setSelectedSeats((current) => current.includes(seat) ? current.filter((value) => value !== seat) : [...current, seat])
  const updatePassenger = (index, field, value) => setPassengers((current) => current.map((passenger, passengerIndex) => passengerIndex === index ? { ...passenger, [field]: value } : passenger))

  const completePayment = async () => {
    if (!isAuthenticated) { navigate('/auth'); return }
    if (passengers.some((passenger) => !passenger.name.trim()
      || !Number.isInteger(Number(passenger.age))
      || Number(passenger.age) < 1
      || Number(passenger.age) > 119
      || !passenger.gender)) {
      setError('Enter a valid name, age, and gender for every passenger.')
      return
    }
    setProcessing(true)
    setError('')
    try {
      const response = await bookingApi.create({
        scheduleId: schedule.id,
        seatIds: selectedSeats,
        paymentMethod: 'UPI',
        passengers: passengers.map(({ seat, seatId, ...passenger }) => ({ ...passenger, age: Number(passenger.age) })),
      })
      setBooking(response.data)
      setStep('ticket')
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.')
    } finally { setProcessing(false) }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
          {steps.map((stage, index) => (
            <button
              type="button"
              key={stage}
              disabled={!canOpenStep(stage)}
              onClick={() => setStep(stage)}
              className={`rounded-full px-3 py-1 capitalize transition ${step === stage ? "bg-slate-900 text-white" : canOpenStep(stage) ? "bg-white text-slate-700 hover:bg-slate-200" : "cursor-not-allowed bg-slate-100 text-slate-400"}`}
            >
              {index + 1}. {stage}
            </button>
          ))}
        </div>

        {step === "details" && (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
                    {bus.operator}
                  </p>
                  <h1 className="mt-2 text-3xl font-black text-slate-900">
                    {bus.busType} · {bus.busNumber}
                  </h1>
                  <p className="mt-2 text-slate-600">
                    {route.source} → {route.destination}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-amber-500">
                    {averageRating} ★
                  </div>
                  <div className="text-sm text-slate-500">
                    {reviews.length} reviews
                  </div>
                </div>
              </div>
              <div className="mt-8 grid gap-4 rounded-2xl bg-slate-900 p-5 text-white sm:grid-cols-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Departure
                  </div>
                  <div className="mt-1 text-xl font-bold">
                    {formatIndianTime(schedule.departureTime)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Arrival
                  </div>
                  <div className="mt-1 text-xl font-bold">
                    {formatIndianTime(schedule.arrivalTime)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Fare
                  </div>
                  <div className="mt-1 text-xl font-bold">₹{schedule.fare}</div>
                </div>
              </div>
              <div className="mt-8 grid gap-8 md:grid-cols-2">
                <div>
                  <h2 className="font-bold text-slate-900">Boarding points</h2>
                  {boardingPoints.map((point) => (
                    <div
                      key={point}
                      className="mt-3 flex items-center gap-2 text-sm text-slate-600"
                    >
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      {point}
                    </div>
                  ))}
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Dropping points</h2>
                  {droppingPoints.map((point) => (
                    <div
                      key={point}
                      className="mt-3 flex items-center gap-2 text-sm text-slate-600"
                    >
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      {point}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-8">
                <h2 className="font-bold text-slate-900">Amenities</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700"
                    >
                      ✓ {amenity}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setStep("seats")}
                className="mt-8 rounded-full bg-slate-900 px-6 py-3 font-semibold text-white"
              >
                Select seats
              </button>
            </section>
            <section className="rounded-3xl bg-amber-50 p-8">
              <h2 className="text-xl font-black text-slate-900">
                Passenger reviews
              </h2>
              {reviews.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">No passenger reviews are available yet.</p>
              ) : reviews.map((review) => (
                <div key={review.id} className="mt-5 border-b border-amber-200 pb-5">
                  <div className="font-bold text-slate-900">{review.reviewerName} · {review.rating} ★</div>
                  <div className="mt-1 text-sm font-semibold text-slate-700">{review.title}</div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{review.comment}</p>
                </div>
              ))}
              <div className="mt-6 border-t border-amber-200 pt-5">
                <h3 className="font-bold text-slate-900">Journey delay estimate</h3>
                {delayReady ? (
                  <div className="mt-2 text-sm text-slate-700">
                    <p>Estimated delay: <strong>{predictedDelay} min</strong></p>
                    <p>Estimated arrival: <strong>{formatIndianTime(estimatedArrival)}</strong></p>
                    <p className="mt-1 text-xs text-slate-500">Model confidence: {delayInfo.confidence} · {delayInfo.trainingRows} performance records</p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">{delayInfo?.message || 'No completed bus performance records are available for this route yet.'}</p>
                )}
              </div>
              <div className="mt-6 border-t border-amber-200 pt-5">
                <h3 className="font-bold text-slate-900">Review intelligence</h3>
                {reviewReady ? (
                  <div className="mt-2">
                    <p className="text-sm text-slate-700">Overall sentiment: <strong>{reviewInsights.sentiment}</strong></p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(reviewInsights.aspects || []).map((aspect) => (
                        <span key={aspect.aspect} className={`rounded-full px-3 py-1 text-xs font-semibold ${aspect.sentiment === 'POSITIVE' ? 'bg-emerald-100 text-emerald-800' : aspect.sentiment === 'NEGATIVE' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}`}>
                          {aspect.aspect}: {aspect.sentiment.toLowerCase()}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Trained on {reviewInsights.trainingRows} database reviews.</p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">{reviewInsights?.message || 'More rated passenger reviews are needed before this model can report sentiment.'}</p>
                )}
              </div>
            </section>
          </div>
        )}

        {step === "seats" && (
          <section className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black text-slate-900">
                  Select your seats
                </h1>
                <p className="mt-2 text-slate-600">
                  Choose up to 6 seats for this journey.
                </p>
              </div>
              <div className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
                DRIVER
              </div>
            </div>
            {seatsLoading ? (
              <div className="mx-auto mt-8 max-w-lg rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-600">
                Loading available seats...
              </div>
            ) : seatOptions.length === 0 ? (
              <div className="mx-auto mt-8 max-w-lg rounded-2xl bg-amber-50 p-6 text-center text-sm text-amber-800">
                Seat inventory has not been configured for this bus yet.
              </div>
            ) : (
              <div className="mx-auto mt-8 grid max-w-lg grid-cols-4 gap-3 rounded-3xl bg-slate-50 p-6">
                {seatOptions.map((seat) => {
                  const selected = selectedSeats.includes(seat.id)
                  return (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={!seat.available || (!selected && selectedSeats.length >= 6)}
                      onClick={() => toggleSeat(seat.id)}
                      title={`${seat.seatType} · ${seat.deck} deck`}
                      className={`aspect-square rounded-xl border text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 ${selected ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-400"}`}
                    >
                      {seat.seatNumber}
                    </button>
                  )
                })}
              </div>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-slate-600">
                Selected: <strong>{selectedSeatLabels.join(", ") || "None"}</strong>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("details")}
                  className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-700"
                >
                  Back
                </button>
                <button
                  disabled={!selectedSeats.length}
                  onClick={() => setStep("passengers")}
                  className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            </div>
          </section>
        )}

        {step === "passengers" && (
          <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-black text-slate-900">
              Passenger details
            </h1>
            {passengers.map((passenger, index) => (
              <div
                key={passenger.seat}
                className="mt-6 rounded-2xl bg-slate-50 p-5"
              >
                <div className="font-bold text-slate-900">
                  Passenger {index + 1} · Seat {passenger.seat}
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {[
                    ["name", "Full name"],
                    ["age", "Age"],
                    ["phone", "Phone"],
                    ["email", "Email"],
                  ].map(([field, label]) => (
                    <label
                      key={field}
                      className="text-sm font-semibold text-slate-600"
                    >
                      {label}
                      <input
                        value={passenger[field]}
                        onChange={(event) =>
                          updatePassenger(index, field, event.target.value)
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none"
                        required={field !== "email"}
                      />
                    </label>
                  ))}
                  <label className="text-sm font-semibold text-slate-600">
                    Gender
                    <select
                      value={passenger.gender}
                      onChange={(event) =>
                        updatePassenger(index, "gender", event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </label>
                </div>
              </div>
            ))}
            <div className="mt-6 flex justify-between gap-3">
              <button
                onClick={() => setStep("seats")}
                className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-700"
              >
                Back
              </button>
              <button
                onClick={() => setStep("summary")}
                className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white"
              >
                Review booking
              </button>
            </div>
          </section>
        )}

        {step === "summary" && (
          <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-black text-slate-900">
              Booking summary
            </h1>
            <div className="mt-6 rounded-2xl bg-slate-900 p-6 text-white">
              <div className="text-xl font-bold">
                {route.source} → {route.destination}
              </div>
              <div className="mt-2 text-slate-300">
                {schedule.travelDate} ·{" "}
                {formatIndianTime(schedule.departureTime)} to{" "}
                {formatIndianTime(schedule.arrivalTime)}
              </div>
              <div className="mt-2 text-slate-300">
                {bus.operator} · {bus.busType} · {bus.busNumber}
              </div>
            </div>
            <div className="mt-6 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Seats ({selectedSeatLabels.join(", ")})</span>
                <span>₹{Number(schedule.fare) * selectedSeats.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Service fee</span>
                <span>₹{fee}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-black text-slate-900">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>
            {error && (
              <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="mt-8 flex justify-between gap-3">
              <button
                onClick={() => setStep("passengers")}
                className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-700"
              >
                Back
              </button>
              <button
                disabled={processing}
                onClick={completePayment}
                className="rounded-full bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                {processing ? "Processing payment..." : `Pay ₹${total}`}
              </button>
            </div>
          </section>
        )}

        {step === "ticket" && booking && (
          <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <div className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">
                  BUSGO E-TICKET
                </div>
                <h1 className="mt-2 text-3xl font-black text-slate-900">
                  Booking confirmed
                </h1>
                <p className="mt-2 text-slate-600">
                  {booking.bookingReference}
                </p>
              </div>
              <QRCodeSVG
                value={`BUSGO|${booking.bookingReference}|${bus.busNumber}|${selectedSeatLabels.join(",")}|${schedule.travelDate}`}
                size={128}
              />
            </div>
            <div className="mt-8 grid gap-4 rounded-2xl bg-slate-50 p-6 sm:grid-cols-2">
              <div>
                <div className="text-sm text-slate-500">Journey</div>
                <div className="font-bold text-slate-900">
                  {route.source} → {route.destination}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Travel date</div>
                <div className="font-bold text-slate-900">
                  {schedule.travelDate}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Departure</div>
                <div className="font-bold text-slate-900">
                  {formatIndianTime(schedule.departureTime)}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Seats</div>
                <div className="font-bold text-slate-900">
                  {selectedSeatLabels.join(", ")}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-between text-lg font-black text-slate-900">
              <span>Paid total</span>
              <span>₹{total}</span>
            </div>
            <button
              onClick={() => navigate("/bookings")}
              className="mt-8 rounded-full bg-slate-900 px-6 py-3 font-semibold text-white"
            >
              View my bookings
            </button>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function BookingsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reviewingBookingId, setReviewingBookingId] = useState(null)
  const [reviewedBookingIds, setReviewedBookingIds] = useState([])
  const [cancellingBookingId, setCancellingBookingId] = useState(null)
  const [cancellationError, setCancellationError] = useState(null)
  const [reviewDraft, setReviewDraft] = useState({
    rating: 5,
    cleanlinessRating: 5,
    comfortRating: 5,
    punctualityRating: 5,
    staffRating: 5,
    boardingRating: 5,
    title: '',
    text: '',
  })
  const [reviewError, setReviewError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchBookings = async () => {
      setLoading(true);
      try {
        const response = await bookingApi.getMyBookings();
        setBookings(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isAuthenticated]);

  const submitReview = async (event, bookingId) => {
    event.preventDefault()
    setReviewError('')
    try {
      await reviewApi.submitForBooking(bookingId, {
        ...reviewDraft,
        rating: Number(reviewDraft.rating),
        cleanlinessRating: Number(reviewDraft.cleanlinessRating),
        comfortRating: Number(reviewDraft.comfortRating),
        punctualityRating: Number(reviewDraft.punctualityRating),
        staffRating: Number(reviewDraft.staffRating),
        boardingRating: Number(reviewDraft.boardingRating),
      })
      setReviewedBookingIds((current) => [...current, bookingId])
      setReviewingBookingId(null)
      setReviewDraft({ rating: 5, cleanlinessRating: 5, comfortRating: 5, punctualityRating: 5, staffRating: 5, boardingRating: 5, title: '', text: '' })
    } catch (error) {
      setReviewError(error.response?.data?.message || 'Unable to submit review')
    }
  }

  const cancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this booking? Any refund will follow the schedule cancellation policy.')) return
    setCancellingBookingId(bookingId)
    setCancellationError(null)
    try {
      const response = await bookingApi.cancel(bookingId)
      setBookings((current) => current.map((booking) =>
        booking.id === bookingId ? response.data : booking))
    } catch (error) {
      setCancellationError({
        bookingId,
        message: error.response?.data?.message || 'Unable to cancel this booking',
      })
    } finally {
      setCancellingBookingId(null)
    }
  }

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="text-3xl font-black text-slate-900">
            Login to see your bookings
          </h1>
          <button
            onClick={() => navigate("/auth")}
            className="mt-6 rounded-full bg-slate-900 px-5 py-3 font-semibold text-white"
          >
            Go to login
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-16">
        <h1 className="text-3xl font-black text-slate-900">My bookings</h1>

        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="rounded-2xl bg-white p-6 text-slate-600">
              Loading bookings...
            </div>
          ) : Array.isArray(bookings) && bookings.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-slate-600">
              No bookings yet.
            </div>
          ) : (
            (Array.isArray(bookings) ? bookings : []).map((booking) => (
              <div
                key={booking.id}
                className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-lg font-bold text-slate-900">
                      {booking.bookingReference}
                    </div>
                    <div className="text-sm text-slate-500">
                      {booking.schedule?.route?.source} →{" "}
                      {booking.schedule?.route?.destination}
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
                    {booking.status}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                  <span>{booking.schedule?.travelDate}</span>
                  <span>{booking.passengers?.length || 1} passengers</span>
                  <span className="font-bold text-slate-900">
                    ₹{booking.totalAmount}
                  </span>
                </div>
                {cancellationError?.bookingId === booking.id && (
                  <p className="mt-3 text-sm text-red-700">{cancellationError.message}</p>
                )}
                {reviewedBookingIds.includes(booking.id) ? (
                  <p className="mt-4 text-sm font-semibold text-emerald-700">Review submitted</p>
                ) : reviewingBookingId === booking.id ? (
                  <form onSubmit={(event) => submitReview(event, booking.id)} className="mt-5 border-t border-slate-200 pt-5">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[["rating", "Overall"], ["cleanlinessRating", "Cleanliness"], ["comfortRating", "Comfort"], ["punctualityRating", "Punctuality"], ["staffRating", "Staff"], ["boardingRating", "Boarding"]].map(([field, label]) => (
                        <label key={field} className="text-sm font-semibold text-slate-600">{label}
                          <select value={reviewDraft[field]} onChange={(event) => setReviewDraft({ ...reviewDraft, [field]: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2">
                            {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}
                          </select>
                        </label>
                      ))}
                    </div>
                    <input value={reviewDraft.title} onChange={(event) => setReviewDraft({ ...reviewDraft, title: event.target.value })} placeholder="Review title" className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2" required />
                    <textarea value={reviewDraft.text} onChange={(event) => setReviewDraft({ ...reviewDraft, text: event.target.value })} placeholder="Share your journey feedback" className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2" required />
                    {reviewError && <p className="mt-2 text-sm text-red-700">{reviewError}</p>}
                    <div className="mt-3 flex justify-end gap-2">
                      <button type="button" onClick={() => setReviewingBookingId(null)} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
                      <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Submit review</button>
                    </div>
                  </form>
                ) : (booking.status === "CONFIRMED" || booking.status === "COMPLETED") ? (
                  <button onClick={() => { setReviewingBookingId(booking.id); setReviewError("") }} className="mt-4 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Review journey</button>
                ) : null}
                {booking.status === "CONFIRMED" && (
                  <button
                    onClick={() => cancelBooking(booking.id)}
                    disabled={cancellingBookingId === booking.id}
                    className="ml-2 mt-4 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                  >
                    {cancellingBookingId === booking.id ? 'Cancelling...' : 'Cancel booking'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}

function AdminPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({});
  const [tab, setTab] = useState("buses");
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [cities, setCities] = useState([]);
  const [operators, setOperators] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [boardingPoints, setBoardingPoints] = useState([]);
  const [busForm, setBusForm] = useState({
    busNumber: "",
    busRegistrationNumber: "",
    operatorId: "",
    primaryDriverId: "",
    busType: "AC Seater",
    seatCapacity: 40,
    model: "",
    manufacturingYear: 2020,
    ac: true,
    sleeper: false,
    wifi: false,
    charging: false,
    blanket: false,
    waterBottle: false,
    amenityIds: [],
    status: "ACTIVE",
  });
  const [driverForm, setDriverForm] = useState({
    name: "",
    phoneNumber: "",
    experienceYears: 1,
    licenseType: "",
    rating: 4,
  });
  const [routeForm, setRouteForm] = useState({
    source: "",
    destination: "",
    distanceKm: 100,
    estimatedDurationMinutes: 180,
  });
  const [scheduleForm, setScheduleForm] = useState({
    busId: "",
    routeId: "",
    boardingPointId: "",
    droppingPointId: "",
    travelDate: getDefaultTravelDate(),
    departureTime: "08:00",
    arrivalTime: "12:00",
    fare: 499,
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const loadManagementData = async () => {
    const [
      dashboard,
      busResponse,
      routeResponse,
      scheduleResponse,
      cityResponse,
      operatorResponse,
      driverResponse,
      amenityResponse,
      boardingPointResponse,
    ] = await Promise.all([
      adminApi.dashboard(),
      adminApi.buses(),
      adminApi.routes(),
      adminApi.schedules(),
      adminApi.cities(),
      adminApi.operators(),
      adminApi.drivers(),
      adminApi.amenities(),
      adminApi.boardingPoints(),
    ]);
    setStats(dashboard.data);
    setBuses(busResponse.data);
    setRoutes(routeResponse.data);
    setSchedules(scheduleResponse.data);
    setCities(cityResponse.data);
    setOperators(operatorResponse.data);
    setDrivers(driverResponse.data);
    setAmenities(amenityResponse.data);
    setBoardingPoints(boardingPointResponse.data);
  };

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    loadManagementData().catch((error) =>
      setMessage(error.response?.data?.message || "Unable to load admin data"),
    );
  }, [user]);

  const saveBus = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...busForm,
        seatCapacity: Number(busForm.seatCapacity),
        manufacturingYear: Number(busForm.manufacturingYear),
        operatorId: Number(busForm.operatorId),
        primaryDriverId: Number(busForm.primaryDriverId),
        amenityIds: busForm.amenityIds.map(Number),
      };
      if (editingId) await adminApi.updateBus(editingId, payload);
      else await adminApi.createBus(payload);
      setEditingId(null);
      setMessage("Bus saved successfully");
      await loadManagementData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to save bus");
    }
  };

  const saveDriver = async (event) => {
    event.preventDefault();
    try {
      await adminApi.createDriver({
        ...driverForm,
        experienceYears: Number(driverForm.experienceYears),
        rating: Number(driverForm.rating),
      });
      setDriverForm({
        name: "",
        phoneNumber: "",
        experienceYears: 1,
        licenseType: "",
        rating: 4,
      });
      setMessage("Driver saved successfully");
      await loadManagementData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to save driver");
    }
  };

  const saveRoute = async (event) => {
    event.preventDefault();
    try {
      if (editingId) await adminApi.updateRoute(editingId, routeForm);
      else
        await adminApi.createRoute({
          ...routeForm,
          distanceKm: Number(routeForm.distanceKm),
          estimatedDurationMinutes: Number(routeForm.estimatedDurationMinutes),
        });
      setEditingId(null);
      setMessage("Route saved successfully");
      await loadManagementData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to save route");
    }
  };

  const saveSchedule = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...scheduleForm,
        busId: Number(scheduleForm.busId),
        routeId: Number(scheduleForm.routeId),
        boardingPointId: Number(scheduleForm.boardingPointId),
        droppingPointId: Number(scheduleForm.droppingPointId),
        fare: Number(scheduleForm.fare),
      };
      if (editingId) await adminApi.updateSchedule(editingId, payload);
      else await adminApi.createSchedule(payload);
      setEditingId(null);
      setMessage("Schedule and price saved successfully");
      await loadManagementData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to save schedule");
    }
  };

  const selectedScheduleRoute = routes.find(
    (route) => String(route.id) === String(scheduleForm.routeId),
  );
  const boardingOptions = selectedScheduleRoute
    ? boardingPoints.filter(
        (point) =>
          point.cityName.toLowerCase() ===
          selectedScheduleRoute.source.toLowerCase(),
      )
    : [];
  const droppingOptions = selectedScheduleRoute
    ? boardingPoints.filter(
        (point) =>
          point.cityName.toLowerCase() ===
          selectedScheduleRoute.destination.toLowerCase(),
      )
    : [];

  if (user?.role !== "ADMIN") {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="text-3xl font-black text-slate-900">
            Admin access required
          </h1>
          <p className="mt-4 text-slate-600">
            Login as an admin account to view this dashboard.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-16">
        <h1 className="text-3xl font-black text-slate-900">Admin dashboard</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ["Total Users", stats.userCount || 0],
            ["Total Buses", stats.busCount || 0],
            ["Total Bookings", stats.bookingCount || 0],
            ["Routes", stats.routeCount || 0],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-3xl font-black text-slate-900">
                {value}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          {["buses", "drivers", "routes", "schedules"].map((value) => (
            <button
              key={value}
              onClick={() => {
                setTab(value);
                setEditingId(null);
              }}
              className={`rounded-full px-5 py-2 text-sm font-semibold capitalize ${tab === value ? "bg-slate-900 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
            >
              {value}
            </button>
          ))}
        </div>
        {message && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        {tab === "buses" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
            <form
              onSubmit={saveBus}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold">
                {editingId ? "Edit bus" : "Add bus"}
              </h2>
              {[
                ["busNumber", "Bus number", "text"],
                ["busRegistrationNumber", "Registration number", "text"],
                ["seatCapacity", "Seat capacity", "number"],
                ["model", "Model", "text"],
                ["manufacturingYear", "Manufacturing year", "number"],
              ].map(([field, label, type]) => (
                <label
                  key={field}
                  className="mt-3 block text-sm font-semibold text-slate-600"
                >
                  {label}
                  <input
                    type={type}
                    value={busForm[field]}
                    onChange={(event) =>
                      setBusForm({ ...busForm, [field]: event.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none"
                    required
                  />
                </label>
              ))}
              <label className="mt-3 block text-sm font-semibold text-slate-600">
                Operator
                <select
                  value={busForm.operatorId}
                  onChange={(event) =>
                    setBusForm({ ...busForm, operatorId: event.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  required
                >
                  <option value="">Select operator</option>
                  {operators.map((operator) => (
                    <option key={operator.id} value={operator.id}>
                      {operator.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block text-sm font-semibold text-slate-600">
                Primary driver
                <select
                  value={busForm.primaryDriverId}
                  onChange={(event) =>
                    setBusForm({
                      ...busForm,
                      primaryDriverId: event.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  required
                >
                  <option value="">Select driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} · {driver.rating} ★
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block text-sm font-semibold text-slate-600">
                Bus type
                <select
                  value={busForm.busType}
                  onChange={(event) =>
                    setBusForm({ ...busForm, busType: event.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  required
                >
                  {[
                    "AC Sleeper",
                    "Non-AC Sleeper",
                    "AC Seater",
                    "Non-AC Seater",
                    "AC Semi-Sleeper",
                    "Volvo Multi-Axle",
                    "Electric AC",
                    "Luxury Sleeper",
                  ].map((busType) => (
                    <option key={busType}>{busType}</option>
                  ))}
                </select>
              </label>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  ["ac", "AC"],
                  ["sleeper", "Sleeper"],
                  ["wifi", "Wi-Fi"],
                  ["charging", "Charging"],
                  ["blanket", "Blanket"],
                  ["waterBottle", "Water bottle"],
                ].map(([field, label]) => (
                  <label key={field} className="text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={busForm[field]}
                      onChange={(event) =>
                        setBusForm({
                          ...busForm,
                          [field]: event.target.checked,
                        })
                      }
                    />{" "}
                    {label}
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <div className="text-sm font-semibold text-slate-600">
                  Amenities
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {amenities.map((amenity) => (
                    <label key={amenity.id} className="text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={busForm.amenityIds.includes(amenity.id)}
                        onChange={(event) =>
                          setBusForm({
                            ...busForm,
                            amenityIds: event.target.checked
                              ? [...busForm.amenityIds, amenity.id]
                              : busForm.amenityIds.filter(
                                  (id) => id !== amenity.id,
                                ),
                          })
                        }
                      />{" "}
                      {amenity.name}
                    </label>
                  ))}
                </div>
              </div>
              <button className="mt-5 rounded-full bg-slate-900 px-5 py-2.5 font-semibold text-white">
                Save bus
              </button>
            </form>
            <div className="overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="p-4">Bus</th>
                    <th className="p-4">Operator</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Seats</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {buses.map((bus) => (
                    <tr key={bus.id} className="border-b border-slate-100">
                      <td className="p-4 font-bold">{bus.busNumber}</td>
                      <td className="p-4">{bus.operator}</td>
                      <td className="p-4">{bus.busType}</td>
                      <td className="p-4">{bus.seatCapacity}</td>
                      <td className="p-4">
                        <button
                          onClick={() => {
                            setEditingId(bus.id);
                            setBusForm(bus);
                          }}
                          className="font-semibold text-emerald-700"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "drivers" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
            <form
              onSubmit={saveDriver}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold">Add driver</h2>
              {[
                ["name", "Driver name", "text"],
                ["phoneNumber", "Phone number", "tel"],
                ["experienceYears", "Experience years", "number"],
                ["licenseType", "License type", "text"],
                ["rating", "Rating (1-5)", "number"],
              ].map(([field, label, type]) => (
                <label
                  key={field}
                  className="mt-3 block text-sm font-semibold text-slate-600"
                >
                  {label}
                  <input
                    type={type}
                    min={
                      field === "rating"
                        ? 1
                        : field === "experienceYears"
                          ? 0
                          : undefined
                    }
                    max={field === "rating" ? 5 : undefined}
                    step={field === "rating" ? 0.1 : 1}
                    value={driverForm[field]}
                    onChange={(event) =>
                      setDriverForm({
                        ...driverForm,
                        [field]: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none"
                    required
                  />
                </label>
              ))}
              <button className="mt-5 rounded-full bg-slate-900 px-5 py-2.5 font-semibold text-white">
                Save driver
              </button>
            </form>
            <div className="overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="p-4">Driver</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">License</th>
                    <th className="p-4">Experience</th>
                    <th className="p-4">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((driver) => (
                    <tr key={driver.id} className="border-b border-slate-100">
                      <td className="p-4 font-bold">{driver.name}</td>
                      <td className="p-4">{driver.phoneNumber}</td>
                      <td className="p-4">{driver.licenseType}</td>
                      <td className="p-4">{driver.experienceYears} years</td>
                      <td className="p-4">{driver.rating} ★</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "routes" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
            <form
              onSubmit={saveRoute}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold">
                {editingId ? "Edit route" : "Add route"}
              </h2>
              {["source", "destination"].map((field) => (
                <label
                  key={field}
                  className="mt-3 block text-sm font-semibold text-slate-600"
                >
                  {field === "source" ? "From city" : "To city"}
                  <select
                    value={routeForm[field]}
                    onChange={(event) =>
                      setRouteForm({
                        ...routeForm,
                        [field]: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    required
                  >
                    <option value="">Select city</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              {[
                ["distanceKm", "Distance (km)"],
                ["estimatedDurationMinutes", "Duration (minutes)"],
              ].map(([field, label]) => (
                <label
                  key={field}
                  className="mt-3 block text-sm font-semibold text-slate-600"
                >
                  {label}
                  <input
                    value={routeForm[field]}
                    onChange={(event) =>
                      setRouteForm({
                        ...routeForm,
                        [field]: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none"
                    required
                  />
                </label>
              ))}
              <button className="mt-5 rounded-full bg-slate-900 px-5 py-2.5 font-semibold text-white">
                Save route
              </button>
            </form>
            <div className="overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="p-4">From</th>
                    <th className="p-4">To</th>
                    <th className="p-4">Distance</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((route) => (
                    <tr key={route.id} className="border-b border-slate-100">
                      <td className="p-4 font-bold">{route.source}</td>
                      <td className="p-4">{route.destination}</td>
                      <td className="p-4">{route.distanceKm} km</td>
                      <td className="p-4">
                        {route.estimatedDurationMinutes} min
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => {
                            setEditingId(route.id);
                            setRouteForm({
                              source: route.source,
                              destination: route.destination,
                              distanceKm: route.distanceKm,
                              estimatedDurationMinutes:
                                route.estimatedDurationMinutes,
                            });
                          }}
                          className="font-semibold text-emerald-700"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "schedules" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
            <form
              onSubmit={saveSchedule}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold">
                {editingId ? "Edit schedule and price" : "Assign bus to route"}
              </h2>
              <label className="mt-3 block text-sm font-semibold text-slate-600">
                Bus
                <select
                  value={scheduleForm.busId}
                  onChange={(event) =>
                    setScheduleForm({
                      ...scheduleForm,
                      busId: event.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  required
                >
                  <option value="">Select bus</option>
                  {buses.map((bus) => (
                    <option key={bus.id} value={bus.id}>
                      {bus.busNumber} · {bus.operator}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block text-sm font-semibold text-slate-600">
                Route
                <select
                  value={scheduleForm.routeId}
                  onChange={(event) =>
                    setScheduleForm({
                      ...scheduleForm,
                      routeId: event.target.value,
                      boardingPointId: "",
                      droppingPointId: "",
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  required
                >
                  <option value="">Select route</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.source} → {route.destination}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block text-sm font-semibold text-slate-600">
                Boarding point
                <select
                  value={scheduleForm.boardingPointId}
                  onChange={(event) =>
                    setScheduleForm({
                      ...scheduleForm,
                      boardingPointId: event.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  required
                >
                  <option value="">Select boarding point</option>
                  {boardingOptions.map((point) => (
                    <option key={point.id} value={point.id}>
                      {point.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block text-sm font-semibold text-slate-600">
                Dropping point
                <select
                  value={scheduleForm.droppingPointId}
                  onChange={(event) =>
                    setScheduleForm({
                      ...scheduleForm,
                      droppingPointId: event.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  required
                >
                  <option value="">Select dropping point</option>
                  {droppingOptions.map((point) => (
                    <option key={point.id} value={point.id}>
                      {point.name}
                    </option>
                  ))}
                </select>
              </label>
              {[
                ["travelDate", "Travel date"],
                ["departureTime", "Departure"],
                ["arrivalTime", "Arrival"],
                ["fare", "Fare (₹)"],
              ].map(([field, label]) => (
                <label
                  key={field}
                  className="mt-3 block text-sm font-semibold text-slate-600"
                >
                  {label}
                  <input
                    type={
                      field === "travelDate"
                        ? "date"
                        : field.includes("Time")
                          ? "time"
                          : "number"
                    }
                    value={scheduleForm[field]}
                    onChange={(event) =>
                      setScheduleForm({
                        ...scheduleForm,
                        [field]: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    required
                  />
                </label>
              ))}
              <button className="mt-5 rounded-full bg-slate-900 px-5 py-2.5 font-semibold text-white">
                Save schedule
              </button>
            </form>
            <div className="overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="p-4">Bus</th>
                    <th className="p-4">Route</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Fare</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.slice(0, 200).map((schedule) => (
                    <tr key={schedule.id} className="border-b border-slate-100">
                      <td className="p-4 font-bold">
                        {schedule.bus?.busNumber}
                      </td>
                      <td className="p-4">
                        {schedule.route?.source} → {schedule.route?.destination}
                      </td>
                      <td className="p-4">{schedule.travelDate}</td>
                      <td className="p-4">₹{schedule.fare}</td>
                      <td className="p-4">
                        <button
                          onClick={() => {
                            setEditingId(schedule.id);
                            setScheduleForm({
                              busId: schedule.bus?.id || "",
                              routeId: schedule.route?.id || "",
                              boardingPointId: schedule.boardingPoint?.id || "",
                              droppingPointId: schedule.droppingPoint?.id || "",
                              travelDate: schedule.travelDate,
                              departureTime: schedule.departureTime,
                              arrivalTime: schedule.arrivalTime,
                              fare: schedule.fare,
                            });
                          }}
                          className="font-semibold text-emerald-700"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function InfoPage({ title, children }) {
  return (
    <AppShell>
      <section className="mx-auto max-w-3xl px-4 py-20">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-black text-slate-900">{title}</h1>
          <div className="mt-5 space-y-4 text-slate-600">{children}</div>
        </div>
      </section>
    </AppShell>
  );
}

function App() {
  const { hydrate, isAuthenticated } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/bus-details" element={<BusDetailsPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/info/about" element={<InfoPage title="About BusGo"><p>BusGo helps travelers discover buses, compare routes, and complete bookings across Tamil Nadu and beyond.</p><p>Our catalog includes district routes, schedules, operator details, amenities, and customer reviews.</p></InfoPage>} />
        <Route path="/info/help" element={<InfoPage title="Help center"><p>Search by district, bus operator, travel date, or departure time. Open a bus to review boarding points, seats, passengers, and payment.</p><p>For booking issues, sign in again and retry from the bus details page. Your confirmed tickets are available under My Bookings.</p></InfoPage>} />
        <Route path="/info/privacy" element={<InfoPage title="Privacy"><p>BusGo stores account, booking, and passenger details in the connected PostgreSQL database so your trips can be retrieved securely.</p><p>Demo payment processing is simulated and does not collect real card or banking credentials.</p></InfoPage>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
