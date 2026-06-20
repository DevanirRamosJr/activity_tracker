import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const currentUser = ref(JSON.parse(localStorage.getItem('currentUser') || 'null'))
const isAuthenticated = ref(!!currentUser.value)

export function useAuth() {
  async function login(username, password) {
    const { data, error } = await supabase.rpc('login', {
      p_username: username,
      p_password: password,
    })
    if (error || !data?.success) return false

    currentUser.value = data.user
    isAuthenticated.value = true
    localStorage.setItem('currentUser', JSON.stringify(data.user))
    return true
  }

  function logout() {
    currentUser.value = null
    isAuthenticated.value = false
    localStorage.removeItem('currentUser')
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
