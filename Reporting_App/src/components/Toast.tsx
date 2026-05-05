import { useEffect } from 'react'

export type ToastType = 'info' | 'success' | 'warning' | 'error'

export interface ToastMessage {
  id: number
  message: string
  type: ToastType
}

let _nextId = 1
export function mkToast(message: string, type: ToastType = 'info'): ToastMessage {
  return { id: _nextId++, message, type }
}

const TYPE_STYLES: Record<ToastType, string> = {
  info:    'border-status-info-border bg-status-info-bg text-status-info-text',
  success: 'border-status-success-border bg-status-success-bg text-status-success-text',
  warning: 'border-status-warning-border bg-status-warning-bg text-status-warning-text',
  error:   'border-status-error-border bg-status-error-bg text-status-error-text',
}

function Toast({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss])

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm shadow-md min-w-[260px] max-w-[400px] ${TYPE_STYLES[toast.type]}`}
    >
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="opacity-60 hover:opacity-100 text-base leading-none mt-0.5"
      >
        ✕
      </button>
    </div>
  )
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[]
  onDismiss: (id: number) => void
}) {
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
