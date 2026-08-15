import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { getFeaturedGames, getDailyGame } from '../../data/gamesRegistry.js'

function HeroSection() {
  const navigate = useNavigate()
  const featured = getFeaturedGames()
  const dailyGame = getDailyGame()
  const [current, setCurrent] = useState(0)

  // Auto-advance carousel
  useEffect(() => {
    if (featured.length <= 1) return
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % featured.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [featured.length])

  const game = featured[current]

  if (!game) return null

  const goNext = () => setCurrent(c => (c + 1) % featured.length)
  const goPrev = () => setCurrent(c => (c - 1 + featured.length) % featured.length)

  return (
    <section className="hero-section">
      <div className="hero-section__carousel">
        <AnimatePresence mode="wait">
          <motion.div
            key={game.id}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.4 }}
            className="hero-section__slide"
          >
            <div className="hero-section__content">
              <div className="hero-section__badges">
                {game.isNew && <span className="hero-badge hero-badge--new">✨ NEW</span>}
                {game.isFeatured && <span className="hero-badge hero-badge--hot">🔥 FEATURED</span>}
                <span className="hero-badge hero-badge--cat">{game.category.toUpperCase()}</span>
              </div>

              <h1 className="hero-section__title">{game.icon} {game.name}</h1>
              <p className="hero-section__desc">{game.description}</p>

              <div className="hero-section__actions">
                {game.status === 'live' ? (
                  <button
                    className="hero-section__play-btn"
                    onClick={() => navigate(`/app/${game.id}`)}
                  >
                    <Play size={20} fill="white" /> Play Now
                  </button>
                ) : (
                  <button className="hero-section__play-btn hero-section__play-btn--soon" disabled>
                    <Sparkles size={20} /> Coming Soon
                  </button>
                )}
              </div>
            </div>

            <div className="hero-section__visual">
              <div className="hero-section__icon-big">{game.icon}</div>
              <div className="hero-section__glow" />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Nav Arrows */}
        {featured.length > 1 && (
          <>
            <button className="hero-section__nav hero-section__nav--prev" onClick={goPrev}>
              <ChevronLeft size={24} />
            </button>
            <button className="hero-section__nav hero-section__nav--next" onClick={goNext}>
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Dots */}
        <div className="hero-section__dots">
          {featured.map((_, i) => (
            <button
              key={i}
              className={`hero-section__dot ${i === current ? 'hero-section__dot--active' : ''}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
      </div>

      {/* Daily Challenge */}
      {dailyGame && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="hero-section__daily"
        >
          <div className="hero-section__daily-label">
            <Sparkles size={16} /> Game of the Day
          </div>
          <button
            className="hero-section__daily-btn"
            onClick={() => navigate(`/app/${dailyGame.id}`)}
          >
            <span className="hero-section__daily-icon">{dailyGame.icon}</span>
            <span>{dailyGame.name}</span>
            <span className="hero-section__daily-xp">+50 XP</span>
          </button>
        </motion.div>
      )}
    </section>
  )
}

export default HeroSection
