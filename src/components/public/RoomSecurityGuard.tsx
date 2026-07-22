'use client'

import { useEffect } from 'react'

export function RoomSecurityGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 1. Prevent Right-Click Context Menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    // 2. Prevent DevTools & Source Code Keyboard Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 key
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }

      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
      ) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u' || e.key === 'S' || e.key === 's')) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    // 3. DevTools Active Monitoring & Tab Blanking
    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160
      const heightThreshold = window.outerHeight - window.innerHeight > 160

      if (widthThreshold || heightThreshold) {
        document.body.innerHTML = `
          <div style="height:100vh;display:flex;align-items:center;justify-content:center;background:#030712;color:#ef4444;font-family:sans-serif;text-align:center;padding:2rem;">
            <div>
              <h1 style="font-size:2rem;margin-bottom:1rem;">⚠️ Access Denied</h1>
              <p style="color:#9ca3af;">Developer tools inspection is strictly prohibited on this secure page.</p>
            </div>
          </div>
        `
        try {
          window.close()
        } catch {
          // ignore
        }
      }
    }

    window.addEventListener('contextmenu', handleContextMenu)
    window.addEventListener('keydown', handleKeyDown)
    const interval = setInterval(checkDevTools, 1000)

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu)
      window.removeEventListener('keydown', handleKeyDown)
      clearInterval(interval)
    }
  }, [])

  return (
    <div
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
      onCopy={e => e.preventDefault()}
      onCut={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      {children}
    </div>
  )
}
