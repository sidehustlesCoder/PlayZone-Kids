import { useParams, Link, Navigate } from 'react-router-dom'
import { useState, useEffect, useCallback, useRef } from 'react'
import SourceCodeViewer from './SourceCodeViewer.jsx'
import Confetti from './Confetti.jsx'
import Mascot from './Mascot.jsx'
import { useKidsProgress } from '../shared/useKidsProgress.js'

// Import App Components
import NumberGuesser from '../apps/number-guesser/NumberGuesser.jsx'
import TicTacToe from '../apps/tic-tac-toe/TicTacToe.jsx'
import Quiz from '../apps/quiz/Quiz.jsx'
import TextAdventure from '../apps/text-adventure/TextAdventure.jsx'
import Hangman from '../apps/hangman/Hangman.jsx'
import MemoryMatch from '../apps/memory-match/MemoryMatch.jsx'
import SimonSays from '../apps/simon-says/SimonSays.jsx'
import ConnectFour from '../apps/connect-four/ConnectFour.jsx'
import MazeRunner from '../apps/maze-runner/MazeRunner.jsx'
import WordSearch from '../apps/word-search/WordSearch.jsx'
import SlidingPuzzle from '../apps/sliding-puzzle/SlidingPuzzle.jsx'
import ShapeSorter from '../apps/shape-sorter/ShapeSorter.jsx'
import ColorSplash from '../apps/color-splash/ColorSplash.jsx'
import AnimalSoundMatch from '../apps/animal-sound-match/AnimalSoundMatch.jsx'
import WhackAMole from '../apps/whack-a-mole/WhackAMole.jsx'

// Import Raw Python Scripts (Only for apps still using Python/Pyodide)
import numberGuesserSource from '../apps/number-guesser/logic.py?raw'
import ticTacToeSource from '../apps/tic-tac-toe/logic.py?raw'
import quizSource from '../apps/quiz/logic.py?raw'
import textAdventureSource from '../apps/text-adventure/logic.py?raw'
import hangmanSource from '../apps/hangman/logic.py?raw'

const APP_COMPONENTS = {
  'shape-sorter': ShapeSorter,
  'color-splash': ColorSplash,
  'animal-sound-match': AnimalSoundMatch,
  'whack-a-mole': WhackAMole,
  'memory-match': MemoryMatch,
  'simon-says': SimonSays,
  'connect-four': ConnectFour,
  'maze-runner': MazeRunner,
  'word-search': WordSearch,
  'sliding-puzzle': SlidingPuzzle,
  'number-guesser': NumberGuesser,
  'tic-tac-toe': TicTacToe,
  quiz: Quiz,
  'text-adventure': TextAdventure,
  hangman: Hangman,
}

const APP_SOURCES = {
  'number-guesser': numberGuesserSource,
  'tic-tac-toe': ticTacToeSource,
  quiz: quizSource,
  'text-adventure': textAdventureSource,
  hangman: hangmanSource,
}

const GAME_HINTS = {
  'shape-sorter': "Try selecting a shape first, then click on the outline slot that matches it! 🧩",
  'color-splash': "Look at the message at the top! We only want to pop balloons of that specific color! 🎈",
  'animal-sound-match': "Click the big sound button to hear the sound, then click the correct animal emoji! 🐯",
  'memory-match': "Flip cards to find pairs! Take your time and try to remember where each card sits. 🃏",
  'simon-says': "Watch the order of colors flashing! Repeat it step-by-step. 🎵",
  'word-search': "Look for words in horizontal, vertical, or diagonal rows. Drag from first to last letter! 🔤",
  'whack-a-mole': "Moles pop up from 9 holes. Tap them quickly before they go down! 🔨",
  'maze-runner': "Find the path from the smiley face to the flag! Use the arrow keys or D-pad. 🌀",
  'connect-four': "Drop chips into the slots. Try to get 4 of your red chips in a straight line! 🔴",
  'sliding-puzzle': "Slide the numbered tiles into the empty space to arrange them in order! 🧩",
  'tic-tac-toe': "Place X's on the board. Get three in a row to win! Don't let the AI get three O's. ❌",
  'hangman': "Start by guessing vowels (A, E, O, I, U). It will help you find the secret word! 🪓",
  'number-guesser': "Use the higher/lower hints! If higher, pick a larger number. If lower, pick a smaller one! 🎯",
  'quiz': "Read the options carefully, and choose the one that answers the question! 🔬",
  'text-adventure': "Read each block of story, then tap on the choices to select your path! 🌲"
}

function AppShell({ apps }) {
  const { appId } = useParams()
  const app = apps.find(a => a.id === appId)
  const [showConfetti, setShowConfetti] = useState(false)
  const { awardStars, markPlayed } = useKidsProgress()
  const [isStuck, setIsStuck] = useState(false)
  const [mascotMsg, setMascotMsg] = useState('')

  useEffect(() => {
    if (appId) {
      markPlayed(appId)
    }
  }, [appId, markPlayed])

  // Stuck timer detection (45 seconds)
  useEffect(() => {
    setIsStuck(false)
    setMascotMsg('')
    
    const timer = setTimeout(() => {
      setIsStuck(true)
    }, 45000)

    return () => clearTimeout(timer)
  }, [appId])

  // Listen for game win events (celebration)
  useEffect(() => {
    const handleGameWin = (e) => {
      setShowConfetti(true)
      awardStars(appId, e.detail?.stars || 1)
      setIsStuck(false)
      setMascotMsg("Wow! You did it! You're a superstar! 🎉🌟")
    }
    window.addEventListener('game-win', handleGameWin)
    return () => window.removeEventListener('game-win', handleGameWin)
  }, [appId, awardStars])

  const handleMascotClick = () => {
    const hint = GAME_HINTS[appId] || "You are doing great! Keep trying! 🦊✨"
    setMascotMsg(hint)
    setIsStuck(false)
    setTimeout(() => {
      setMascotMsg('')
    }, 8000)
  }

  if (!app) {
    return <Navigate to="/404" replace />
  }

  const Component = APP_COMPONENTS[appId]
  const source = APP_SOURCES[appId]

  return (
    <div className="app-shell">
      <Confetti active={showConfetti} onDone={() => setShowConfetti(false)} />

      {/* Floating Mascot */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
        <Mascot message={mascotMsg} isStuck={isStuck} onClick={handleMascotClick} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="app-shell__back">
          ← Back to Games
        </Link>
        <button
          onClick={() => { setShowConfetti(true); awardStars(appId, 1) }}
          className="ttt-back-btn"
          style={{ fontSize: '0.85rem', padding: '4px 14px' }}
          title="Celebrate your victory!"
        >
          🎉 Celebrate Win!
        </button>
      </div>

      <h1 className="app-shell__title">
        <span aria-hidden="true">{app.icon} </span>
        {app.name}
      </h1>

      <div className="app-shell__content">
        {Component ? (
          <Component />
        ) : (
          <div className="coming-soon">
            <span className="coming-soon__icon" aria-hidden="true">🚧</span>
            <span className="coming-soon__text">Coming Soon</span>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              This game will be built in the next phase.
            </p>
          </div>
        )}
      </div>

      <SourceCodeViewer appId={app.id} source={source} />
    </div>
  )
}

export default AppShell
