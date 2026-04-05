import Button from './Button'

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  actions = [],
  size = 'md'
}) {
  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`bg-dark-secondary border border-dark-border rounded-lg shadow-2xl ${sizes[size]}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <h2 className="text-xl font-bold text-orange-500">{title}</h2>
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary-orange transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {actions.length > 0 && (
          <div className="flex gap-3 justify-end p-6 border-t border-dark-border">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'primary'}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
