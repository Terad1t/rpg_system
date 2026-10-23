import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { put } from '@/api/client'
import { keys, useAction, useNote } from '@/api/queries'
import { Button } from '@/ui/Button'
import { TextArea } from '@/ui/Field'
import { Panel } from '@/ui/Panel'

/** Anotações pessoais do jogador (só ele vê). */
export function Notes() {
  const note = useNote()
  const [content, setContent] = useState('')
  useEffect(() => {
    if (note.data) setContent(note.data.content ?? '')
  }, [note.data])
  const save = useAction(() => put('/api/notes/', { content }), { invalidate: [keys.note], success: 'Anotações salvas.' })
  const dirty = content !== (note.data?.content ?? '')

  return (
    <Panel title="Anotações" eyebrow="Só você vê">
      <TextArea
        label="Diário de campanha"
        rows={12}
        maxLength={5000}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Nomes de NPCs, pistas, dívidas com o taverneiro..."
        hint={`${content.length}/5000`}
      />
      <div className="mt-3 flex justify-end">
        <Button icon={<Save className="h-4 w-4" />} disabled={!dirty || !content.trim()} loading={save.isPending} onClick={() => save.mutate()}>
          Salvar
        </Button>
      </div>
    </Panel>
  )
}
