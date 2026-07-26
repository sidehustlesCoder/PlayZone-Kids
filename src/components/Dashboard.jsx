import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar from './SearchBar.jsx'
import CategoryFilter from './CategoryFilter.jsx'
import AppCard from './AppCard.jsx'
import Mascot from './Mascot.jsx'

const TIP_MESSAGES = [
  "💡 Tip: Practice Memory Match to boost your memory power!",
  "🚀 Did you know? Mazes help improve logic and spatial awareness!",
  "⭐ Earn stars by completing games and clearing levels!",
  "🎯 Challenge the Connect Four AI on Medium difficulty for a real test!",
  "🔤 Word Search expands your vocabulary while having fun!",
  "🧩 Sliding Puzzle exercises your brain's step-by-step planning!",
]

function getDailyGameId(apps) {
  if (!apps.length) return ''
  const today = new Date().toISOString().slice(0, 10)
  let hash = 0
  for (let i = 0; i < today.length; i++) {
    hash = (hash << 5) - hash + today.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % apps.length
  return apps[index].id
}

function Dashboard({ apps, progress }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [tipIndex, setTipIndex] = useState(0)

  const dailyGameId = useMemo(() => getDailyGameId(apps), [apps])
  const dailyGame = useMemo(() => apps.find(a => a.id === dailyGameId), [apps, dailyGameId])

  /* Filter apps by search + category */
  const filtered = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(search.toLowerCase()) ||
                          app.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'All' || app.category === category
    return matchesSearch && matchesCategory
  })

  /* Extract unique categories */
  const categories = ['All', ...new Set(apps.map(a => a.category))]

  const handlePickRandomGame = () => {
    if (apps.length === 0) return
    const randomIndex = Math.floor(Math.random() * apps.length)
    const randomApp = apps[randomIndex]
    navigate(`/app/${randomApp.id}`)
  }

  const handleNextTip = () => {
    setTipIndex(prev => (prev + 1) % TIP_MESSAGES.length)
  }

  return (
    <main>
      {/* Floating BG Emojis */}
      <div className="kids-bg-floats" aria-hidden="true">
        <span className="kids-bg-floats__item" style={{ top: '15%', left: '8%', animationDuration: '18s' }}>⭐</span>
        <span className="kids-bg-floats__item" style={{ top: '35%', left: '85%', animationDuration: '22s' }}>🚀</span>
        <span className="kids-bg-floats__item" style={{ top: '65%', left: '12%', animationDuration: '16s' }}>🎈</span>
        <span className="kids-bg-floats__item" style={{ top: '75%', left: '90%', animationDuration: '25s' }}>🎨</span>
        <span className="kids-bg-floats__item" style={{ top: '45%', left: '50%', animationDuration: '20s' }}>✨</span>
      </div>

      {/* Kids Hero */}
      <section className="kids-hero">
        <div className="kids-hero__floats" aria-hidden="true">
          <span className="kids-hero__float">⭐</span>
          <span className="kids-hero__float">🎈</span>
          <span className="kids-hero__float">✨</span>
          <span className="kids-hero__float">🌟</span>
          <span className="kids-hero__float">🎯</span>
          <span className="kids-hero__float">🎨</span>
        </div>

        <Mascot />

        <h1 className="kids-hero__title">Welcome to GameZone!</h1>
        <p className="kids-hero__subtitle">
          Fun, colorful & free mini-games made especially for kids. Play, learn & collect stars! ⭐
        </p>

        {dailyGame && (
          <div>
            <button
              onClick={() => navigate(`/app/${dailyGame.id}`)}
              className="daily-challenge"
              title="Play today's featured game!"
            >
              <span>🌟 Game of the Day: <strong>{dailyGame.name}</strong></span>
              <span className="daily-challenge__label">Play Now →</span>
            </button>
          </div>
        )}

        <div>
          <button onClick={handlePickRandomGame} className="pick-game-btn" id="pick-game-btn">
            🎲 Surprise Me! Pick a Game
          </button>
        </div>

        <div className="tip-bubble" onClick={handleNextTip} style={{ cursor: 'pointer' }} title="Click for another tip!">
          {TIP_MESSAGES[tipIndex]}
        </div>
      </section>

      {/* Kids Section Header */}
      <div className="kids-section-header">
        <h2>🎮 All Games</h2>
        <div className="kids-section-divider" />
      </div>

      {/* Controls */}
      <div className="controls">
        <div className="controls__search-row">
          <SearchBar value={search} onChange={setSearch} />
          <button onClick={handlePickRandomGame} className="random-app-btn" id="random-app-btn">
            🎲 Random
          </button>
        </div>
        <CategoryFilter
          categories={categories}
          active={category}
          onChange={setCategory}
        />
      </div>

      {/* Card Grid */}
      <div className="card-grid">
        {filtered.length > 0 ? (
          filtered.map(app => (
            <AppCard
              key={app.id}
              app={app}
              isDaily={app.id === dailyGameId}
              starsEarned={progress?.games?.[app.id]?.stars || 0}
            />
          ))
        ) : (
          <div className="card-grid__empty">
            <p>🔍 No games found matching your search. Try another search!</p>
          </div>
        )}
      </div>
    </main>
  )
}

export default Dashboard
