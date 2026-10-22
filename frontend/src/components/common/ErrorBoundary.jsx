import { Component } from 'react'

/** Evita tela branca: mostra uma mensagem e permite recarregar se um componente quebrar. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Erro não tratado na interface:', error, info?.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#040815] px-6 text-white">
        <div className="max-w-md rounded-2xl border border-white/10 bg-[#08111f] p-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.45em] text-orange-200">Erro inesperado</p>
          <h1 className="mt-3 text-2xl font-black uppercase tracking-[0.12em]">Algo saiu do roteiro</h1>
          <p className="mt-3 text-sm text-slate-300">Recarregue a página. Se o problema continuar, avise o mestre da mesa.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white hover:bg-orange-600"
          >
            Recarregar
          </button>
        </div>
      </div>
    )
  }
}
