import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmRequest {
  title: string
  message: ReactNode
  confirmLabel?: string
  danger?: boolean
  resolve: (ok: boolean) => void
}

type ConfirmFn = (options: Omit<ConfirmRequest, 'resolve'>) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

/** Substitui window.confirm por um diálogo no estilo do app. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null)

  const confirm = useCallback<ConfirmFn>(
    (options) => new Promise<boolean>((resolve) => setRequest({ ...options, resolve })),
    [],
  )

  const close = (ok: boolean) => {
    request?.resolve(ok)
    setRequest(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={Boolean(request)}
        onClose={() => close(false)}
        title={request?.title ?? ''}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => close(false)}>
              Cancelar
            </Button>
            <Button variant={request?.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
              {request?.confirmLabel ?? 'Confirmar'}
            </Button>
          </>
        }
      >
        <div className="text-sm text-parchment-muted">{request?.message}</div>
      </Modal>
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmFn {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error('useConfirm precisa de ConfirmProvider')
  return context
}
