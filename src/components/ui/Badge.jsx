/**
 * Reusable Badge Component
 * Variants: open, locked, present, absent, pending, success, warning, danger
 */

const variants = {
  open: 'bg-accent/20 text-accent border-accent/30',
  locked: 'bg-charcoal-400/20 text-gray-500 border-charcoal-400/30',
  present: 'bg-accent/20 text-accent border-accent/30',
  absent: 'bg-red-500/20 text-red-400 border-red-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  success: 'bg-accent/20 text-accent border-accent/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  danger: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs',
  lg: 'px-4 py-1.5 text-sm',
}

function Badge({ 
  children, 
  variant = 'locked', 
  size = 'md',
  className = '',
  ...props 
}) {
  return (
    <span
      className={`
        inline-flex items-center justify-center
        font-medium uppercase tracking-wide
        rounded-md border
        ${variants[variant]} 
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  )
}

export default Badge
