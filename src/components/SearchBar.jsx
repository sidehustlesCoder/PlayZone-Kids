function SearchBar({ value, onChange }) {
  return (
    <div className="search-bar">
      <span className="search-bar__icon" aria-hidden="true">🔍</span>
      <input
        id="search-apps"
        className="search-bar__input"
        type="text"
        placeholder="Search apps..."
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label="Search apps by name"
      />
    </div>
  )
}

export default SearchBar
