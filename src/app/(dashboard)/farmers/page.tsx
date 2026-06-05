import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Phone, MapPin, Plus, Search } from 'lucide-react'
import Link from 'next/link'

const TAG_COLORS: Record<string, string> = {
  'production-agreement': 'bg-brand-50 text-brand-700',
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
    <div className="space-y-5 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Farmers</h1>
        <Link
          href="/farmers/new"
          className="hidden items-center gap-2 rounded-xl bg-brand-700 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-brand-700/25 transition hover:bg-brand-800 active:scale-[0.98] sm:flex"
        >
          <Plus className="h-5 w-5" /> Add Farmer
        </Link>
      </div>

      {/* Search */}
      <form method="get" className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400" />
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search name, phone or code…"
          className="h-14 w-full rounded-2xl border-2 border-input bg-white pl-12 pr-4 text-lg outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-700/10"
        />
      </form>

      <p className="text-base font-medium text-muted-foreground">{farmers?.length ?? 0} farmers</p>

      {!farmers?.length && (
        <Card><CardContent className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-lg text-gray-600">No farmers yet.</p>
          <Link href="/farmers/new" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-3 text-base font-semibold text-white hover:bg-brand-800">
            <Plus className="h-5 w-5" /> Add First Farmer
          </Link>
        </CardContent></Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {farmers?.map((farmer) => (
          <Link key={farmer.id} href={`/farmers/${farmer.id}`}>
            <Card className="border-2 transition hover:border-brand-200 hover:shadow-lg active:scale-[0.99]">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
                    {farmer.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xl font-bold text-gray-900">{farmer.full_name}</p>
                    <p className="text-sm text-muted-foreground">{farmer.farmer_code}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${
                    farmer.agreement_status === 'active' ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {farmer.agreement_status}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5">
                  <p className="flex items-center gap-2 text-base text-gray-700">
                    <Phone className="h-5 w-5 text-gray-400" /> {farmer.primary_phone}
                  </p>
                  <p className="flex items-center gap-2 text-base text-gray-700">
                    <MapPin className="h-5 w-5 text-gray-400" /> {farmer.village}, {farmer.district}
                  </p>
                </div>

                {Array.isArray(farmer.tags) && farmer.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(farmer.tags as string[]).slice(0, 3).map(tag => (
                      <span key={tag} className={`rounded-full px-2.5 py-1 text-sm font-medium ${TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-700'}`}>
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

      {/* Mobile FAB */}
      <Link
        href="/farmers/new"
        className="fixed bottom-6 right-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-700 text-white shadow-xl shadow-brand-700/40 transition hover:bg-brand-800 active:scale-95 sm:hidden"
        aria-label="Add Farmer"
      >
        <Plus className="h-8 w-8" />
      </Link>
    </div>
  )
}
