import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Backpack, ScrollText, Swords } from 'lucide-react'
import type { AxiosError } from 'axios'
import { errorMessage } from '@/api/client'
import { useAuth } from '@/auth/AuthProvider'
import { Brand } from '@/layout/Brand'
import { Button } from '@/ui/Button'
import { TextField } from '@/ui/Field'

function loginError(error: unknown) {
  const status = (error as AxiosError)?.response?.status
  if (status === 401) return 'Usuário, senha ou PIN incorretos.'
  if (status === 429) return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
  return errorMessage(error, 'Não foi possível entrar.')
}

const FEATURES = [
  { icon: ScrollText, title: 'Fichas vivas', text: 'Vida, mana, atributos e efeitos atualizados na hora pelo mestre.' },
  { icon: Swords, title: 'Lutas por turno', text: 'Convites, ordem de turno e registro de cada golpe.' },
  { icon: Backpack, title: 'Inventário e chat', text: 'Itens entregues durante a sessão e conversa com a mesa.' },
]

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ login: '', password: '', pin: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const user = await login(form.login.trim(), form.password, form.pin)
      navigate(user.role === 'master' ? '/mestre' : '/jogador', { replace: true })
    } catch (err) {
      setError(loginError(err))
    } finally {
      setLoading(false)
    }
  }

  const set = (field: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }))

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <Brand subtitle="Mesa de RPG online" />
          <h1 className="mt-8 text-4xl font-bold leading-tight text-parchment sm:text-5xl">
            A aventura continua <span className="text-gold-bright">onde vocês pararam</span>.
          </h1>
          <p className="mt-4 max-w-lg text-parchment-muted">
            O mestre conduz a mesa; os jogadores acompanham a ficha, o inventário e as lutas em tempo real.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-lg border border-line bg-surface/70 p-4">
                <Icon className="h-5 w-5 text-gold" aria-hidden />
                <p className="mt-2 font-display font-bold text-parchment">{title}</p>
                <p className="mt-1 text-sm text-parchment-muted">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <form onSubmit={submit} className="rounded-lg border border-line-strong bg-surface p-6 shadow-rune sm:p-8" noValidate={false}>
          <p className="eyebrow">Entrar</p>
          <h2 className="mt-1 text-2xl font-bold text-parchment">Acesse sua mesa</h2>
          <p className="mt-1 text-sm text-parchment-muted">Use o login, a senha e o PIN que o mestre combinou com você.</p>

          <div className="mt-6 space-y-4">
            <TextField label="Usuário" required autoComplete="username" value={form.login} onChange={set('login')} autoFocus />
            <TextField label="Senha" type="password" required autoComplete="current-password" value={form.password} onChange={set('password')} />
            <TextField
              label="PIN"
              type="password"
              required
              inputMode="numeric"
              pattern="[0-9]{4,6}"
              hint="4 a 6 dígitos"
              autoComplete="off"
              value={form.pin}
              onChange={set('pin')}
            />
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-md border border-blood/40 bg-blood/10 px-3 py-2 text-sm text-parchment">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" loading={loading} className="mt-6 w-full">
            Entrar
          </Button>
        </form>
      </div>
    </div>
  )
}
