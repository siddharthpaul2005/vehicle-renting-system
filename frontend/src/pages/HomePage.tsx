import { CalendarCheck, CarFront, KeyRound, MapPin, Search, ShieldCheck, Sparkles, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import VehicleCard from '../components/VehicleCard'
import { EmptyState, ErrorBanner } from '../components/ui'
import { api, qs } from '../lib/api'
import { label } from '../lib/format'
import { firstName, greeting } from '../lib/human'
import { FUEL_TYPES, TRANSMISSIONS, VEHICLE_TYPES, type Vehicle } from '../lib/types'

const HERO_IMG = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1920&q=80'

const STEPS = [
  { icon: <Search />, title: 'Pick a car you like', text: 'Filter by city, fuel or size. Every price is per day, with nothing hidden.' },
  { icon: <CalendarCheck />, title: 'Choose your dates', text: 'You see the exact total before you confirm. One click and it is yours.' },
  { icon: <KeyRound />, title: 'Drive, then hand it back', text: 'Return it from "My trips". A real person checks it over before the next guest.' },
]

export default function HomePage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null)
  const [cities, setCities] = useState<string[]>([])
  const [error, setError] = useState('')
  const [q, setQ] = useState(params.get('q') ?? '')

  const filters = {
    city: params.get('city') ?? '',
    type: params.get('type') ?? '',
    fuel: params.get('fuel') ?? '',
    transmission: params.get('transmission') ?? '',
    sort: params.get('sort') ?? '',
    availableOnly: params.get('availableOnly') === 'true',
    q: params.get('q') ?? '',
  }
  const query = qs(filters)

  const setFilter = (key: string, value: string | boolean) => {
    const next = new URLSearchParams(params)
    if (value === '' || value === false) next.delete(key)
    else next.set(key, String(value))
    setParams(next, { replace: true })
  }

  useEffect(() => {
    api<string[]>('/vehicles/cities').then(setCities).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    api<Vehicle[]>(`/vehicles${query}`)
      .then((v) => {
        if (!cancelled) {
          setVehicles(v)
          setError('')
        }
      })
      .catch((e: Error) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [query])

  // Debounce free-text search into the URL.
  useEffect(() => {
    const t = setTimeout(() => {
      if (q.trim() !== (params.get('q') ?? '')) setFilter('q', q.trim())
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const activeFilters = Object.entries(filters).filter(([k, v]) => k !== 'sort' && v).length
  const availableCount = vehicles?.filter((v) => v.status === 'AVAILABLE').length ?? 0

  return (
    <div className="mx-auto max-w-7xl px-3 pb-12 pt-6 sm:px-6">
      {/* Hero */}
      <section className="animate-rise relative overflow-hidden rounded-[2rem] shadow-[0_30px_80px_-30px_rgba(60,40,20,0.5)]">
        <img src={HERO_IMG} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-900/55 to-stone-900/10" />
        <div className="relative px-6 py-14 sm:px-12 sm:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
              <Sparkles className="size-3.5 text-amber-300" />
              {user ? `${greeting()}, ${firstName(user.fullName)}! Where to next?` : 'Hand-checked cars, honest prices'}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-6xl">
              Your next road trip <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">starts here.</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-stone-200">
              From zippy hatchbacks to roomy SUVs, pick up a car from a hub near you. No paperwork maze, no surprise fees.
            </p>

            <form
              className="mt-8 flex flex-col gap-2 rounded-[1.75rem] border border-white/30 bg-white/20 p-2 backdrop-blur-xl sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault()
                document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <label className="flex flex-1 items-center gap-2 rounded-[1.25rem] bg-white/90 px-4">
                <MapPin className="size-5 shrink-0 text-rose-400" />
                <select
                  value={filters.city}
                  onChange={(e) => setFilter('city', e.target.value)}
                  className="w-full bg-transparent py-3.5 text-sm font-semibold text-ink focus:outline-none"
                  aria-label="Pick-up city"
                >
                  <option value="">Anywhere in India</option>
                  {cities.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <button type="submit" className="btn-primary px-7 py-3.5">
                <Search className="size-4" /> Show me cars
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-200">
              <span className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-emerald-300" /> Inspected after every trip</span>
              <span className="flex items-center gap-1.5"><MapPin className="size-4 text-rose-300" /> {cities.length || 'Several'} cities</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="card animate-rise flex gap-4 p-5" style={{ animationDelay: `${100 + i * 80}ms` }}>
            <div className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 text-orange-600 [&>svg]:size-5">
              {s.icon}
              <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-ink text-[10px] font-bold text-white">{i + 1}</span>
            </div>
            <div>
              <div className="font-bold text-ink">{s.title}</div>
              <div className="mt-0.5 text-sm leading-relaxed text-stone-500">{s.text}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Fleet */}
      <section id="fleet" className="scroll-mt-24 pt-14">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="text-sm font-semibold text-amber-600">The garage</div>
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">
              {filters.city ? `Cars waiting in ${filters.city}` : 'Find one that feels like you'}
            </h2>
            <p className="mt-1 text-stone-500">
              {vehicles
                ? `${vehicles.length} car${vehicles.length === 1 ? '' : 's'} here, ${availableCount} ready to go right now.`
                : 'Rolling them out...'}
            </p>
          </div>
          <select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)} className="input sm:w-56" aria-label="Sort">
            <option value="">Sort: A to Z</option>
            <option value="price_asc">Price: easy on the wallet first</option>
            <option value="price_desc">Price: treat yourself first</option>
            <option value="newest">Newest arrivals</option>
          </select>
        </div>

        <div className="card mt-6 grid gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute z-10 left-4 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} className="input pl-10" placeholder="Try “Creta” or “Tata”" aria-label="Search" />
          </div>
          <select value={filters.type} onChange={(e) => setFilter('type', e.target.value)} className="input" aria-label="Body type">
            <option value="">Any size</option>
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t}>{label(t)}</option>
            ))}
          </select>
          <select value={filters.fuel} onChange={(e) => setFilter('fuel', e.target.value)} className="input" aria-label="Fuel">
            <option value="">Any fuel</option>
            {FUEL_TYPES.map((t) => (
              <option key={t} value={t}>{label(t)}</option>
            ))}
          </select>
          <select value={filters.transmission} onChange={(e) => setFilter('transmission', e.target.value)} className="input" aria-label="Transmission">
            <option value="">Any gearbox</option>
            {TRANSMISSIONS.map((t) => (
              <option key={t} value={t}>{label(t)}</option>
            ))}
          </select>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white/70 px-3 py-2.5 text-sm font-semibold text-stone-700 transition has-[:checked]:border-emerald-300 has-[:checked]:bg-emerald-50/80 has-[:checked]:text-emerald-700">
            <input type="checkbox" checked={filters.availableOnly} onChange={(e) => setFilter('availableOnly', e.target.checked)} className="size-4 accent-emerald-500" />
            Free right now
          </label>
        </div>

        {activeFilters > 0 && (
          <button
            onClick={() => {
              setQ('')
              setParams(new URLSearchParams(), { replace: true })
            }}
            className="btn-ghost btn-sm mt-3"
          >
            <X className="size-3.5" /> Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''}
          </button>
        )}

        <div className="mt-6">
          {error ? (
            <ErrorBanner message={error} />
          ) : vehicles === null ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="card h-[26rem] animate-pulse" />
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            <EmptyState icon={<CarFront className="size-7" />} title="Hmm, nothing matches that">
              We couldn't find a car with those filters. Try another city, or loosen a filter or two.
            </EmptyState>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((v, i) => (
                <VehicleCard key={v.id} vehicle={v} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
