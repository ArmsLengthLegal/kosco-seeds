import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Phone, MapPin, ArrowLeft, Plus, ClipboardCheck, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

const TAG_COLORS: Record<string, string> = {
  'production-agreement': 'bg-brand-50 text-brand-700',
  'kharif-2025': 'bg-orange-100 text-orange-800',
  'rabi-2025-26': 'bg-blue-100 text-blue-800',
  vip: 'bg-purple-100 text-purple-800',
  'feedback-needed': 'bg-yellow-100 text-yellow-800',
}

export default async function FarmerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: farmer } = await supabase
    .from('farmers')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (!farmer) notFound()

  const { data: fields } = await supabase
    .from('farmer_fields')
    .select('id, field_name, khasra_number, total_area_acres, area_under_seed_acres, village, agency_registration_status')
    .eq('farmer_id', id)
    .eq('is_deleted', false)

  const { data: agreements } = await supabase
    .from('production_agreements')
    .select(`id, agreement_number, crop_season, crop_year, status, area_acres,
      crop_varieties(crop_name, variety_code),
      seed_qualities(quality_name)`)
    .eq('farmer_id', id)
    .order('created_at', { ascending: false })

  const { data: inspections } = await supabase
    .from('inspections')
    .select(`id, inspection_date, inspection_number, overall_status, production_agreements(crop_varieties(crop_name))`)
    .eq('production_agreements.farmer_id', id)
    .order('inspection_date', { ascending: false })
    .limit(10)

  const initials = farmer.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/farmers" className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-gray-600 hover:bg-gray-50">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div className="flex flex-1 items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-2xl font-bold text-brand-700">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{farmer.full_name}</h1>
            <p className="text-base text-muted-foreground">{farmer.farmer_code}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${farmer.agreement_status === 'active' ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-600'}`}>
                {farmer.agreement_status}
              </span>
              {Array.isArray(farmer.tags) && (farmer.tags as string[]).map(tag => (
                <span key={tag} className={`rounded-full px-3 py-1 text-sm font-semibold ${TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-700'}`}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contact info */}
      <Card className="border-2">
        <CardHeader><CardTitle className="text-xl">Contact & Location</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-lg">
            <Phone className="h-6 w-6 text-brand-600" />
            <a href={`tel:${farmer.primary_phone}`} className="font-semibold text-brand-700 hover:underline">{farmer.primary_phone}</a>
            {farmer.whatsapp_number && (
              <a href={`https://wa.me/91${farmer.whatsapp_number}`} target="_blank" rel="noopener noreferrer"
                className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 hover:bg-green-200">WhatsApp</a>
            )}
          </div>
          {farmer.alternate_phone && (
            <div className="flex items-center gap-3 text-lg">
              <Phone className="h-6 w-6 text-gray-400" />
              <span className="text-gray-700">{farmer.alternate_phone} (alternate)</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-lg">
            <MapPin className="h-6 w-6 text-brand-600" />
            <span className="text-gray-700">{[farmer.village, farmer.tehsil, farmer.district, 'Rajasthan'].filter(Boolean).join(', ')}</span>
          </div>
          {farmer.father_or_husband_name && (
            <p className="text-base text-gray-700">Father/Husband: <span className="font-medium">{farmer.father_or_husband_name}</span></p>
          )}
        </CardContent>
      </Card>

      {/* Fields */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Fields ({fields?.length ?? 0})</CardTitle>
            <Link href={`/farmers/${id}/add-field`}
              className="flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 text-base font-semibold text-white hover:bg-brand-800">
              <Plus className="h-5 w-5" /> Add Field
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!fields?.length ? (
            <p className="text-base text-muted-foreground">No fields added yet.</p>
          ) : (
            <div className="space-y-3">
              {fields.map(f => (
                <div key={f.id} className="rounded-xl border-2 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{f.field_name || f.khasra_number}</p>
                      <p className="text-base text-muted-foreground">Khasra: {f.khasra_number} · {f.village}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      f.agency_registration_status === 'registered' ? 'bg-brand-50 text-brand-700' : 'bg-amber-50 text-amber-700'
                    }`}>{f.agency_registration_status}</span>
                  </div>
                  <div className="mt-2 flex gap-4 text-base text-gray-700">
                    <span>Total: <strong>{f.total_area_acres} acres</strong></span>
                    <span>Seed: <strong>{f.area_under_seed_acres} acres</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agreements */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Agreements ({agreements?.length ?? 0})</CardTitle>
            <Link href={`/agreements/new?farmer=${id}`}
              className="flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 text-base font-semibold text-white hover:bg-brand-800">
              <Plus className="h-5 w-5" /> New
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!agreements?.length ? (
            <p className="text-base text-muted-foreground">No agreements yet.</p>
          ) : (
            <div className="space-y-3">
              {agreements.map((a: Record<string, unknown>) => (
                <div key={String(a.id)} className="flex items-center justify-between rounded-xl border-2 p-4">
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {(a.crop_varieties as Record<string, unknown>)?.crop_name as string} {(a.crop_varieties as Record<string, unknown>)?.variety_code as string}
                    </p>
                    <p className="text-base text-muted-foreground">{String(a.crop_season).toUpperCase()} {String(a.crop_year)} · {String(a.area_acres)} acres</p>
                    <p className="text-sm text-muted-foreground">{String(a.agreement_number)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                      a.status === 'active' ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-600'
                    }`}>{String(a.status)}</span>
                    <Link href={`/inspections/assign?agreement=${String(a.id)}`}
                      className="mt-2 flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
                      <ClipboardCheck className="h-4 w-4" /> Assign Inspection
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inspections */}
      <Card className="border-2">
        <CardHeader><CardTitle className="text-xl">Inspection History</CardTitle></CardHeader>
        <CardContent>
          {!inspections?.length ? (
            <p className="text-base text-muted-foreground">No inspections yet.</p>
          ) : (
            <div className="space-y-2">
              {inspections.map(i => (
                <Link key={i.id} href={`/inspections/${i.id}`}
                  className="flex items-center justify-between rounded-xl border-2 p-4 hover:border-brand-200 hover:bg-brand-50">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-brand-600" />
                    <div>
                      <p className="text-base font-semibold text-gray-900">Visit #{i.inspection_number} · {i.inspection_date}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-bold ${
                    i.overall_status === 'pass' ? 'bg-brand-50 text-brand-700' :
                    i.overall_status === 'fail' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                  }`}>{i.overall_status ?? 'pending'}</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {farmer.notes && (
        <Card className="border-2">
          <CardHeader><CardTitle className="text-xl">Notes</CardTitle></CardHeader>
          <CardContent><p className="text-base text-gray-700">{farmer.notes}</p></CardContent>
        </Card>
      )}
    </div>
  )
}
