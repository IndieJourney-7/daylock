const comparisons = [
  {
    others: 'Self-tracking with no consequences',
    daylock: 'Accountability partners who enforce your commitments',
  },
  {
    others: 'Flexible schedules you keep breaking',
    daylock: 'Time-locked rooms that close if you miss them',
  },
  {
    others: 'Promises you make to yourself',
    daylock: 'Proof verified by someone who cares',
  },
  {
    others: 'Apps that remind and nag',
    daylock: 'Real people watching you show up',
  },
]

function Differentiation() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
          This Is Different
        </h2>
        <p className="text-gray-500 text-center mb-12 max-w-lg mx-auto">
          Daylock isn't self-help. It's external accountability.<br />
          Someone else holds the keys to your day.
        </p>
        
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
