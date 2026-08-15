import { useEffect, useRef, useState } from 'react'

const BUBBLE_COLORS = ['#ff375f', '#00f5ff', '#32d74b', '#ffd700', '#bf5af2']
const ROWS = 9
const COLS = 10
const RADIUS = 20

export default function BubbleShooter({ isPaused, onScoreChange, onGameOver, onVictory, settings }) {
  const canvasRef = useRef(null)
  const [hud, setHud] = useState({ score: 0, bubblesLeft: 35, combo: 1 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let isMounted = true

    const width = 600
    const height = 650
    canvas.width = width
    canvas.height = height

    let score = 0
    let bubblesRemaining = 35
    let aimAngle = -Math.PI / 2
    let activeBubble = null
    let nextColor = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)]
    let currentColor = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)]
    let particles = []

    // Sound effect
    const playPop = (freq = 400) => {
      if (!settings?.soundEnabled) return
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime)
        gain.gain.setValueAtTime((settings?.volume || 0.7) * 0.15, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12)
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.12)
      } catch {}
    }

    // Grid Initialization
    const grid = []
    for (let r = 0; r < ROWS; r++) {
      grid[r] = []
      for (let c = 0; c < COLS; c++) {
        if (r < 5) {
          grid[r][c] = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)]
        } else {
          grid[r][c] = null
        }
      }
    }

    const getBubblePos = (r, c) => {
      const offsetX = (r % 2 === 1) ? RADIUS : 0
      const x = c * (RADIUS * 2) + RADIUS + 10 + offsetX
      const y = r * (RADIUS * 1.75) + RADIUS + 10
      return { x, y }
    }

    const handleAim = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect()
      const x = ((clientX - rect.left) / rect.width) * width
      const y = ((clientY - rect.top) / rect.height) * height
      const cannonX = width / 2
      const cannonY = height - 45
      aimAngle = Math.atan2(y - cannonY, x - cannonX)
      // Clamp angle so player can't shoot downwards
      if (aimAngle > -0.2) aimAngle = -0.2
      if (aimAngle < -Math.PI + 0.2) aimAngle = -Math.PI + 0.2
    }

    const fireBubble = () => {
      if (activeBubble || isPaused || bubblesRemaining <= 0) return
      activeBubble = {
        x: width / 2,
        y: height - 45,
        vx: Math.cos(aimAngle) * 14,
        vy: Math.sin(aimAngle) * 14,
        color: currentColor,
      }
      currentColor = nextColor
      nextColor = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)]
      bubblesRemaining--
      setHud(h => ({ ...h, bubblesLeft: bubblesRemaining }))
      playPop(300)
    }

    const onMouseMove = (e) => handleAim(e.clientX, e.clientY)
    const onMouseDown = () => fireBubble()
    const onTouchMove = (e) => {
      if (e.touches.length > 0) handleAim(e.touches[0].clientX, e.touches[0].clientY)
    }
    const onTouchEnd = () => fireBubble()

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)

    // Cluster finder (Flood Fill)
    const findCluster = (startR, startC, targetColor, visited = {}) => {
      const key = `${startR},${startC}`
      if (
        startR < 0 || startR >= ROWS || startC < 0 || startC >= COLS ||
        !grid[startR][startC] || grid[startR][startC] !== targetColor || visited[key]
      ) {
        return []
      }
      visited[key] = true
      let cluster = [{ r: startR, c: startC }]

      const neighbors = (startR % 2 === 1)
        ? [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]]
        : [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]

      neighbors.forEach(([dr, dc]) => {
        cluster = cluster.concat(findCluster(startR + dr, startC + dc, targetColor, visited))
      })
      return cluster
    }

    // Attach bubble to grid
    const attachBubble = (bubble) => {
      let closestR = 0
      let closestC = 0
      let minDist = Infinity

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (!grid[r][c]) {
            const pos = getBubblePos(r, c)
            const d = Math.hypot(pos.x - bubble.x, pos.y - bubble.y)
            if (d < minDist) {
              minDist = d
              closestR = r
              closestC = c
            }
          }
        }
      }

      grid[closestR][closestC] = bubble.color
      const cluster = findCluster(closestR, closestC, bubble.color)

      if (cluster.length >= 3) {
        cluster.forEach(({ r, c }) => {
          const pos = getBubblePos(r, c)
          grid[r][c] = null
          // Particles
          for (let i = 0; i < 10; i++) {
            particles.push({
              x: pos.x,
              y: pos.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              color: bubble.color,
              alpha: 1,
            })
          }
        })
        score += cluster.length * 30
        onScoreChange(score)
        playPop(650)
      }

      activeBubble = null

      // Check Victory (grid empty)
      const hasBubbles = grid.some(row => row.some(cell => cell !== null))
      if (!hasBubbles) {
        onVictory(score + 500)
      } else if (bubblesRemaining <= 0) {
        onGameOver(score)
      }
    }

    // Main animation loop
    const render = () => {
      if (!isMounted) return

      if (!isPaused) {
        // Update active flying bubble
        if (activeBubble) {
          activeBubble.x += activeBubble.vx
          activeBubble.y += activeBubble.vy

          // Wall bounce
          if (activeBubble.x - RADIUS < 0 || activeBubble.x + RADIUS > width) {
            activeBubble.vx *= -1
            playPop(220)
          }

          // Ceiling hit or grid collision
          let hit = activeBubble.y - RADIUS <= 10
          if (!hit) {
            for (let r = 0; r < ROWS; r++) {
              for (let c = 0; c < COLS; c++) {
                if (grid[r][c]) {
                  const pos = getBubblePos(r, c)
                  if (Math.hypot(pos.x - activeBubble.x, pos.y - activeBubble.y) < RADIUS * 1.8) {
                    hit = true
                    break
                  }
                }
              }
              if (hit) break
            }
          }

          if (hit) {
            attachBubble(activeBubble)
          }
        }

        // Update particles
        particles.forEach(p => {
          p.x += p.vx
          p.y += p.vy
          p.alpha -= 0.03
        })
        particles = particles.filter(p => p.alpha > 0)
      }

      // Draw background
      ctx.fillStyle = '#0a0d1f'
      ctx.fillRect(0, 0, width, height)

      // Draw Top Ceiling Bar
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(0, 0, width, 12)

      // Draw Grid Bubbles
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (grid[r][c]) {
            const pos = getBubblePos(r, c)
            ctx.fillStyle = grid[r][c]
            ctx.shadowBlur = 8
            ctx.shadowColor = grid[r][c]
            ctx.beginPath()
            ctx.arc(pos.x, pos.y, RADIUS - 1, 0, Math.PI * 2)
            ctx.fill()
            ctx.shadowBlur = 0

            // Inner shine highlight
            ctx.fillStyle = 'rgba(255,255,255,0.4)'
            ctx.beginPath()
            ctx.arc(pos.x - 5, pos.y - 5, 5, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }

      // Draw Trajectory Aim Guide Line
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.4)'
      ctx.setLineDash([6, 6])
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(width / 2, height - 45)
      ctx.lineTo(width / 2 + Math.cos(aimAngle) * 160, (height - 45) + Math.sin(aimAngle) * 160)
      ctx.stroke()
      ctx.setLineDash([])

      // Draw Cannon Base & Active Bubble
      const cannonX = width / 2
      const cannonY = height - 45

      ctx.fillStyle = '#1e293b'
      ctx.beginPath()
      ctx.arc(cannonX, cannonY, 32, 0, Math.PI * 2)
      ctx.fill()

      if (currentColor) {
        ctx.fillStyle = currentColor
        ctx.beginPath()
        ctx.arc(cannonX, cannonY, RADIUS, 0, Math.PI * 2)
        ctx.fill()
      }

      // Next Bubble Preview
      ctx.fillStyle = '#334155'
      ctx.beginPath()
      ctx.arc(cannonX - 60, cannonY, 18, 0, Math.PI * 2)
      ctx.fill()

      if (nextColor) {
        ctx.fillStyle = nextColor
        ctx.beginPath()
        ctx.arc(cannonX - 60, cannonY, 12, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw Active Flying Bubble
      if (activeBubble) {
        ctx.fillStyle = activeBubble.color
        ctx.shadowBlur = 10
        ctx.shadowColor = activeBubble.color
        ctx.beginPath()
        ctx.arc(activeBubble.x, activeBubble.y, RADIUS, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // Draw Particles
      particles.forEach(p => {
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.beginPath()
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      })

      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      isMounted = false
      cancelAnimationFrame(animationFrameId)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [isPaused, onScoreChange, onGameOver, onVictory, settings])

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-2xl mx-auto select-none">
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900/90 border border-b-0 border-slate-800 rounded-t-2xl text-xs font-black">
        <div className="flex items-center gap-2 text-cyan-400">
          <span>🫧</span> Bubbles Left: <span className="text-white font-mono">{hud.bubblesLeft}</span>
        </div>
        <div className="text-yellow-400 font-bold">
          🎯 Aim & Shoot to Match 3!
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full max-h-[600px] aspect-[12/13] bg-slate-950 border border-slate-800 rounded-b-2xl shadow-2xl cursor-pointer touch-none"
      />
    </div>
  )
}
