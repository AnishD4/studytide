'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

export default function VantaWavesBackground({ children, className = '', darkOverlay = true }) {
  const vantaRef = useRef(null)
  const [vantaEffect, setVantaEffect] = useState(null)
  const [scriptsLoaded, setScriptsLoaded] = useState({ three: false, vanta: false })

  useEffect(() => {
    // Only initialize when both scripts are loaded
    if (!scriptsLoaded.three || !scriptsLoaded.vanta) return
    if (vantaEffect) return
    if (!vantaRef.current) return

    // Small delay to ensure scripts are fully executed
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && window.VANTA && window.THREE) {
        try {
          const effect = window.VANTA.WAVES({
            el: vantaRef.current,
            THREE: window.THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            // Darker ocean theme colors for better contrast
            color: 0x1e3a5f, // Darker ocean blue
            shininess: 30,
            waveHeight: 15,
            waveSpeed: 1,
            zoom: 1,
          })
          setVantaEffect(effect)
        } catch (error) {
          console.error('Error initializing Vanta:', error)
        }
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [scriptsLoaded, vantaEffect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vantaEffect) {
        vantaEffect.destroy()
      }
    }
  }, [vantaEffect])

  return (
    <>
      {/* Load Three.js */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"
        strategy="afterInteractive"
        onLoad={() => setScriptsLoaded(prev => ({ ...prev, three: true }))}
      />
      {/* Load Vanta Waves */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.waves.min.js"
        strategy="afterInteractive"
        onLoad={() => setScriptsLoaded(prev => ({ ...prev, vanta: true }))}
      />

      <div ref={vantaRef} className={`relative ${className}`}>
        {/* Dark gradient overlay for better text contrast */}
        {darkOverlay && (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/30 to-slate-900/60 pointer-events-none z-[1]" />
        )}

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </>
  )
}

// Lighter version without scripts for pages that don't need heavy animations
export function SimpleWavesBackground({ children, className = '' }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Animated CSS waves with darker colors */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Background gradient - darker */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-cyan-900 to-slate-900" />

        {/* Animated wave layers */}
        <svg
          className="absolute bottom-0 left-0 w-[200%] h-32 animate-wave"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-cyan-600/30"
          />
        </svg>
        <svg
          className="absolute bottom-0 left-0 w-[200%] h-24 animate-wave"
          style={{ animationDelay: '-3s', animationDuration: '12s' }}
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-teal-500/20"
          />
        </svg>
        <svg
          className="absolute bottom-0 left-0 w-[200%] h-20 animate-wave"
          style={{ animationDelay: '-5s', animationDuration: '15s' }}
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-sky-400/15"
          />
        </svg>

        {/* Floating bubbles */}
        <div className="absolute bottom-0 left-[10%] w-3 h-3 bg-white/20 rounded-full animate-bubble" style={{ animationDelay: '0s' }} />
        <div className="absolute bottom-0 left-[25%] w-4 h-4 bg-white/15 rounded-full animate-bubble" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-[45%] w-2 h-2 bg-white/25 rounded-full animate-bubble" style={{ animationDelay: '4s' }} />
        <div className="absolute bottom-0 left-[65%] w-3 h-3 bg-white/20 rounded-full animate-bubble" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-[80%] w-4 h-4 bg-white/15 rounded-full animate-bubble" style={{ animationDelay: '3s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

