const comparisons = [
  {
    others: 'Track it yourself (and lie to yourself)',
    daylock: 'Someone else verifies your proof',
  },
  {
    others: '"Flexible" schedules you keep pushing',
    daylock: 'Time-locked windows that close permanently',
  },
  {
    others: 'Motivation that fades by Tuesday',
    daylock: 'External pressure that doesn\'t care about your mood',
  },
  {
    others: 'Apps that send reminders you swipe away',
    daylock: 'A real person watching if you showed up',
  },
]

function Differentiation() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <p className="text-accent text-sm font-semibold text-center mb-2 tracking-wide uppercase">
          Why this works
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
          You've Tried Discipline Apps Before.
          <span className="block text-gray-400 font-normal text-lg mt-1">They didn't work because you were accountable to yourself.</span>
        </h2>
        
        <div className="space-y-4">
          {comparisons.map((item, index) => (
            <div 
              key={index}
              className="glass-card rounded-xl p-5 sm:p-6 grid sm:grid-cols-2 gap-4 fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Others */}
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm sm:text-base">{item.others}</p>
              </div>
              
              {/* Daylock */}
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white text-sm sm:text-base font-medium">{item.daylock}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Differentiation
