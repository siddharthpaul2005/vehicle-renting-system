import { CheckCircle2, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type Kind = 'success' | 'error'
interface ToastItem {
  id: number
  kind: Kind
  message: string
}

const ToastContext = createContext<(message: string, kind?: Kind) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((message: string, kind: Kind = 'success') => {
    const id = Date.now() + Math.random()
    setItems((xs) => [...xs.slice(-2), { id, kind, message }])
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="glass-strong animate-rise pointer-events-auto flex max-w-md items-center gap-2.5 rounded-full px-5 py-3 text-sm font-semibold text-ink">
            {t.kind === 'success' ? <CheckCircle2 className="size-5 text-emerald-500" /> : <XCircle className="size-5 text-rose-500" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)
