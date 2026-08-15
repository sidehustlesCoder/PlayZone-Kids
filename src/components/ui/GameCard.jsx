import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Play, Star, Clock, Zap } from 'lucide-react'
import { useGameStore } from '../../store/gameStore.js'

const DIFFICULTY_COLORS = {
  Easy: '#32d74b',
  Medium: '#ff9f0a',
  Hard: '#ff375f',
  Multi: '#bf5af2',
}

function GameCard({ game, index = 0 }) {
  const { toggleFavorite, favorites, gameStats } = useGameStore()
  const [hovered, setHovered] = useState(false)
  const isFav = favorites.includes(game.id)
  const stats = gameStats[game.id]
  const isComingSoon = game.status === 'coming-soon'

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`game-card ${isComingSoon ? 'game-card--soon' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail Area */}
      <div className="game-card__thumb">
        <div className="game-card__thumb-bg" style={{ background: `linear-gradient(135deg, ${DIFFICULTY_COLORS[game.difficulty] || '#00f5ff'}30, ${DIFFICULTY_COLORS[game.difficulty] || '#00f5ff'}08)` }}>
          <span className="game-card__thumb-icon">{game.icon}</span>
        </div>

        {/* Hover Overlay */}
        <motion.div
          className="game-card__overlay"
          initial={false}
          animate={{ opacity: hovered && !isComingSoon ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Link to={`/app/${game.id}`} className="game-card__play-btn">
            <Play size={28} fill="white" />
            <span>Play Now</span>
          </Link>
        </motion.div>

        {/* Badges */}
        <div className="game-card__badges">
          {game.isNew && <span className="game-card__badge game-card__badge--new">NEW</span>}
          {game.isFeatured && <span className="game-card__badge game-card__badge--featured"><Zap size={10} /> HOT</span>}
          {isComingSoon && <span className="game-card__badge game-card__badge--soon">COMING SOON</span>}
        </div>

        {/* Favorite */}
        <button
          className={`game-card__fav ${isFav ? 'game-card__fav--active' : ''}`}
          onClick={(e) => { e.preventDefault(); toggleFavorite(game.id) }}
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart size={16} fill={isFav ? '#ff375f' : 'none'} />
        </button>
      </div>

      {/* Info */}
      <div className="game-card__info">
        <Link to={isComingSoon ? '#' : `/app/${game.id}`} className="game-card__title-link">
          <h3 className="game-card__title">{game.name}</h3>
        </Link>
        <p className="game-card__desc">{game.description}</p>

        <div className="game-card__meta">
          <span className="game-card__meta-item" style={{ color: DIFFICULTY_COLORS[game.difficulty] }}>
            {game.difficulty}
          </span>
          {game.rating > 0 && (
            <span className="game-card__meta-item">
              <Star size={12} fill="#ff9f0a" stroke="#ff9f0a" /> {game.rating}
            </span>
          )}
          {stats?.plays > 0 && (
            <span className="game-card__meta-item">
              <Play size={12} /> {stats.plays}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default GameCard
