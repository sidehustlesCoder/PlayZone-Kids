import { useState, useEffect, useCallback, useRef } from 'react'
import { playWinSound, playLoseSound, playSelectSound } from '../../shared/sounds'
import wordLists from './word-lists.json'

const THEMES = [
  { value: 'animals',   label: '🐾 Animals',   color: '#2ED573' },
  { value: 'space',     label: '🚀 Space',      color: '#6C63FF' },
  { value: 'dinosaurs', label: '🦕 Dinosaurs',  color: '#FF6B6B' },
]

export default function WordSearch() {
  const [puzzle, setPuzzle] = useState(null)
  const [theme, setTheme] = useState('animals')
  const [selection, setSelection] = useState([])   // cells being dragged over: [[r, c], ...]
  const [isDragging, setIsDragging] = useState(false)
  const [foundPositions, setFoundPositions] = useState({})   // word -> [[r,c], ...]
  const [message, setMessage] = useState('')
  const startCell = useRef(null)

  const generatePuzzle = useCallback((th = theme) => {
    setSelection([])
    setFoundPositions({})
    setMessage('')

    const gridSize = 8
    const themeWords = wordLists[th] || []
    
    // Pick 5 random words from the theme
    const selectedWords = [...themeWords]
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)
      .map(w => w.toUpperCase())

    // Initialize empty grid
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''))
    const wordPlacements = {} // word -> array of [r, c]

    const directions = [
      [0, 1],   // Horizontal
      [1, 0],   // Vertical
      [1, 1],   // Diagonal Down-Right
      [-1, 1],  // Diagonal Up-Right
    ]

    selectedWords.forEach(word => {
      let placed = false
      let attempts = 0
      
      while (!placed && attempts < 100) {
        attempts++
        const dir = directions[Math.floor(Math.random() * directions.length)]
        const isReverse = Math.random() > 0.5
        const displayWord = isReverse ? word.split('').reverse().join('') : word
        
        // Pick random start position
        const startR = Math.floor(Math.random() * gridSize)
        const startC = Math.floor(Math.random() * gridSize)
        
        // Check boundary
        const endR = startR + dir[0] * (word.length - 1)
        const endC = startC + dir[1] * (word.length - 1)
        
        if (endR >= 0 && endR < gridSize && endC >= 0 && endC < gridSize) {
          // Check collision
          let ok = true
          const cells = []
          for (let i = 0; i < word.length; i++) {
            const r = startR + dir[0] * i
            const c = startC + dir[1] * i
            const letter = displayWord[i]
            if (grid[r][c] !== '' && grid[r][c] !== letter) {
              ok = false
              break
            }
            cells.push([r, c])
          }
          
          if (ok) {
            cells.forEach(([r, c], i) => {
              grid[r][c] = displayWord[i]
            })
            // If it was reversed, store the positions in correct word order
            wordPlacements[word] = isReverse ? [...cells].reverse() : cells
            placed = true
          }
        }
      }
    })

    // Fill remaining cells with random letters
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (grid[r][c] === '') {
          grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)]
        }
      }
    }

    setPuzzle({
      grid,
      grid_size: gridSize,
      words: selectedWords,
      found_words: [],
      complete: false,
      placements: wordPlacements
    })
  }, [theme])

  useEffect(() => {
    generatePuzzle()
  }, [])

  const getCellKey = (r, c) => `${r}-${c}`

  const handleMouseDown = (r, c) => {
    if (puzzle?.complete) return
    setIsDragging(true)
    startCell.current = [r, c]
    setSelection([[r, c]])
    playSelectSound()
  }

  const handleMouseEnter = (r, c) => {
    if (!isDragging || !startCell.current || puzzle?.complete) return
    const [sr, sc] = startCell.current
    const dr = Math.sign(r - sr)
    const dc = Math.sign(c - sc)
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

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !puzzle) return
    setIsDragging(false)

    if (selection.length >= 2) {
      // Convert selection to uppercase word string from grid letters
      const selectedWord = selection.map(([r, c]) => puzzle.grid[r][c]).join('')
      const reversedWord = selectedWord.split('').reverse().join('')
      
      let matchedWord = null
      let matchedCells = []

      // Check if matches any word in placements
      for (const [word, cells] of Object.entries(puzzle.placements)) {
        if (puzzle.found_words.includes(word)) continue
        
        const cellKeys = cells.map(([r, c]) => getCellKey(r, c)).join(',')
        const selKeys = selection.map(([r, c]) => getCellKey(r, c)).join(',')
        const revSelKeys = [...selection].reverse().map(([r, c]) => getCellKey(r, c)).join(',')

        if (selKeys === cellKeys || revSelKeys === cellKeys) {
          matchedWord = word
          matchedCells = cells
          break
        }
      }

      if (matchedWord) {
        // Success
        playWinSound()
        const nextFoundWords = [...puzzle.found_words, matchedWord]
        const isComplete = nextFoundWords.length === puzzle.words.length
        
        setFoundPositions(prev => ({
          ...prev,
          [matchedWord]: matchedCells
        }))

        setPuzzle(prev => ({
          ...prev,
          found_words: nextFoundWords,
          complete: isComplete
        }))

        setMessage('✓ Found one! 🎉')
        setTimeout(() => setMessage(''), 1500)

        if (isComplete) {
          window.dispatchEvent(new CustomEvent('game-win', { detail: { stars: 1 } }))
        }
      } else {
        playLoseSound()
      }
    }

    setSelection([])
  }, [isDragging, selection, puzzle])

  if (!puzzle) return null

  const { grid, grid_size, words, found_words, complete } = puzzle
  const themeColor = THEMES.find(t => t.value === theme)?.color || 'var(--primary-color)'
  const selSet = new Set(selection.map(([r,c]) => getCellKey(r,c)))

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
        onMouseLeave={handleMouseUp}
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
