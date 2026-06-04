import { createClient } from '@/lib/supabase/client'

export async function generateFarmerCode(): Promise<string> {
  const supabase = createClient()
  const { count } = await supabase
    .from('farmers')
    .select('*', { count: 'exact', head: true })
  const next = ((count ?? 0) + 1).toString().padStart(5, '0')
  return `CS-RJ-${next}`
}
