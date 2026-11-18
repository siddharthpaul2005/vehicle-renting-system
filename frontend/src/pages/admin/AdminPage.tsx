import {
  AlertTriangle,
  CarFront,
  CheckCircle2,
  ClipboardCheck,
  IndianRupee,
  KeyRound,
  LayoutGrid,
  Pencil,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  Trash2,
  Users,
  Wrench,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useToast } from '../../components/Toast'
import { EmptyState, ErrorBanner, PageHeader, PageLoader, Spinner, StatusBadge, VehicleImage } from '../../components/ui'
import { api } from '../../lib/api'
import { formatDate, formatDateTime, formatINR, label } from '../../lib/format'
import { firstName, greeting, initials } from '../../lib/human'
import type { Booking, BookingStatus, Stats, Vehicle, VehicleStatus } from '../../lib/types'
import VehicleFormModal from './VehicleFormModal'

type Tab = 'overview' | 'fleet' | 'inspections' | 'bookings'

export default function AdminPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'overview'
  const [stats, setStats] = useState<Stats | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null)
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      const [s, v, b] = await Promise.all([
        api<Stats>('/admin/stats'),
        api<Vehicle[]>('/admin/vehicles'),
        api<Booking[]>('/admin/bookings'),
      ])
      setStats(s)
      setVehicles(v)
      setBookings(b)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  if (error) return <div className="mx-auto max-w-7xl px-4 py-10"><ErrorBanner message={error} /></div>
  if (!stats || !vehicles || !bookings) return <PageLoader text="Opening the fleet desk..." />

  const pending = bookings.filter((b) => b.status === 'RETURNED')
  const goTo = (t: Tab) => setParams({ tab: t }, { replace: true })
  const tabs: { id: Tab; text: string; icon: ReactNode; count?: number }[] = [
    { id: 'overview', text: 'Overview', icon: <LayoutGrid className="size-4" /> },
    { id: 'fleet', text: 'Fleet', icon: <CarFront className="size-4" />, count: vehicles.filter((v) => v.status !== 'RETIRED').length },
    { id: 'inspections', text: 'Inspections', icon: <ClipboardCheck className="size-4" />, count: pending.length },
    { id: 'bookings', text: 'Bookings', icon: <ReceiptText className="size-4" />, count: bookings.length },
  ]

  return (
    <div className="mx-auto max-w-7xl px-3 pb-12 pt-8 sm:px-6">
      <PageHeader eyebrow={user ? `${greeting()}, ${firstName(user.fullName)}` : 'Fleet desk'} title="Here's how the fleet is doing">
        {pending.length > 0
          ? `${pending.length} car${pending.length > 1 ? 's are' : ' is'} back from a trip and waiting for you to check.`
          : 'Everything is checked and in order. Nice work.'}
      </PageHeader>

      <div className="glass mt-6 inline-flex max-w-full gap-1 overflow-x-auto rounded-full p-1.5" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => goTo(t.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === t.id ? 'bg-white text-ink shadow-sm' : 'text-stone-500 hover:text-ink'
            }`}
          >
            {t.icon} {t.text}
            {t.count !== undefined && (
              <span className={`rounded-full px-2 py-0.5 text-xs ${t.id === 'inspections' && t.count > 0 ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-ink' : 'bg-stone-900/5 text-stone-600'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'overview' && <Overview stats={stats} pending={pending} recent={bookings.slice(0, 5)} goTo={goTo} />}
        {tab === 'fleet' && <Fleet vehicles={vehicles} onChange={reload} />}
        {tab === 'inspections' && <Inspections pending={pending} onChange={reload} />}
        {tab === 'bookings' && <Bookings bookings={bookings} />}
      </div>
    </div>
  )
}

/* ---------------- Overview ---------------- */

const STATUS_BAR: Record<VehicleStatus, string> = {
  AVAILABLE: 'bg-emerald-400',
  RENTED: 'bg-rose-400',
  UNDER_REVIEW: 'bg-amber-400',
  MAINTENANCE: 'bg-stone-400',
  RETIRED: 'bg-stone-300',
}

