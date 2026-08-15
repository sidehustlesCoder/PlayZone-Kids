import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import GameCard from '../ui/GameCard.jsx'
import { getTrendingGames } from '../../data/gamesRegistry.js'

function TrendingSection() {
  const trending = getTrendingGames()

  if (!trending.length) return null

  return (
    <section className="platform-section">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="platform-section__header"
      >
        <div className="platform-section__title-row">
          <TrendingUp size={24} className="platform-section__icon" style={{ color: '#ff375f' }} />
          <h2 className="platform-section__title">Trending Now 🔥</h2>
        </div>
        <p className="platform-section__subtitle">Most popular games this week</p>
      </motion.div>

      <div className="game-grid">
        {trending.map((game, i) => (
          <GameCard key={game.id} game={game} index={i} />
        ))}
      </div>
    </section>
  )
}

export default TrendingSection
