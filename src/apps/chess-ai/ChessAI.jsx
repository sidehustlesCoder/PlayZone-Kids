import { useState, useCallback, useEffect, useRef } from 'react'

// ── Chess engine ──────────────────────────────────────────────────────────────
const INIT_BOARD = () => {
  const b = Array(8).fill(null).map(() => Array(8).fill(null))
  const order = ['R','N','B','Q','K','B','N','R']
  order.forEach((p,i) => { b[0][i]={type:p,color:'b'}; b[7][i]={type:p,color:'w'} })
  for(let i=0;i<8;i++) { b[1][i]={type:'P',color:'b'}; b[6][i]={type:'P',color:'w'} }
  return b
}
const inBounds = (r,c) => r>=0&&r<8&&c>=0&&c<8
const getPawnMoves = (board,r,c,color,ep) => {
  const moves=[]; const dir=color==='w'?-1:1; const start=color==='w'?6:1
  if(inBounds(r+dir,c)&&!board[r+dir][c]){ moves.push([r+dir,c]); if(r===start&&!board[r+dir*2][c])moves.push([r+dir*2,c]) }
  [[r+dir,c-1],[r+dir,c+1]].forEach(([nr,nc])=>{
    if(inBounds(nr,nc)&&board[nr][nc]&&board[nr][nc].color!==color)moves.push([nr,nc])
    if(ep&&ep[0]===nr&&ep[1]===nc)moves.push([nr,nc])
  })
  return moves
}
const slideMoves = (board,r,c,color,dirs) => {
  const moves=[]
  dirs.forEach(([dr,dc])=>{ let nr=r+dr,nc=c+dc; while(inBounds(nr,nc)){ if(board[nr][nc]){if(board[nr][nc].color!==color)moves.push([nr,nc]);break}; moves.push([nr,nc]);nr+=dr;nc+=dc } })
  return moves
}
const getKnightMoves = (board,r,c,color) =>
  [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].map(([dr,dc])=>[r+dr,c+dc]).filter(([nr,nc])=>inBounds(nr,nc)&&(!board[nr][nc]||board[nr][nc].color!==color))
const getKingMoves = (board,r,c,color) =>
  [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].map(([dr,dc])=>[r+dr,c+dc]).filter(([nr,nc])=>inBounds(nr,nc)&&(!board[nr][nc]||board[nr][nc].color!==color))
const getMoves = (board,r,c,ep=[]) => {
  const p=board[r][c]; if(!p)return[]
  switch(p.type){
    case 'P': return getPawnMoves(board,r,c,p.color,ep)
    case 'R': return slideMoves(board,r,c,p.color,[[0,1],[0,-1],[1,0],[-1,0]])
    case 'B': return slideMoves(board,r,c,p.color,[[-1,-1],[-1,1],[1,-1],[1,1]])
    case 'Q': return slideMoves(board,r,c,p.color,[[0,1],[0,-1],[1,0],[-1,0],[-1,-1],[-1,1],[1,-1],[1,1]])
    case 'N': return getKnightMoves(board,r,c,p.color)
    case 'K': return getKingMoves(board,r,c,p.color)
    default: return []
  }
}
const PIECE_VAL = {K:900,Q:90,R:50,B:30,N:29,P:10}
const evalBoard = (b) => { let s=0; b.forEach(row=>row.forEach(p=>{if(p)s+=(p.color==='w'?-1:1)*(PIECE_VAL[p.type]||0)})); return s }
const cloneBoard = (b) => b.map(row=>row.map(cell=>cell?{...cell}:null))
const minimax = (b,depth,alpha,beta,isMax,ep) => {
  if(depth===0)return{score:evalBoard(b)}
  let best=isMax?{score:-Infinity}:{score:Infinity},bm=null
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const p=b[r][c]; if(!p||p.color!==(isMax?'b':'w'))continue
    for(const [nr,nc] of getMoves(b,r,c,ep)){
      const nb=cloneBoard(b); nb[nr][nc]=nb[r][c]; nb[r][c]=null
      if(nb[nr][nc].type==='P'&&(nr===0||nr===7))nb[nr][nc]={...nb[nr][nc],type:'Q'}
      const res=minimax(nb,depth-1,alpha,beta,!isMax,[])
      if(isMax&&res.score>best.score){best=res;bm=[r,c,nr,nc]}
      if(!isMax&&res.score<best.score){best=res;bm=[r,c,nr,nc]}
      if(isMax)alpha=Math.max(alpha,best.score); else beta=Math.min(beta,best.score)
      if(beta<=alpha)break
    }
  }
  return{score:best.score,move:bm}
}

