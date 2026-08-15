import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Gamepad2 } from 'lucide-react'
import GameCard from '../ui/GameCard.jsx'
import { useGameStore } from '../../store/gameStore.js'
import { GAMES, searchGames } from '../../data/gamesRegistry.js'

function AllGamesSection() {
  const { searchQuery, activeCategory } = useGameStore()

  const filtered = useMemo(() => {
    let games = GAMES

    // Search filter
    if (searchQuery.length > 1) {
      games = searchGames(searchQuery)
    }

    // Category filter
    if (activeCategory !== 'all') {
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
        <div className="platform-section__title-row">
          <Gamepad2 size={24} className="platform-section__icon" style={{ color: '#00f5ff' }} />
          <h2 className="platform-section__title">All Games 🎮</h2>
        </div>
        <p className="platform-section__subtitle">
          {filtered.length} game{filtered.length !== 1 ? 's' : ''}
          {activeCategory !== 'all' ? ` in ${activeCategory}` : ''}
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
          <p>No games found. Try a different search or category!</p>
        </div>
      )}
    </section>
  )
}

export default AllGamesSection
