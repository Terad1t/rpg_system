import { useId } from 'react'

export default function Input({
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error = '',
  disabled = false,
  className = '',
  id,
  ...props
}) {
  const generatedId = useId()
  const inputId = id || generatedId
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-primary-orange mb-2">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        aria-invalid={error ? true : undefined}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`
          w-full px-4 py-2 bg-dark border border-dark-border rounded-lg
          text-white placeholder-secondary
          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}
