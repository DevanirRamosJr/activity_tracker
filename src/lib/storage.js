import { supabase } from './supabase'

const BUCKET = 'entry-images'

export async function uploadImage(file) {
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'png'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
