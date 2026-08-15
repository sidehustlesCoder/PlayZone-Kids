import { useState, useCallback, useEffect, useRef } from 'react'

const GRID_SIZE = 10

const SHAPES = [
  // Dots / Small
  { name: '1x1', color: '#00f5ff', matrix: [[1]] },
  { name: '2x2', color: '#ffd700', matrix: [[1,1],[1,1]] },
  { name: '3x3', color: '#ff375f', matrix: [[1,1,1],[1,1,1],[1,1,1]] },
  // Lines Horizontal
  { name: 'H2', color: '#32d74b', matrix: [[1,1]] },
  { name: 'H3', color: '#32d74b', matrix: [[1,1,1]] },
  { name: 'H4', color: '#0a84ff', matrix: [[1,1,1,1]] },
  { name: 'H5', color: '#bf5af2', matrix: [[1,1,1,1,1]] },
  // Lines Vertical
  { name: 'V2', color: '#ff9f0a', matrix: [[1],[1]] },
  { name: 'V3', color: '#ff9f0a', matrix: [[1],[1],[1]] },
  { name: 'V4', color: '#0a84ff', matrix: [[1],[1],[1],[1]] },
  { name: 'V5', color: '#bf5af2', matrix: [[1],[1],[1],[1],[1]] },
  // L Shapes
  { name: 'L1', color: '#ff375f', matrix: [[1,0],[1,0],[1,1]] },
  { name: 'L2', color: '#ff375f', matrix: [[0,1],[0,1],[1,1]] },
  { name: 'L3', color: '#ff375f', matrix: [[1,1,1],[1,0,0]] },
  { name: 'L4', color: '#ff375f', matrix: [[1,1,1],[0,0,1]] },
  // T Shapes
  { name: 'T1', color: '#bf5af2', matrix: [[1,1,1],[0,1,0]] },
  { name: 'T2', color: '#bf5af2', matrix: [[0,1,0],[1,1,1]] },
  // Corner 2x2
  { name: 'C1', color: '#ffd700', matrix: [[1,1],[1,0]] },
  { name: 'C2', color: '#ffd700', matrix: [[1,1],[0,1]] },
  { name: 'C3', color: '#ffd700', matrix: [[1,0],[1,1]] },
  { name: 'C4', color: '#ffd700', matrix: [[0,1],[1,1]] },
]

const getRandomShapes = () => {
  return [
    { ...SHAPES[Math.floor(Math.random() * SHAPES.length)], id: Math.random() },
    { ...SHAPES[Math.floor(Math.random() * SHAPES.length)], id: Math.random() },
    { ...SHAPES[Math.floor(Math.random() * SHAPES.length)], id: Math.random() },
  ]
}

