// Web Audio API Sound Synthesizer
// Provides offline sound effects for GameZone Kids without external assets

let audioCtx = null

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

export function playWinSound() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.connect(gain)
    gain.connect(ctx.destination)

    // Sweet arpeggio
    osc.frequency.setValueAtTime(261.63, now) // C4
    osc.frequency.setValueAtTime(329.63, now + 0.1) // E4
    osc.frequency.setValueAtTime(392.00, now + 0.2) // G4
    osc.frequency.setValueAtTime(523.25, now + 0.3) // C5

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)

    osc.start(now)
    osc.stop(now + 0.5)
  } catch (e) {
    console.error("Audio failed", e)
  }
}

export function playLoseSound() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.connect(gain)
    gain.connect(ctx.destination)

    // Sad sliding sound
    osc.frequency.setValueAtTime(293.66, now) // D4
    osc.frequency.linearRampToValueAtTime(196.00, now + 0.4) // G3

    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)

    osc.start(now)
    osc.stop(now + 0.4)
  } catch (e) {
    console.error("Audio failed", e)
  }
}

export function playClickSound() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.frequency.setValueAtTime(600, now)

    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)

    osc.start(now)
    osc.stop(now + 0.08)
  } catch (e) {
    console.error("Audio failed", e)
  }
}

export function playSelectSound() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.frequency.setValueAtTime(440, now) // A4
    osc.frequency.setValueAtTime(554.37, now + 0.08) // C#5

    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

    osc.start(now)
    osc.stop(now + 0.15)
  } catch (e) {
    console.error("Audio failed", e)
  }
}
