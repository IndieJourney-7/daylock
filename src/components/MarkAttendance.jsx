import { useState } from 'react'
import CameraIcon from './icons/CameraIcon'

function MarkAttendance() {
  const [note, setNote] = useState('Did my workout!')
  const [uploaded, setUploaded] = useState(true)

  return (
    <section className="py-20 px-4">
      <div className="max-w-md mx-auto">
        <div className="glass-card rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
            Mark Your Attendance
          </h2>
          <p className="text-gray-500 text-center text-sm mb-8">
            Upload Your Proof
          </p>
          
          {/* Upload area */}
          <div className="relative mb-6">
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              uploaded 
                ? 'border-accent/50 bg-accent/5' 
                : 'border-charcoal-300 hover:border-gray-500'
            }`}>
              <div className="relative inline-flex items-center justify-center mb-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                  uploaded ? 'bg-charcoal-500/50' : 'bg-charcoal-400/30'
                }`}>
                  <CameraIcon className={`w-8 h-8 ${uploaded ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                
                {/* Checkmark badge when uploaded */}
                {uploaded && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              
              <button className="flex items-center justify-center gap-2 text-gray-400 text-sm mx-auto hover:text-white transition-colors">
                <CameraIcon className="w-4 h-4" />
                Take a Photo or Upload
              </button>
            </div>
          </div>
          
          {/* Note input */}
          <div className="mb-6">
            <label className="block text-gray-500 text-sm mb-2">
              - Add a Note <span className="text-gray-600">(Optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full bg-charcoal-500/30 border border-charcoal-300/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          
          {/* Submit button */}
          <button className="w-full py-4 bg-accent hover:bg-accent-dark text-charcoal-900 font-semibold rounded-lg transition-all duration-300 hover:shadow-glow">
            Submit
          </button>
        </div>
      </div>
    </section>
  )
}

export default MarkAttendance
