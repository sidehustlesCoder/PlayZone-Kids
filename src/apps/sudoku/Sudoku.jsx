import { useState, useCallback, useEffect } from 'react'

const generatePuzzle = (difficulty) => {
  // Generates a valid sudoku using a known solved board + removals
  const base = [
    [5,3,4,6,7,8,9,1,2],[6,7,2,1,9,5,3,4,8],[1,9,8,3,4,2,5,6,7],
    [8,5,9,7,6,1,4,2,3],[4,2,6,8,5,3,7,9,1],[7,1,3,9,2,4,8,5,6],
    [9,6,1,5,3,7,2,8,4],[2,8,7,4,1,9,6,3,5],[3,4,5,2,8,6,1,7,9],
  ]
  // Shuffle by permuting rows within bands and columns within bands
  const perm3 = () => { const p=[0,1,2].sort(()=>Math.random()-.5); return p }
  const rp=perm3(), cp=perm3()
  const shuffled=Array(9).fill(null).map((_,r)=>Array(9).fill(null).map((_2,c)=>base[rp[Math.floor(r/3)]*3+(r%3)][cp[Math.floor(c/3)]*3+(c%3)]))

  const removals = difficulty==='Easy'?35:difficulty==='Medium'?45:52
  const puzzle=shuffled.map(row=>[...row])
  let removed=0
  while(removed<removals){
    const r=Math.floor(Math.random()*9), c=Math.floor(Math.random()*9)
    if(puzzle[r][c]!==0){puzzle[r][c]=0;removed++}
  }
  return { puzzle, solution: shuffled }
}

