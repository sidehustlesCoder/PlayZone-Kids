import { useKidsProgress, BADGE_CONFIG } from '../shared/useKidsProgress'
import { Link } from 'react-router-dom'

// Map each badge to a decoration item
const DECORATION_CATALOG = [
  {
    id: 'first_star',
    badgeId: 'first_star',
    name: 'Toy Train',
    emoji: '🚂',
    description: 'Chug chug! Earned for your first star.',
    slot: 'shelf-left',
    color: '#ff7043',
  },
  {
    id: 'five_games',
    badgeId: 'five_games',
    name: 'Plush Teddy Bear',
    emoji: '🧸',
    description: 'A cuddly bear for playing 5 times!',
    slot: 'floor-left',
    color: '#a1887f',
  },
  {
    id: 'three_streak',
    badgeId: 'three_streak',
    name: 'Lava Lamp',
    emoji: '🔮',
    description: 'Glowing and groovy — for a 3-day streak!',
    slot: 'shelf-right',
    color: '#7c4dff',
  },
  {
    id: 'explorer',
    badgeId: 'explorer',
    name: 'Telescope',
    emoji: '🔭',
    description: 'For an explorer who tried 3+ different games!',
    slot: 'floor-right',
    color: '#00897b',
  },
]

export default function HomeBase() {
  const { progress, togglePlaceItem, resetProgress } = useKidsProgress()

  const unlockedBadgeIds = progress.badges || []
  const placedItems = progress.placedItems || []

  const totalPlayed = Object.values(progress.games || {}).reduce((sum, g) => sum + (g.played || 0), 0)

  const getSlotItems = (slot) =>
    DECORATION_CATALOG.filter(d => d.slot === slot && placedItems.includes(d.id))

  const slots = ['shelf-left', 'shelf-right', 'floor-left', 'floor-right']
  const slotLabels = {
    'shelf-left': 'Left Shelf',
    'shelf-right': 'Right Shelf',
    'floor-left': 'Floor Left',
    'floor-right': 'Floor Right',
  }

  return (
    <div className="homebase-container">
      <h1 className="homebase-title">🏡 My Treehouse!</h1>
      <p className="homebase-subtitle">Decorate your cozy treehouse with rewards you've earned!</p>

      {/* Stats Row */}
      <div className="homebase-stats-row">
        <div className="homebase-stat-card">
          <span className="homebase-stat-icon">⭐</span>
          <span className="homebase-stat-label">Stars Earned</span>
          <span className="homebase-stat-value">{progress.totalStars || 0}</span>
        </div>
        <div className="homebase-stat-card">
          <span className="homebase-stat-icon">🔥</span>
          <span className="homebase-stat-label">Day Streak</span>
          <span className="homebase-stat-value">{progress.streak || 0}</span>
        </div>
        <div className="homebase-stat-card">
          <span className="homebase-stat-icon">🎮</span>
          <span className="homebase-stat-label">Games Played</span>
          <span className="homebase-stat-value">{totalPlayed}</span>
        </div>
        <div className="homebase-stat-card">
          <span className="homebase-stat-icon">🏅</span>
          <span className="homebase-stat-label">Badges Unlocked</span>
          <span className="homebase-stat-value">{unlockedBadgeIds.length} / {BADGE_CONFIG.length}</span>
        </div>
      </div>

      {/* Treehouse Room */}
      <div className="treehouse-room" aria-label="Your treehouse decoration room">
        {/* Treehouse background layers */}
        <div className="treehouse-bg-sky" />
        <div className="treehouse-bg-leaves">🌿🍃🌿🍃🌿</div>
        <div className="treehouse-bg-trunk" />

        {/* Room interior */}
        <div className="treehouse-interior">
          {/* Roof */}
          <div className="treehouse-roof">
            <span>🏠</span> Your Room
          </div>

          {/* Main room area */}
          <div className="treehouse-main">
            {/* Left wall with shelf */}
            <div className="treehouse-wall treehouse-wall--left">
              <div className="treehouse-shelf treehouse-shelf--left">
                <div className="treehouse-shelf-board" />
                <div className="treehouse-shelf-slot">
                  {getSlotItems('shelf-left').map(item => (
                    <span key={item.id} className="placed-item" title={item.name}>{item.emoji}</span>
                  ))}
                  {getSlotItems('shelf-left').length === 0 && (
                    <span className="slot-empty" title="Earn a reward to decorate here!">✦</span>
                  )}
                </div>
              </div>
              <div className="treehouse-window">🌟</div>
            </div>

            {/* Center floor */}
            <div className="treehouse-floor-center">
              {/* Rug */}
              <div className="treehouse-rug">🔶🔷🔶🔷🔶</div>
              {/* Mascot lives here */}
              <div className="treehouse-mascot">
                <span style={{ fontSize: '3.5rem' }}>🦊</span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Felix says hi! 👋</p>
              </div>
            </div>

            {/* Right wall with shelf */}
            <div className="treehouse-wall treehouse-wall--right">
              <div className="treehouse-shelf treehouse-shelf--right">
                <div className="treehouse-shelf-board" />
                <div className="treehouse-shelf-slot">
                  {getSlotItems('shelf-right').map(item => (
                    <span key={item.id} className="placed-item" title={item.name}>{item.emoji}</span>
                  ))}
                  {getSlotItems('shelf-right').length === 0 && (
                    <span className="slot-empty" title="Earn a reward to decorate here!">✦</span>
                  )}
                </div>
              </div>
              <div className="treehouse-window">🌙</div>
            </div>
          </div>

          {/* Floor area with items */}
          <div className="treehouse-floor-row">
            <div className="treehouse-floor-slot">
              {getSlotItems('floor-left').map(item => (
                <span key={item.id} className="placed-item placed-item--big" title={item.name}>{item.emoji}</span>
              ))}
              {getSlotItems('floor-left').length === 0 && (
                <span className="slot-empty slot-empty--floor">✦</span>
              )}
            </div>
            <div className="treehouse-floor-board" />
            <div className="treehouse-floor-slot">
              {getSlotItems('floor-right').map(item => (
                <span key={item.id} className="placed-item placed-item--big" title={item.name}>{item.emoji}</span>
              ))}
              {getSlotItems('floor-right').length === 0 && (
                <span className="slot-empty slot-empty--floor">✦</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Decorations Drawer */}
      <div className="decorations-drawer">
        <h2 className="decorations-drawer__title">🎁 Your Decoration Drawer</h2>
        <p className="decorations-drawer__subtitle">
          Click any unlocked item to place it in (or remove it from) your treehouse!
        </p>
        <div className="decorations-grid">
          {DECORATION_CATALOG.map(item => {
            const isUnlocked = unlockedBadgeIds.includes(item.badgeId)
            const isPlaced = placedItems.includes(item.id)
            const badge = BADGE_CONFIG.find(b => b.id === item.badgeId)

            return (
              <button
                key={item.id}
                className={`decoration-card ${isUnlocked ? 'decoration-card--unlocked' : 'decoration-card--locked'} ${isPlaced ? 'decoration-card--placed' : ''}`}
                onClick={() => isUnlocked && togglePlaceItem(item.id)}
                disabled={!isUnlocked}
                title={isUnlocked ? `Click to ${isPlaced ? 'remove' : 'place'} ${item.name}` : `Locked: ${badge?.description}`}
                style={{ '--accent': item.color }}
              >
                <div className="decoration-card__emoji">{isUnlocked ? item.emoji : '🔒'}</div>
                <div className="decoration-card__name">{item.name}</div>
                {isUnlocked ? (
                  <div className={`decoration-card__status ${isPlaced ? 'placed' : 'ready'}`}>
                    {isPlaced ? '✅ In Room' : '+ Place It!'}
                  </div>
                ) : (
                  <div className="decoration-card__lock-hint">{badge?.description}</div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Badge Collection */}
      <div className="badges-section">
        <h2 className="badges-section__title">🏅 Badge Collection</h2>
        <div className="badges-grid">
          {BADGE_CONFIG.map(badge => {
            const earned = unlockedBadgeIds.includes(badge.id)
            return (
              <div key={badge.id} className={`badge-card ${earned ? 'badge-card--earned' : 'badge-card--locked'}`}>
                <div className="badge-card__icon">{earned ? badge.icon : '🔒'}</div>
                <div className="badge-card__name">{badge.name}</div>
                <div className="badge-card__desc">{badge.description}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="homebase-footer">
        <Link to="/" className="homebase-back-btn">🎮 Back to Games</Link>
        <button
          className="homebase-reset-btn"
          onClick={() => {
            if (window.confirm('Are you sure? This will clear ALL your stars, badges, and decorations! 😱')) {
              resetProgress()
            }
          }}
        >
          🗑 Reset Progress
        </button>
      </div>
    </div>
  )
}
