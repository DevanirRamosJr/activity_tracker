import { describe, it, expect, vi, afterEach } from 'vitest'
import { getItem, setItem, removeItem, getJSON } from './safeStorage'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
})

// Replace localStorage with one whose every access throws, simulating a
// privacy extension / strict-mode browser that blocks site storage.
function blockStorage() {
  const throwBlocked = () => {
    throw new DOMException('blocked', 'SecurityError')
  }
  vi.stubGlobal('localStorage', {
    getItem: throwBlocked,
    setItem: throwBlocked,
    removeItem: throwBlocked,
    clear: () => {},
  })
}

describe('safeStorage — normal operation', () => {
  it('round-trips a value', () => {
    expect(setItem('k', 'v')).toBe(true)
    expect(getItem('k')).toBe('v')
  })

  it('returns null for a missing key', () => {
    expect(getItem('missing')).toBe(null)
  })

  it('removes a value', () => {
    setItem('k', 'v')
    expect(removeItem('k')).toBe(true)
    expect(getItem('k')).toBe(null)
  })

  it('parses JSON', () => {
    setItem('obj', JSON.stringify({ a: 1 }))
    expect(getJSON('obj')).toEqual({ a: 1 })
  })

  it('returns the fallback for a missing JSON key', () => {
    expect(getJSON('missing', { def: true })).toEqual({ def: true })
  })

  it('returns the fallback for corrupt JSON instead of throwing', () => {
    setItem('bad', 'not json{')
    expect(getJSON('bad', null)).toBe(null)
  })
})

describe('safeStorage — when localStorage is blocked', () => {
  it('getItem returns null instead of throwing', () => {
    blockStorage()
    expect(() => getItem('k')).not.toThrow()
    expect(getItem('k')).toBe(null)
  })

  it('setItem returns false instead of throwing', () => {
    blockStorage()
    expect(setItem('k', 'v')).toBe(false)
  })

  it('removeItem returns false instead of throwing', () => {
    blockStorage()
    expect(removeItem('k')).toBe(false)
  })

  it('getJSON returns the fallback instead of throwing', () => {
    blockStorage()
    expect(getJSON('k', 'fallback')).toBe('fallback')
  })
})
