import { db } from './db'
import { createClient } from '@/lib/supabase/client'

export async function syncPendingInspections() {
  const supabase = createClient()
  const pending = await db.draftInspections.where('isSynced').equals(0).toArray()

  let synced = 0
  let failed = 0

  for (const draft of pending) {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .insert({ ...draft.data, local_draft_id: draft.id, is_synced: true, submitted_at: new Date().toISOString() })
        .select('id')
        .single()

      if (error) throw error

      // Upload photos
      for (const photo of draft.photos) {
        const fileName = `inspections/${data.id}/${photo.id}.jpg`
        await supabase.storage.from('inspection-photos').upload(fileName, photo.blob, { contentType: 'image/jpeg' })
        const { data: { publicUrl } } = supabase.storage.from('inspection-photos').getPublicUrl(fileName)
        await supabase.from('inspection_photos').insert({
          inspection_id: data.id,
          photo_url: publicUrl,
          caption: photo.caption,
          photo_type: photo.photoType,
          is_synced: true,
        })
      }

      await db.draftInspections.update(draft.id, { isSynced: true })
      synced++
    } catch {
      failed++
    }
  }

  return { synced, failed, total: pending.length }
}

export async function getPendingCount(): Promise<number> {
  return db.draftInspections.where('isSynced').equals(0).count()
}

export function setupOnlineListener(onSync: (result: { synced: number; failed: number; total: number }) => void) {
  const handler = async () => {
    const result = await syncPendingInspections()
    if (result.total > 0) onSync(result)
  }
  window.addEventListener('online', handler)
  return () => window.removeEventListener('online', handler)
}
