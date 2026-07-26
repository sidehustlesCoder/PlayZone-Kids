import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * React hook for communicating with the Pyodide Web Worker.
 *
 * Usage:
 *   const { runPython, loading, error } = usePyodide()
 *   const result = await runPython('1 + 1')
 */
export function usePyodide() {
  const workerRef = useRef(null)
  const callbacksRef = useRef(new Map())
  const idCounter = useRef(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const worker = new Worker(
      new URL('./pyodideWorker.js', import.meta.url),
      { type: 'classic' }
    )

    worker.onmessage = (event) => {
      const { id, result, error: workerError } = event.data
      const cb = callbacksRef.current.get(id)
      if (cb) {
        callbacksRef.current.delete(id)
        if (workerError) {
          cb.reject(new Error(workerError))
        } else {
          cb.resolve(result)
        }
      }
    }

    worker.onerror = (err) => {
      setError(err.message)
    }

    workerRef.current = worker

    return () => {
      worker.terminate()
    }
  }, [])

  const runPython = useCallback(async (code, loadPackages = []) => {
    if (!workerRef.current) {
      throw new Error('Pyodide worker not initialized')
    }

    const id = idCounter.current++
    setLoading(true)
    setError(null)

    try {
      const result = await new Promise((resolve, reject) => {
        callbacksRef.current.set(id, { resolve, reject })
        workerRef.current.postMessage({ id, code, loadPackages })
      })
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { runPython, loading, error }
}
