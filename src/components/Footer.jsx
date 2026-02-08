function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="py-12 px-4 border-t border-charcoal-400/20">
      <div className="max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-8 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/Assets/daylock_logo.png" 
                alt="Daylock Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-white font-bold text-lg">Daylock</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Your Day. Locked.<br />
              One Room at a Time.
            </p>
          </div>
          
          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <a href="#how-it-works" className="text-gray-500 hover:text-white text-sm transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#waitlist" className="text-gray-500 hover:text-white text-sm transition-colors">
                  Join Waitlist
                </a>
              </li>
              <li>
                <span className="text-gray-600 text-sm">Pricing (Coming Soon)</span>
              </li>
            </ul>
          </div>
          
          {/* Connect */}
          <div>
            <h4 className="text-white font-semibold mb-4">Connect</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:hello@daylock.app" className="text-gray-500 hover:text-white text-sm transition-colors">
                  hello@daylock.app
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  @daylock
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="pt-8 border-t border-charcoal-400/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">
            © {currentYear} Daylock. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
        
        {/* Commitment tagline */}
        <div className="mt-8 text-center">
          <p className="text-gray-700 text-xs">
            Built for those who show up. Every. Single. Day.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
