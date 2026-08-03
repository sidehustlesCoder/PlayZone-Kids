import { useState, useEffect } from 'react'
import { usePyodide } from '../../shared/usePyodide'
import numberGuesserSource from './logic.py?raw'
import { playWinSound, playLoseSound, playSelectSound } from '../../shared/sounds'

function NumberGuesser() {
  const { runPython, loading, error: pyodideError } = usePyodide()
  const [isPythonInitialized, setIsPythonInitialized] = useState(false)
  const [gameState, setGameState] = useState(null)
  const [currentGuess, setCurrentGuess] = useState('')
  const [error, setError] = useState('')

  // Game config state
  const [minVal, setMinVal] = useState(1)
  const [maxVal, setMaxVal] = useState(100)
  const [difficulty, setDifficulty] = useState('medium') // easy, medium, hard

  // Local storage high scores state
  const [highScores, setHighScores] = useState({
    easy: null,
    medium: null,
    hard: null,
  })

  // Load high scores on mount
  useEffect(() => {
    const scores = localStorage.getItem('codearcade-guesser-highs')
    if (scores) {
      try {
        setHighScores(JSON.parse(scores))
      } catch (e) {
        console.error('Error loading high scores:', e)
      }
    }
  }, [])

  // Initialize Python logic on mount
  useEffect(() => {
    async function init() {
      try {
        await runPython(numberGuesserSource)
        setIsPythonInitialized(true)
      } catch (err) {
        console.error('Failed to initialize number guesser logic:', err)
        setError('Oops! Something went wrong starting the game.')
      }
    }
    init()
  }, [runPython])

  const handleStartGame = async () => {
    setError('')
    if (Number(minVal) >= Number(maxVal)) {
      setError('Hmm, the minimum number needs to be smaller than the maximum! 🤔')
      return
    }
    try {
      const pyCode = `
import json
if 'guesser' not in globals():
    guesser = NumberGuesser()
state = guesser.new_game({"min": ${minVal}, "max": ${maxVal}, "difficulty": "${difficulty}"})
json.dumps(state)
`
      const stateStr = await runPython(pyCode)
      const state = JSON.parse(stateStr)
      setGameState(state)
      setCurrentGuess('')
    } catch (err) {
      setError(err.message || 'Error starting game')
    }
  }

  const handleGuessSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!currentGuess || isNaN(currentGuess)) {
      setError('Please enter a valid number! 🔢')
      return
    }

    const val = Number(currentGuess)
    if (val < gameState.min || val > gameState.max) {
      setError(`Try a number between ${gameState.min} and ${gameState.max}! 😊`)
      return
    }

    playSelectSound()
    try {
      const pyCode = `
import json
state = guesser.make_move(${val})
json.dumps(state)
`
      const stateStr = await runPython(pyCode)
      const state = JSON.parse(stateStr)
      setGameState(state)
      setCurrentGuess('')

      // Feedback sounds & star reward
      if (state.game_over && state.won) {
        playWinSound()
        window.dispatchEvent(new CustomEvent('game-win', { detail: { stars: 1 } }))
        const attemptsUsed = state.attempts
        const prevBest = highScores[difficulty]
        if (!prevBest || attemptsUsed < prevBest) {
          const updatedScores = { ...highScores, [difficulty]: attemptsUsed }
          setHighScores(updatedScores)
          localStorage.setItem('codearcade-guesser-highs', JSON.stringify(updatedScores))
        }
      } else if (state.game_over && !state.won) {
        playLoseSound()
      } else if (state.guesses?.length > 0) {
        const lastHint = state.guesses[state.guesses.length - 1]?.hint
        if (lastHint === 'higher' || lastHint === 'lower') playLoseSound()
      }
    } catch (err) {
      setError(err.message || 'Error processing guess')
    }
  }

  const hintMap = {
    correct: '🎯 You got it!',
    higher: '🔺 Go higher! Try a bigger number!',
    lower: '🔻 Go lower! Try a smaller number!'
  }

  return (
    <div className="number-guesser-app">
      {!isPythonInitialized ? (
        <div className="calculator-app__status" style={{ textAlign: 'center', padding: '40px', fontSize: '1.2rem' }}>
          ⚡ Getting the game ready for you...
        </div>
      ) : !gameState ? (
        /* Configuration Screen */
        <div className="guesser-config">
          <h2 className="guesser-config__title">🎯 Number Guessing!</h2>
          <p style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-muted)' }}>
            I'm thinking of a secret number... can YOU guess it? 🤫
          </p>
          {error && <div className="guesser-config__error" role="alert">{error}</div>}

          <div className="guesser-config__form">
            <div className="guesser-config__field-group">
              <div className="guesser-config__field">
                <label htmlFor="min-val">Min Number</label>
                <input
                  type="number"
                  id="min-val"
                  value={minVal}
                  onChange={(e) => setMinVal(Number(e.target.value))}
                />
              </div>
              <div className="guesser-config__field">
                <label htmlFor="max-val">Max Number</label>
                <input
                  type="number"
                  id="max-val"
                  value={maxVal}
                  onChange={(e) => setMaxVal(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="guesser-config__field">
              <label>Pick your challenge:</label>
              <div className="guesser-config__difficulty" role="radiogroup" aria-label="Difficulty Selection">
                {['easy', 'medium', 'hard'].map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`guesser-config__diff-btn guesser-config__diff-btn--${diff} ${difficulty === diff ? 'active' : ''}`}
                  >
                    {diff === 'easy' ? '😊' : diff === 'medium' ? '🤔' : '🔥'} {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    <span className="attempts-badge">
                      {diff === 'easy' ? '15 tries' : diff === 'medium' ? '10 tries' : '5 tries'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Best Scores Display */}
            <div className="guesser-config__best-scores">
              <h3>🏆 Your Best Scores (fewer guesses = better!)</h3>
              <div className="scores-grid">
                <div>😊 Easy: <strong>{highScores.easy || '—'}</strong></div>
                <div>🤔 Medium: <strong>{highScores.medium || '—'}</strong></div>
                <div>🔥 Hard: <strong>{highScores.hard || '—'}</strong></div>
              </div>
            </div>

            <button
              onClick={handleStartGame}
              disabled={loading}
              className="guesser-config__start-btn"
            >
              🎮 Start Guessing!
            </button>
          </div>
        </div>
      ) : (
        /* Play Screen */
        <div className="guesser-play">
          <div className="guesser-play__header">
            <div>
              <h3>🔢 Guess between {gameState.min} and {gameState.max}</h3>
              <p>Guesses: <strong>{gameState.attempts}</strong> of <strong>{gameState.max_attempts}</strong></p>
            </div>
            <button
              onClick={() => setGameState(null)}
              className="guesser-play__reset-btn"
            >
              ⚙️ Settings
            </button>
          </div>

          {/* Progress gauge */}
          <div className="guesser-play__progress">
            <div
              className="guesser-play__progress-bar"
              style={{ width: `${(gameState.attempts / gameState.max_attempts) * 100}%` }}
            />
          </div>

          {error && <div className="guesser-config__error" role="alert">{error}</div>}

          {!gameState.game_over ? (
            /* Guess input form */
            <form onSubmit={handleGuessSubmit} className="guesser-play__form">
              <input
                type="number"
                value={currentGuess}
                onChange={(e) => setCurrentGuess(e.target.value)}
                placeholder="Type your guess here!"
                aria-label="Your guess"
                disabled={loading}
                autoFocus
              />
              <button type="submit" disabled={loading}>
                🎯 Guess!
              </button>
            </form>
          ) : (
            /* Game over message */
            <div className="guesser-play__gameover">
              {gameState.won ? (
                <div className="won-banner">
                  🎉 You found it in <strong>{gameState.attempts}</strong> guess{gameState.attempts !== 1 ? 'es' : ''}! Way to go!
                  {highScores[difficulty] === gameState.attempts && <span> 🏆 New Personal Best!</span>}
                </div>
              ) : (
                <div className="lost-banner">
                  😢 Aww! You ran out of guesses. You were SO close! Try again! 💪
                </div>
              )}
              <button
                onClick={handleStartGame}
                className="guesser-play__replay-btn"
              >
                🔄 Play Again!
              </button>
            </div>
          )}

          {/* Guess history list */}
          {gameState.guesses.length > 0 && (
            <div className="guesser-play__history">
              <h4>Your guesses:</h4>
              <div className="history-list">
                {[...gameState.guesses].reverse().map((g, index) => (
                  <div
                    key={index}
                    className={`history-card hint-${g.hint}`}
                  >
                    <span className="guess-val">{g.guess}</span>
                    <span className="guess-hint">
                      {hintMap[g.hint] || g.hint}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NumberGuesser
