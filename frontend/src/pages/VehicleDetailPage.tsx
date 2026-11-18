import { ArrowLeft, CalendarDays, CarFront, Fuel, MapPin, Settings2, ShieldCheck, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../components/Toast'
import { EmptyState, ErrorBanner, PageLoader, Spinner, StatusBadge, VehicleImage } from '../components/ui'
import { api, ApiError } from '../lib/api'
import { addDays, daysInclusive, formatDate, formatINR, isoDate, label } from '../lib/format'
import { TYPE_BLURB } from '../lib/human'
import type { Booking, Vehicle } from '../lib/types'

const MAX_DAYS = 30
const MAX_AHEAD = 90

const UNAVAILABLE_REASON: Record<string, string> = {
  RENTED: "Someone's out enjoying this one right now. Check back soon!",
  UNDER_REVIEW: 'It just came back from a trip, and our team is giving it a once-over.',
  MAINTENANCE: "It's having a little spa day in the workshop.",
}

export default function VehicleDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [today] = useState(() => isoDate(new Date()))
  const [start, setStart] = useState(today)
  const [end, setEnd] = useState(() => addDays(isoDate(new Date()), 1))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api<Vehicle>(`/vehicles/${id}`)
      .then(setVehicle)
      .catch((e) => (e instanceof ApiError && e.status === 404 ? setNotFound(true) : setError(e.message)))
  }, [id])

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState icon={<CarFront className="size-7" />} title="This car has driven off">
          We couldn't find it. It may have been retired from the fleet.{' '}
          <Link to="/" className="font-semibold text-orange-600 hover:underline">See the others</Link>
        </EmptyState>
      </div>
    )
  }
  if (!vehicle) return error ? <div className="mx-auto max-w-3xl px-4 py-16"><ErrorBanner message={error} /></div> : <PageLoader text="Fetching the keys..." />

  const days = end >= start ? daysInclusive(start, end) : 0
  const datesValid = days >= 1 && days <= MAX_DAYS && start >= today
  const available = vehicle.status === 'AVAILABLE'
  const total = vehicle.pricePerDay * Math.max(days, 0)
  const name = `${vehicle.brand} ${vehicle.model}`

  async function book() {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/vehicles/${id}`)}`)
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await api<Booking>('/bookings', 'POST', { vehicleId: vehicle!.id, startDate: start, endDate: end })
      toast(`You're all set! The ${vehicle!.model} is yours.`)
      navigate('/bookings')
    } catch (e) {
      setError((e as Error).message)
      api<Vehicle>(`/vehicles/${id}`).then(setVehicle).catch(() => {})
    } finally {
      setSubmitting(false)
    }
  }

  const specs = [
    { icon: <CarFront />, k: 'Body', v: label(vehicle.vehicleType) },
    { icon: <Settings2 />, k: 'Gearbox', v: label(vehicle.transmission) },
    { icon: <Fuel />, k: 'Fuel', v: label(vehicle.fuelType) },
    { icon: <Users />, k: 'Seats', v: `${vehicle.seats} people` },
  ]

  return (
    <div className="mx-auto max-w-7xl px-3 pb-12 pt-6 sm:px-6">
      <Link to="/" className="btn-ghost btn-sm">
        <ArrowLeft className="size-4" /> All cars
      </Link>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="animate-rise">
          <div className="card overflow-hidden p-2">
            <VehicleImage src={vehicle.imageUrl} alt={name} className="aspect-[16/9] w-full rounded-[1.25rem]" />
          </div>

          <div className="card mt-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold uppercase tracking-wider text-stone-500">{vehicle.brand}</div>
                <h1 className="text-4xl font-extrabold tracking-tight text-ink">{vehicle.model}</h1>
                <p className="mt-1 text-stone-500">{TYPE_BLURB[vehicle.vehicleType]}.</p>
              </div>
              <StatusBadge status={vehicle.status} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {specs.map((s) => (
                <div key={s.k} className="rounded-2xl border border-white/80 bg-white/60 p-4">
                  <div className="text-orange-500 [&>svg]:size-5">{s.icon}</div>
                  <div className="mt-2 text-xs text-stone-500">{s.k}</div>
                  <div className="font-bold text-ink">{s.v}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-600">
              <span className="flex items-center gap-1.5"><MapPin className="size-4 text-rose-400" /> Pick up and drop off at our {vehicle.hubCity} hub</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-emerald-500" /> Checked by our team after every trip</span>
            </div>
          </div>
        </div>

        <aside className="glass-strong animate-rise h-fit rounded-3xl p-6 lg:sticky lg:top-28" style={{ animationDelay: '80ms' }}>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-ink">{formatINR(vehicle.pricePerDay)}</span>
            <span className="text-stone-500">per day</span>
          </div>

          {available ? (
            <>
              <p className="mt-1 text-sm text-stone-500">Nice pick! When do you need it?</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="start" className="label">Pick-up day</label>
                  <input
                    id="start"
                    type="date"
                    className="input"
                    value={start}
                    min={today}
                    max={addDays(today, MAX_AHEAD)}
                    onChange={(e) => {
                      setStart(e.target.value)
                      if (end < e.target.value) setEnd(e.target.value)
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="end" className="label">Return day</label>
                  <input id="end" type="date" className="input" value={end} min={start} max={addDays(start, MAX_DAYS - 1)} onChange={(e) => setEnd(e.target.value)} />
                </div>
              </div>

              <div className="mt-5 space-y-2 rounded-2xl border border-white/80 bg-white/60 p-4 text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>{formatINR(vehicle.pricePerDay)} × {days} day{days === 1 ? '' : 's'}</span>
                  <span>{formatINR(total)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Booking & hidden fees</span>
                  <span className="font-semibold text-emerald-600">₹0</span>
                </div>
                <div className="flex justify-between border-t border-stone-200/70 pt-2 text-base font-extrabold text-ink">
                  <span>You pay</span>
                  <span>{formatINR(total)}</span>
                </div>
              </div>

              {datesValid ? (
                <p className="mt-3 text-sm text-stone-500">
                  Pick it up on <b className="text-stone-700">{formatDate(start)}</b> and bring it back by <b className="text-stone-700">{formatDate(end)}</b>.
                </p>
              ) : (
                <p className="mt-3 text-sm text-rose-600">Pick a start date from today onwards, for up to {MAX_DAYS} days.</p>
              )}
              {error && <div className="mt-3"><ErrorBanner message={error} /></div>}

              <button onClick={book} disabled={!datesValid || submitting} className="btn-primary mt-5 w-full py-3.5 text-base">
                {submitting ? <Spinner /> : <CalendarDays className="size-5" />}
                {user ? 'Book it' : 'Log in to book'}
              </button>
              {!user && <p className="mt-2 text-center text-xs text-stone-500">It takes 20 seconds to sign up, and we'll bring you right back here.</p>}
            </>
          ) : (
            <div className="mt-5 rounded-2xl border border-white/80 bg-white/60 p-5 text-sm text-stone-600">
              <p className="font-bold text-ink">Not available right now</p>
              <p className="mt-1 leading-relaxed">{UNAVAILABLE_REASON[vehicle.status] ?? "This car can't be booked at the moment."}</p>
              <Link to="/?availableOnly=true" className="btn-dark mt-4 w-full">Show me cars that are free</Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
