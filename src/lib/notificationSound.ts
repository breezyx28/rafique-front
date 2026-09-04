const SEEN_KEY = 'rafique-notif-seen'

export function loadSeenNotificationIds(): Set<number> {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY)
    const parsed = raw ? (JSON.parse(raw) as number[]) : []
    return new Set(parsed.filter((id) => Number.isFinite(id)))
  } catch {
    return new Set()
  }
}

export function persistSeenNotificationIds(ids: Set<number>) {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-300)))
  } catch {
    // Ignore storage failures (private mode, quota).
  }
}

let audioContext: AudioContext | null = null
let unlocked = false

function getAudioContext() {
  const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!audioContext) audioContext = new Ctor()
  return audioContext
}

export function unlockNotificationAudio() {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  unlocked = true
}

export function playNotificationSound() {
  const ctx = getAudioContext()
  if (!ctx) return
  const start = () => {
    const now = ctx.currentTime
    const master = ctx.createGain()
    master.gain.setValueAtTime(0.0001, now)
    master.gain.exponentialRampToValueAtTime(0.12, now + 0.02)
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.42)
    master.connect(ctx.destination)

    const ping = (freq: number, offset: number) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + offset)
      osc.connect(master)
      osc.start(now + offset)
      osc.stop(now + offset + 0.22)
    }

    ping(880, 0)
    ping(1174, 0.14)
  }

  if (ctx.state === 'suspended') {
    void ctx.resume().then(() => {
      unlocked = true
      start()
    })
    return
  }
  if (!unlocked) unlockNotificationAudio()
  start()
}
