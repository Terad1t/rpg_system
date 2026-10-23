import { UserX } from 'lucide-react'
import { post } from '@/api/client'
import { keys, useAccounts, useAction } from '@/api/queries'
import type { Account } from '@/api/types'
import { useCurrentUser } from '@/auth/AuthProvider'
import { Badge } from '@/ui/Badge'
import { Button } from '@/ui/Button'
import { PageHeader } from '@/ui/Panel'
import { formatDateTime } from '@/lib/format'
import { CrudPage, text, type FieldDef } from './CrudPage'

const FIELDS: FieldDef[] = [
  { name: 'login', label: 'Login', required: true, createOnly: true, maxLength: 50, hint: 'Mínimo de 3 caracteres.' },
  { name: 'password', label: 'Senha', type: 'password', requiredOnCreate: true, hint: 'Mínimo de 6 caracteres.' },
  { name: 'pin', label: 'PIN', type: 'password', requiredOnCreate: true, pattern: '[0-9]{4,6}', inputMode: 'numeric', hint: '4 a 6 dígitos.' },
  { name: 'is_active', label: 'Conta ativa', type: 'checkbox', default: true },
]

function DeactivateButton({ account }: { account: Account }) {
  const deactivate = useAction(() => post(`/api/auth/users/${account.id}/deactivate`), {
    invalidate: [keys.accounts, keys.overview],
    success: `Conta "${account.login}" desativada.`,
  })
  return (
    <Button size="sm" variant="ghost" icon={<UserX className="h-3.5 w-3.5" />} loading={deactivate.isPending} onClick={() => deactivate.mutate()}>
      Desativar
    </Button>
  )
}

export function AccountsPage() {
  const me = useCurrentUser()
  const isMe = (account: Account) => account.id === me.id

  return (
    <>
      <PageHeader
        title="Contas"
        subtitle="Crie o acesso de cada jogador e combine a senha e o PIN pessoalmente. Desativar bloqueia o acesso na hora."
      />
      <CrudPage<Account>
        title="Contas"
        singular="Conta"
        feminine
        query={useAccounts()}
        queryKey={keys.accounts}
        extraInvalidate={[keys.overview]}
        endpoint="/api/auth/users"
        itemEndpoint={(id) => `/api/auth/users/${id}`}
        fields={FIELDS}
        toPayload={(v, mode) => {
          if (mode === 'create') return { login: text(v.login), password: v.password, pin: v.pin, role: 'player', is_active: v.is_active }
          return { is_active: v.is_active, ...(v.password ? { password: v.password } : {}), ...(v.pin ? { pin: v.pin } : {}) }
        }}
        toForm={(a) => ({ login: a.login, password: '', pin: '', is_active: a.is_active })}
        canEdit={(a) => !isMe(a)}
        canDelete={(a) => !isMe(a)}
        searchText={(a) => a.login}
        itemActions={(a) => (a.is_active && !isMe(a) ? <DeactivateButton account={a} /> : null)}
        renderItem={(a) => (
          <div>
            <p className="flex flex-wrap items-center gap-2 font-semibold text-parchment">
              {a.login}
              <Badge tone={a.role === 'master' ? 'gold' : 'arcane'}>{a.role === 'master' ? 'Mestre' : 'Jogador'}</Badge>
              {!a.is_active && <Badge tone="blood">desativada</Badge>}
              {isMe(a) && <Badge>você</Badge>}
            </p>
            <p className="mt-0.5 text-xs text-parchment-faint">Criada em {formatDateTime(a.created_at)}</p>
          </div>
        )}
      />
    </>
  )
}
