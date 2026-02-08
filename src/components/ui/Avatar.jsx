/**
 * Reusable Avatar Component
 * With placeholder fallback
 */

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28',
}

function Avatar({ 
  src, 
  alt = 'User', 
  size = 'md',
  className = '',
  ...props 
}) {
  return (
    <div
      className={`
        relative rounded-full overflow-hidden 
        bg-charcoal-500 border-2 border-charcoal-400/30
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {src ? (
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-charcoal-500">
          <svg 
            className="w-1/2 h-1/2 text-gray-500" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
      )}
    </div>
  )
}

export default Avatar
