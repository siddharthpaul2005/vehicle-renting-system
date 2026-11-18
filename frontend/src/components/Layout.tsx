import { CarFront, Heart, LayoutDashboard, LogOut, Menu, ReceiptText, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { initials } from '../lib/human'

const YEAR = new Date().getFullYear()

const navLink = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-white/90 text-ink shadow-sm' : 'text-stone-600 hover:bg-white/60 hover:text-ink'
  }`

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-ink">
      <span className="grid size-9 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-300/50">
        <CarFront className="size-5" />
      </span>
      <span>
        Drive<span className="text-orange-500">Xpress</span>
      </span>
    </Link>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  const links = (
    <>
      <NavLink to="/" end className={navLink} onClick={close}>
        <CarFront className="size-4" /> Find a car
      </NavLink>
      {user && (
        <NavLink to="/bookings" className={navLink} onClick={close}>
          <ReceiptText className="size-4" /> My trips
        </NavLink>
      )}
      {user?.role === 'ADMIN' && (
        <NavLink to="/admin" className={navLink} onClick={close}>
          <LayoutDashboard className="size-4" /> Fleet desk
        </NavLink>
      )}
    </>
  )

  const account = user ? (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-violet-300 to-sky-300 text-xs font-bold text-white shadow-inner ring-2 ring-white/80">
          {initials(user.fullName)}
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-ink">{user.fullName}</div>
          <div className="text-xs text-stone-500">{user.role === 'ADMIN' ? 'Fleet admin' : 'Member'}</div>
        </div>
      </div>
      <button
        onClick={() => {
          logout()
          close()
          navigate('/')
        }}
        className="btn-ghost btn-sm"
        aria-label="Log out"
      >
        <LogOut className="size-4" /> <span className="md:hidden lg:inline">Log out</span>
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Link to="/login" onClick={close} className="btn btn-sm text-stone-700 hover:bg-white/60">
        Log in
      </Link>
      <Link to="/register" onClick={close} className="btn-primary btn-sm">
        Join free
      </Link>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-6">
        <div className="glass mx-auto max-w-7xl rounded-3xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-5">
            <Logo />
            <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">{links}</nav>
            <div className="hidden md:block">{account}</div>
            <button className="rounded-full p-2 text-stone-700 hover:bg-white/70 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
              {open ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
          {open && (
            <div className="space-y-4 border-t border-white/70 px-4 pb-4 pt-3 md:hidden">
              <nav className="flex flex-col gap-1">{links}</nav>
              {account}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="px-3 pb-3 sm:px-6">
        <div className="glass mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 rounded-3xl px-6 py-5 text-sm text-stone-500 sm:flex-row">
          <span>
            © {YEAR} DriveXpress · Every car checked by a real person after every trip ·{' '}
            <Link to="/credits" className="underline decoration-stone-300 underline-offset-2 hover:text-ink">Photo credits</Link>
          </span>
          <span className="flex items-center gap-1">
            Made with <Heart className="size-3.5 fill-rose-400 text-rose-400" /> for road trips across India
          </span>
        </div>
      </footer>
    </div>
  )
}
