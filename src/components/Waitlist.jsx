import { useState } from 'react'

function Waitlist() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email) {
      setSubmitted(true)
      // Here you would typically send the email to your backend
    }
  }

  return (
    <section id="waitlist" className="py-20 px-4">
      <div className="max-w-xl mx-auto">
        <div className="glass-card rounded-2xl p-8 sm:p-12 text-center glow-border">
          {!submitted ? (
            <>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Ready to Lock Your Day?
              </h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Join the waitlist. No spam, no hype.<br />
                Just an invite when we're ready.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full bg-charcoal-500/30 border border-charcoal-300/20 rounded-lg px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-accent/50 transition-colors text-center"
                />
                
                <button
                  type="submit"
                  className="w-full py-4 bg-accent hover:bg-accent-dark text-charcoal-900 font-semibold rounded-lg transition-all duration-300 hover:shadow-glow"
                >
                  Join the Waitlist
                </button>
              </form>
              
              <p className="text-gray-600 text-sm mt-6">
                Free to join. No credit card required.
              </p>
            </>
          ) : (
            <div className="py-8 fade-in">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">You're on the list.</h3>
              <p className="text-gray-500">
                We'll reach out when it's time to lock your first day.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default Waitlist
