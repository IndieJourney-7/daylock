import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './contexts'
import './index.css'

// Suppress Supabase AbortError in development
// These occur during normal navigation and are harmless
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'AbortError' || 
      event.reason?.message?.includes('aborted') ||
      event.reason?.message?.includes('AbortError')) {
    event.preventDefault()
  }
})

// Note: Strict Mode removed to prevent AbortError with Supabase
// Strict Mode double-mounts components, causing request cancellations
ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
)
