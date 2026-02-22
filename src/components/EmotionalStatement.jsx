import { Link } from 'react-router-dom'
import { useAuth } from '../contexts'

function EmotionalStatement() {
  const { user } = useAuth()

  return (
    <section className="py-24 px-4">
      <div className="max-w-3xl mx-auto text-center">
        {/* Decorative line */}
        <div className="w-12 h-px bg-accent/50 mx-auto mb-12" />
        
        <blockquote className="fade-in">
          <p className="text-2xl sm:text-3xl lg:text-4xl font-light text-white leading-relaxed mb-8">
            "The gap between who you are and who you want to be
            <span className="block mt-2 text-accent font-medium">
              closes when someone else is watching."
            </span>
          </p>
        </blockquote>
        
        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed mb-10">
          Your trainer verifies your gym photo at 6 AM.<br />
          Your friend reviews your work proof at 9 AM.<br />
          Miss it? Your streak dies. Your record updates. The evidence is permanent.
        </p>

        {/* Mid-page CTA */}
        {!user && (
          <Link
            to="/login"
            state={{ from: { pathname: '/rooms' } }}
            className="inline-flex items-center justify-center px-8 py-4 bg-accent hover:bg-accent-dark text-charcoal-900 font-semibold rounded-lg transition-all duration-300 hover:shadow-glow text-lg"
          >
            Start For Free — Lock Your First Day
          </Link>
        )}
        
        {/* Decorative line */}
        <div className="w-12 h-px bg-accent/50 mx-auto mt-12" />
      </div>
    </section>
  )
}

export default EmotionalStatement
