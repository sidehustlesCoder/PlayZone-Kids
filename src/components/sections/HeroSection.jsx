import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, ChevronLeft, ChevronRight, Sparkles, Users } from 'lucide-react'
import { getFeaturedGames, getDailyGame, getLiveGames } from '../../data/gamesRegistry.js'

function HeroSection() {
  const navigate = useNavigate()
  const featured = getFeaturedGames()
  const dailyGame = getDailyGame()
  const totalGames = getLiveGames().length
  const [current, setCurrent] = useState(0)

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
      {/* Main Carousel */}
      <div className="hero-section__carousel">
        <AnimatePresence mode="wait">
          <motion.div
            key={game.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
            className="hero-section__slide"
          >
            <div className="hero-section__content">
              <div className="hero-section__badges">
                {game.isNew && <span className="hero-badge hero-badge--new">✨ NEW</span>}
                {game.isFeatured && <span className="hero-badge hero-badge--hot">🔥 FEATURED</span>}
                <span className="hero-badge hero-badge--cat">{game.category.toUpperCase()}</span>
              </div>

              <h1 className="hero-section__title">
                {game.name}
              </h1>
              <p className="hero-section__desc">{game.description}</p>

              <div className="hero-section__actions">
                {game.status === 'live' ? (
                  <button
                    className="hero-section__play-btn"
                    onClick={() => navigate(`/app/${game.id}`)}
                    id={`hero-play-${game.id}`}
                  >
                    <Play size={20} fill="currentColor" /> Play Now — Free!
                  </button>
                ) : (
                  <button className="hero-section__play-btn hero-section__play-btn--soon" disabled>
                    <Sparkles size={20} /> Coming Soon
                  </button>
                )}
              </div>

              {/* Social proof */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--plat-text-muted)', fontWeight: 700, marginTop: '4px' }}>
                <Users size={14} />
                <span>{(game.playCount || 0).toLocaleString()} plays</span>
                <span style={{ margin: '0 4px', opacity: 0.4 }}>·</span>
                <span style={{ color: '#ff9f0a' }}>★ {game.rating}</span>
                <span style={{ margin: '0 4px', opacity: 0.4 }}>·</span>
                <span>Ages {game.ageBand}</span>
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
            <button className="hero-section__nav hero-section__nav--prev" onClick={goPrev} id="hero-prev">
              <ChevronLeft size={22} />
            </button>
            <button className="hero-section__nav hero-section__nav--next" onClick={goNext} id="hero-next">
              <ChevronRight size={22} />
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
              id={`hero-dot-${i}`}
            />
          ))}
        </div>
      </div>

      {/* Stats bar + Daily Game */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px', alignItems: 'stretch' }}>
        {/* Platform stats chips */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px', padding: '12px 18px',
          }}
        >
          {[
            { label: 'Games', value: totalGames + '+' },
            { label: 'Players', value: '12K+' },
            { label: 'Avg Rating', value: '4.6★' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center', padding: '0 12px' }}>
              <div style={{ fontFamily: "'Syne', cursive", fontWeight: 800, fontSize: '1.1rem', color: 'var(--plat-text)' }}>{stat.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--plat-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Daily Game */}
        {dailyGame && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="hero-section__daily"
            style={{ flex: 1, minWidth: '220px' }}
          >
            <div className="hero-section__daily-label">
              <Sparkles size={15} /> Game of the Day
            </div>
            <button
              className="hero-section__daily-btn"
              onClick={() => navigate(`/app/${dailyGame.id}`)}
              id="daily-game-btn"
            >
              <span className="hero-section__daily-icon">{dailyGame.icon}</span>
              <span>{dailyGame.name}</span>
              <span className="hero-section__daily-xp">+50 XP</span>
            </button>
          </motion.div>
        )}
      </div>
    </section>
  )
}

export default HeroSection
