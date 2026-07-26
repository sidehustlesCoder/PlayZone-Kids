/**
 * Pyodide Web Worker
 * Loads Python runtime in a background thread so the UI stays responsive.
 * Communicates with the main thread via postMessage.
 */

let pyodideReady = null

async function initPyodide() {
  importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js')
  const pyodide = await loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
  })
  return pyodide
}

self.onmessage = async (event) => {
  if (!pyodideReady) {
    pyodideReady = initPyodide()
  }

  try {
    const pyodide = await pyodideReady
    const { id, code, loadPackages } = event.data

    // Optionally load packages before running
    if (loadPackages && loadPackages.length > 0) {
      await pyodide.loadPackage(loadPackages)
    }

    const result = await pyodide.runPythonAsync(code)
    self.postMessage({ id, result: result?.toString() ?? null, error: null })
  } catch (error) {
    self.postMessage({ id: event.data.id, result: null, error: error.message })
  }
}
