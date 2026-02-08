function AccountabilityPartner() {
  return (
    <section id="accountability" className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Your Partner Holds the Keys
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Each room has an accountability partner — someone you trust to keep you honest.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Gym Room Example */}
          <div className="glass-card rounded-xl p-6 fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="text-lg">🏋️</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Gym Room</h3>
                <p className="text-gray-500 text-xs">6:00 AM - 7:00 AM</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-accent mt-0.5">→</span>
                <p className="text-gray-400"><span className="text-white">Partner:</span> Your gym trainer</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent mt-0.5">→</span>
                <p className="text-gray-400"><span className="text-white">Rules:</span> Trainer sets the workout</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent mt-0.5">→</span>
                <p className="text-gray-400"><span className="text-white">Proof:</span> Upload gym selfie</p>
              </div>
            </div>
          </div>
          
          {/* Work Room Example */}
          <div className="glass-card rounded-xl p-6 fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="text-lg">💼</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Work Room</h3>
                <p className="text-gray-500 text-xs">9:00 AM - 1:00 PM</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-accent mt-0.5">→</span>
                <p className="text-gray-400"><span className="text-white">Partner:</span> Your serious friend</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent mt-0.5">→</span>
                <p className="text-gray-400"><span className="text-white">Rules:</span> No distractions policy</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent mt-0.5">→</span>
                <p className="text-gray-400"><span className="text-white">Proof:</span> Screenshot of work done</p>
              </div>
            </div>
          </div>
          
          {/* Food Room Example */}
          <div className="glass-card rounded-xl p-6 fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="text-lg">🥗</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Food Room</h3>
                <p className="text-gray-500 text-xs">12:00 PM - 1:00 PM</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-accent mt-0.5">→</span>
                <p className="text-gray-400"><span className="text-white">Partner:</span> Your nutritionist</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent mt-0.5">→</span>
                <p className="text-gray-400"><span className="text-white">Rules:</span> Healthy meals only</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent mt-0.5">→</span>
                <p className="text-gray-400"><span className="text-white">Proof:</span> Photo of your plate</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Key message */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-charcoal-500/50 border border-charcoal-300/20">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-gray-400 text-sm">
              Miss the time window? <span className="text-white font-medium">The door stays locked.</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AccountabilityPartner
