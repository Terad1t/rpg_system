import { useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'
import { post } from '@/api/client'
import { useAction, useClasses, useRaces } from '@/api/queries'
import { Button } from '@/ui/Button'
import { SelectField, TextArea, TextField } from '@/ui/Field'
import { Panel } from '@/ui/Panel'
import { int, options, text } from '@/lib/forms'

const EMPTY = { name: '', codename: '', raca_id: '', classe_id: '', age: '', height: '', description: '' }

export function RequestCharacterForm() {
  const races = useRaces()
  const classes = useClasses()
  const [values, setValues] = useState(EMPTY)
  const set = (field: keyof typeof EMPTY) => (e: { target: { value: string } }) => setValues((p) => ({ ...p, [field]: e.target.value }))
  const send = useAction(
    () =>
      post('/api/characters/requests/', {
        name: text(values.name),
        codename: text(values.codename),
        raca_id: int(values.raca_id),
        classe_id: int(values.classe_id),
        age: int(values.age),
        height: values.height ? Number(values.height) : null,
        description: text(values.description),
      }),
    { invalidate: [['my-requests']], success: 'Pedido enviado! O mestre vai avaliar.', failure: 'Não foi possível enviar' },
  )

  const submit = (event: FormEvent) => {
    event.preventDefault()
    send.mutate(undefined, { onSuccess: () => setValues(EMPTY) })
  }

  return (
    <Panel title="Pedir um personagem" eyebrow="Nova ficha">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Nome" required value={values.name} onChange={set('name')} />
          <TextField label="Codinome" maxLength={50} value={values.codename} onChange={set('codename')} hint="Como você aparece no chat." />
          <SelectField label="Raça" required options={options(races.data)} value={values.raca_id} onChange={set('raca_id')} />
          <SelectField label="Classe" required options={options(classes.data)} value={values.classe_id} onChange={set('classe_id')} />
          <TextField label="Idade" type="number" min={0} value={values.age} onChange={set('age')} />
          <TextField label="Altura (m)" type="number" min={0} step="0.01" value={values.height} onChange={set('height')} />
        </div>
        <TextArea label="História" rows={4} maxLength={2000} value={values.description} onChange={set('description')} placeholder="De onde vem, o que procura..." />
        <Button type="submit" icon={<Send className="h-4 w-4" />} loading={send.isPending} className="w-full sm:w-auto">
          Enviar pedido
        </Button>
      </form>
    </Panel>
  )
}
