import { Component, type ErrorInfo, type ReactNode } from 'react'

/** Evita tela branca: mostra uma mensagem e permite recarregar se algo quebrar. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro não tratado na interface:', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md rounded-lg border border-line-strong bg-surface p-8 text-center shadow-rune">
          <p className="eyebrow">Erro inesperado</p>
          <h1 className="mt-3 text-2xl font-bold text-parchment">Algo saiu do roteiro</h1>
          <p className="mt-3 text-sm text-parchment-muted">Recarregue a página. Se continuar, avise o mestre da mesa.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-md bg-gold px-5 py-2 font-semibold text-ink hover:bg-gold-bright"
          >
            Recarregar
          </button>
        </div>
      </div>
    )
  }
}
