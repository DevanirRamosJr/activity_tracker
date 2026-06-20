import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const categories = ref([])
const loaded = ref(false)

export function useCategories() {
  async function fetchCategories() {
    if (loaded.value) return
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order')
    if (data) {
      categories.value = data
      loaded.value = true
    }
  }

  return { categories, fetchCategories }
}
