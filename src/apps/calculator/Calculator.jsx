import { useState, useEffect } from 'react'
import { usePyodide } from '../../shared/usePyodide'
import calculatorSource from './logic.py?raw'

function Calculator() {
  const [expression, setExpression] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const { runPython, loading, error: pyodideError } = usePyodide()
  const [isPythonInitialized, setIsPythonInitialized] = useState(false)

  // Initialize Python calculator logic on mount
  useEffect(() => {
    async function init() {
      try {
        await runPython(calculatorSource)
        setIsPythonInitialized(true)
      } catch (err) {
        console.error('Failed to initialize calculator python logic:', err)
        setError('Failed to initialize Python runtime')
      }
    }
    init()
  }, [runPython])

  const handleCalculate = async (exprToEval = expression) => {
    if (!exprToEval.trim()) return
    setError('')
    try {
      // Escape backslashes and double quotes in expression for python string literal
      const escapedExpr = exprToEval.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '')
      const pyCode = `
import json
json.dumps(calculate("${escapedExpr}"))
`
      const resultStr = await runPython(pyCode)
      const res = JSON.parse(resultStr)

      if (res.error) {
        setError(res.error)
        setResult('')
      } else {
        setResult(String(res.result))
        setError('')
      }
    } catch (err) {
      setError(err.message || 'Calculation error')
      setResult('')
    }
  }

  const handleKeyPress = (value) => {
    setError('')
    if (value === 'AC') {
      setExpression('')
      setResult('')
    } else if (value === 'C') {
      setExpression(prev => prev.slice(0, -1))
    } else if (value === '=') {
      handleCalculate()
    } else {
      setExpression(prev => prev + value)
    }
  }

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeElement = document.activeElement
      // Ignore key events if user is typing in some text input outside the calculator
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return
      }

      const key = e.key
      if (/[0-9]/.test(key)) {
        handleKeyPress(key)
      } else if (['+', '-', '*', '/', '(', ')', '.'].includes(key)) {
        handleKeyPress(key)
      } else if (key === 'Enter') {
        e.preventDefault()
        handleKeyPress('=')
      } else if (key === 'Backspace') {
        handleKeyPress('C')
      } else if (key === 'Escape') {
        handleKeyPress('AC')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [expression, isPythonInitialized])

  const buttons = [
    ['(', 'calc-btn--meta'], [')', 'calc-btn--meta'], ['C', 'calc-btn--warning'], ['AC', 'calc-btn--danger'],
    ['7', ''], ['8', ''], ['9', ''], ['/', 'calc-btn--accent'],
    ['4', ''], ['5', ''], ['6', ''], ['*', 'calc-btn--accent'],
    ['1', ''], ['2', ''], ['3', ''], ['-', 'calc-btn--accent'],
    ['0', ''], ['.', ''], ['=', 'calc-btn--success'], ['+', 'calc-btn--accent']
  ]

  return (
    <div className="calculator-app">
      {/* Display Screen */}
      <div className="calculator-app__screen">
        <div className="calculator-app__expr" aria-label="Current expression">
          {expression || '0'}
        </div>
        {error ? (
          <div className="calculator-app__error" role="alert">
            ⚠️ {error}
          </div>
        ) : (
          <div className="calculator-app__result" aria-label="Result">
            {result ? `= ${result}` : ''}
          </div>
        )}
      </div>

      {/* Loading state indicator */}
      {!isPythonInitialized && (
        <div className="calculator-app__status">
          ⚡ Initializing Pyodide Python WASM Engine...
        </div>
      )}

      {/* Buttons Grid */}
      <div className="calculator-app__grid">
        {buttons.map(([label, btnClass]) => (
          <button
            key={label}
            onClick={() => handleKeyPress(label)}
            disabled={!isPythonInitialized && label !== 'AC' && label !== 'C'}
            className={`calc-btn ${btnClass}`}
            id={`calc-btn-${label === '(' ? 'paren-l' : label === ')' ? 'paren-r' : label === '/' ? 'div' : label === '*' ? 'mul' : label === '-' ? 'sub' : label === '+' ? 'add' : label === '=' ? 'eq' : label === '.' ? 'dot' : label.toLowerCase()}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default Calculator
