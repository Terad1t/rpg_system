import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Card } from '../components/common'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, error: authError } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    pin: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    console.log('[LoginPage] Form submitted')
    setIsLoading(true)

    try {
      console.log('[LoginPage] Calling login() with:', { login: formData.login })
      const user = await login(formData.login, formData.password, formData.pin)
      console.log('[LoginPage] login() returned, user:', user)
      const targetRoute = user.role === 'master' ? '/master' : '/player/select'
      console.log('[LoginPage] Navigating to:', targetRoute)
      navigate(targetRoute)
    } catch (err) {
      console.error('[LoginPage] Catch block, error:', err.message)
      setError(authError || 'Erro ao fazer login. Verifique suas credenciais.')
    } finally {
      console.log('[LoginPage] Finally block - setting isLoading to false')
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(255,122,24,0.12),transparent_24%),linear-gradient(180deg,#040815_0%,#07111f_45%,#050a12_100%)]" />
      <div className="pointer-events-none absolute left-0 top-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-orange-400/10 blur-3xl" />

      <div className="relative grid w-full max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.45em] text-cyan-200/75">RPG System</p>
            <h1 className="max-w-xl text-4xl font-black uppercase tracking-[0.15em] text-white sm:text-5xl">
              Acesso tático ao painel do jogador
            </h1>
            <p className="max-w-xl text-sm leading-6 text-slate-300">
              Entre para acompanhar personagens, inventário, mapa e chat em uma interface compacta, pensada para desktop e celular.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border border-white/10 bg-[#08111f]/90 p-4">
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Painel</p>
              <p className="mt-2 text-lg font-semibold text-white">Compacto</p>
              <p className="mt-2 text-sm text-slate-300">Cards curtos e navegação rápida.</p>
            </Card>
            <Card className="border border-white/10 bg-[#08111f]/90 p-4">
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Chat</p>
              <p className="mt-2 text-lg font-semibold text-cyan-200">Flutuante</p>
              <p className="mt-2 text-sm text-slate-300">Sempre acessível no canto da tela.</p>
            </Card>
            <Card className="border border-white/10 bg-[#08111f]/90 p-4">
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Mobile</p>
              <p className="mt-2 text-lg font-semibold text-orange-200">Sem rolagem excessiva</p>
              <p className="mt-2 text-sm text-slate-300">Fluxo pensado para toque e leitura rápida.</p>
            </Card>
          </div>
        </div>

        <Card className="border border-white/10 bg-[#08111fe6] p-8 shadow-[0_0_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.45em] text-cyan-200/75">Login</p>
            <h2 className="text-2xl font-black uppercase tracking-[0.14em] text-white">Entrar</h2>
            <p className="text-sm text-slate-300">Use seu login, senha e PIN para acessar o painel.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.3em] text-slate-400">Usuário</label>
              <input
                type="text"
                name="login"
                value={formData.login}
                onChange={handleChange}
                placeholder="seu_usuario"
                required
                disabled={isLoading}
                className="w-full rounded-xl border border-white/10 bg-[#050b18] px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.3em] text-slate-400">Senha</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Sua senha"
                required
                disabled={isLoading}
                className="w-full rounded-xl border border-white/10 bg-[#050b18] px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.3em] text-slate-400">PIN</label>
              <input
                type="password"
                name="pin"
                value={formData.pin}
                onChange={handleChange}
                placeholder="Seu PIN (4-6 dígitos)"
                required
                disabled={isLoading}
                className="w-full rounded-xl border border-white/10 bg-[#050b18] px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
              />
            </div>

            {(error || authError) && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
                <p className="text-sm">{error || authError}</p>
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Autenticando...' : 'Entrar'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
