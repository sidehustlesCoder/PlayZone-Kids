import { useState, useEffect } from 'react'
import { usePyodide } from '../../shared/usePyodide'
import converterSource from './logic.py?raw'

const CATEGORIES = {
  Length: {
    units: ['km', 'm', 'cm', 'mm', 'mile', 'yard', 'foot', 'inch'],
    fn: 'convert_length',
    icon: '📏',
  },
  Temperature: {
    units: ['Celsius', 'Fahrenheit', 'Kelvin'],
    fn: 'convert_temperature',
    icon: '🌡️',
  },
  Currency: {
    units: ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'CNY', 'CHF', 'BRL'],
    fn: 'convert_currency',
    icon: '💱',
  },
}

export default function UnitConverter() {
  const { runPython, loading } = usePyodide()
  const [initialized, setInitialized] = useState(false)
  const [category, setCategory] = useState('Length')
  const [fromUnit, setFromUnit] = useState('m')
  const [toUnit, setToUnit] = useState('km')
  const [inputVal, setInputVal] = useState('1')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    runPython(converterSource).then(() => setInitialized(true)).catch(() => setError('Failed to initialize Python runtime'))
  }, [runPython])

  const units = CATEGORIES[category].units
  const fn = CATEGORIES[category].fn

  // When category changes, reset from/to units to sensible defaults
  const handleCategoryChange = (cat) => {
    setCategory(cat)
    const u = CATEGORIES[cat].units
    setFromUnit(u[0])
    setToUnit(u[1])
    setResult(null)
    setError('')
  }

  const convert = async () => {
    setError('')
    const num = parseFloat(inputVal)
    if (isNaN(num)) { setError('Please enter a valid number.'); return }
    try {
      const code = `
import json
try:
    r = ${fn}(${num}, "${fromUnit}", "${toUnit}")
    json.dumps({"result": round(r, 8)})
except Exception as e:
    json.dumps({"error": str(e)})
`
      const raw = await runPython(code)
      const parsed = JSON.parse(raw)
      if (parsed.error) setError(parsed.error)
      else setResult(parsed.result)
    } catch (e) {
      setError(e.message)
    }
  }

  // Auto-convert on input/unit changes
  useEffect(() => {
    if (initialized && inputVal) convert()
  }, [initialized, inputVal, fromUnit, toUnit, category])

  const swap = () => { setFromUnit(toUnit); setToUnit(fromUnit) }

  return (
    <div className="converter-app">
      {!initialized && <div className="calculator-app__status">⚡ Initializing Pyodide Python WASM Engine...</div>}

      {/* Category tabs */}
      <div className="converter-tabs">
        {Object.entries(CATEGORIES).map(([cat, { icon }]) => (
          <button
            key={cat}
            id={`converter-tab-${cat.toLowerCase()}`}
            className={`converter-tab ${category === cat ? 'active' : ''}`}
            onClick={() => handleCategoryChange(cat)}
          >
            {icon} {cat}
          </button>
        ))}
      </div>

      {/* Conversion UI */}
      <div className="converter-panel">
        <div className="converter-row">
          <div className="converter-col">
            <label htmlFor="converter-from-val">From</label>
            <input
              id="converter-from-val"
              type="number"
              className="converter-number-input"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Enter value"
            />
            <select
              id="converter-from-unit"
              className="converter-select"
              value={fromUnit}
              onChange={e => setFromUnit(e.target.value)}
            >
              {units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <button className="converter-swap-btn" onClick={swap} aria-label="Swap units">⇄</button>

          <div className="converter-col">
            <label>To</label>
            <div className="converter-result-display">
              {error ? <span className="converter-error">⚠ {error}</span> :
               result !== null ? <span className="converter-result-num">{Number.isInteger(result) ? result : result.toLocaleString(undefined, { maximumSignificantDigits: 8 })}</span> :
               <span className="converter-result-placeholder">—</span>}
            </div>
            <select
              id="converter-to-unit"
              className="converter-select"
              value={toUnit}
              onChange={e => setToUnit(e.target.value)}
            >
              {units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {result !== null && !error && (
          <div className="converter-formula">
            {inputVal} {fromUnit} = {Number.isInteger(result) ? result : result.toFixed(6)} {toUnit}
          </div>
        )}

        {category === 'Currency' && (
          <p className="converter-disclaimer">ℹ️ Static rates (July 2025) — not for financial use</p>
        )}
      </div>
    </div>
  )
}