function Overview({ stats, pending, recent, goTo }: { stats: Stats; pending: Booking[]; recent: Booking[]; goTo: (t: Tab) => void }) {
  const tiles = [
    { k: 'Cars in the fleet', v: stats.totalVehicles, icon: <CarFront />, tint: 'from-sky-100 to-violet-100 text-sky-600' },
    { k: 'Ready to rent', v: stats.vehiclesByStatus.AVAILABLE, icon: <CheckCircle2 />, tint: 'from-emerald-100 to-lime-100 text-emerald-600' },
    { k: 'Out on trips', v: stats.activeBookings, icon: <KeyRound />, tint: 'from-rose-100 to-orange-100 text-rose-500' },
    { k: 'Need a check', v: stats.pendingInspections, icon: <ClipboardCheck />, tint: 'from-amber-100 to-yellow-100 text-amber-600' },
    { k: 'Happy customers', v: stats.customers, icon: <Users />, tint: 'from-violet-100 to-fuchsia-100 text-violet-600' },
    { k: 'Booked revenue', v: formatINR(stats.totalRevenue), icon: <IndianRupee />, tint: 'from-orange-100 to-amber-100 text-orange-600' },
  ]
  const statuses = (Object.keys(STATUS_BAR) as VehicleStatus[]).filter((s) => s !== 'RETIRED')
  const total = statuses.reduce((n, s) => n + stats.vehiclesByStatus[s], 0) || 1

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {tiles.map((t, i) => (
          <div key={t.k} className="card animate-rise p-5" style={{ animationDelay: `${i * 50}ms` }}>
            <div className={`grid size-10 place-items-center rounded-2xl bg-gradient-to-br ${t.tint} [&>svg]:size-5`}>{t.icon}</div>
            <div className="mt-4 text-2xl font-extrabold text-ink">{t.v}</div>
            <div className="text-xs font-medium text-stone-500">{t.k}</div>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div className="animate-rise flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-amber-200/80 bg-amber-50/70 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-3 text-amber-900">
            <div className="grid size-10 place-items-center rounded-2xl bg-amber-100"><ClipboardCheck className="size-5" /></div>
            <div>
              <div className="font-bold">{pending.length} car{pending.length > 1 ? 's' : ''} waiting at the door</div>
              <div className="text-sm text-amber-800">They can't go out again until someone takes a look.</div>
            </div>
          </div>
          <button onClick={() => goTo('inspections')} className="btn-dark btn-sm">Inspect now</button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-bold text-ink">Where the cars are right now</h2>
          <div className="mt-5 flex h-3 gap-1 overflow-hidden rounded-full">
            {statuses.filter((s) => stats.vehiclesByStatus[s] > 0).map((s) => (
              <div key={s} className={`${STATUS_BAR[s]} rounded-full`} style={{ width: `${(stats.vehiclesByStatus[s] / total) * 100}%` }} title={`${label(s)}: ${stats.vehiclesByStatus[s]}`} />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {statuses.map((s) => (
              <div key={s} className="flex items-center justify-between rounded-2xl bg-white/50 px-3 py-2">
                <span className="flex items-center gap-2 text-stone-600"><span className={`size-2.5 rounded-full ${STATUS_BAR[s]}`} /> <StatusText s={s} /></span>
                <b className="text-ink">{stats.vehiclesByStatus[s]}</b>
              </div>
            ))}
          </div>
          {stats.vehiclesByStatus.RETIRED > 0 && <p className="mt-3 text-xs text-stone-400">Plus {stats.vehiclesByStatus.RETIRED} retired, kept for the records.</p>}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-ink">Latest bookings</h2>
            <button onClick={() => goTo('bookings')} className="text-sm font-semibold text-orange-600 hover:underline">See all</button>
          </div>
          {recent.length === 0 ? (
            <p className="mt-6 text-sm text-stone-500">No bookings yet. They'll show up here as soon as they roll in.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {recent.map((b) => (
                <li key={b.id} className="flex items-center gap-3 rounded-2xl bg-white/50 p-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-200 to-sky-200 text-xs font-bold text-white">{initials(b.customer.fullName)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink">{b.customer.fullName} · {b.vehicle.brand} {b.vehicle.model}</div>
                    <div className="text-xs text-stone-500">{formatDate(b.startDate)} → {formatDate(b.endDate)} · {formatINR(b.totalPrice)}</div>
                  </div>
                  <StatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusText({ s }: { s: VehicleStatus }) {
  return <>{{ AVAILABLE: 'Ready', RENTED: 'On a trip', UNDER_REVIEW: 'Being checked', MAINTENANCE: 'In the workshop', RETIRED: 'Retired' }[s]}</>
}

/* ---------------- Fleet ---------------- */

function Fleet({ vehicles, onChange }: { vehicles: Vehicle[]; onChange: () => Promise<void> }) {
  const toast = useToast()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<VehicleStatus | ''>('')
  const [editing, setEditing] = useState<Vehicle | null | 'new'>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const cities = useMemo(() => [...new Set(vehicles.map((v) => v.hubCity))].sort(), [vehicles])

  const shown = vehicles.filter(
    (v) => (!status ? v.status !== 'RETIRED' : v.status === status) && `${v.brand} ${v.model} ${v.hubCity}`.toLowerCase().includes(q.trim().toLowerCase()),
  )

  async function act(v: Vehicle, path: string, method: 'POST' | 'DELETE', success: string) {
    setBusyId(v.id)
    try {
      await api(path, method)
      toast(success)
      await onChange()
    } catch (e) {
      toast((e as Error).message, 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute z-10 left-4 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="input pl-10" placeholder="Find a car or a city" aria-label="Search fleet" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as VehicleStatus | '')} className="input sm:w-52" aria-label="Status filter">
          <option value="">All active cars</option>
          <option value="AVAILABLE">Ready to rent</option>
          <option value="RENTED">On a trip</option>
          <option value="UNDER_REVIEW">Being checked</option>
          <option value="MAINTENANCE">In the workshop</option>
          <option value="RETIRED">Retired</option>
        </select>
        <button onClick={() => setEditing('new')} className="btn-primary">
          <Plus className="size-4" /> Add a car
        </button>
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={<CarFront className="size-7" />} title="No cars here">Try a different filter, or add a new car to the fleet.</EmptyState>
      ) : (
        <div className="card overflow-x-auto p-2">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="text-xs font-semibold text-stone-500">
              <tr>
                <th className="px-4 py-3">Car</th>
                <th className="px-4 py-3">Hub</th>
                <th className="px-4 py-3">Daily rate</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((v) => (
                <tr key={v.id} className="border-t border-white/70 transition hover:bg-white/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <VehicleImage src={v.imageUrl} alt="" className="h-12 w-16 shrink-0 rounded-xl" />
                      <div>
                        <div className="font-bold text-ink">{v.brand} {v.model}</div>
                        <div className="text-xs text-stone-500">#{v.id} · {label(v.vehicleType)} · {label(v.transmission)} · {label(v.fuelType)} · {v.seats} seats</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{v.hubCity}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{formatINR(v.pricePerDay)}</td>
                  <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      {busyId === v.id ? (
                        <Spinner className="size-4 text-stone-400" />
                      ) : (
                        <>
                          {v.status === 'AVAILABLE' && (
                            <button className="btn-ghost btn-sm" title="Send to the workshop" onClick={() => act(v, `/admin/vehicles/${v.id}/maintenance`, 'POST', `${v.model} is off to the workshop`)}>
                              <Wrench className="size-3.5" /> Service
                            </button>
                          )}
                          {(v.status === 'MAINTENANCE' || v.status === 'RETIRED') && (
                            <button className="btn-ghost btn-sm text-emerald-700" onClick={() => act(v, `/admin/vehicles/${v.id}/available`, 'POST', `${v.model} is back on the road`)}>
                              <RotateCcw className="size-3.5" /> {v.status === 'RETIRED' ? 'Bring back' : 'Fixed'}
                            </button>
                          )}
                          <button className="btn-ghost btn-sm" onClick={() => setEditing(v)} aria-label={`Edit ${v.model}`}>
                            <Pencil className="size-3.5" />
                          </button>
                          {v.status !== 'RETIRED' && (
                            <button
                              className="btn-danger btn-sm"
                              aria-label={`Remove ${v.model}`}
                              disabled={v.status === 'RENTED' || v.status === 'UNDER_REVIEW'}
                              title={v.status === 'RENTED' || v.status === 'UNDER_REVIEW' ? 'Finish the current trip first' : 'Remove from the fleet'}
                              onClick={() => {
                                if (window.confirm(`Remove the ${v.brand} ${v.model}? If it has trip history it will be retired, not deleted.`)) {
                                  act(v, `/admin/vehicles/${v.id}`, 'DELETE', `${v.model} has left the fleet`)
                                }
                              }}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <VehicleFormModal
          vehicle={editing === 'new' ? null : editing}
          cities={cities}
          onClose={() => setEditing(null)}
          onSaved={async (v) => {
            toast(editing === 'new' ? `Welcome to the fleet, ${v.brand} ${v.model}!` : 'Changes saved')
            setEditing(null)
            await onChange()
          }}
        />
      )}
    </div>
  )
}

/* ---------------- Inspections ---------------- */

function Inspections({ pending, onChange }: { pending: Booking[]; onChange: () => Promise<void> }) {
  if (pending.length === 0) {
    return (
      <EmptyState icon={<ClipboardCheck className="size-7" />} title="All caught up ☕">
        No cars are waiting for a check. Time for a coffee.
      </EmptyState>
    )
  }
  return <div className="grid gap-4 lg:grid-cols-2">{pending.map((b) => <InspectionCard key={b.id} b={b} onDone={onChange} />)}</div>
}

function InspectionCard({ b, onDone }: { b: Booking; onDone: () => Promise<void> }) {
  const toast = useToast()
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState<'ok' | 'damage' | null>(null)
  const [error, setError] = useState('')

  async function submit(approved: boolean) {
    if (!approved && !notes.trim()) {
      setError("Jot down what's wrong first, so the workshop knows what to fix.")
      return
    }
    setBusy(approved ? 'ok' : 'damage')
    setError('')
    try {
      await api(`/admin/bookings/${b.id}/inspection`, 'POST', { approved, notes: notes.trim() || null })
      toast(approved ? `${b.vehicle.model} is ready for its next trip` : `${b.vehicle.model} is off to the workshop`)
      await onDone()
    } catch (e) {
      setError((e as Error).message)
      setBusy(null)
    }
  }

  return (
    <div className="card animate-rise overflow-hidden">
      <div className="flex gap-4 p-5">
        <VehicleImage src={b.vehicle.imageUrl} alt="" className="h-20 w-28 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <div className="font-bold text-ink">{b.vehicle.brand} {b.vehicle.model}</div>
          <div className="text-sm text-stone-500">Trip #{b.id} · {b.vehicle.hubCity}</div>
          <div className="mt-1 truncate text-sm text-stone-600">Returned by {b.customer.fullName}</div>
          <div className="mt-0.5 text-xs text-stone-500">{formatDate(b.startDate)} → {formatDate(b.endDate)} · back {formatDateTime(b.returnedAt)}</div>
        </div>
      </div>
      <div className="space-y-3 border-t border-white/70 bg-white/30 p-5">
        <textarea
          rows={2}
          maxLength={500}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input resize-none"
          placeholder="How does it look? (needed if you report damage)"
          aria-label="Inspection notes"
        />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => submit(true)} disabled={busy !== null} className="btn btn-sm bg-emerald-500 text-white shadow-lg shadow-emerald-300/40 hover:bg-emerald-600">
            {busy === 'ok' ? <Spinner className="size-4" /> : <CheckCircle2 className="size-4" />} Looks good, rent it out
          </button>
          <button onClick={() => submit(false)} disabled={busy !== null} className="btn-danger btn-sm">
            {busy === 'damage' ? <Spinner className="size-4" /> : <AlertTriangle className="size-4" />} Found damage
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Bookings ---------------- */

function Bookings({ bookings }: { bookings: Booking[] }) {
  const [status, setStatus] = useState<BookingStatus | ''>('')
  const shown = status ? bookings.filter((b) => b.status === status) : bookings

  return (
    <div className="space-y-4">
      <select value={status} onChange={(e) => setStatus(e.target.value as BookingStatus | '')} className="input sm:w-60" aria-label="Booking status filter">
        <option value="">Every booking</option>
        <option value="ACTIVE">Active</option>
        <option value="RETURNED">Awaiting inspection</option>
        <option value="COMPLETED">Completed</option>
      </select>
      {shown.length === 0 ? (
        <EmptyState icon={<ReceiptText className="size-7" />} title="Nothing here yet" />
      ) : (
        <div className="card overflow-x-auto p-2">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="text-xs font-semibold text-stone-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Car</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((b) => (
                <tr key={b.id} className="border-t border-white/70 transition hover:bg-white/50">
                  <td className="px-4 py-3 font-bold text-ink">{b.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-200 to-sky-200 text-[11px] font-bold text-white">{initials(b.customer.fullName)}</span>
                      <div>
                        <div className="font-semibold text-ink">{b.customer.fullName}</div>
                        <div className="text-xs text-stone-500">{b.customer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-700">{b.vehicle.brand} {b.vehicle.model}<div className="text-xs text-stone-500">{b.vehicle.hubCity}</div></td>
                  <td className="px-4 py-3 text-stone-600">
                    {formatDate(b.startDate)} → {formatDate(b.endDate)}
                    <div className="text-xs text-stone-500">{b.days} day{b.days === 1 ? '' : 's'}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">{formatINR(b.totalPrice)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                    {b.damageReported && <div className="mt-1 text-xs text-rose-600" title={b.inspectionNotes ?? ''}>Damage noted</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
