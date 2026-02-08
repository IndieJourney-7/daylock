const steps = [
  {
    number: 1,
    title: 'Create Your Rooms',
    description: 'Gym, Work, Food — each room has its own schedule, rules, and accountability partner.',
    image: '/Assets/daylock_calendar.png',
  },
  {
    number: 2,
    title: 'Assign a Partner',
    description: 'Your trainer, friend, or mentor controls the room. They set the rules. They mark attendance.',
    image: '/Assets/daylock_door.png',
  },
  {
    number: 3,
    title: 'Show Up with Proof',
    description: "Upload your photo. Miss the time window? The door stays locked. No excuses.",
    image: '/Assets/daylock_camera.png',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Section card */}
        <div className="glass-card rounded-2xl p-8 sm:p-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className="text-center fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Image container */}
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div className="w-32 h-32 rounded-2xl bg-charcoal-500/50 border border-charcoal-300/20 flex items-center justify-center overflow-hidden">
                    <img 
                      src={step.image} 
                      alt={step.title}
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                </div>
                
                {/* Step number and title */}
                <h3 className="text-lg font-semibold text-white mb-2">
                  {step.number}. {step.title}
                </h3>
                
                {/* Description */}
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
