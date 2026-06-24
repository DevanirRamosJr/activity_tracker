import { describe, it, expect, vi, beforeEach } from 'vitest'

const setAccessToken = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: { rpc: vi.fn() },
  setAccessToken: (...args) => setAccessToken(...args),
}))

import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    useAuth().logout()
  })

  it('logs in, stores the JWT, and persists the user', async () => {
    supabase.rpc.mockResolvedValue({
      data: { success: true, token: 'jwt-abc', user: { id: 'u1', username: 'admin' } },
      error: null,
    })

    const { login, isAuthenticated, currentUser } = useAuth()
    const ok = await login('admin', 'admin')

    expect(ok).toBe(true)
    expect(isAuthenticated.value).toBe(true)
    expect(currentUser.value).toEqual({ id: 'u1', username: 'admin' })
    expect(localStorage.getItem('authToken')).toBe('jwt-abc')
    expect(setAccessToken).toHaveBeenCalledWith('jwt-abc')
    expect(supabase.rpc).toHaveBeenCalledWith('login', {
      p_username: 'admin',
      p_password: 'admin',
    })
  })

  it('fails login when the RPC reports failure', async () => {
    supabase.rpc.mockResolvedValue({ data: { success: false }, error: null })

    const { login, isAuthenticated } = useAuth()
    const ok = await login('admin', 'wrong')

    expect(ok).toBe(false)
    expect(isAuthenticated.value).toBe(false)
    expect(localStorage.getItem('authToken')).toBeNull()
  })

  it('fails login when the RPC returns an error', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: { message: 'boom' } })

    const { login, isAuthenticated } = useAuth()
    expect(await login('admin', 'admin')).toBe(false)
    expect(isAuthenticated.value).toBe(false)
  })

  it('logs out, clears the JWT, and resets the client', async () => {
    supabase.rpc.mockResolvedValue({
      data: { success: true, token: 'jwt-abc', user: { id: 'u1', username: 'admin' } },
      error: null,
    })

    const { login, logout, isAuthenticated, currentUser } = useAuth()
    await login('admin', 'admin')
    setAccessToken.mockClear()
    logout()

    expect(isAuthenticated.value).toBe(false)
    expect(currentUser.value).toBeNull()
    expect(localStorage.getItem('currentUser')).toBeNull()
    expect(localStorage.getItem('authToken')).toBeNull()
    expect(setAccessToken).toHaveBeenCalledWith(null)
  })

  describe('changePassword', () => {
    async function loginAs(id = 'u1') {
      supabase.rpc.mockResolvedValueOnce({
        data: { success: true, token: 'jwt-abc', user: { id, username: 'admin' } },
        error: null,
      })
      await useAuth().login('admin', 'admin')
    }

    it('fails when no user is signed in', async () => {
      const result = await useAuth().changePassword('old', 'new')
      expect(result).toEqual({ success: false, error: 'Not signed in' })
      expect(supabase.rpc).not.toHaveBeenCalled()
    })

    it('calls the RPC with the current user id and passwords', async () => {
      await loginAs('u1')
      supabase.rpc.mockResolvedValueOnce({ data: { success: true }, error: null })

      const result = await useAuth().changePassword('admin', 'newpass')

      expect(result).toEqual({ success: true })
      expect(supabase.rpc).toHaveBeenLastCalledWith('change_password', {
        p_user_id: 'u1',
        p_current_password: 'admin',
        p_new_password: 'newpass',
      })
    })

    it('returns the failure payload when the current password is wrong', async () => {
      await loginAs()
      supabase.rpc.mockResolvedValueOnce({
        data: { success: false, error: 'Current password is incorrect' },
        error: null,
      })

      const result = await useAuth().changePassword('wrong', 'newpass')
      expect(result).toEqual({ success: false, error: 'Current password is incorrect' })
    })

    it('returns an error when the RPC itself errors', async () => {
      await loginAs()
      supabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'network down' } })

      const result = await useAuth().changePassword('admin', 'newpass')
      expect(result).toEqual({ success: false, error: 'network down' })
    })
  })
})
