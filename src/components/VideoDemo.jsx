function VideoDemo() {
  return (
    <section className="py-20 px-4 bg-charcoal-900 relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/5 blur-[120px] rounded-full" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          See Daylock in Action
        </h2>
        <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
          Watch how real users lock their day, submit proof, and build unbreakable streaks.
        </p>

        {/* Video embed with phone-frame-like wrapper */}
        <div className="relative mx-auto rounded-2xl border-2 border-charcoal-400/20 bg-charcoal-800/80 p-2 shadow-2xl shadow-accent/10 overflow-hidden aspect-video">
          <iframe
            className="w-full h-full rounded-xl"
            src="https://www.youtube.com/embed/5SpV4PYgTcI?rel=0&modestbranding=1"
            title="Daylock Demo — See how the accountability app works"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <p className="mt-6 text-gray-500 text-sm">
          60-second walkthrough · No signup required to watch
        </p>
      </div>
    </section>
  )
}

export default VideoDemo
