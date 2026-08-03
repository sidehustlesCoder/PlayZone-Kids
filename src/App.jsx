import { Routes, Route, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard.jsx'
import AppShell from './components/AppShell.jsx'
import NotFound from './components/NotFound.jsx'
import HomeBase from './components/HomeBase.jsx'
import { useKidsProgress } from './shared/useKidsProgress.js'

export const APP_LIST = [
  // --- Younger band (3-5) ---
  {
    id: 'shape-sorter',
    name: 'Shape Sorter',
    description: 'Drag or tap shapes to match their outlines! Super fun and simple.',
    category: 'Kids',
    icon: '🧩',
    ageBand: '3-5',
    difficulty: 'Easy'
  },
  {
    id: 'color-splash',
    name: 'Color Splash',
    description: 'Pop balloons of the target color to splash and reveal a mystery animal!',
    category: 'Kids',
    icon: '🎈',
    ageBand: '3-5',
    difficulty: 'Easy'
  },
  {
    id: 'animal-sound-match',
    name: 'Animal Sound Match',
    description: 'Hear a funny sound and guess which cute animal made it!',
    category: 'Kids',
    icon: '🔊',
    ageBand: '3-5',
    difficulty: 'Easy'
  },

  // --- Middle band (6-8) ---
  {
    id: 'memory-match',
    name: 'Memory Match',
    description: 'Flip cards to find matching pairs of emojis. Pick from awesome themes!',
    category: 'Kids',
    icon: '🃏',
    ageBand: '6-8',
    difficulty: 'Multi'
  },
  {
    id: 'simon-says',
    name: 'Simon Says',
    description: 'Watch the flashing colors and repeat the pattern as it gets faster!',
    category: 'Kids',
    icon: '🎵',
    ageBand: '6-8',
    difficulty: 'Multi'
  },
  {
    id: 'word-search',
    name: 'Word Search',
    description: 'Find all the hidden words in the letter grid. Space, animals, or dinosaur themes!',
    category: 'Kids',
    icon: '🔤',
    ageBand: '6-8',
    difficulty: 'Medium'
  },
  {
    id: 'whack-a-mole',
    name: 'Whack-a-Mole',
    description: 'Tap the moles as they pop up from their holes before time runs out!',
    category: 'Kids',
    icon: '🔨',
    ageBand: '6-8',
    difficulty: 'Medium'
  },

  // --- Older band (9-12) ---
  {
    id: 'maze-runner',
    name: 'Maze Runner',
    description: 'Navigate through auto-generated mazes from start to finish! Track your best time.',
    category: 'Kids',
    icon: '🌀',
    ageBand: '9-12',
    difficulty: 'Multi'
  },
  {
    id: 'connect-four',
    name: 'Connect Four',
    description: 'Drop chips into the grid and connect four in a row. Challenge the smart AI!',
    category: 'Kids',
    icon: '🔴',
    ageBand: '9-12',
    difficulty: 'Multi'
  },
  {
    id: 'sliding-puzzle',
    name: 'Sliding Puzzle',
    description: 'Slide the tiles into numerical order. Easy 3×3 or tricky 4×4!',
    category: 'Kids',
    icon: '🧩',
    ageBand: '9-12',
    difficulty: 'Multi'
  },

  // --- Legacy games ---
  {
    id: 'tic-tac-toe',
    name: 'Tic-Tac-Toe',
    description: 'The classic X and O game! Beat the unbeatable AI or play with a friend.',
    category: 'Fun',
    icon: '❌',
    ageBand: '6-12',
    difficulty: 'Multi'
  },
  {
    id: 'hangman',
    name: 'Hangman',
    description: 'Guess the hidden word letter by letter before time runs out!',
    category: 'Fun',
    icon: '🪓',
    ageBand: '6-12',
    difficulty: 'Medium'
  },
  {
    id: 'number-guesser',
    name: 'Number Guessing',
    description: 'I\'m thinking of a number... can you guess it? Hot or cold hints guide you!',
    category: 'Fun',
    icon: '🎯',
    ageBand: '6-12',
    difficulty: 'Easy'
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
          {/* Home Base Link */}
          <Link to="/profile" className="header-stars" style={{ textDecoration: 'none' }} title="Go to Home Base">
            🏰 Home Base
          </Link>

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
        <Route path="/profile" element={<HomeBase progress={progress} />} />
        <Route path="/app/:appId" element={<AppShell apps={APP_LIST} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default App
