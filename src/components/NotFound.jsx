import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found__code">404</div>
      <h1 className="not-found__title">Page not found</h1>
      <p className="not-found__desc">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="not-found__link" id="back-home-link">
        ← Back to Dashboard
      </Link>
    </div>
  )
}

export default NotFound
