const steps = [
  {
    number: 1,
    title: 'Create Rooms for Each Habit',
    description: 'Gym at 6 AM. Work at 9 AM. Study at 7 PM. Each room has its own time window — miss it and the door locks.',
    emoji: '🚪',
    accent: 'from-green-500/20 to-transparent',
  },
  {
    number: 2,
    title: 'Assign Someone Who Won\'t Let You Slide',
    description: 'Your trainer, friend, or mentor becomes the admin. They set the rules. They approve or reject your proof.',
    emoji: '🤝',
    accent: 'from-blue-500/20 to-transparent',
  },
  {
    number: 3,
    title: 'Show Up. Upload Proof. Get Verified.',
    description: 'Take a photo, submit before the timer runs out. Your partner reviews it. No proof = no streak. The record is permanent.',
    emoji: '📸',
    accent: 'from-orange-500/20 to-transparent',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Section card */}
        <div className="glass-card rounded-2xl p-8 sm:p-12">
          <p className="text-accent text-sm font-semibold text-center mb-2 tracking-wide uppercase">
            3 steps to discipline
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
            How Daylock Works
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-lg mx-auto">
            No willpower hacks. No motivational quotes. Just a system that makes quitting harder than showing up.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className="text-center fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Emoji container with gradient bg */}
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-b ${step.accent} border border-charcoal-300/20 flex items-center justify-center`}>
                    <span className="text-4xl">{step.emoji}</span>
                  </div>
                  {/* Step number badge */}
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent text-charcoal-900 text-xs font-bold flex items-center justify-center">
                    {step.number}
                  </div>
                </div>
                
                {/* Title */}
                <h3 className="text-lg font-semibold text-white mb-2">
                  {step.title}
                </h3>
                
                {/* Description */}
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* Connector line visual (desktop only) */}
          <div className="hidden md:flex justify-center mt-10">
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-charcoal-500/30 border border-charcoal-400/20">
              <span className="text-gray-500 text-sm">Result:</span>
              <span className="text-white font-semibold text-sm">You either show up with proof, or the record shows you didn't.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
