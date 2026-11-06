import { useEffect, useSyncExternalStore } from 'react'
import { subscribe, getToasts, getConfirm, dismissToast, answerConfirm, registerHost, type ToastType } from '../notify'
import { btnGhost, btnDanger, btnPrimarySm } from '../ui'
import Icon from './Icon'

const toastStyle: Record<ToastType, string> = {
  success: 'border-accent-500/30 bg-accent-950/80 text-accent-300',
  error: 'border-red-500/30 bg-red-950/80 text-red-300',
  info: 'border-zinc-800 bg-zinc-900 text-zinc-200',
}
const toastIcon: Record<ToastType, string> = { success: 'check', error: 'alert', info: 'info' }

// Montowany raz w App.tsx: pokazuje toasty (prawy górny róg) i okno potwierdzenia
export default function Toaster() {
  const toasts = useSyncExternalStore(subscribe, getToasts)
  const confirm = useSyncExternalStore(subscribe, getConfirm)

  useEffect(() => registerHost(), [])

  useEffect(() => {
    if (!confirm) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') answerConfirm(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirm])

  return (
    <>
      <div className="pointer-events-none fixed left-4 right-4 top-4 z-[100] flex flex-col gap-3 sm:left-auto sm:w-96" role="status" aria-live="polite">
        {toasts.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => dismissToast(t.id)}
            className={`pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold animate-fade-in ${toastStyle[t.type]}`}
          >
            <Icon name={toastIcon[t.type]} size={18} />
            <span>{t.message}</span>
          </button>
        ))}
      </div>

      {confirm && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => answerConfirm(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={confirm.message}
            className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-lg font-bold text-white">{confirm.message}</p>
            <div className="flex gap-3">
              <button type="button" autoFocus onClick={() => answerConfirm(false)} className={`${btnGhost} flex-1`}>{confirm.cancelLabel}</button>
              <button type="button" onClick={() => answerConfirm(true)} className={`${confirm.danger ? btnDanger : btnPrimarySm} flex-1`}>{confirm.confirmLabel}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
