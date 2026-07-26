import { Routes, Route, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard.jsx'
import AppShell from './components/AppShell.jsx'
import NotFound from './components/NotFound.jsx'
import { useKidsProgress } from './shared/useKidsProgress.js'

/** 🎮 GameZone Kids — only kids-friendly games! */
export const APP_LIST = [
  {
    id: 'memory-match',
    name: 'Memory Match',
    description: 'Flip cards to find matching pairs of emojis. How fast can you clear the board?',
    category: 'Kids',
    icon: '🃏',
  },
  {
    id: 'simon-says',
    name: 'Simon Says',
    description: 'Watch the flashing colors and repeat the pattern — can you beat your best score?',
    category: 'Kids',
    icon: '🎵',
  },
  {
    id: 'connect-four',
    name: 'Connect Four',
    description: 'Drop chips into the grid and be first to get four in a row. Challenge the AI!',
    category: 'Kids',
    icon: '🔴',
  },
  {
    id: 'maze-runner',
    name: 'Maze Runner',
    description: 'Navigate through auto-generated mazes from start to finish using arrow keys!',
    category: 'Kids',
    icon: '🌀',
  },
  {
    id: 'word-search',
    name: 'Word Search',
    description: 'Find all the hidden words in the grid! Animals, space, or dinosaur themes.',
    category: 'Kids',
    icon: '🔤',
  },
  {
    id: 'sliding-puzzle',
    name: 'Sliding Puzzle',
    description: 'Slide the tiles into the right order. Easy 3×3 or tricky 4×4 — you choose!',
    category: 'Kids',
    icon: '🧩',
  },
  {
    id: 'tic-tac-toe',
    name: 'Tic-Tac-Toe',
    description: 'The classic X and O game! Beat the unbeatable AI or play with a friend.',
    category: 'Fun',
    icon: '❌',
  },
  {
    id: 'hangman',
    name: 'Hangman',
    description: 'Guess the hidden word letter by letter before time runs out!',
    category: 'Fun',
    icon: '🪓',
  },
  {
    id: 'number-guesser',
    name: 'Number Guessing',
    description: 'I\'m thinking of a number... can you guess it? Hot or cold hints guide you!',
    category: 'Fun',
    icon: '🎯',
  },
]

const KIDS_THEMES = ['candy', 'galaxy', 'ocean', 'jungle']
const THEME_LABELS = { candy: '🍬', galaxy: '🌌', ocean: '🌊', jungle: '🌿' }
const THEME_KEY = 'gamezone-kids-theme'

function App() {
  const [kidsTheme, setKidsTheme] = useState(
    () => localStorage.getItem(THEME_KEY) || 'candy'
  )
  const { progress } = useKidsProgress()

  useEffect(() => {
    document.body.setAttribute('data-kids-theme', kidsTheme)
    document.documentElement.setAttribute('data-kids-theme', kidsTheme)
    localStorage.setItem(THEME_KEY, kidsTheme)
  }, [kidsTheme])

  // Apply candy theme on initial mount
  useEffect(() => {
    document.body.setAttribute('data-kids-theme', kidsTheme)
    document.documentElement.setAttribute('data-kids-theme', kidsTheme)
  }, [])

  return (
    <>
      <header className="header">
        <Link to="/" className="header__logo">
          <span className="header__logo-icon" aria-hidden="true">🎮</span>
          GameZone
        </Link>

        <nav className="header__nav" aria-label="Site navigation">
          {/* Stars counter */}
          <div className="header-stars" title={`You have ${progress.totalStars} stars!`}>
            ⭐ {progress.totalStars} Stars
          </div>

          {/* Theme picker */}
          <div className="theme-picker" aria-label="Pick a color theme">
            {KIDS_THEMES.map(t => (
              <button
                key={t}
                id={`theme-btn-${t}`}
                className={`theme-picker__btn theme-picker__btn--${t} ${kidsTheme === t ? 'theme-picker__btn--active' : ''}`}
                onClick={() => setKidsTheme(t)}
                title={`${t.charAt(0).toUpperCase() + t.slice(1)} theme`}
                aria-pressed={kidsTheme === t}
              />
            ))}
          </div>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Dashboard apps={APP_LIST} progress={progress} />} />
        <Route path="/app/:appId" element={<AppShell apps={APP_LIST} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default App
