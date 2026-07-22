'use client'

import { useEffect } from 'react'

export function CertificateSecurityGuard() {
  useEffect(() => {
    // 1. Terminate function on devtools trigger
    const terminatePage = () => {
      try {
        document.body.innerHTML = '<div style="background:#0f172a;color:#ef4444;height:100vh;display:grid;place-items:center;font-family:sans-serif;font-weight:bold;font-size:1.5rem;">Access Denied. DevTools Inspection Detected.</div>'
        window.close()
        window.location.replace('about:blank')
      } catch {
        window.location.href = 'about:blank'
      }
    }

    // 2. Prevent right click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    // 3. Prevent inspect & devtools keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey

      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault()
        e.stopPropagation()
        terminatePage()
        return false
      }

      // Ctrl/Cmd + Shift + I/J/C/U or Ctrl/Cmd + U or S
      if (ctrlOrCmd) {
        const key = e.key.toLowerCase()
        if (
          (e.shiftKey && (key === 'i' || key === 'j' || key === 'c' || key === 'u')) ||
          key === 'u' ||
          key === 's'
        ) {
          e.preventDefault()
          e.stopPropagation()
          terminatePage()
          return false
        }
      }
    }

    // 4. Prevent drag start
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault()
      return false
    }

    // 5. Continuous DevTools Detection Heuristics
    const checkDevTools = () => {
      const threshold = 160
      const widthDiff = window.outerWidth - window.innerWidth > threshold
      const heightDiff = window.outerHeight - window.innerHeight > threshold

      if (widthDiff || heightDiff) {
        terminatePage()
      }

      // Debugger detection loop
      const start = performance.now()
      // eslint-disable-next-line no-debugger
      debugger
      const end = performance.now()
      if (end - start > 100) {
        terminatePage()
      }
    }

    window.addEventListener('contextmenu', handleContextMenu, true)
    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('dragstart', handleDragStart, true)

    const interval = setInterval(checkDevTools, 500)

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, true)
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('dragstart', handleDragStart, true)
      clearInterval(interval)
    }
  }, [])

  return (
    <style jsx global>{`
      body {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      img, canvas, svg {
        -webkit-user-drag: none !important;
        user-drag: none !important;
        pointer-events: none;
      }
      .interactive-element {
        pointer-events: auto !important;
      }
    `}</style>
  )
}
