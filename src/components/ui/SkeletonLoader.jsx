function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card__thumb skeleton-shimmer" />
      <div className="skeleton-card__body">
        <div className="skeleton-card__title skeleton-shimmer" />
        <div className="skeleton-card__desc skeleton-shimmer" />
        <div className="skeleton-card__meta skeleton-shimmer" />
      </div>
    </div>
  )
}

function SkeletonLoader({ count = 8 }) {
  return (
    <div className="game-grid">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export default SkeletonLoader
