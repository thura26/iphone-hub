import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import Modal from '@/components/common/Modal'
import { cn } from '@/lib/utils'

const ConfirmContext = createContext(null)

const tones = {
  danger: {
    icon: 'bg-danger/10 text-danger',
    button: 'btn-danger',
    defaultIcon: Trash2,
    defaultConfirm: 'Delete',
  },
  warning: {
    icon: 'bg-warning/10 text-warning',
    button: 'btn-primary',
    defaultIcon: AlertTriangle,
    defaultConfirm: 'Continue',
  },
  neutral: {
    icon: 'bg-soft text-ink',
    button: 'btn-primary',
    defaultIcon: AlertTriangle,
    defaultConfirm: 'Confirm',
  },
}

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null)
  const resolverRef = useRef(null)

  const confirm = useCallback((options = {}) => {
    if (resolverRef.current) {
      resolverRef.current(false)
      resolverRef.current = null
    }
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setDialog(typeof options === 'string' ? { title: options } : options)
    })
  }, [])

  const finish = useCallback((result) => {
    setDialog(null)
    const resolve = resolverRef.current
    resolverRef.current = null
    resolve?.(result)
  }, [])

  const value = useMemo(() => ({ confirm }), [confirm])

  const tone = tones[dialog?.tone] || tones.danger
  const Icon = dialog?.icon || tone.defaultIcon

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal
        open={!!dialog}
        onClose={() => finish(false)}
        className="sm:max-w-md"
        aria-label={dialog?.title || 'Confirm action'}
      >
        {dialog && (
          <>
            <div className="flex items-start gap-3.5 pr-7">
              <span
                className={cn(
                  'grid h-11 w-11 shrink-0 place-items-center rounded-full',
                  tone.icon,
                )}
              >
                <Icon size={19} />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-bold tracking-tight text-ink">
                  {dialog.title || 'Are you sure?'}
                </h2>
                {dialog.description && (
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {dialog.description}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => finish(false)}
                className="btn-outline w-full sm:w-auto"
              >
                {dialog.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => finish(true)}
                className={cn('w-full sm:w-auto', tone.button)}
              >
                {dialog.confirmLabel || tone.defaultConfirm}
              </button>
            </div>
          </>
        )}
      </Modal>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider')
  return context.confirm
}
