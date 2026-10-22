import CrudManager from '../components/master/CrudManager'
import { Button } from '../components/common'
import { useAuth } from '../context/AuthContext'
import api, { errorMessage } from '../services/api'

const FIELDS = [
  { name: 'login', label: 'Login', required: true, minLength: 3, maxLength: 50, createOnly: true, autoComplete: 'off' },
  {
    name: 'password',
    label: 'Senha',
    type: 'password',
    required: true,
    optionalOnEdit: true,
    minLength: 6,
    autoComplete: 'new-password',
    hint: 'Mínimo de 6 caracteres. Combine a senha pessoalmente com o jogador.',
  },
  {
    name: 'pin',
    label: 'PIN',
    type: 'password',
    required: true,
    optionalOnEdit: true,
    pattern: '[0-9]{4,6}',
    inputMode: 'numeric',
    hint: '4 a 6 dígitos.',
  },
  { name: 'is_active', label: 'Conta ativa', type: 'checkbox', default: true },
]

function toPayload(form, mode) {
  if (mode === 'create') {
    return { login: form.login.trim(), password: form.password, pin: form.pin, role: 'player', is_active: form.is_active }
  }
  const payload = { is_active: form.is_active }
  if (form.password) payload.password = form.password
  if (form.pin) payload.pin = form.pin
  return payload
}

/** Contas dos jogadores: o Master cria o login e entrega senha/PIN para cada pessoa. */
export default function UserManager() {
  const { user } = useAuth()
  const isSelf = (account) => account.id === user?.id

  return (
    <CrudManager
      title="Contas"
      singular="Conta"
      endpoint="/api/auth/users"
      itemEndpoint={(id) => `/api/auth/users/${id}`}
      fields={FIELDS}
      toPayload={toPayload}
      toForm={(account) => ({ login: account.login, password: '', pin: '', is_active: account.is_active })}
      canEdit={(account) => !isSelf(account)}
      canDelete={(account) => !isSelf(account)}
      deleteLabel="Excluir"
      renderItem={(account) => (
        <div>
          <p className="font-semibold text-white">
            {account.login}
            <span className="ml-2 text-xs uppercase tracking-[0.25em] text-cyan-200">{account.role}</span>
          </p>
          <p className={`mt-1 text-xs uppercase tracking-[0.25em] ${account.is_active ? 'text-emerald-300' : 'text-slate-500'}`}>
            {account.is_active ? 'ativa' : 'desativada'}
            {isSelf(account) && ' • você'}
          </p>
        </div>
      )}
      itemActions={(account, reload, notify) =>
        account.is_active && !isSelf(account) ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              try {
                await api.post(`/api/auth/users/${account.id}/deactivate`)
                notify('success', `Conta "${account.login}" desativada.`)
                await reload()
              } catch (err) {
                notify('error', errorMessage(err, 'Não foi possível desativar a conta.'))
              }
            }}
          >
            Desativar
          </Button>
        ) : null
      }
    />
  )
}
