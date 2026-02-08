/**
 * Reusable Button Component
 * Variants: primary, secondary, ghost, danger
 * Sizes: sm, md, lg
 */

const variants = {
  primary: 'bg-accent hover:bg-accent-dark text-charcoal-900 font-semibold',
  secondary: 'bg-charcoal-500 hover:bg-charcoal-400 text-white border border-charcoal-300/20',
  ghost: 'bg-transparent hover:bg-charcoal-500/50 text-gray-400 hover:text-white',
  danger: 'bg-red-500 hover:bg-red-600 text-white font-semibold',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-5 py-2.5 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-lg',
  full: 'w-full px-6 py-3 text-base rounded-lg',
}

function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props 
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center 
        transition-all duration-300 
        ${variants[variant]} 
        ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-glow cursor-pointer'}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