export default function BlockPuzzle({ isPaused, onScoreChange, onGameOver, onVictory, settings }) {
  const [grid, setGrid] = useState(() => Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)))
  const [availableShapes, setAvailableShapes] = useState(getRandomShapes)
  const [selectedShapeIndex, setSelectedShapeIndex] = useState(null)
  const [hoverPos, setHoverPos] = useState(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [clearedLinesAnim, setClearedLinesAnim] = useState([])
  const [gameOver, setGameOver] = useState(false)

  const snd = useCallback((freq, type = 'sine', dur = 0.12) => {
    if (!settings?.soundEnabled) return
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)()
      const o = ac.createOscillator(), g = ac.createGain()
      o.type = type; o.frequency.setValueAtTime(freq, ac.currentTime)
      g.gain.setValueAtTime((settings?.volume || 0.7) * 0.12, ac.currentTime)
      g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + dur)
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + dur)
    } catch {}
  }, [settings])

  const canPlaceShape = useCallback((matrix, r, c, currentGrid) => {
    const rows = matrix.length
    const cols = matrix[0].length
    if (r + rows > GRID_SIZE || c + cols > GRID_SIZE) return false
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (matrix[i][j] === 1 && currentGrid[r + i][c + j] !== null) {
          return false
        }
      }
    }
    return true
  }, [])

  const checkAnyShapeCanFit = useCallback((shapes, currentGrid) => {
    for (const shape of shapes) {
      if (!shape) continue
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (canPlaceShape(shape.matrix, r, c, currentGrid)) {
            return true
          }
        }
      }
    }
    return false
  }, [canPlaceShape])

  const handlePlace = useCallback((r, c) => {
    if (isPaused || gameOver || selectedShapeIndex === null) return
    const shape = availableShapes[selectedShapeIndex]
    if (!shape) return

    if (!canPlaceShape(shape.matrix, r, c, grid)) {
      snd(150, 'sawtooth', 0.1)
      return
    }

    // Place shape
    const newGrid = grid.map(row => [...row])
    let blockCount = 0
    for (let i = 0; i < shape.matrix.length; i++) {
      for (let j = 0; j < shape.matrix[0].length; j++) {
        if (shape.matrix[i][j] === 1) {
          newGrid[r + i][c + j] = shape.color
          blockCount++
        }
      }
    }

    snd(440, 'triangle', 0.1)

    // Check full rows & columns
    const fullRows = []
    const fullCols = []

    for (let ri = 0; ri < GRID_SIZE; ri++) {
      if (newGrid[ri].every(cell => cell !== null)) {
        fullRows.push(ri)
      }
    }

    for (let ci = 0; ci < GRID_SIZE; ci++) {
      let isFull = true
      for (let ri = 0; ri < GRID_SIZE; ri++) {
        if (newGrid[ri][ci] === null) {
          isFull = false
          break
        }
      }
      if (isFull) fullCols.push(ci)
    }

    const totalLines = fullRows.length + fullCols.length
    let linePoints = 0

    if (totalLines > 0) {
      setClearedLinesAnim({ rows: fullRows, cols: fullCols })
      setTimeout(() => setClearedLinesAnim([]), 350)

      // Clear the cells
      fullRows.forEach(ri => {
        for (let ci = 0; ci < GRID_SIZE; ci++) newGrid[ri][ci] = null
      })
      fullCols.forEach(ci => {
        for (let ri = 0; ri < GRID_SIZE; ri++) newGrid[ri][ci] = null
      })

      const newStreak = streak + 1
      setStreak(newStreak)
      linePoints = totalLines * 100 * (totalLines > 1 ? totalLines : 1) * (1 + newStreak * 0.2)
      snd(600 + totalLines * 150, 'sine', 0.3)
    } else {
      setStreak(0)
    }

    const addedScore = blockCount * 10 + Math.round(linePoints)
    const newScore = score + addedScore
    setScore(newScore)
    onScoreChange(newScore)

    // Remove used shape
    const newShapes = [...availableShapes]
    newShapes[selectedShapeIndex] = null

    // If all 3 used, spawn 3 new
    const remaining = newShapes.filter(Boolean)
    let nextShapes = newShapes
    if (remaining.length === 0) {
      nextShapes = getRandomShapes()
      snd(520, 'sine', 0.15)
    }

    setAvailableShapes(nextShapes)
    setSelectedShapeIndex(null)
    setGrid(newGrid)

    // Check game over
    const activeShapes = nextShapes.filter(Boolean)
    if (!checkAnyShapeCanFit(activeShapes, newGrid)) {
      setGameOver(true)
      snd(180, 'sawtooth', 0.4)
      onGameOver(newScore)
    }
  }, [isPaused, gameOver, selectedShapeIndex, availableShapes, canPlaceShape, grid, streak, score, onScoreChange, checkAnyShapeCanFit, snd, onGameOver])

  const selectedShape = selectedShapeIndex !== null ? availableShapes[selectedShapeIndex] : null

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-6 w-full max-w-4xl mx-auto select-none p-3">
      {/* ── MAIN GRID ────────────────────────────────────────────── */}
      <div className="flex flex-col items-center">
        {/* Header HUD */}
        <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900/90 border border-b-0 border-slate-800 rounded-t-2xl text-xs font-black">
          <div className="flex items-center gap-3">
            <span className="text-yellow-400 font-mono text-sm">🏆 {score} PTS</span>
            {streak > 1 && (
              <span className="text-rose-400 animate-pulse text-xs bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
                🔥 {streak}x STREAK
              </span>
            )}
          </div>
          <div className="text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
            {selectedShape ? `Placing: ${selectedShape.name}` : 'Select a piece below'}
          </div>
        </div>

        {/* 10x10 Board */}
        <div className="relative p-2 bg-slate-950 border border-slate-800 shadow-2xl rounded-b-2xl">
          <div className="grid grid-cols-10 gap-1 sm:gap-1.5 bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
            {grid.map((row, r) =>
              row.map((cell, c) => {
                // Check if current hovered piece covers this cell
                let isPreview = false
                let isPreviewValid = false
                if (selectedShape && hoverPos) {
                  const [hr, hc] = hoverPos
                  const sr = r - hr
                  const sc = c - hc
                  if (
                    sr >= 0 &&
                    sr < selectedShape.matrix.length &&
                    sc >= 0 &&
                    sc < selectedShape.matrix[0].length &&
                    selectedShape.matrix[sr][sc] === 1
                  ) {
                    isPreview = true
                    isPreviewValid = canPlaceShape(selectedShape.matrix, hr, hc, grid)
                  }
                }

                const isClearing =
                  clearedLinesAnim.rows?.includes(r) || clearedLinesAnim.cols?.includes(c)

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => handlePlace(r, c)}
                    onMouseEnter={() => setHoverPos([r, c])}
                    className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg transition-all duration-150 relative flex items-center justify-center cursor-pointer border ${
                      isClearing
                        ? 'bg-white scale-110 shadow-[0_0_15px_#fff] border-white z-10'
                        : cell
                        ? 'border-white/20 shadow-md scale-95'
                        : isPreview
                        ? isPreviewValid
                          ? 'border-cyan-400 bg-cyan-400/40 scale-100 shadow-[0_0_8px_#00f5ff]'
                          : 'border-rose-500 bg-rose-500/40 scale-95'
                        : 'bg-slate-900/90 border-slate-800/60 hover:border-slate-700'
                    }`}
                    style={{
                      backgroundColor: !isClearing && cell ? cell : undefined,
                      boxShadow: !isClearing && cell ? `0 0 10px ${cell}55, inset 0 1px 1px #ffffff44` : undefined,
                    }}
                  />
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── SIDE PANEL (PIECES DOCK) ─────────────────────────────── */}
      <div className="flex flex-col items-center gap-4 w-full lg:w-64 bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Available Blocks</h3>
        
        <div className="flex lg:flex-col gap-4 items-center justify-around w-full">
          {availableShapes.map((shape, idx) => {
            if (!shape) {
              return (
                <div
                  key={idx}
                  className="w-20 h-20 rounded-xl border border-dashed border-slate-800 flex items-center justify-center opacity-30 text-xs text-slate-600"
                >
                  Used
                </div>
              )
            }

            const isSelected = selectedShapeIndex === idx

            return (
              <button
                key={shape.id}
                type="button"
                onClick={() => {
                  setSelectedShapeIndex(isSelected ? null : idx)
                  snd(isSelected ? 300 : 500, 'sine', 0.08)
                }}
                className={`p-3 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center border-2 ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(0,245,255,0.3)] scale-105'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:scale-102'
                }`}
              >
                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${shape.matrix[0].length}, minmax(0, 1fr))`,
                  }}
                >
                  {shape.matrix.map((row, ri) =>
                    row.map((val, ci) => (
                      <div
                        key={`${ri}-${ci}`}
                        className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md ${
                          val === 1
                            ? 'border border-white/20'
                            : 'opacity-0 pointer-events-none'
                        }`}
                        style={{
                          backgroundColor: val === 1 ? shape.color : 'transparent',
                          boxShadow: val === 1 ? `0 0 6px ${shape.color}88` : 'none',
                        }}
                      />
                    ))
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <p className="text-[11px] text-slate-500 text-center leading-relaxed mt-2">
          Click a block, then click on the grid to place. Clear complete rows and columns for mega combos!
        </p>
      </div>
    </div>
  )
}
