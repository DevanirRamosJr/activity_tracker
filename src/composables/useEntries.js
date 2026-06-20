import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const entries = ref([])
const loading = ref(true)

export function useEntries() {
  const { currentUser } = useAuth()

  async function fetchEntries() {
    loading.value = true
    const { data } = await supabase
      .from('entries')
      .select(`
        *,
        category:categories(*),
        history:entry_history(*),
        scores:user_entry_scores(*)
      `)
      .order('created_at', { ascending: false })

    if (data) {
      entries.value = data.map(e => ({
        ...e,
        history: (e.history || []).sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        ),
      }))
    }
    loading.value = false
  }

  async function addEntry(form) {
    const { data: entry, error } = await supabase
      .from('entries')
      .insert({
        user_id: currentUser.value.id,
        category_id: form.category_id,
        title: form.title.trim(),
        status: form.status,
        notes: form.notes.trim(),
        image_url: form.image_url || null,
      })
      .select()
      .single()

    if (error || !entry) return

    await supabase.from('entry_history').insert({
      entry_id: entry.id,
      description: `Entry added · status "${form.status}"`,
    })

    await supabase.from('user_entry_scores').insert({
      user_id: currentUser.value.id,
      entry_id: entry.id,
      desire_level: form.desire_level,
      rating: form.rating || null,
    })

    await fetchEntries()
  }

  async function updateEntry(id, form, orig) {
    const logs = []
    if (form.title.trim() !== orig.title)
      logs.push(`Title renamed to "${form.title.trim()}"`)
    if (form.category_id !== orig.category.id)
      logs.push('Category changed')
    if (form.status !== orig.status)
      logs.push(`Status changed from "${orig.status}" to "${form.status}"`)
    if (form.notes.trim() !== (orig.notes || ''))
      logs.push('Notes updated')
    if ((form.image_url || '') !== (orig.image_url || ''))
      logs.push('Image updated')

    await supabase
      .from('entries')
      .update({
        category_id: form.category_id,
        title: form.title.trim(),
        status: form.status,
        notes: form.notes.trim(),
        image_url: form.image_url || null,
      })
      .eq('id', id)

    if (logs.length) {
      await supabase.from('entry_history').insert(
        logs.map(desc => ({ entry_id: id, description: desc }))
      )
    }

    await supabase
      .from('user_entry_scores')
      .upsert({
        user_id: currentUser.value.id,
        entry_id: id,
        desire_level: form.desire_level,
        rating: form.rating || null,
      }, { onConflict: 'user_id,entry_id' })

    await fetchEntries()
  }

  async function deleteEntry(id) {
    await supabase.from('entries').delete().eq('id', id)
    entries.value = entries.value.filter(e => e.id !== id)
  }

  return { entries, loading, fetchEntries, addEntry, updateEntry, deleteEntry }
}
