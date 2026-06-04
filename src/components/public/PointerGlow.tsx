'use client'

import { useEffect } from 'react'

export function PointerGlow() {
  useEffect(() => {
    const root = document.documentElement
    let raf = 0
    let x = 0
    let y = 0

    const update = () => {
      raf = 0
      const width = window.innerWidth || 1
      const height = window.innerHeight || 1
      const xp = Math.round((x / width) * 100)
      const yp = Math.round((y / height) * 100)
      const dx = ((x / width) - 0.5) * 12
      const dy = ((y / height) - 0.5) * 12
      root.style.setProperty('--cursor-x', `${xp}%`)
      root.style.setProperty('--cursor-y', `${yp}%`)
      root.style.setProperty('--grid-shift-x', `${dx.toFixed(2)}px`)
      root.style.setProperty('--grid-shift-y', `${dy.toFixed(2)}px`)
      root.style.setProperty('--cursor-glow-a', '0.22')
    }

    const handleMove = (event: PointerEvent) => {
      x = event.clientX
      y = event.clientY
      if (raf) return
      raf = window.requestAnimationFrame(update)
    }

    const handleLeave = () => {
      root.style.setProperty('--cursor-glow-a', '0')
      root.style.setProperty('--grid-shift-x', '0px')
      root.style.setProperty('--grid-shift-y', '0px')
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerdown', handleMove)
    window.addEventListener('pointerleave', handleLeave)

    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerdown', handleMove)
      window.removeEventListener('pointerleave', handleLeave)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [])

  return null
}
