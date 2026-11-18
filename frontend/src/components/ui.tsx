import { CarFront, Loader2, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { label } from '../lib/format'
import type { BookingStatus, VehicleStatus } from '../lib/types'

const STATUS: Record<VehicleStatus | BookingStatus, { text: string; cls: string; dot: string }> = {
  AVAILABLE: { text: 'Available', cls: 'bg-emerald-50/80 text-emerald-700 ring-emerald-500/20', dot: 'bg-emerald-500' },
  RENTED: { text: 'On a trip', cls: 'bg-rose-50/80 text-rose-700 ring-rose-500/20', dot: 'bg-rose-500' },
  UNDER_REVIEW: { text: 'Being checked', cls: 'bg-amber-50/80 text-amber-800 ring-amber-500/25', dot: 'bg-amber-500' },
  MAINTENANCE: { text: 'In the workshop', cls: 'bg-stone-100/80 text-stone-700 ring-stone-500/20', dot: 'bg-stone-500' },
  RETIRED: { text: 'Retired', cls: 'bg-stone-100/70 text-stone-500 ring-stone-400/20', dot: 'bg-stone-400' },
  ACTIVE: { text: 'Active', cls: 'bg-sky-50/80 text-sky-700 ring-sky-500/20', dot: 'bg-sky-500' },
  RETURNED: { text: 'Awaiting inspection', cls: 'bg-amber-50/80 text-amber-800 ring-amber-500/25', dot: 'bg-amber-500' },
  COMPLETED: { text: 'Completed', cls: 'bg-emerald-50/80 text-emerald-700 ring-emerald-500/20', dot: 'bg-emerald-500' },
}

export function StatusBadge({ status }: { status: VehicleStatus | BookingStatus }) {
  const s = STATUS[status] ?? { text: label(status), cls: 'bg-white/70 text-stone-600 ring-stone-300', dot: 'bg-stone-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset backdrop-blur ${s.cls}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {s.text}
    </span>
  )
}

/** Car photo with a soft placeholder when the URL is missing or broken. */
export function VehicleImage({ src, alt, className = '' }: { src: string | null; alt: string; className?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  if (!src || failedSrc === src) {
    return (
      <div className={`flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-amber-100/80 via-rose-100/70 to-violet-100/80 ${className}`}>
        <CarFront className="size-10 text-stone-400/80" aria-hidden />
        <span className="sr-only">{alt}</span>
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailedSrc(src)} className={`object-cover ${className}`} />
}

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`size-5 animate-spin ${className}`} aria-label="Loading" />
}

export function PageLoader({ text = 'Just a moment...' }: { text?: string }) {
  return (
    <div className="flex min-h-[45vh] flex-col items-center justify-center gap-3 text-stone-500">
      <Spinner className="size-7 text-amber-500" />
      <span className="text-sm">{text}</span>
    </div>
  )
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="card animate-rise flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-amber-100 to-rose-100 text-amber-600 shadow-inner">{icon}</div>
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {children && <div className="max-w-sm text-sm leading-relaxed text-stone-500">{children}</div>}
    </div>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-2xl border border-rose-200/80 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 backdrop-blur">
      {message}
    </div>
  )
}

export function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-stone-900/30 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="glass-strong animate-rise max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl sm:rounded-3xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
          <div>
            <h2 className="text-xl font-bold text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-stone-400 transition hover:bg-white hover:text-stone-700" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="p-6 pt-4">{children}</div>
      </div>
    </div>
  )
}

/** Small "eyebrow" + heading combo used at the top of pages. */
export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="animate-rise">
      {eyebrow && <div className="text-sm font-semibold text-amber-600">{eyebrow}</div>}
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{title}</h1>
      {children && <p className="mt-2 max-w-2xl text-stone-500">{children}</p>}
    </div>
  )
}
