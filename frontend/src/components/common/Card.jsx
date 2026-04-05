export default function Card({ children, className = '', title = '', ...props }) {
  return (
    <div
      className={`bg-dark-secondary border border-dark-border rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 ${className}`}
      {...props}
    >
      {title && (
        <h3 className="text-xl font-bold text-orange-500 mb-4 pb-3 border-b border-dark-border">
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}
