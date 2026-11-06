// Powiadomienia bez alert()/confirm(): toasty i własne okno potwierdzenia.
// Działa bez Providera - wystarczy raz zamontować <Toaster /> w App.tsx.
// Gdy Toaster nie jest zamontowany (np. w testach), confirmDialog wraca do window.confirm.

export type ToastType = 'success' | 'error' | 'info'
export type ToastItem = { id: number; type: ToastType; message: string }
export type ConfirmOptions = { confirmLabel?: string; cancelLabel?: string; danger?: boolean }
export type ConfirmRequest = {
  message: string
  confirmLabel: string
  cancelLabel: string
  danger: boolean
  resolve: (value: boolean) => void
}

const listeners = new Set<() => void>()
const emit = () => listeners.forEach(l => l())

let toasts: ToastItem[] = []
let pendingConfirm: ConfirmRequest | null = null
let hostCount = 0
let nextId = 1

export const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export const getToasts = () => toasts
export const getConfirm = () => pendingConfirm

export const registerHost = () => {
  hostCount++
  return () => { hostCount-- }
}

export const dismissToast = (id: number) => {
  toasts = toasts.filter(t => t.id !== id)
  emit()
}

const push = (type: ToastType, message: string) => {
  const id = nextId++
  toasts = [...toasts, { id, type, message }].slice(-4) // max 4 naraz
  emit()
  setTimeout(() => dismissToast(id), type === 'error' ? 5000 : 3000)
}

export const toast = {
  success: (message: string) => push('success', message),
  error: (message: string) => push('error', message),
  info: (message: string) => push('info', message),
}

export function confirmDialog(message: string, options: ConfirmOptions = {}): Promise<boolean> {
  if (hostCount === 0) return Promise.resolve(window.confirm(message))
  pendingConfirm?.resolve(false) // nowe pytanie anuluje poprzednie
  return new Promise(resolve => {
    pendingConfirm = {
      message,
      confirmLabel: options.confirmLabel ?? 'Potwierdź',
      cancelLabel: options.cancelLabel ?? 'Anuluj',
      danger: options.danger ?? true,
      resolve,
    }
    emit()
  })
}

export const answerConfirm = (value: boolean) => {
  pendingConfirm?.resolve(value)
  pendingConfirm = null
  emit()
}
