import { useState, useEffect } from 'react'
import { usePyodide } from '../../shared/usePyodide'
import scraperSource from './logic.py?raw'

const SOURCES = [
  { name: 'Open Trivia DB', description: '10 random trivia questions', icon: '🧠' },
  { name: 'REST Countries', description: 'European country data', icon: '🌍' },
  { name: 'JSONPlaceholder Posts', description: '10 sample blog posts (demo API)', icon: '📝' },
]

export default function WebScraper() {
  const { runPython, loading } = usePyodide()
  const [initialized, setInitialized] = useState(false)
  const [source, setSource] = useState(SOURCES[0].name)
  const [status, setStatus] = useState('idle')  // 'idle' | 'fetching' | 'done' | 'error'
  const [tableData, setTableData] = useState(null) // { columns, rows }
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    runPython(scraperSource).then(() => setInitialized(true)).catch(() => setErrorMsg('Failed to initialize Python runtime'))
  }, [runPython])

  const handleFetch = async () => {
    setStatus('fetching')
    setTableData(null)
    setErrorMsg('')
    try {
      const code = `
import json, asyncio

async def _run():
    result = await fetch_data("""${source}""")
    return result

asyncio.get_event_loop().run_until_complete(_run())
`
      const raw = await runPython(code)
      const parsed = JSON.parse(raw)
      setTableData(parsed)
      setStatus('done')
    } catch (e) {
      setErrorMsg(e.message || 'Fetch failed')
      setStatus('error')
    }
  }

  return (
    <div className="scraper-app">
      <div className="scraper-header">
        <h2 className="scraper-header__title">Data Fetcher</h2>
        <p className="scraper-header__desc">
          Fetches data from CORS-friendly public APIs using Python's <code>pyfetch</code> running inside your browser via Pyodide (WASM). No server required.
        </p>
      </div>

      {!initialized && <div className="calculator-app__status">⚡ Initializing Pyodide Python WASM Engine...</div>}

      {/* Source selector */}
      <div className="scraper-sources">
        {SOURCES.map(s => (
          <button
            key={s.name}
            id={`scraper-src-${s.name.replace(/\s+/g,'-').toLowerCase()}`}
            className={`scraper-source-card ${source === s.name ? 'active' : ''}`}
            onClick={() => { setSource(s.name); setTableData(null); setStatus('idle') }}
          >
            <span className="scraper-source-card__icon">{s.icon}</span>
            <span className="scraper-source-card__name">{s.name}</span>
            <span className="scraper-source-card__desc">{s.description}</span>
          </button>
        ))}
      </div>

      <button
        className="scraper-fetch-btn"
        id="scraper-fetch-btn"
        onClick={handleFetch}
        disabled={!initialized || status === 'fetching'}
      >
        {status === 'fetching' ? '⏳ Fetching…' : '⚡ Fetch Data'}
      </button>

      {status === 'error' && (
        <div className="scraper-error" role="alert">
          ⚠️ {errorMsg}
        </div>
      )}

      {status === 'done' && tableData && (
        <div className="scraper-results">
          <p className="scraper-results__meta">
            ✓ Retrieved {tableData.rows.length} rows from <strong>{source}</strong>
          </p>
          <div className="scraper-table-wrap">
            <table className="scraper-table">
              <thead>
                <tr>
                  {tableData.columns.map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, i) => (
                  <tr key={i}>
                    {tableData.columns.map(col => (
                      <td key={col}>{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="scraper-note">
        <strong>ℹ️ How it works:</strong> Python code runs inside your browser via WebAssembly (Pyodide).
        <code>pyfetch</code> makes HTTP requests directly from Python — no server middleman.
        Only CORS-enabled public APIs work in this context.
      </div>
    </div>
  )
}
