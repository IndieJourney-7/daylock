import { useState } from 'react'

const features = [
  {
    title: 'Your Dashboard',
    description: 'See every room, your streak, discipline score, and today\'s progress at a glance.',
    image: '/Assets/Userdashboard.png',
  },
  {
    title: 'Analytics',
    description: 'Track your attendance rate, completion trends, and performance over time.',
    image: '/Assets/Analytics.png',
  },
  {
    title: 'Leaderboard',
    description: 'Compete with your accountability group. Top streaks and highest scores rise to the top.',
    image: '/Assets/Leadershipboard.png',
  },
  {
    title: 'Challenges',
    description: 'Join time-bound challenges to push yourself — and prove you showed up.',
    image: '/Assets/challenges.png',
  },
  {
    title: 'Proof Gallery',
    description: 'Every check-in is backed by photo proof. Your gallery tells the real story.',
    image: '/Assets/gallery.png',
  },
  {
    title: 'History',
    description: 'Full attendance history — every hit, every miss, every streak recorded.',
    image: '/Assets/History.png',
  },
]

function FeaturesShowcase() {
  const [active, setActive] = useState(0)

  return (
    <section className="py-20 px-4 bg-charcoal-900 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[150px] rounded-full" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase text-accent bg-accent/10 rounded-full mb-4">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Everything You Need to Stay Locked In
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Built for people who are done making promises to themselves.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {features.map((f, i) => (
            <button
              key={f.title}
              onClick={() => setActive(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                active === i
                  ? 'bg-accent text-charcoal-900'
                  : 'bg-charcoal-700/50 text-gray-400 hover:text-white hover:bg-charcoal-700'
              }`}
            >
              {f.title}
            </button>
          ))}
        </div>

        {/* Active feature display */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Screenshot */}
          <div className="order-2 md:order-1">
            <div className="rounded-2xl border-2 border-charcoal-400/20 bg-charcoal-800/80 p-2 shadow-2xl shadow-accent/10 overflow-hidden">
              <img
                src={features[active].image}
                alt={`${features[active].title} — Daylock feature screenshot`}
                className="w-full rounded-xl"
              />
            </div>
          </div>

          {/* Description */}
          <div className="order-1 md:order-2 flex flex-col justify-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              {features[active].title}
            </h3>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              {features[active].description}
            </p>
            {/* Feature list bullets */}
            <ul className="space-y-3">
              {active === 0 && (
                <>
                  <FeatureBullet text="Room status: Done, Open, Missed, or Locked" />
                  <FeatureBullet text="Live countdown timers for every window" />
                  <FeatureBullet text="Streak counter & discipline score" />
                </>
              )}
              {active === 1 && (
                <>
                  <FeatureBullet text="Daily, weekly, and monthly breakdowns" />
                  <FeatureBullet text="Attendance rate & approval rate" />
                  <FeatureBullet text="Export to PDF or Excel" />
                </>
              )}
              {active === 2 && (
                <>
                  <FeatureBullet text="Score based on streaks, rate & consistency" />
                  <FeatureBullet text="Room-level and global rankings" />
                  <FeatureBullet text="See where you stand vs your group" />
                </>
              )}
              {active === 3 && (
                <>
                  <FeatureBullet text="Community or room-based challenges" />
                  <FeatureBullet text="Time-bound with clear rules" />
                  <FeatureBullet text="Earn bonus discipline points" />
                </>
              )}
              {active === 4 && (
                <>
                  <FeatureBullet text="Photo proof for every check-in" />
                  <FeatureBullet text="Admin reviews & approves" />
                  <FeatureBullet text="Sorted by date for easy browsing" />
                </>
              )}
              {active === 5 && (
                <>
                  <FeatureBullet text="Complete attendance log" />
                  <FeatureBullet text="Filter by room, status, or date" />
                  <FeatureBullet text="Track improvement over time" />
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureBullet({ text }) {
  return (
    <li className="flex items-center gap-2.5 text-gray-300">
      <svg className="w-5 h-5 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-sm">{text}</span>
    </li>
  )
}

export default FeaturesShowcase
