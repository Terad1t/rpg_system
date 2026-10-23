import { useRef, useState, type FormEvent } from 'react'
import { ImageUp, Save } from 'lucide-react'
import { http, put } from '@/api/client'
import { keys, useAction } from '@/api/queries'
import type { PanelCharacter } from '@/api/types'
import { Button } from '@/ui/Button'
import { TextArea, TextField } from '@/ui/Field'
import { Panel } from '@/ui/Panel'
import { Avatar } from '@/ui/misc'

export const CODENAME_MAX = 50
export const DESCRIPTION_MAX = 2000
const ACCEPTED = 'image/png,image/jpeg,image/webp'

/** O jogador edita codinome, história e retrato; o resto é com o mestre. */
export function ProfileEditor({ character }: { character: PanelCharacter }) {
  const [codename, setCodename] = useState(character.codename ?? '')
  const [description, setDescription] = useState(character.description ?? '')
  const fileRef = useRef<HTMLInputElement>(null)

  const save = useAction(() => put(`/api/my-characters/${character.id}`, { codename: codename.trim() || null, description: description.trim() || null }), {
    invalidate: [keys.panel],
    success: 'Ficha atualizada.',
  })
  const upload = useAction(
    (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return http.post(`/api/my-characters/${character.id}/portrait`, form)
    },
    { invalidate: [keys.panel], success: 'Retrato atualizado.', failure: 'Não foi possível enviar a imagem' },
  )

  const submit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate()
  }

  return (
    <Panel title="Editar ficha" eyebrow="Seu personagem">
      <div className="mb-6 flex items-center gap-4">
        <Avatar src={character.portrait || character.race.image} name={character.codename || character.name} size="xl" />
        <div>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED}
            className="sr-only"
            aria-label="Escolher retrato"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) upload.mutate(file)
              e.target.value = ''
            }}
          />
          <Button variant="secondary" icon={<ImageUp className="h-4 w-4" />} loading={upload.isPending} onClick={() => fileRef.current?.click()}>
            Trocar retrato
          </Button>
          <p className="mt-1 text-xs text-parchment-faint">PNG, JPG ou WebP, até 2 MB.</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <TextField label="Codinome" maxLength={CODENAME_MAX} value={codename} onChange={(e) => setCodename(e.target.value)} hint={`${codename.length}/${CODENAME_MAX} · aparece no chat`} />
        <TextArea label="História" rows={6} maxLength={DESCRIPTION_MAX} value={description} onChange={(e) => setDescription(e.target.value)} hint={`${description.length}/${DESCRIPTION_MAX}`} />
        <p className="text-xs text-parchment-faint">Nome, raça e classe são definidos pelo mestre.</p>
        <div className="flex justify-end">
          <Button type="submit" icon={<Save className="h-4 w-4" />} loading={save.isPending}>
            Salvar
          </Button>
        </div>
      </form>
    </Panel>
  )
}
