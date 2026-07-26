import { useState, useEffect, useCallback, useRef } from 'react'
import { usePyodide } from '../../shared/usePyodide'
import wsSource from './logic.py?raw'

const THEMES = [
  { value: 'animals',   label: '🐾 Animals',   color: '#2ED573' },
  { value: 'space',     label: '🚀 Space',      color: '#6C63FF' },
  { value: 'dinosaurs', label: '🦕 Dinosaurs',  color: '#FF6B6B' },
]

export default function WordSearch() {
  const { runPython } = usePyodide()
  const [initialized, setInitialized] = useState(false)
  const [puzzle, setPuzzle] = useState(null)
  const [theme, setTheme] = useState('animals')
  const [selection, setSelection] = useState([])   // cells being dragged over
  const [isDragging, setIsDragging] = useState(false)
  const [foundPositions, setFoundPositions] = useState({})   // word -> cells
  const [message, setMessage] = useState('')
  const startCell = useRef(null)

  useEffect(() => {
    runPython(wsSource).then(() => setInitialized(true))
  }, [runPython])

  const generatePuzzle = useCallback(async (th = theme) => {
    setSelection([])
    setFoundPositions({})
    setMessage('')
    const raw = await runPython(`
import json
ws = WordSearch()
state = ws.generate({"theme": "${th}"})
json.dumps(state)
`)
    setPuzzle(JSON.parse(raw))
  }, [runPython, theme])

  const getCellKey = (r, c) => `${r}-${c}`

  const handleMouseDown = (r, c) => {
    setIsDragging(true)
    startCell.current = [r, c]
    setSelection([[r, c]])
  }

  const handleMouseEnter = (r, c) => {
    if (!isDragging || !startCell.current) return
    // Build a straight line from startCell to current cell
    const [sr, sc] = startCell.current
    const dr = Math.sign(r - sr), dc = Math.sign(c - sc)
    if (dr === 0 && dc === 0) return
    // Only allow straight lines (horizontal, vertical, diagonal)
    if (dr !== 0 && dc !== 0 && Math.abs(r - sr) !== Math.abs(c - sc)) return
    const cells = []
    let cr = sr, cc = sc
    while (cr !== r || cc !== c) {
      cells.push([cr, cc])
      cr += dr; cc += dc
    }
    cells.push([r, c])
    setSelection(cells)
  }

  const handleMouseUp = useCallback(async () => {
    if (!isDragging || selection.length < 2) { setIsDragging(false); setSelection([]); return }
    setIsDragging(false)
    const cellsJson = JSON.stringify(selection)
    const raw = await runPython(`
import json
state = ws.check_word(${cellsJson})
json.dumps(state)
`)
    const state = JSON.parse(raw)
    setPuzzle(state)

    // Get word positions to highlight found words
    if (state.found_words.length > (puzzle?.found_words?.length || 0)) {
      const posRaw = await runPython(`import json; json.dumps(ws.get_word_positions())`)
      const positions = JSON.parse(posRaw)
      // Only keep found words' positions
      const newFP = {}
      for (const w of state.found_words) { newFP[w] = positions[w] || [] }
      setFoundPositions(newFP)
      setMessage('✓ Found one!')
      setTimeout(() => setMessage(''), 1500)
    }
    setSelection([])
  }, [isDragging, selection, runPython, puzzle])

  if (!initialized) return <div className="calculator-app__status">⚡ Initializing Pyodide Python WASM Engine...</div>

  if (!puzzle) {
    return (
      <div className="ws-setup">
        <h2 className="ttt-setup__title">🔤 Word Search</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Find all hidden words! Click and drag to select.</p>
        <div className="ttt-setup__group">
          <label>Theme</label>
          <div className="ttt-setup__btns">
            {THEMES.map(t => (
              <button key={t.value} className={`ttt-option-btn ${theme===t.value?'active':''}`} onClick={() => setTheme(t.value)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <button className="ttt-start-btn" onClick={() => generatePuzzle(theme)} style={{ marginTop: '1.5rem' }}>Generate Puzzle</button>
      </div>
    )
  }

  const { grid, grid_size, words, found_words, complete } = puzzle
  const themeColor = THEMES.find(t => t.value === theme)?.color || 'var(--primary)'
  const selSet = new Set(selection.map(([r,c]) => getCellKey(r,c)))

  // Build a map of all found cell positions
  const foundCellSet = new Set()
  for (const cells of Object.values(foundPositions)) {
    for (const [r,c] of cells) foundCellSet.add(getCellKey(r,c))
  }

  return (
    <div className="ws-app">
      <div className="ws-header">
        <div className="ws-words">
          {words.map(w => (
            <span key={w} className={`ws-word-chip ${found_words.includes(w) ? 'ws-word-chip--found' : ''}`}
              style={found_words.includes(w) ? { textDecoration: 'line-through', color: themeColor } : {}}>
              {w}
            </span>
          ))}
        </div>
        {message && <div className="ws-message">{message}</div>}
      </div>

      {complete && (
        <div className="memory-celebration">
          <div className="memory-celebration__text">🎉 All words found!</div>
          <div className="memory-celebration__actions">
            <button className="ttt-replay-btn" onClick={() => generatePuzzle()}>New Puzzle</button>
            <button className="ttt-back-btn" onClick={() => setPuzzle(null)}>Change Theme</button>
          </div>
        </div>
      )}

      <div
        className="ws-grid"
        onMouseLeave={() => { if (isDragging) { handleMouseUp() } }}
        style={{ gridTemplateColumns: `repeat(${grid_size}, 1fr)` }}
        onMouseUp={handleMouseUp}
      >
        {grid.map((row, r) => row.map((letter, c) => {
          const key = getCellKey(r, c)
          const isSel = selSet.has(key)
          const isFound = foundCellSet.has(key)
          return (
            <div
              key={key}
              id={`ws-cell-${r}-${c}`}
              className={`ws-cell ${isSel ? 'ws-cell--selected' : ''} ${isFound ? 'ws-cell--found' : ''}`}
              style={isFound ? { '--found-color': themeColor } : {}}
              onMouseDown={() => handleMouseDown(r, c)}
              onMouseEnter={() => handleMouseEnter(r, c)}
              role="gridcell"
              aria-label={`Letter ${letter}`}
            >
              {letter}
            </div>
          )
        }))}
      </div>

      <div className="ws-controls">
        <span className="ws-controls__stat">Found: {found_words.length}/{words.length}</span>
        <button className="ttt-back-btn" onClick={() => generatePuzzle()}>New Puzzle</button>
        <button className="ttt-back-btn" onClick={() => setPuzzle(null)}>⚙ Theme</button>
      </div>
    </div>
  )
}
