import { useState, useEffect, useCallback } from 'react'
import { usePyodide } from '../../shared/usePyodide'
import hangmanSource from './logic.py?raw'

// SVG hangman parts revealed progressively
const HANGMAN_PARTS = [
  // gallows
  <line key="base" x1="10" y1="190" x2="130" y2="190" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>,
  <line key="pole" x1="60" y1="190" x2="60" y2="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>,
  <line key="top" x1="60" y1="10" x2="120" y2="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>,
  <line key="rope" x1="120" y1="10" x2="120" y2="35" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>,
  // body parts (revealed per wrong guess)
  <circle key="head" cx="120" cy="50" r="16" stroke="currentColor" strokeWidth="3" fill="none"/>,
  <line key="body" x1="120" y1="66" x2="120" y2="120" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>,
  <line key="larm" x1="120" y1="80" x2="95" y2="105" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>,
  <line key="rarm" x1="120" y1="80" x2="145" y2="105" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>,
  <line key="lleg" x1="120" y1="120" x2="95" y2="150" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>,
  <line key="rleg" x1="120" y1="120" x2="145" y2="150" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>,
]

// Show gallows always (first 4), then body parts progressively
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export default function Hangman() {
  const { runPython, loading } = usePyodide()
  const [initialized, setInitialized] = useState(false)
  const [gameState, setGameState] = useState(null)
  const [difficulty, setDifficulty] = useState('medium')
  const [inputLetter, setInputLetter] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function init() {
      try {
        await runPython(hangmanSource)
        setInitialized(true)
      } catch (e) {
        setError('Failed to initialize Python runtime')
      }
    }
    init()
  }, [runPython])

  const startGame = useCallback(async (diff = difficulty) => {
    setError('')
    try {
      const code = `
import json
hangman_game = Hangman()
state = hangman_game.new_game({"difficulty": "${diff}"})
json.dumps(state)
`
      const result = await runPython(code)
      setGameState(JSON.parse(result))
    } catch (e) {
      setError(e.message)
    }
  }, [runPython, difficulty])

  const guessLetter = useCallback(async (letter) => {
    if (!gameState || gameState.game_over) return
    setError('')
    try {
      const code = `
import json
state = hangman_game.make_move("${letter}")
json.dumps(state)
`
      const result = await runPython(code)
      setGameState(JSON.parse(result))
    } catch (e) {
      setError(e.message)
    }
  }, [runPython, gameState])

  const handleInput = (e) => {
    e.preventDefault()
    if (inputLetter) {
      guessLetter(inputLetter.toUpperCase())
      setInputLetter('')
    }
  }

  if (!initialized) {
    return <div className="calculator-app__status">⚡ Initializing Pyodide Python WASM Engine...</div>
  }

  if (!gameState) {
    return (
      <div className="hangman-setup">
        <h2 className="hangman-setup__title">Hangman</h2>
        <p className="hangman-setup__desc">Guess the hidden word one letter at a time before the hangman is complete!</p>
        <div className="hangman-setup__difficulty">
          <label>Difficulty</label>
          <div className="ttt-setup__btns">
            {[['easy','😊 Easy (8 tries)'],['medium','🤔 Medium (7 tries)'],['hard','💀 Hard (6 tries)']].map(([v,l]) => (
              <button key={v} className={`ttt-option-btn ${difficulty===v?'active':''}`} onClick={() => setDifficulty(v)}>{l}</button>
            ))}
          </div>
        </div>
        <button className="ttt-start-btn" onClick={() => startGame(difficulty)} disabled={loading}>Start Game</button>
      </div>
    )
  }

  const { display, guessed_letters, wrong_guesses, wrong_count, max_wrong, game_over, won, word } = gameState
  // Gallows always visible (4 parts) + body parts for wrong guesses
  const visibleParts = [...HANGMAN_PARTS.slice(0, 4), ...HANGMAN_PARTS.slice(4, 4 + wrong_count)]

  return (
    <div className="hangman-app">
      <div className="hangman-main">
        {/* SVG Drawing */}
        <div className="hangman-drawing">
          <svg viewBox="0 0 175 200" className="hangman-svg" aria-label={`Hangman: ${wrong_count} of ${max_wrong} wrong guesses`}>
            {visibleParts}
          </svg>
          <div className="hangman-counter">
            {wrong_count} / {max_wrong} wrong
          </div>
        </div>

        {/* Word Display */}
        <div className="hangman-word">
          {display.map((ch, i) => (
            <span key={i} className={`hangman-letter ${ch !== '_' ? 'hangman-letter--revealed' : ''}`}>
              {ch}
            </span>
          ))}
        </div>

        {/* Game over */}
        {game_over && (
          <div className={`hangman-result ${won ? 'hangman-result--won' : 'hangman-result--lost'}`}>
            {won ? '🎉 You got it!' : `💀 The word was: ${word}`}
          </div>
        )}

        {/* Input or letter grid */}
        {!game_over && (
          <form className="hangman-input-row" onSubmit={handleInput}>
            <input
              type="text"
              maxLength={1}
              value={inputLetter}
              onChange={e => setInputLetter(e.target.value.replace(/[^a-zA-Z]/g, ''))}
              placeholder="Type a letter"
              className="hangman-input"
              autoFocus
            />
            <button type="submit" className="hangman-guess-btn" disabled={!inputLetter}>Guess</button>
          </form>
        )}

        {/* Alphabet keyboard */}
        <div className="hangman-keyboard">
          {ALPHABET.map(l => {
            const used = guessed_letters.includes(l)
            const isWrong = wrong_guesses.includes(l)
            return (
              <button
                key={l}
                id={`hangman-key-${l}`}
                className={`hangman-key ${used ? (isWrong ? 'hangman-key--wrong' : 'hangman-key--right') : ''}`}
                onClick={() => guessLetter(l)}
                disabled={used || game_over}
                aria-label={`Guess letter ${l}`}
              >
                {l}
              </button>
            )
          })}
        </div>

        {error && <p className="guesser-config__error">{error}</p>}

        {game_over && (
          <div className="hangman-actions">
            <button className="ttt-replay-btn" onClick={() => startGame()}>Play Again</button>
            <button className="ttt-back-btn" onClick={() => setGameState(null)}>⚙ Settings</button>
          </div>
        )}
      </div>
    </div>
  )
}
