import { useParams, Link, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import SourceCodeViewer from './SourceCodeViewer.jsx'
import Confetti from './Confetti.jsx'
import { useKidsProgress } from '../shared/useKidsProgress.js'

// Import App Components
import Calculator from '../apps/calculator/Calculator.jsx'
import NumberGuesser from '../apps/number-guesser/NumberGuesser.jsx'
import PasswordGenerator from '../apps/password-gen/PasswordGenerator.jsx'
import TicTacToe from '../apps/tic-tac-toe/TicTacToe.jsx'
import Quiz from '../apps/quiz/Quiz.jsx'
import TodoApp from '../apps/todo/TodoApp.jsx'
import UnitConverter from '../apps/unit-converter/UnitConverter.jsx'
import TextAdventure from '../apps/text-adventure/TextAdventure.jsx'
import Hangman from '../apps/hangman/Hangman.jsx'
import WebScraper from '../apps/web-scraper/WebScraper.jsx'
import MemoryMatch from '../apps/memory-match/MemoryMatch.jsx'
import SimonSays from '../apps/simon-says/SimonSays.jsx'
import ConnectFour from '../apps/connect-four/ConnectFour.jsx'
import MazeRunner from '../apps/maze-runner/MazeRunner.jsx'
import WordSearch from '../apps/word-search/WordSearch.jsx'
import SlidingPuzzle from '../apps/sliding-puzzle/SlidingPuzzle.jsx'

// Import Raw Python Scripts
import calculatorSource from '../apps/calculator/logic.py?raw'
import numberGuesserSource from '../apps/number-guesser/logic.py?raw'
import passwordGenSource from '../apps/password-gen/logic.py?raw'
import ticTacToeSource from '../apps/tic-tac-toe/logic.py?raw'
import quizSource from '../apps/quiz/logic.py?raw'
import todoSource from '../apps/todo/logic.py?raw'
import unitConverterSource from '../apps/unit-converter/logic.py?raw'
import textAdventureSource from '../apps/text-adventure/logic.py?raw'
import hangmanSource from '../apps/hangman/logic.py?raw'
import webScraperSource from '../apps/web-scraper/logic.py?raw'
import memoryMatchSource from '../apps/memory-match/logic.py?raw'
import simonSaysSource from '../apps/simon-says/logic.py?raw'
import connectFourSource from '../apps/connect-four/logic.py?raw'
import mazeRunnerSource from '../apps/maze-runner/logic.py?raw'
import wordSearchSource from '../apps/word-search/logic.py?raw'
import slidingPuzzleSource from '../apps/sliding-puzzle/logic.py?raw'

const APP_COMPONENTS = {
  calculator: Calculator,
  'number-guesser': NumberGuesser,
  'password-gen': PasswordGenerator,
  'tic-tac-toe': TicTacToe,
  quiz: Quiz,
  todo: TodoApp,
  'unit-converter': UnitConverter,
  'text-adventure': TextAdventure,
  hangman: Hangman,
  'web-scraper': WebScraper,
  'memory-match': MemoryMatch,
  'simon-says': SimonSays,
  'connect-four': ConnectFour,
  'maze-runner': MazeRunner,
  'word-search': WordSearch,
  'sliding-puzzle': SlidingPuzzle,
}

const APP_SOURCES = {
  calculator: calculatorSource,
  'number-guesser': numberGuesserSource,
  'password-gen': passwordGenSource,
  'tic-tac-toe': ticTacToeSource,
  quiz: quizSource,
  todo: todoSource,
  'unit-converter': unitConverterSource,
  'text-adventure': textAdventureSource,
  hangman: hangmanSource,
  'web-scraper': webScraperSource,
  'memory-match': memoryMatchSource,
  'simon-says': simonSaysSource,
  'connect-four': connectFourSource,
  'maze-runner': mazeRunnerSource,
  'word-search': wordSearchSource,
  'sliding-puzzle': slidingPuzzleSource,
}

function AppShell({ apps }) {
  const { appId } = useParams()
  const app = apps.find(a => a.id === appId)
  const [showConfetti, setShowConfetti] = useState(false)
  const { awardStars, markPlayed } = useKidsProgress()

  useEffect(() => {
    if (appId) {
      markPlayed(appId)
    }
  }, [appId, markPlayed])

  // Listen for game win events (celebration)
  useEffect(() => {
    const handleGameWin = (e) => {
      setShowConfetti(true)
      awardStars(appId, e.detail?.stars || 1)
    }
    window.addEventListener('game-win', handleGameWin)
    return () => window.removeEventListener('game-win', handleGameWin)
  }, [appId, awardStars])

  if (!app) {
    return <Navigate to="/404" replace />
  }

  const Component = APP_COMPONENTS[appId]
  const source = APP_SOURCES[appId]

  return (
    <div className="app-shell">
      <Confetti active={showConfetti} onDone={() => setShowConfetti(false)} />

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