export default function Sudoku({ isPaused, onScoreChange, onGameOver, onVictory, settings }) {
  const [difficulty, setDifficulty] = useState(null)
  const [board, setBoard] = useState(null)
  const [solution, setSolution] = useState(null)
  const [given, setGiven] = useState(null)
  const [selected, setSelected] = useState(null)
  const [errors, setErrors] = useState(new Set())
  const [notes, setNotes] = useState({})
  const [noteMode, setNoteMode] = useState(false)
  const [mistakes, setMistakes] = useState(0)
  const [score, setScore] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [won, setWon] = useState(false)

  useEffect(() => {
    if (!board || won || isPaused) return
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [board, won, isPaused])

  const startGame = useCallback((diff) => {
    const { puzzle, solution: sol } = generatePuzzle(diff)
    const givenSet = new Set(puzzle.flatMap((row, r) => row.map((v, c) => v !== 0 ? `${r},${c}` : null).filter(Boolean)))
    setDifficulty(diff); setBoard(puzzle.map(r => [...r])); setSolution(sol)
    setGiven(givenSet); setSelected(null); setErrors(new Set()); setNotes({}); setMistakes(0); setScore(0); setElapsed(0); setWon(false)
  }, [])

  const selectCell = useCallback((r, c) => {
    if (won || isPaused) return
    setSelected([r, c])
  }, [won, isPaused])

  const inputNumber = useCallback((n) => {
    if (!selected || !board || won || isPaused) return
    const [r, c] = selected
    if (given?.has(`${r},${c}`)) return
    const key = `${r},${c}`

    if (noteMode) {
      setNotes(prev => {
        const cur = new Set(prev[key] || [])
        cur.has(n) ? cur.delete(n) : cur.add(n)
        return { ...prev, [key]: cur }
      })
      return
    }

    const newBoard = board.map(row => [...row])
    newBoard[r][c] = n

    const newErrors = new Set(errors)
    if (n !== 0 && n !== solution[r][c]) {
      newErrors.add(key)
      const nm = mistakes + 1
      setMistakes(nm)
      if (nm >= 5) { onGameOver(score) }
    } else {
      newErrors.delete(key)
      if (n !== 0) { const ns = score + (difficulty === 'Hard' ? 15 : difficulty === 'Medium' ? 10 : 5); setScore(ns); onScoreChange(ns) }
    }

    // Clear note for this cell
    setNotes(prev => { const n2 = { ...prev }; delete n2[key]; return n2 })
    setErrors(newErrors)
    setBoard(newBoard)

    // Check complete
    const isComplete = newBoard.every((row, ri) => row.every((v, ci) => v === solution[ri][ci]))
    if (isComplete) {
      const bonus = Math.max(0, 1000 - elapsed * 2) + (difficulty === 'Hard' ? 500 : difficulty === 'Medium' ? 300 : 100)
      const finalScore = score + bonus; setScore(finalScore); onScoreChange(finalScore); onVictory(finalScore); setWon(true)
    }
  }, [selected, board, given, won, isPaused, noteMode, errors, solution, mistakes, score, difficulty, elapsed, onGameOver, onScoreChange, onVictory])

  useEffect(() => {
    const onKey = (e) => {
      const n = parseInt(e.key)
      if (n >= 1 && n <= 9) inputNumber(n)
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') inputNumber(0)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inputNumber])

  const fmt = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  const getCellBg = (r, c) => {
    const key = `${r},${c}`
    if (selected && selected[0]===r && selected[1]===c) return 'bg-blue-500 text-white'
    if (errors.has(key)) return 'bg-rose-500/30 text-rose-300'
    if (selected && (selected[0]===r || selected[1]===c || (Math.floor(selected[0]/3)===Math.floor(r/3) && Math.floor(selected[1]/3)===Math.floor(c/3)))) return 'bg-slate-700/60'
    if (given?.has(key)) return 'bg-slate-800'
    return 'bg-slate-900 hover:bg-slate-700'
  }

  if (!difficulty) return (
    <div className="flex flex-col items-center justify-center gap-8 py-12 px-4">
      <div className="text-5xl">🔢</div>
      <h2 className="text-2xl font-black text-white">Sudoku</h2>
      <p className="text-slate-400 text-sm text-center max-w-xs">Fill in the grid so every row, column, and 3×3 box contains the digits 1–9.</p>
      <div className="flex gap-4 flex-wrap justify-center">
        {['Easy','Medium','Hard'].map(d => (
          <button key={d} onClick={() => startGame(d)}
            className={`px-8 py-4 rounded-2xl font-black text-lg transition-all hover:scale-105 ${d==='Easy'?'bg-emerald-500 text-white':d==='Medium'?'bg-yellow-500 text-slate-950':'bg-rose-600 text-white'}`}>
            {d}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-md mx-auto select-none px-2">
      {/* Stats bar */}
      <div className="w-full flex items-center justify-between text-xs font-bold text-slate-300 px-1">
        <span className="text-cyan-400">⏱ {fmt(elapsed)}</span>
        <span className={`uppercase tracking-wider ${difficulty==='Easy'?'text-emerald-400':difficulty==='Medium'?'text-yellow-400':'text-rose-400'}`}>{difficulty}</span>
        <span className="text-rose-400">❌ {mistakes}/5 mistakes</span>
      </div>

      {/* Grid */}
      <div className="border-2 border-slate-500 rounded-xl overflow-hidden shadow-2xl">
        {board.map((row, r) => (
          <div key={r} className={`flex ${r===2||r===5?'border-b-2 border-slate-500':''}`}>
            {row.map((val, c) => {
              const key = `${r},${c}`
              const isGiven = given?.has(key)
              const noteSet = notes[key]
              return (
                <div
                  key={c}
                  onClick={() => selectCell(r,c)}
                  className={`relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center cursor-pointer border border-slate-700 transition-colors text-sm font-black ${c===2||c===5?'border-r-2 border-r-slate-500':''} ${getCellBg(r,c)} ${isGiven?'text-white':'text-cyan-300'}`}
                >
                  {val !== 0 ? val : (
                    noteSet && noteSet.size > 0 ? (
                      <div className="grid grid-cols-3 gap-0 w-full h-full p-0.5">
                        {[1,2,3,4,5,6,7,8,9].map(n => (
                          <span key={n} className={`text-[7px] flex items-center justify-center leading-none ${noteSet.has(n)?'text-yellow-300':'text-transparent'}`}>{n}</span>
                        ))}
                      </div>
                    ) : null
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Number pad */}
      <div className="flex gap-1.5 flex-wrap justify-center">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => inputNumber(n)}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-cyan-500/30 border border-slate-700 text-white font-black text-sm transition-all hover:scale-110">
            {n}
          </button>
        ))}
        <button onClick={() => inputNumber(0)} className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-rose-500/30 border border-slate-700 text-slate-400 font-black text-xs transition-all">✕</button>
        <button onClick={() => setNoteMode(n => !n)} className={`px-3 h-10 rounded-xl border font-black text-xs transition-all ${noteMode?'bg-yellow-500 border-yellow-400 text-slate-950':'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}>📝 Notes</button>
        <button onClick={() => startGame(difficulty)} className="px-3 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-black text-xs">New</button>
      </div>

      {won && <div className="text-emerald-400 font-black text-xl animate-bounce">🎉 Puzzle Complete!</div>}
    </div>
  )
}
