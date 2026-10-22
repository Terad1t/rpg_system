import { useEffect, useId } from 'react'
import Button from './Button'
import { IconX } from './Icons'

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export default function Modal({ isOpen, onClose, title, children, actions = [], size = 'md' }) {
  const titleId = useId()

  useEffect(() => {
    if (!isOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`w-full rounded-lg border border-dark-border bg-dark-secondary shadow-2xl ${SIZES[size] || SIZES.md}`}
      >
        <div className="flex items-center justify-between border-b border-dark-border p-6">
          <h2 id={titleId} className="text-xl font-bold text-orange-500">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-secondary transition-colors hover:text-primary-orange"
            aria-label="Fechar"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-6">{children}</div>

        {actions.length > 0 && (
          <div className="flex justify-end gap-3 border-t border-dark-border p-6">
            {actions.map((action) => (
              <Button key={action.label} variant={action.variant || 'primary'} onClick={action.onClick} disabled={action.disabled}>
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
