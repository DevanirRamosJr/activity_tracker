// Safe localStorage access.
//
// Some browsers and privacy/ad-blocking extensions make `localStorage` *throw*
// (SecurityError) instead of returning null — e.g. strict privacy modes or
// "block site data". Reading storage unguarded at module-load time would crash
// the whole app before Vue mounts, producing a blank page. These helpers fail
// soft: the app keeps running, just without persistence.

export function getItem(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function setItem(key, value) {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function removeItem(key) {
  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

// Read and JSON.parse, falling back to `fallback` on missing, blocked, or
// corrupt data.
export function getJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}
