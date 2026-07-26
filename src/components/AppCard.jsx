import { Link } from 'react-router-dom'

function AppCard({ app, isDaily, starsEarned = 0 }) {
  const categoryClass = app.category.toLowerCase()

  return (
    <article className={`app-card ${isDaily ? 'app-card--daily' : ''}`} id={`card-${app.id}`}>
      <div className="app-card__header">
        <div className={`app-card__icon app-card__icon--${categoryClass}`} aria-hidden="true">
          {app.icon}
        </div>
        <div>
          <h2 className="app-card__title">{app.name}</h2>
          <span className={`app-card__badge app-card__badge--${categoryClass}`}>
            {app.category}
          </span>
          <div className="app-card__stars" title={`${starsEarned} star(s) earned`}>
            <span className={`app-card__star ${starsEarned >= 1 ? 'app-card__star--earned' : ''}`}>⭐</span>
            <span className={`app-card__star ${starsEarned >= 2 ? 'app-card__star--earned' : ''}`}>⭐</span>
            <span className={`app-card__star ${starsEarned >= 3 ? 'app-card__star--earned' : ''}`}>⭐</span>
          </div>
        </div>
      </div>

      <p className="app-card__desc">{app.description}</p>

      <Link
        to={`/app/${app.id}`}
        className="app-card__launch"
        aria-label={`Play ${app.name}`}
      >
        ⭐ Play Now!
      </Link>
    </article>
  )
}

export default AppCard
