function CategoryFilter({ categories, active, onChange }) {
  return (
    <div className="category-tabs" role="tablist" aria-label="Filter by category">
      {categories.map(cat => (
        <button
          key={cat}
          role="tab"
          aria-selected={active === cat}
          className={`category-tabs__btn${active === cat ? ' category-tabs__btn--active' : ''}`}
          onClick={() => onChange(cat)}
          id={`tab-${cat.toLowerCase()}`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}

export default CategoryFilter
