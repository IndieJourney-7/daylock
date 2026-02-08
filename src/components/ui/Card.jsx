/**
 * Reusable Card Component
 * Variants: default, active, locked
 */

const variants = {
  default: 'bg-charcoal-600/50 border-charcoal-400/20',
  active: 'bg-gradient-to-br from-accent/10 to-charcoal-600/50 border-accent/30',
  locked: 'bg-charcoal-700/50 border-charcoal-400/10 opacity-75',
}

function Card({ 
  children, 
  variant = 'default', 
  className = '',
  padding = 'p-5',
  onClick,
  ...props 
}) {
  const isClickable = !!onClick
  
  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl border 
        ${variants[variant]} 
        ${padding}
        ${isClickable ? 'cursor-pointer hover:border-accent/40 transition-all duration-300' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
