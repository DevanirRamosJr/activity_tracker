import { ref } from 'vue'
import { supabase, setAccessToken } from '../lib/supabase'
import { getItem, getJSON, setItem, removeItem } from '../lib/safeStorage'

const currentUser = ref(getJSON('currentUser', null))
const isAuthenticated = ref(!!currentUser.value)

// Restore the JWT from localStorage on page load.
const savedToken = getItem('authToken')
if (savedToken) setAccessToken(savedToken)

export function useAuth() {
  async function login(username, password) {
    const { data, error } = await supabase.rpc('login', {
      p_username: username,
      p_password: password,
    })
    if (error || !data?.success) return false

    setAccessToken(data.token)
    currentUser.value = data.user
    isAuthenticated.value = true
    setItem('currentUser', JSON.stringify(data.user))
    setItem('authToken', data.token)
    return true
  }

  function logout() {
    setAccessToken(null)
    currentUser.value = null
    isAuthenticated.value = false
    removeItem('currentUser')
    removeItem('authToken')
  }

  async function changePassword(currentPassword, newPassword) {
    if (!currentUser.value) {
      return { success: false, error: 'Not signed in' }
    }
    const { data, error } = await supabase.rpc('change_password', {
      p_user_id: currentUser.value.id,
      p_current_password: currentPassword,
      p_new_password: newPassword,
    })
    if (error) return { success: false, error: error.message }
    return data
  }

  return { currentUser, isAuthenticated, login, logout, changePassword }
}
