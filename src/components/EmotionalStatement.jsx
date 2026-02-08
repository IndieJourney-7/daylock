function EmotionalStatement() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-3xl mx-auto text-center">
        {/* Decorative line */}
        <div className="w-12 h-px bg-accent/50 mx-auto mb-12" />
        
        <blockquote className="fade-in">
          <p className="text-2xl sm:text-3xl lg:text-4xl font-light text-white leading-relaxed mb-8">
            "When someone else is watching,
            <span className="block mt-2 text-accent font-medium">
              you don't let yourself down."
            </span>
          </p>
        </blockquote>
        
        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
          Your trainer marks your gym attendance.<br />
          Your friend checks your work proof.<br />
          The door only opens when it's time — and closes when you're late.
        </p>
        
        {/* Decorative line */}
        <div className="w-12 h-px bg-accent/50 mx-auto mt-12" />
      </div>
    </section>
  )
}

export default EmotionalStatement
