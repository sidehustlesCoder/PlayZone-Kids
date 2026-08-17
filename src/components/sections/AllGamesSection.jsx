import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Gamepad2, X } from 'lucide-react'
import GameCard from '../ui/GameCard.jsx'
import { useGameStore } from '../../store/gameStore.js'
import { GAMES, CATEGORIES, searchGames } from '../../data/gamesRegistry.js'

function AllGamesSection() {
  const { searchQuery, activeCategory, setActiveCategory } = useGameStore()

  const activeCategoryLabel = useMemo(() => {
    const cat = CATEGORIES.find(c => c.id === activeCategory)
    return cat ? cat.label : activeCategory
  }, [activeCategory])

  const filtered = useMemo(() => {
    let games = GAMES.filter(g => g.status === 'live')

    // Search filter
    if (searchQuery.length > 1) {
      games = searchGames(searchQuery)
    }

    // Category filter
    if (activeCategory && activeCategory !== 'all') {
      games = games.filter(g =>
        g.category === activeCategory || g.tags.includes(activeCategory)
      )
    }

    return games
  }, [searchQuery, activeCategory])

  return (
    <section className="platform-section" id="all-games">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="platform-section__header"
      >
        <div className="platform-section__title-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Gamepad2 size={24} className="platform-section__icon" style={{ color: '#00f5ff' }} />
            <h2 className="platform-section__title">
              {activeCategory !== 'all'
                ? `${activeCategoryLabel} Games`
                : 'All Games 🎮'}
            </h2>
          </div>

          {/* Reset filter button */}
          {activeCategory !== 'all' && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setActiveCategory('all')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '999px',
                border: '1px solid rgba(0,245,255,0.3)',
                background: 'rgba(0,245,255,0.08)',
                color: '#00f5ff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              <X size={13} />
              Show All Games
            </motion.button>
          )}
        </div>

        <p className="platform-section__subtitle">
          {filtered.length} game{filtered.length !== 1 ? 's' : ''}
          {activeCategory !== 'all' ? ` in ${activeCategoryLabel}` : ''}
          {searchQuery ? ` matching "${searchQuery}"` : ''}
        </p>
      </motion.div>

      {filtered.length > 0 ? (
        <div className="game-grid">
          {filtered.map((game, i) => (
            <GameCard key={game.id} game={game} index={i} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-state__icon">🔍</span>
          <p>No games found{activeCategory !== 'all' ? ` in ${activeCategoryLabel}` : ''}. Try a different search or category!</p>
          {activeCategory !== 'all' && (
            <button
              onClick={() => setActiveCategory('all')}
              style={{
                marginTop: '12px',
                padding: '8px 20px',
                borderRadius: '999px',
                border: '1px solid rgba(0,245,255,0.4)',
                background: 'rgba(0,245,255,0.1)',
                color: '#00f5ff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ← Show All Games
            </button>
          )}
        </div>
      )}
    </section>
  )
}

export default AllGamesSection
