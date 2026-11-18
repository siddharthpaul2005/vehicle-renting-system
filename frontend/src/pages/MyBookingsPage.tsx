import { CalendarDays, Clock, MapPin, ReceiptText, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../components/Toast'
import { EmptyState, ErrorBanner, PageHeader, PageLoader, Spinner, StatusBadge, VehicleImage } from '../components/ui'
import { api } from '../lib/api'
import { formatDate, formatINR } from '../lib/format'
import { firstName, tripMood } from '../lib/human'
import type { Booking } from '../lib/types'

const TONE = {
  info: 'border-sky-200/70 bg-sky-50/70 text-sky-800',
  warn: 'border-amber-200/70 bg-amber-50/70 text-amber-900',
  good: 'border-emerald-200/70 bg-emerald-50/70 text-emerald-800',
  bad: 'border-rose-200/70 bg-rose-50/70 text-rose-800',
}

export default function MyBookingsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [error, setError] = useState('')
  const [returning, setReturning] = useState<number | null>(null)

  const load = useCallback(() => {
    api<Booking[]>('/bookings/me').then(setBookings).catch((e: Error) => setError(e.message))
  }, [])

  useEffect(load, [load])

  async function returnCar(b: Booking) {
    if (!window.confirm(`Ready to hand back the ${b.vehicle.brand} ${b.vehicle.model}?`)) return
    setReturning(b.id)
    try {
      await api(`/bookings/${b.id}/return`, 'POST')
      toast('Thanks! We got it. Our team will check the car shortly.')
      load()
    } catch (e) {
      toast((e as Error).message, 'error')
    } finally {
      setReturning(null)
    }
  }

  if (error) return <div className="mx-auto max-w-4xl px-4 py-10"><ErrorBanner message={error} /></div>
  if (!bookings) return <PageLoader text="Gathering your trips..." />

  const current = bookings.filter((b) => b.status !== 'COMPLETED')
  const past = bookings.filter((b) => b.status === 'COMPLETED')
  const spent = bookings.reduce((n, b) => n + b.totalPrice, 0)

  return (
    <div className="mx-auto max-w-5xl px-3 pb-12 pt-8 sm:px-6">
      <PageHeader eyebrow={user ? `Hey ${firstName(user.fullName)}` : undefined} title="Your trips">
        {bookings.length === 0
          ? 'Nothing booked yet, but every great road trip starts with one click.'
          : `${bookings.length} trip${bookings.length === 1 ? '' : 's'} so far, ${formatINR(spent)} on the road. Thanks for riding with us!`}
      </PageHeader>

      {bookings.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={<ReceiptText className="size-7" />} title="No trips yet">
            <Link to="/" className="font-semibold text-orange-600 hover:underline">Browse the garage</Link> and pick something you'll love driving.
          </EmptyState>
        </div>
      ) : (
        <>
          {current.length > 0 && (
            <Section title="Coming up and on the road">
              {current.map((b) => <Row key={b.id} b={b} onReturn={returnCar} busy={returning === b.id} />)}
            </Section>
          )}
          {past.length > 0 && <Section title="Memories">{past.map((b) => <Row key={b.id} b={b} />)}</Section>}
        </>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-stone-500">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Row({ b, onReturn, busy }: { b: Booking; onReturn?: (b: Booking) => void; busy?: boolean }) {
  const mood = tripMood(b)
  return (
    <div className="card animate-rise flex flex-col gap-2 p-2 sm:flex-row">
      <VehicleImage src={b.vehicle.imageUrl} alt={`${b.vehicle.brand} ${b.vehicle.model}`} className="h-44 w-full shrink-0 rounded-[1.25rem] sm:h-auto sm:w-56" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-stone-400">Trip #{b.id}</div>
            <h3 className="text-xl font-bold text-ink">{b.vehicle.brand} {b.vehicle.model}</h3>
            <div className="flex items-center gap-1 text-sm text-stone-500"><MapPin className="size-3.5 text-rose-400" /> {b.vehicle.hubCity} hub</div>
          </div>
          <StatusBadge status={b.status} />
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="chip"><CalendarDays className="size-3.5" /> {formatDate(b.startDate)} → {formatDate(b.endDate)}</span>
          <span className="chip"><Clock className="size-3.5" /> {b.days} day{b.days === 1 ? '' : 's'}</span>
          <span className="chip font-bold text-ink">{formatINR(b.totalPrice)}</span>
        </div>

        <p className={`rounded-2xl border px-4 py-2.5 text-sm ${TONE[mood.tone]}`}>{mood.text}</p>

        {b.status === 'ACTIVE' && onReturn && (
          <div>
            <button onClick={() => onReturn(b)} disabled={busy} className="btn-dark btn-sm">
              {busy ? <Spinner className="size-4" /> : <RotateCcw className="size-4" />} I've returned the car
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