const PIECE_UNICODE = { wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙', bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟' }

const FILES = ['a','b','c','d','e','f','g','h']
const RANKS = ['8','7','6','5','4','3','2','1']

export default function ChessAI({ isPaused, onScoreChange, onGameOver, onVictory, settings }) {
  const [board, setBoard] = useState(INIT_BOARD)
  const [selected, setSelected] = useState(null)
  const [validMoves, setValidMoves] = useState([])
  const [lastMove, setLastMove] = useState(null)
  const [turn, setTurn] = useState('w')
  const [status, setStatus] = useState('idle') // 'idle'|'thinking'|'won'|'lost'
  const [capturedW, setCapturedW] = useState([]) // white pieces captured by AI
  const [capturedB, setCapturedB] = useState([]) // black pieces captured by player
  const [enPassant, setEnPassant] = useState(null)
  const [score, setScore] = useState(0)
  const [moveHistory, setMoveHistory] = useState([])
  const [hovered, setHovered] = useState(null)
  const [animCell, setAnimCell] = useState(null)
  const boardRef = useRef(board)
  boardRef.current = board
  const historyRef = useRef(null)

  useEffect(() => {
    if (historyRef.current) historyRef.current.scrollLeft = historyRef.current.scrollWidth
  }, [moveHistory])

  const snd = useCallback((freq, type='sine', dur=0.15) => {
    if (!settings?.soundEnabled) return
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)()
      const o = ac.createOscillator(), g = ac.createGain()
      o.type = type; o.frequency.setValueAtTime(freq, ac.currentTime)
      g.gain.setValueAtTime((settings?.volume||0.7)*0.1, ac.currentTime)
      g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime+dur)
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime+dur)
    } catch {}
  }, [settings])

  const materialAdvantage = () => {
    let wMat = 0, bMat = 0
    board.forEach(row => row.forEach(p => {
      if (!p || p.type === 'K') return
      if (p.color === 'w') wMat += PIECE_VAL[p.type]
      else bMat += PIECE_VAL[p.type]
    }))
    return wMat - bMat
  }

  const doAIMove = useCallback((currentBoard, ep) => {
    setStatus('thinking')
    setTimeout(() => {
      const result = minimax(currentBoard, 2, -Infinity, Infinity, true, ep||[])
      if (!result.move) { setStatus('won'); onVictory(score + 300); return }
      const [fr,fc,tr,tc] = result.move
      const nb = cloneBoard(currentBoard)
      const captured = nb[tr][tc]
      nb[tr][tc] = nb[fr][fc]; nb[fr][fc] = null
      if (nb[tr][tc].type==='P'&&tr===7) nb[tr][tc]={...nb[tr][tc],type:'Q'}
      if (captured) {
        setCapturedB(prev => [...prev, captured.type])
        setScore(s => { const ns = s+(PIECE_VAL[captured.type]||0)*10; onScoreChange(ns); return ns })
      }
      const moveStr = `${FILES[fc]}${RANKS[fr]}→${FILES[tc]}${RANKS[tr]}${captured?'×':''}`
      setMoveHistory(h => [...h, { player: 'AI', str: moveStr, captured: captured?.type }])
      setLastMove([[fr,fc],[tr,tc]])
      setAnimCell([tr,tc])
      setTimeout(() => setAnimCell(null), 400)
      if (captured?.type==='K') { setStatus('lost'); onGameOver(score) }
      else setStatus('idle')
      setBoard(nb); setTurn('w'); snd(captured?220:300)
    }, 350)
  }, [onGameOver, onVictory, score, snd, onScoreChange])

  const handleClick = useCallback((r, c) => {
    if (isPaused || turn!=='w' || status==='thinking' || status==='won' || status==='lost') return
    const b = boardRef.current
    if (selected) {
      const [sr,sc] = selected
      const isValid = validMoves.some(([vr,vc]) => vr===r&&vc===c)
      if (isValid) {
        const nb = cloneBoard(b)
        const captured = nb[r][c]
        nb[r][c] = nb[sr][sc]; nb[sr][sc] = null
        let newEP = null
        if (nb[r][c].type==='P'&&Math.abs(r-sr)===2) newEP=[(sr+r)/2,c]
        if (nb[r][c].type==='P'&&r===0) nb[r][c]={...nb[r][c],type:'Q'}
        if (captured) {
          setCapturedW(prev => [...prev, captured.type])
          setScore(s => { const ns = s+(PIECE_VAL[captured.type]||0)*10; onScoreChange(ns); return ns })
        }
        const moveStr = `${FILES[sc]}${RANKS[sr]}→${FILES[c]}${RANKS[r]}${captured?'×':''}`
        setMoveHistory(h => [...h, { player: 'YOU', str: moveStr, captured: captured?.type }])
        setLastMove([[sr,sc],[r,c]])
        setAnimCell([r,c])
        setTimeout(() => setAnimCell(null), 400)
        setSelected(null); setValidMoves([])
        if (captured?.type==='K') { setStatus('won'); onVictory(score+500); setBoard(nb) }
        else { setBoard(nb); setTurn('b'); setEnPassant(newEP); doAIMove(nb, newEP); snd(captured?220:440,'sine',0.1) }
      } else if (b[r][c]?.color==='w') {
        setSelected([r,c]); setValidMoves(getMoves(b,r,c,enPassant||[])); snd(500,'sine',0.05)
      } else { setSelected(null); setValidMoves([]) }
    } else if (b[r][c]?.color==='w') {
      setSelected([r,c]); setValidMoves(getMoves(b,r,c,enPassant||[])); snd(500,'sine',0.05)
    }
  }, [selected, validMoves, turn, status, isPaused, doAIMove, enPassant, onVictory, onGameOver, score, snd, onScoreChange])

  const advantage = materialAdvantage()

  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full max-w-2xl mx-auto my-auto select-none p-2 sm:p-4">
      
      {/* ── TOP HUD (AI vs PLAYER) ───────────────────────────────── */}
      <div className="w-full flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        
        {/* AI Opponent */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xl bg-slate-800 border-2 ${status==='thinking'?'border-yellow-400 animate-pulse':'border-rose-500/50'}`}>
            🤖
            {status==='thinking' && (
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-400 animate-bounce" />
            )}
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-black text-rose-400 uppercase">AI DeepMind</div>
            {capturedB.length > 0 && (
              <div className="flex flex-wrap gap-0.5 text-xs opacity-80">
                {capturedB.map((p,i) => <span key={i}>{PIECE_UNICODE['w'+p]}</span>)}
              </div>
            )}
          </div>
        </div>

        {/* Center: Material bar & status badge */}
        <div className="flex flex-col items-center gap-1">
          <div className={`px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${
            status==='thinking' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 animate-pulse'
            : status==='won' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            : status==='lost' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            : turn==='w' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
            : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            {status==='thinking' ? 'AI Thinking...' : status==='won' ? '🏆 Victory!' : status==='lost' ? '💀 AI Won' : 'Your Turn ♔'}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-slate-400">Material:</span>
            <span className={`text-[10px] font-black ${advantage > 0 ? 'text-cyan-400' : advantage < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {advantage > 0 ? `+${advantage}` : advantage < 0 ? advantage : '±0'}
            </span>
          </div>
        </div>

        {/* Player (White) */}
        <div className="flex items-center gap-2 sm:gap-3 text-right">
          <div>
            <div className="text-[10px] sm:text-xs font-black text-cyan-400 uppercase">You (White)</div>
            <div className="text-yellow-400 font-mono font-black text-xs">{score} PTS</div>
            {capturedW.length > 0 && (
              <div className="flex flex-wrap gap-0.5 justify-end text-xs opacity-80">
                {capturedW.map((p,i) => <span key={i}>{PIECE_UNICODE['b'+p]}</span>)}
              </div>
            )}
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xl bg-slate-800 border-2 border-cyan-500/50">
            🧑‍💻
          </div>
        </div>

      </div>

      {/* ── CHESS BOARD ──────────────────────────────────────────── */}
      <div className="relative flex flex-col items-center p-2 sm:p-3 bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl">
        <div className="flex">
          {/* Rank numbers (8 to 1) on the left */}
          <div className="flex flex-col justify-around pr-1.5 text-slate-500 font-bold text-[10px] sm:text-xs select-none">
            {RANKS.map(r => (
              <div key={r} className="flex items-center justify-center w-4 h-10 sm:h-12 md:h-14 lg:h-16">
                {r}
              </div>
            ))}
          </div>

          {/* 8x8 Board - explicit flex rows */}
          <div className="flex flex-col border-2 border-slate-700 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,245,255,0.15)] bg-slate-900">
            {board.map((row, r) => (
              <div key={r} className="flex flex-row">
                {row.map((piece, c) => {
                  const isLight = (r + c) % 2 === 0
                  const isSel = selected && selected[0]===r && selected[1]===c
                  const isValid = validMoves.some(([vr,vc]) => vr===r&&vc===c)
                  const isHover = hovered && hovered[0]===r && hovered[1]===c
                  const isLastMove = lastMove && (
                    (lastMove[0][0]===r&&lastMove[0][1]===c) ||
                    (lastMove[1][0]===r&&lastMove[1][1]===c)
                  )
                  const isAnim = animCell && animCell[0]===r && animCell[1]===c

                  // Tile Background Colors
                  let bgStyle = isSel
                    ? '#f6f669'
                    : isLastMove
                    ? isLight ? '#cdd26a' : '#aaa23a'
                    : isLight
                    ? '#e8d5b5'
                    : '#8b6243'

                  const isCapture = isValid && piece

                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleClick(r, c)}
                      onMouseEnter={() => setHovered([r,c])}
                      onMouseLeave={() => setHovered(null)}
                      className={`relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center transition-all duration-100 cursor-pointer ${isHover&&!isSel?'brightness-110':''}`}
                      style={{ backgroundColor: bgStyle }}
                    >
                      {/* Valid Move Indicator (Dot) */}
                      {isValid && !piece && (
                        <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-black/30 pointer-events-none" />
                      )}

                      {/* Valid Capture Target Ring */}
                      {isCapture && (
                        <div className="absolute inset-0 ring-inset ring-2 sm:ring-4 ring-black/35 pointer-events-none" />
                      )}

                      {/* Chess Piece */}
                      {piece && (
                        <span
                          className={`leading-none select-none transition-transform duration-150 ${
                            isAnim ? 'scale-125' : isHover&&piece.color==='w'&&turn==='w' ? 'scale-110' : 'scale-100'
                          }`}
                          style={{
                            fontSize: 'clamp(1.5rem, 3.2vw, 2.5rem)',
                            color: piece.color === 'w' ? '#ffffff' : '#110500',
                            filter: piece.color === 'w'
                              ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.9)) drop-shadow(0 0 4px rgba(0,245,255,0.4))'
                              : 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
                            textShadow: piece.color === 'w' && isSel ? '0 0 12px rgba(0,245,255,0.9)' : 'none',
                          }}
                        >
                          {PIECE_UNICODE[piece.color + piece.type]}
                        </span>
                      )}

                      {/* File letter label in bottom rank */}
                      {r === 7 && (
                        <span className="absolute bottom-0.5 right-1 text-[8px] sm:text-[9px] font-bold opacity-40 leading-none pointer-events-none" style={{ color: isLight ? '#8b6243' : '#e8d5b5' }}>
                          {FILES[c]}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* File letters (a to h) below */}
        <div className="flex pl-5 pt-1.5 text-slate-500 font-bold text-[10px] sm:text-xs select-none">
          {FILES.map(f => (
            <div key={f} className="flex items-center justify-center w-10 sm:w-12 md:w-14 lg:w-16">
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM DRAWER: MOVE HISTORY & CONTROLS ───────────────── */}
      <div className="w-full flex items-center justify-between gap-3 px-4 py-2 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-[10px] font-black uppercase text-slate-400 shrink-0">Moves:</span>
          <div ref={historyRef} className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 max-w-xs sm:max-w-md">
            {moveHistory.length === 0 ? (
              <span className="text-slate-600 text-[11px]">Click a piece to play</span>
            ) : (
              moveHistory.map((m, i) => (
                <span
                  key={i}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono shrink-0 border ${
                    m.player === 'YOU'
                      ? 'bg-cyan-950/60 border-cyan-500/30 text-cyan-300'
                      : 'bg-rose-950/60 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {m.str}
                </span>
              ))
            )}
          </div>
        </div>

        <button
          onClick={() => {
            setBoard(INIT_BOARD())
            setSelected(null)
            setValidMoves([])
            setLastMove(null)
            setTurn('w')
            setStatus('idle')
            setCapturedW([])
            setCapturedB([])
            setMoveHistory([])
            setScore(0)
          }}
          className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer shrink-0"
        >
          🔄 New Game
        </button>
      </div>

    </div>
  )
}
