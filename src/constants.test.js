import { describe, it, expect } from 'vitest'
import { STATUSES, STATUS_COLORS, formatDate } from './constants'

describe('STATUSES', () => {
  it('contains the three workflow statuses in order', () => {
    expect(STATUSES).toEqual(['Want to', 'In Progress', 'Done'])
  })
})

describe('STATUS_COLORS', () => {
  it('has a color class for every status', () => {
    for (const status of STATUSES) {
      expect(STATUS_COLORS[status]).toBeTruthy()
    }
  })
})

describe('formatDate', () => {
  it('formats a date in pt-BR with day, month and year', () => {
    const result = formatDate(new Date(2026, 5, 18, 15, 30))
    expect(result).toContain('jun')
    expect(result).toContain('18')
    expect(result).toContain('2026')
  })

  it('accepts an ISO string', () => {
    expect(() => formatDate('2026-06-18T15:30:00Z')).not.toThrow()
    expect(typeof formatDate('2026-06-18T15:30:00Z')).toBe('string')
  })
})
