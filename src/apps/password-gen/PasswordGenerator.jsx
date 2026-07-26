import { useState, useEffect, useCallback } from 'react'
import { usePyodide } from '../../shared/usePyodide'
import passwordGenSource from './logic.py?raw'

function PasswordGenerator() {
  const { runPython, loading, error: pyodideError } = usePyodide()
  const [isPythonInitialized, setIsPythonInitialized] = useState(false)
  const [password, setPassword] = useState('')
  const [strength, setStrength] = useState('weak') // weak, medium, strong
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  // Configurations
  const [length, setLength] = useState(16)
  const [useUpper, setUseUpper] = useState(true)
  const [useNumbers, setUseNumbers] = useState(true)
  const [useSymbols, setUseSymbols] = useState(true)

  // Initialize Python on mount
  useEffect(() => {
    async function init() {
      try {
        await runPython(passwordGenSource)
        setIsPythonInitialized(true)
      } catch (err) {
        console.error('Failed to initialize password generator logic:', err)
        setError('Failed to initialize Python runtime')
      }
    }
    init()
  }, [runPython])

  // Generator trigger function
  const handleGenerate = useCallback(async () => {
    if (!isPythonInitialized) return
    setError('')
    try {
      const pyCode = `
import json
pw = generate_password(${length}, ${useUpper ? 'True' : 'False'}, ${useNumbers ? 'True' : 'False'}, ${useSymbols ? 'True' : 'False'})
st = check_strength(pw)
json.dumps({"password": pw, "strength": st})
`
      const resStr = await runPython(pyCode)
      const res = JSON.parse(resStr)
      setPassword(res.password)
      setStrength(res.strength)
      setCopied(false)
    } catch (err) {
      setError(err.message || 'Error generating password')
    }
  }, [isPythonInitialized, length, useUpper, useNumbers, useSymbols, runPython])

  // Generate automatically when options change
  useEffect(() => {
    handleGenerate()
  }, [handleGenerate])

  const handleCopy = async () => {
    if (!password) return
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Clipboard copy failed:', err)
    }
  }

  const strengthPercentage = strength === 'weak' ? 33 : strength === 'medium' ? 66 : 100
  const strengthColor = strength === 'weak' ? 'var(--error)' : strength === 'medium' ? 'var(--warning)' : 'var(--success)'

  return (
    <div className="password-gen-app">
      {!isPythonInitialized ? (
        <div className="calculator-app__status">
          ⚡ Initializing Pyodide Python WASM Engine...
        </div>
      ) : (
        <div className="password-gen">
          {error && <div className="guesser-config__error" role="alert">{error}</div>}

          {/* Password Output Area */}
          <div className="password-gen__output-container">
            <input
              type="text"
              readOnly
              value={password}
              placeholder="Your secure password"
              className="password-gen__output"
              aria-label="Generated password output"
              id="generated-password-field"
            />
            <button
              onClick={handleCopy}
              className={`password-gen__copy-btn ${copied ? 'copied' : ''}`}
              title="Copy to clipboard"
              aria-label="Copy generated password to clipboard"
              disabled={!password}
            >
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
          </div>

          {/* Strength Meter */}
          <div className="password-gen__strength">
            <div className="strength-label">
              <span>Strength: </span>
              <strong style={{ color: strengthColor, textTransform: 'capitalize' }}>
                {strength}
              </strong>
            </div>
            <div className="strength-track">
              <div
                className="strength-bar"
                style={{
                  width: `${strengthPercentage}%`,
                  backgroundColor: strengthColor
                }}
              />
            </div>
          </div>

          {/* Configuration Inputs */}
          <div className="password-gen__controls">
            {/* Length slider */}
            <div className="password-gen__control">
              <div className="slider-label">
                <label htmlFor="pw-length">Password Length</label>
                <span>{length} characters</span>
              </div>
              <input
                type="range"
                id="pw-length"
                min="8"
                max="64"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="length-slider"
              />
            </div>

            {/* Checkboxes grid */}
            <div className="password-gen__checkboxes">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={useUpper}
                  onChange={(e) => setUseUpper(e.target.checked)}
                  id="checkbox-uppercase"
                />
                <span className="checkmark" />
                Include Uppercase Letters (A-Z)
              </label>

              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={useNumbers}
                  onChange={(e) => setUseNumbers(e.target.checked)}
                  id="checkbox-numbers"
                />
                <span className="checkmark" />
                Include Numbers (0-9)
              </label>

              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={useSymbols}
                  onChange={(e) => setUseSymbols(e.target.checked)}
                  id="checkbox-symbols"
                />
                <span className="checkmark" />
                Include Symbols (!@#$...)
              </label>
            </div>

            <button
              onClick={handleGenerate}
              className="password-gen__generate-btn"
              disabled={loading}
            >
              🔄 Re-generate
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PasswordGenerator
