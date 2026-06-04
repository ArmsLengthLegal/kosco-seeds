import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Phone, MapPin, Plus } from 'lucide-react'
import Link from 'next/link'

const TAG_COLORS: Record<string, string> = {
  'production-agreement': 'bg-green-100 text-green-800',
  'kharif-2025': 'bg-orange-100 text-orange-800',
  'rabi-2025-26': 'bg-blue-100 text-blue-800',
  vip: 'bg-purple-100 text-purple-800',
  'feedback-needed': 'bg-yellow-100 text-yellow-800',
}

export default async function FarmersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; district?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('farmers')
    .select('id, farmer_code, full_name, primary_phone, village, district, tags, agreement_status')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(50)

  if (params.q) {
    query = query.or(`full_name.ilike.%${params.q}%,primary_phone.ilike.%${params.q}%,farmer_code.ilike.%${params.q}%`)
  }
  if (params.district) query = query.eq('district', params.district)

  const { data: farmers } = await query

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Farmers</h1>
        <Link
          href="/farmers/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-green-800 px-3 py-2 text-sm font-medium text-white hover:bg-green-900"
        >
          <Plus className="h-4 w-4" /> Add Farmer
        </Link>
      </div>

      <form method="get" className="flex gap-2">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search by name, phone, code…"
          className="h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button type="submit" className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent">
          Search
        </button>
      </form>

      <p className="text-sm text-gray-500">{farmers?.length ?? 0} farmers</p>

      {!farmers?.length && (
        <Card><CardContent className="py-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500">No farmers found.</p>
          <Link href="/farmers/new" className="mt-4 inline-flex items-center rounded-md bg-green-800 px-3 py-2 text-sm font-medium text-white hover:bg-green-900">
            Add First Farmer
          </Link>
        </CardContent></Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {farmers?.map((farmer) => (
          <Link key={farmer.id} href={`/farmers/${farmer.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{farmer.full_name}</p>
                    <p className="text-xs text-gray-400">{farmer.farmer_code}</p>
                  </div>
                  <Badge
                    variant={farmer.agreement_status === 'active' ? 'default' : 'secondary'}
                    className={farmer.agreement_status === 'active' ? 'bg-green-100 text-green-800 text-xs' : 'text-xs'}
                  >
                    {farmer.agreement_status}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{farmer.primary_phone}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{farmer.village}</span>
                </div>
                {Array.isArray(farmer.tags) && farmer.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(farmer.tags as string[]).slice(0, 3).map(tag => (
                      <span key={tag} className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-700'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
