import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from './cn'

interface FieldShellProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: (props: { id: string; describedBy?: string }) => ReactNode
  className?: string
}

/** Rótulo + controle + dica/erro, com os ids de acessibilidade já ligados. */
function FieldShell({ label, hint, error, required, children, className }: FieldShellProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-parchment-muted">
        {label}
        {required && (
          <span className="text-gold" aria-hidden>
            {' '}*
          </span>
        )}
      </label>
      {children({ id, describedBy })}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-blood">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1 text-xs text-parchment-faint">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

type Common = { label: string; hint?: string; error?: string; className?: string }

export function TextField({ label, hint, error, className, required, ...props }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy }) => (
        <input
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="field-control"
          {...props}
        />
      )}
    </FieldShell>
  )
}

export function TextArea({ label, hint, error, className, required, ...props }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy }) => (
        <textarea
          id={id}
          required={required}
          rows={props.rows ?? 3}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="field-control resize-y"
          {...props}
        />
      )}
    </FieldShell>
  )
}

export interface Option {
  value: string | number
  label: string
}

export function SelectField({
  label,
  hint,
  error,
  className,
  required,
  options,
  placeholder = 'Selecione...',
  ...props
}: Common & SelectHTMLAttributes<HTMLSelectElement> & { options: Option[]; placeholder?: string | null }) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy }) => (
        <select id={id} required={required} aria-describedby={describedBy} className="field-control" {...props}>
          {placeholder !== null && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  )
}

export function CheckboxField({ label, className, ...props }: { label: string; className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <label htmlFor={id} className={cn('flex cursor-pointer items-center gap-2 text-sm text-parchment-muted', className)}>
      <input id={id} type="checkbox" className="h-4 w-4 accent-[rgb(var(--gold))]" {...props} />
      {label}
    </label>
  )
}
